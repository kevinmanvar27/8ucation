import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all fee types for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = { schoolId };
    if (search) {
      where.name = { contains: search };
    }

    const feeTypes = await prisma.fee_types.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: feeTypes });
  } catch (error) {
    console.error('Error fetching fee types:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee types' }, { status: 500 });
  }
}

// POST - Create new fee type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { name, code, description, isActive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Fee type name is required' }, { status: 400 });
    }

    const feeType = await prisma.fee_types.create({
      data: { schoolId, name, code, description, isActive: isActive ?? true },
    });

    return NextResponse.json({ success: true, data: feeType }, { status: 201 });
  } catch (error) {
    console.error('Error creating fee type:', error);
    return NextResponse.json({ success: false, error: 'Failed to create fee type' }, { status: 500 });
  }
}
