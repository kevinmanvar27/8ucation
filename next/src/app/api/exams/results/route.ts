import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get exam results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const examSubjectId = searchParams.get('examSubjectId');
    const classSectionId = searchParams.get('classSectionId');
    const studentId = searchParams.get('studentId');

    const where: any = {};

    if (examSubjectId) {
      where.examSubjectId = parseInt(examSubjectId);
    } else if (examId) {
      where.examSubject = { examId: parseInt(examId) };
    }

    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    if (classSectionId) {
      where.studentSession = { classSectionId: parseInt(classSectionId) };
    }

    // Ensure results are from the same school
    where.student = { schoolId };

    const results = await prisma.examResult.findMany({
      where,
      include: {
        examSubject: {
          include: {
            exam: true,
            subject: true,
          },
        },
        student: {
          select: { id: true, admissionNo: true, firstName: true, lastName: true, image: true },
        },
        studentSession: {
          include: {
            classSection: {
              include: { class: true, section: true },
            },
          },
        },
      },
      orderBy: { student: { firstName: 'asc' } },
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch exam results' }, { status: 500 });
  }
}

// POST - Save exam results (bulk)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { examSubjectId, results } = body;

    if (!examSubjectId || !results?.length) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    // Upsert results
    const savedResults = await Promise.all(
      results.map(async (r: any) => {
        return prisma.examResult.upsert({
          where: {
            examSubjectId_studentSessionId: {
              examSubjectId: parseInt(examSubjectId),
              studentSessionId: parseInt(r.studentSessionId),
            },
          },
          update: {
            marksObtained: r.marksObtained !== null && r.marksObtained !== '' ? parseFloat(r.marksObtained) : null,
            isAbsent: r.isAbsent || false,
            note: r.note,
          },
          create: {
            examSubjectId: parseInt(examSubjectId),
            studentSessionId: parseInt(r.studentSessionId),
            studentId: parseInt(r.studentId),
            marksObtained: r.marksObtained !== null && r.marksObtained !== '' ? parseFloat(r.marksObtained) : null,
            isAbsent: r.isAbsent || false,
            note: r.note,
          },
        });
      })
    );

    return NextResponse.json({ success: true, data: savedResults, message: 'Results saved successfully' });
  } catch (error) {
    console.error('Error saving exam results:', error);
    return NextResponse.json({ success: false, error: 'Failed to save exam results' }, { status: 500 });
  }
}
