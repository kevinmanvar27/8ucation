import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all exams for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sessionId = searchParams.get('sessionId');

    const where: any = { schoolId };

    if (search) {
      where.name = { contains: search };
    }

    const [exams, total] = await Promise.all([
      prisma.exams.findMany({
        where,
        include: {
          exam_schedules: {
            where: sessionId ? { sessionId: parseInt(sessionId) } : undefined,
            include: { sessions: true },
          },
          exam_subjects: {
            include: { subjects: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.exams.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST - Create new exam
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { name, description, sessionId, subjects } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Exam name is required' }, { status: 400 });
    }

    const exam = await prisma.exams.create({
      data: {
        schoolId,
        name,
        description,
        exam_schedules: sessionId ? {
          create: { sessionId: parseInt(sessionId) },
        } : undefined,
        exam_subjects: subjects?.length ? {
          create: subjects.map((s: any) => ({
            subjectId: parseInt(s.subjectId),
            examDate: s.examDate ? new Date(s.examDate) : null,
            startTime: s.startTime,
            endTime: s.endTime,
            roomNo: s.roomNo,
            maxMarks: parseFloat(s.maxMarks || '100'),
            minMarks: parseFloat(s.minMarks || '33'),
          })),
        } : undefined,
      },
      include: {
        exam_schedules: { include: { sessions: true } },
        exam_subjects: { include: { subjects: true } },
      },
    });

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ success: false, error: 'Failed to create exam' }, { status: 500 });
  }
}
