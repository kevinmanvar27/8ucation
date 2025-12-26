import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List homework submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const homeworkId = searchParams.get('homeworkId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {};

    if (homeworkId) {
      where.homeworkId = parseInt(homeworkId);
    }

    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    if (status) {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      prisma.homework_submissions.findMany({
        where,
        include: {
          homeworks: {
            select: {
              id: true,
              title: true,
              submissionDate: true,
              subjects: { select: { id: true, name: true } },
            },
          },
          students: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.homework_submissions.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching homework submissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST - Submit homework (for students)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { homeworkId, studentId, document, message } = body;

    if (!homeworkId) {
      return NextResponse.json({ success: false, error: 'Homework ID is required' }, { status: 400 });
    }

    // Check if submission already exists
    const existingSubmission = await prisma.homework_submissions.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId: parseInt(homeworkId),
          studentId: parseInt(studentId),
        },
      },
    });

    if (existingSubmission) {
      // Update existing submission
      const submission = await prisma.homework_submissions.update({
        where: { id: existingSubmission.id },
        data: {
          document,
          message,
          status: 'pending',
          submittedAt: new Date(),
        },
        include: {
          homeworks: { select: { id: true, title: true } },
          students: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return NextResponse.json({ success: true, data: submission });
    }

    // Create new submission
    const submission = await prisma.homework_submissions.create({
      data: {
        homeworkId: parseInt(homeworkId),
        studentId: parseInt(studentId),
        document,
        message,
        status: 'pending',
        submittedAt: new Date(),
      },
      include: {
        homeworks: { select: { id: true, title: true } },
        students: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    console.error('Error submitting homework:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit homework' }, { status: 500 });
  }
}

// PATCH - Evaluate homework submission (for teachers)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, status, marks, feedback } = body;

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Valid status (accepted/rejected) is required' }, { status: 400 });
    }

    const submission = await prisma.homework_submissions.update({
      where: { id: parseInt(submissionId) },
      data: {
        status,
        marks: marks ? parseFloat(marks) : null,
        feedback,
        evaluatedAt: new Date(),
        evaluatedBy: parseInt(session.user.id),
      },
      include: {
        homeworks: { select: { id: true, title: true } },
        students: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error('Error evaluating homework:', error);
    return NextResponse.json({ success: false, error: 'Failed to evaluate homework' }, { status: 500 });
  }
}
