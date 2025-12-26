import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET /api/students/[id] - Get a single student
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
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const student = await prisma.students.findFirst({
      where: {
        id,
        schoolId,
      },
      include: {
        parents: true,
        hostel_rooms: {
          include: {
            hostels: true,
            room_types: true,
          },
        },
        route_pickup_points: {
          include: {
            transport_routes: true,
          },
        },
        student_sessions: {
          include: {
            sessions: true,
            class_sections: {
              include: {
                classes: true,
                sections: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        student_documents: true,
        student_timeline: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        fee_payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        student_attendances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        exam_results: {
          include: {
            exam_subjects: {
              include: {
                exams: true,
                subjects: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// Update schema
const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  caste: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  motherTongue: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  hostelRoomId: z.number().optional().nullable(),
  routePickupPointId: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
  image: z.string().optional().nullable(),
  parent: z.object({
    fatherName: z.string().optional().nullable(),
    fatherPhone: z.string().optional().nullable(),
    fatherOccupation: z.string().optional().nullable(),
    fatherEmail: z.string().email().optional().nullable(),
    motherName: z.string().optional().nullable(),
    motherPhone: z.string().optional().nullable(),
    motherOccupation: z.string().optional().nullable(),
    motherEmail: z.string().email().optional().nullable(),
    guardianName: z.string().optional().nullable(),
    guardianRelation: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
    guardianEmail: z.string().email().optional().nullable(),
    guardianAddress: z.string().optional().nullable(),
  }).optional(),
});

// PUT /api/students/[id] - Update a student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await prisma.students.findFirst({
      where: {
        id,
        schoolId,
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update student and parent in a transaction
    const student = await prisma.$transaction(async (tx) => {
      // Update parent if provided
      if (validatedData.parent && existingStudent.parentId) {
        // Filter out null/undefined values for update
        const parentUpdateData: Record<string, any> = {};
        for (const [key, value] of Object.entries(validatedData.parent)) {
          if (value !== null && value !== undefined) {
            parentUpdateData[key] = value;
          }
        }
        if (Object.keys(parentUpdateData).length > 0) {
          await tx.parents.update({
            where: { id: existingStudent.parentId },
            data: parentUpdateData,
          });
        }
      } else if (validatedData.parent && !existingStudent.parentId) {
        // Create parent if not exists - guardianName and guardianPhone are required
        const parentData = validatedData.parent;
        if (parentData.guardianName && parentData.guardianPhone) {
          const parent = await tx.parents.create({
            data: {
              schoolId,
              guardianName: parentData.guardianName,
              guardianPhone: parentData.guardianPhone,
              fatherName: parentData.fatherName ?? undefined,
              fatherPhone: parentData.fatherPhone ?? undefined,
              fatherOccupation: parentData.fatherOccupation ?? undefined,
              motherName: parentData.motherName ?? undefined,
              motherPhone: parentData.motherPhone ?? undefined,
              motherOccupation: parentData.motherOccupation ?? undefined,
              guardianRelation: parentData.guardianRelation ?? undefined,
              guardianEmail: parentData.guardianEmail ?? undefined,
              guardianAddress: parentData.guardianAddress ?? undefined,
            },
          });
          (validatedData as any).parentId = parent.id;
        }
        validatedData.parent = undefined;
      }

      // Remove parent from update data
      const { parent, dob, ...studentData } = validatedData;

      // Update student
      const updatedStudent = await tx.students.update({
        where: { id },
        data: {
          ...studentData,
          dob: dob ? new Date(dob) : undefined,
        },
      });

      return updatedStudent;
    });

    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error('Error updating student:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete a student
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
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Check if student exists
    const existingStudent = await prisma.students.findFirst({
      where: {
        id,
        schoolId,
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Delete student (cascading deletes will handle related records)
    await prisma.students.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
