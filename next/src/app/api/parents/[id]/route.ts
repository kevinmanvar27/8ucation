import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateParentSchema = z.object({
  fatherName: z.string().max(100).optional().nullable(),
  fatherPhone: z.string().max(20).optional().nullable(),
  fatherOccupation: z.string().max(100).optional().nullable(),
  fatherImage: z.string().max(255).optional().nullable(),
  motherName: z.string().max(100).optional().nullable(),
  motherPhone: z.string().max(20).optional().nullable(),
  motherOccupation: z.string().max(100).optional().nullable(),
  motherImage: z.string().max(255).optional().nullable(),
  guardianName: z.string().min(1, 'Guardian name is required').max(100),
  guardianRelation: z.string().max(50).optional().nullable(),
  guardianPhone: z.string().min(1, 'Guardian phone is required').max(20),
  guardianEmail: z.string().email().max(255).optional().nullable(),
  guardianOccupation: z.string().max(100).optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
  guardianImage: z.string().max(255).optional().nullable(),
});

// GET single parent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);
    
    const parent = await prisma.parents.findFirst({
      where: {
        id,
        schoolId,
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            isActive: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ success: false, error: 'Parent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: parent });
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch parent' }, { status: 500 });
  }
}

// PUT update parent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);
    
    // Verify parent exists and belongs to school
    const existing = await prisma.parents.findFirst({
      where: {
        id,
        schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Parent not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateParentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check for duplicate guardian phone (excluding current record)
    const duplicate = await prisma.parents.findFirst({
      where: {
        schoolId,
        guardianPhone: validation.data.guardianPhone,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'A parent with this guardian phone already exists' },
        { status: 400 }
      );
    }

    const parent = await prisma.parents.update({
      where: { id },
      data: validation.data,
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
        },
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json({ success: true, data: parent });
  } catch (error) {
    console.error('Error updating parent:', error);
    return NextResponse.json({ success: false, error: 'Failed to update parent' }, { status: 500 });
  }
}

// DELETE parent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);
    
    // Verify parent exists and belongs to school
    const parent = await prisma.parents.findFirst({
      where: {
        id,
        schoolId,
      },
      include: {
        _count: { select: { students: true } },
      },
    });

    if (!parent) {
      return NextResponse.json({ success: false, error: 'Parent not found' }, { status: 404 });
    }

    // Check if parent has students
    if (parent._count.students > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete parent with ${parent._count.students} student(s). Reassign or remove students first.` },
        { status: 400 }
      );
    }

    // Delete associated user if exists
    await prisma.users.deleteMany({
      where: {
        parentId: id,
        schoolId,
      },
    });

    await prisma.parents.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Parent deleted successfully' });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete parent' }, { status: 500 });
  }
}
