import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get fee assignments (FeesMaster records)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const sessionId = searchParams.get('sessionId');
    const feeGroupId = searchParams.get('feeGroupId');

    const where: any = { 
      fee_groups: { schoolId },
      classes: { schoolId }
    };
    if (classId) where.classId = parseInt(classId);
    if (sessionId) where.sessionId = parseInt(sessionId);
    if (feeGroupId) where.feeGroupId = parseInt(feeGroupId);

    const feesMasters = await prisma.fees_masters.findMany({
      where,
      include: {
        fee_groups: {
          include: { fee_group_types: { include: { fee_types: true } } },
        },
        classes: true,
        sessions: true,
        student_fees_masters: {
          include: {
            student_sessions: {
              include: {
                students: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: feesMasters });
  } catch (error) {
    console.error('Error fetching fee assignments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee assignments' }, { status: 500 });
  }
}

// POST - Create FeesMaster (assign fee group to class) and optionally StudentFeesMaster records
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { feeGroupId, classId, sessionId, assignToStudents } = body;

    if (!feeGroupId || !classId || !sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Fee group, class, and session are required' 
      }, { status: 400 });
    }

    // Verify fee group belongs to school
    const feeGroup = await prisma.fee_groups.findFirst({
      where: { id: parseInt(feeGroupId), schoolId },
    });

    if (!feeGroup) {
      return NextResponse.json({ success: false, error: 'Fee group not found' }, { status: 404 });
    }

    // Verify class belongs to school
    const classRecord = await prisma.classes.findFirst({
      where: { id: parseInt(classId), schoolId },
    });

    if (!classRecord) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    // Create or get FeesMaster
    const feesMaster = await prisma.fees_masters.upsert({
      where: {
        sessionId_feeGroupId_classId: {
          sessionId: parseInt(sessionId),
          feeGroupId: parseInt(feeGroupId),
          classId: parseInt(classId),
        },
      },
      update: {},
      create: {
        sessionId: parseInt(sessionId),
        feeGroupId: parseInt(feeGroupId),
        classId: parseInt(classId),
      },
    });

    // Optionally assign to all students in the class for this session
    if (assignToStudents) {
      // Get all student sessions for this class in this session
      const studentSessions = await prisma.student_sessions.findMany({
        where: {
          sessionId: parseInt(sessionId),
          class_sections: {
            classId: parseInt(classId),
          },
          students: { schoolId },
        },
        select: { id: true },
      });

      // Create StudentFeesMaster records for each student
      await Promise.all(
        studentSessions.map(async (ss) => {
          return prisma.student_fees_masters.upsert({
            where: {
              studentSessionId_feesMasterId: {
                studentSessionId: ss.id,
                feesMasterId: feesMaster.id,
              },
            },
            update: {},
            create: {
              studentSessionId: ss.id,
              feesMasterId: feesMaster.id,
              isActive: true,
            },
          });
        })
      );
    }

    // Fetch the complete record
    const result = await prisma.fees_masters.findUnique({
      where: { id: feesMaster.id },
      include: {
        fee_groups: {
          include: { fee_group_types: { include: { fee_types: true } } },
        },
        classes: true,
        sessions: true,
        student_fees_masters: {
          include: {
            student_sessions: {
              include: {
                students: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Fee group assigned successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning fees:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign fees' }, { status: 500 });
  }
}

// DELETE - Remove fee assignment (FeesMaster or StudentFeesMaster)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const feesMasterId = searchParams.get('feesMasterId');
    const studentFeesMasterId = searchParams.get('studentFeesMasterId');

    if (studentFeesMasterId) {
      // Delete single student assignment
      const studentFeesMaster = await prisma.student_fees_masters.findFirst({
        where: { 
          id: parseInt(studentFeesMasterId),
          fees_masters: {
            fee_groups: { schoolId },
          },
        },
      });

      if (!studentFeesMaster) {
        return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
      }

      await prisma.student_fees_masters.delete({
        where: { id: parseInt(studentFeesMasterId) },
      });

      return NextResponse.json({ success: true, message: 'Student fee assignment removed' });
    } else if (feesMasterId) {
      // Delete entire class fee assignment (and all student assignments)
      const feesMaster = await prisma.fees_masters.findFirst({
        where: { 
          id: parseInt(feesMasterId),
          fee_groups: { schoolId },
        },
      });

      if (!feesMaster) {
        return NextResponse.json({ success: false, error: 'Fee master not found' }, { status: 404 });
      }

      await prisma.fees_masters.delete({
        where: { id: parseInt(feesMasterId) },
      });

      return NextResponse.json({ success: true, message: 'Fee assignment removed' });
    }

    return NextResponse.json({ success: false, error: 'No assignment ID provided' }, { status: 400 });
  } catch (error) {
    console.error('Error removing fee assignment:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove fee assignment' }, { status: 500 });
  }
}
