import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all certificate templates for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const where: any = { schoolId };

    if (search) {
      where.name = { contains: search };
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [certificates, total] = await Promise.all([
      prisma.certificates.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificates.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: certificates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

// POST - Create new certificate template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const {
      name,
      templateContent,
      headerLeft,
      headerCenter,
      headerRight,
      bodyContent,
      footerLeft,
      footerCenter,
      footerRight,
      backgroundImage,
      isActive,
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Certificate name is required' }, { status: 400 });
    }

    if (!templateContent) {
      return NextResponse.json({ success: false, error: 'Template content is required' }, { status: 400 });
    }

    const certificate = await prisma.certificates.create({
      data: {
        schoolId,
        name,
        templateContent,
        headerLeft,
        headerCenter,
        headerRight,
        bodyContent,
        footerLeft,
        footerCenter,
        footerRight,
        backgroundImage,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, data: certificate }, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ success: false, error: 'Failed to create certificate' }, { status: 500 });
  }
}
