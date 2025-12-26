import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateDesignationSchema = z.object({
  name: z.string().min(1, 'Designation name is required').max(100),
  isActive: z.boolean().optional(),
});

// GET single designation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const designationId = parseInt(params.id, 10);
    if (isNaN(designationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const designation = await prisma.designations.findFirst({
      where: {
        id: designationId,
        schoolId,
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    if (!designation) {
      return NextResponse.json({ success: false, error: 'Designation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: designation });
  } catch (error) {
    console.error('Error fetching designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch designation' }, { status: 500 });
  }
}

// PUT update designation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateDesignationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    const designationId = parseInt(params.id, 10);
    if (isNaN(designationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Check if exists
    const existing = await prisma.designations.findFirst({
      where: {
        id: designationId,
        schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Designation not found' }, { status: 404 });
    }

    // Check for duplicate name
    const duplicate = await prisma.designations.findFirst({
      where: {
        schoolId,
        name: validation.data.name,
        id: { not: designationId },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'A designation with this name already exists' },
        { status: 400 }
      );
    }

    const designation = await prisma.designations.update({
      where: { id: designationId },
      data: validation.data,
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: designation });
  } catch (error) {
    console.error('Error updating designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to update designation' }, { status: 500 });
  }
}

// DELETE designation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const designationId = parseInt(params.id, 10);
    if (isNaN(designationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Check if exists
    const designation = await prisma.designations.findFirst({
      where: {
        id: designationId,
        schoolId,
      },
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    if (!designation) {
      return NextResponse.json({ success: false, error: 'Designation not found' }, { status: 404 });
    }

    // Check if designation has staff
    if (designation._count.staff > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete designation. ${designation._count.staff} staff member(s) are assigned to it.` },
        { status: 400 }
      );
    }

    await prisma.designations.delete({
      where: { id: designationId },
    });

    return NextResponse.json({ success: true, message: 'Designation deleted successfully' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete designation' }, { status: 500 });
  }
}
