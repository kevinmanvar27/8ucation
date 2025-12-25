import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().max(20).optional(),
  type: z.enum(['theory', 'practical']).optional(),
  isActive: z.boolean().optional(),
});

// GET single subject
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subjectId = parseInt(params.id, 10);
    if (isNaN(subjectId)) {
      return NextResponse.json({ success: false, error: 'Invalid subject ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);

    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
      include: {
        subjectGroupSubjects: {
          include: {
            subjectGroup: true,
          },
        },
        _count: {
          select: {
            subjectGroupSubjects: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subject' }, { status: 500 });
  }
}

// PUT update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subjectId = parseInt(params.id, 10);
    if (isNaN(subjectId)) {
      return NextResponse.json({ success: false, error: 'Invalid subject ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validation = updateSubjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if subject exists
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
    });

    if (!existingSubject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    // Check for duplicate name
    const duplicateName = await prisma.subject.findFirst({
      where: {
        schoolId,
        name: validation.data.name,
        id: { not: subjectId },
      },
    });

    if (duplicateName) {
      return NextResponse.json(
        { success: false, error: 'A subject with this name already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate code if provided
    if (validation.data.code) {
      const duplicateCode = await prisma.subject.findFirst({
        where: {
          schoolId,
          code: validation.data.code,
          id: { not: subjectId },
        },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: 'A subject with this code already exists' },
          { status: 400 }
        );
      }
    }

    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: validation.data,
      include: {
        _count: {
          select: {
            subjectGroupSubjects: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ success: false, error: 'Failed to update subject' }, { status: 500 });
  }
}

// DELETE subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subjectId = parseInt(params.id, 10);
    if (isNaN(subjectId)) {
      return NextResponse.json({ success: false, error: 'Invalid subject ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);

    // Check if subject exists
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
      include: {
        _count: {
          select: {
            subjectGroupSubjects: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    // Check if subject is assigned to any subject groups
    if (subject._count.subjectGroupSubjects > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete subject. It is assigned to subject groups. Remove it from all groups first.' },
        { status: 400 }
      );
    }

    // Delete the subject
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    return NextResponse.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete subject' }, { status: 500 });
  }
}
