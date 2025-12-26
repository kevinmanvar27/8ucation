import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all fee groups for the school
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

    const feeGroups = await prisma.fee_groups.findMany({
      where,
      include: {
        fee_group_types: {
          include: { fee_types: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: feeGroups });
  } catch (error) {
    console.error('Error fetching fee groups:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee groups' }, { status: 500 });
  }
}

// POST - Create new fee group with fee types
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { name, description, feeTypes, isActive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Fee group name is required' }, { status: 400 });
    }

    const feeGroup = await prisma.fee_groups.create({
      data: {
        schoolId,
        name,
        description,
        isActive: isActive ?? true,
        fee_group_types: feeTypes?.length ? {
          create: feeTypes.map((ft: any) => ({
            feeTypeId: parseInt(ft.feeTypeId),
            amount: parseFloat(ft.amount),
            dueDate: ft.dueDate ? new Date(ft.dueDate) : null,
            fineType: ft.fineType,
            finePercentage: ft.finePercentage ? parseFloat(ft.finePercentage) : null,
            fineAmount: ft.fineAmount ? parseFloat(ft.fineAmount) : null,
          })),
        } : undefined,
      },
      include: {
        fee_group_types: { include: { fee_types: true } },
      },
    });

    return NextResponse.json({ success: true, data: feeGroup }, { status: 201 });
  } catch (error) {
    console.error('Error creating fee group:', error);
    return NextResponse.json({ success: false, error: 'Failed to create fee group' }, { status: 500 });
  }
}
