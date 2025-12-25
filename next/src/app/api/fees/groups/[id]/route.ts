import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get single fee group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const feeGroup = await prisma.feeGroup.findFirst({
      where: { id: parseInt(params.id), schoolId },
      include: {
        feeGroupTypes: { include: { feeType: true } },
      },
    });

    if (!feeGroup) {
      return NextResponse.json({ success: false, error: 'Fee group not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: feeGroup });
  } catch (error) {
    console.error('Error fetching fee group:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee group' }, { status: 500 });
  }
}

// PUT - Update fee group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { name, description, feeTypes, isActive } = body;

    const existing = await prisma.feeGroup.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fee group not found' }, { status: 404 });
    }

    // Delete existing fee types and recreate
    await prisma.feeGroupType.deleteMany({
      where: { feeGroupId: parseInt(params.id) },
    });

    const feeGroup = await prisma.feeGroup.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description,
        isActive,
        feeGroupTypes: feeTypes?.length ? {
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
        feeGroupTypes: { include: { feeType: true } },
      },
    });

    return NextResponse.json({ success: true, data: feeGroup });
  } catch (error) {
    console.error('Error updating fee group:', error);
    return NextResponse.json({ success: false, error: 'Failed to update fee group' }, { status: 500 });
  }
}

// DELETE - Delete fee group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    
    const existing = await prisma.feeGroup.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fee group not found' }, { status: 404 });
    }

    await prisma.feeGroup.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Fee group deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee group:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete fee group' }, { status: 500 });
  }
}
