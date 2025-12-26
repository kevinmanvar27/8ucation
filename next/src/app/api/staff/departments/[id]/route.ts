import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  isActive: z.boolean().optional(),
});

// GET single department
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
    const departmentId = parseInt(params.id, 10);
    if (isNaN(departmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    
    const department = await prisma.departments.findFirst({
      where: {
        id: departmentId,
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

    if (!department) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch department' }, { status: 500 });
  }
}

// PUT update department
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
    const validation = updateDepartmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    const departmentId = parseInt(params.id, 10);
    if (isNaN(departmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Check if exists
    const existing = await prisma.departments.findFirst({
      where: {
        id: departmentId,
        schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    // Check for duplicate name
    const duplicate = await prisma.departments.findFirst({
      where: {
        schoolId,
        name: validation.data.name,
        id: { not: departmentId },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'A department with this name already exists' },
        { status: 400 }
      );
    }

    const department = await prisma.departments.update({
      where: { id: departmentId },
      data: validation.data,
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ success: false, error: 'Failed to update department' }, { status: 500 });
  }
}

// DELETE department
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
    const departmentId = parseInt(params.id, 10);
    if (isNaN(departmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Check if exists
    const department = await prisma.departments.findFirst({
      where: {
        id: departmentId,
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

    if (!department) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    // Check if department has staff
    if (department._count.staff > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete department. ${department._count.staff} staff member(s) are assigned to it.` },
        { status: 400 }
      );
    }

    await prisma.departments.delete({
      where: { id: departmentId },
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete department' }, { status: 500 });
  }
}
