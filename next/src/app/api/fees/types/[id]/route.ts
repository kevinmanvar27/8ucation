import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get single fee type
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
    const feeType = await prisma.fee_types.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!feeType) {
      return NextResponse.json({ success: false, error: 'Fee type not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: feeType });
  } catch (error) {
    console.error('Error fetching fee type:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee type' }, { status: 500 });
  }
}

// PUT - Update fee type
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
    const { name, code, description, isActive } = body;

    const existing = await prisma.fee_types.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fee type not found' }, { status: 404 });
    }

    const feeType = await prisma.fee_types.update({
      where: { id: parseInt(params.id) },
      data: { name, code, description, isActive },
    });

    return NextResponse.json({ success: true, data: feeType });
  } catch (error) {
    console.error('Error updating fee type:', error);
    return NextResponse.json({ success: false, error: 'Failed to update fee type' }, { status: 500 });
  }
}

// DELETE - Delete fee type
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
    
    const existing = await prisma.fee_types.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fee type not found' }, { status: 404 });
    }

    await prisma.fee_types.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Fee type deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee type:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete fee type' }, { status: 500 });
  }
}
