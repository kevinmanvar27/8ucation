import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET /api/academics/classes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const classId = parseInt(params.id, 10);
    if (isNaN(classId)) {
      return NextResponse.json({ success: false, error: 'Invalid class ID' }, { status: 400 });
    }

    const classData = await prisma.classes.findFirst({
      where: {
        id: classId,
        schoolId: Number(session.user.schoolId),
      },
      include: {
        class_sections: {
          include: { sections: true },
        },
        subject_groups: {
          include: { 
            subject_group_subjects: {
              include: { subjects: true }
            }
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: classData });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  orderNo: z.number().optional(),
  isActive: z.boolean().optional(),
  sectionIds: z.array(z.number()).optional(),
});

// PUT /api/academics/classes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const classId = parseInt(params.id, 10);
    if (isNaN(classId)) {
      return NextResponse.json({ success: false, error: 'Invalid class ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validatedData = updateClassSchema.parse(body);

    // Check if class exists
    const existing = await prisma.classes.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name
    if (validatedData.name && validatedData.name !== existing.className) {
      const duplicate = await prisma.classes.findFirst({
        where: {
          schoolId,
          className: validatedData.name,
          id: { not: classId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Class name already exists' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update class
      const classUpdated = await tx.classes.update({
        where: { id: classId },
        data: {
          className: validatedData.name,
          sortOrder: validatedData.orderNo,
          isActive: validatedData.isActive,
        },
      });

      // Update sections if provided
      if (validatedData.sectionIds !== undefined) {
        // Remove existing sections
        await tx.class_sections.deleteMany({
          where: { classId },
        });

        // Add new sections
        if (validatedData.sectionIds.length > 0) {
          await tx.class_sections.createMany({
            data: validatedData.sectionIds.map(sectionId => ({
              classId,
              sectionId,
            })),
          });
        }
      }

      return classUpdated;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Class updated successfully',
    });
  } catch (error) {
    console.error('Error updating class:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE /api/academics/classes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const classId = parseInt(params.id, 10);
    if (isNaN(classId)) {
      return NextResponse.json({ success: false, error: 'Invalid class ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);

    // Check if class exists
    const existing = await prisma.classes.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if class has students via ClassSection
    const studentCount = await prisma.student_sessions.count({
      where: { 
        class_sections: {
          classId 
        }
      },
    });

    if (studentCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete class with assigned students' },
        { status: 400 }
      );
    }

    await prisma.classes.delete({
      where: { id: classId },
    });

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
