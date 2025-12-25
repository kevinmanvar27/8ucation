import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const attendanceSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  classId: z.number().int().positive(),
  sectionId: z.number().int().positive(),
  attendances: z.array(z.object({
    studentSessionId: z.number().int().positive(),
    studentId: z.number().int().positive(),
    status: z.enum(['present', 'absent', 'late', 'half_day', 'holiday']),
    remark: z.string().optional().nullable(),
  })),
});

// GET attendance for a class/section on a date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');

    if (!date || !classId || !sectionId) {
      return NextResponse.json(
        { success: false, error: 'Date, classId, and sectionId are required' },
        { status: 400 }
      );
    }

    // Get the current session
    const currentSession = await prisma.session.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
    });

    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: 'No active session found' },
        { status: 400 }
      );
    }

    // Get class section
    const classSection = await prisma.classSection.findFirst({
      where: {
        classId: parseInt(classId, 10),
        sectionId: parseInt(sectionId, 10),
        class: { schoolId },
      },
    });

    if (!classSection) {
      return NextResponse.json(
        { success: false, error: 'Class section not found' },
        { status: 404 }
      );
    }

    // Get all students in this class/section for the current session
    const studentSessions = await prisma.studentSession.findMany({
      where: {
        sessionId: currentSession.id,
        classSectionId: classSection.id,
        student: {
          isActive: true,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            image: true,
          },
        },
        attendances: {
          where: {
            date: new Date(date),
          },
        },
      },
      orderBy: {
        rollNo: 'asc',
      },
    });

    // Format response
    const students = studentSessions.map((ss) => ({
      studentSessionId: ss.id,
      studentId: ss.student.id,
      rollNo: ss.rollNo,
      firstName: ss.student.firstName,
      lastName: ss.student.lastName,
      admissionNo: ss.student.admissionNo,
      image: ss.student.image,
      attendance: ss.attendances[0] || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        date,
        classId: parseInt(classId, 10),
        sectionId: parseInt(sectionId, 10),
        students,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST/PUT save attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = attendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, attendances } = validation.data;
    const attendanceDate = new Date(date);

    // Upsert each attendance record
    const results = await Promise.all(
      attendances.map(async (att) => {
        return prisma.studentAttendance.upsert({
          where: {
            studentSessionId_date: {
              studentSessionId: att.studentSessionId,
              date: attendanceDate,
            },
          },
          update: {
            status: att.status,
            remark: att.remark,
          },
          create: {
            studentSessionId: att.studentSessionId,
            studentId: att.studentId,
            date: attendanceDate,
            status: att.status,
            remark: att.remark,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Attendance saved for ${results.length} students`,
      data: results,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ success: false, error: 'Failed to save attendance' }, { status: 500 });
  }
}
