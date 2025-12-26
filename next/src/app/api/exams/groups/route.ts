import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all exam groups for the school
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
    const examType = searchParams.get('examType');

    const where: any = { schoolId };

    if (search) {
      where.name = { contains: search };
    }

    if (examType) {
      where.examType = examType;
    }

    const [examGroups, total] = await Promise.all([
      prisma.exam_groups.findMany({
        where,
        include: {
          exam_group_exams: {
            include: {
              exams: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.exam_groups.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: examGroups,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching exam groups:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch exam groups' }, { status: 500 });
  }
}

// POST - Create new exam group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { name, description, examType, examIds } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Exam group name is required' }, { status: 400 });
    }

    const examGroup = await prisma.exam_groups.create({
      data: {
        schoolId,
        name,
        description,
        examType: examType || 'term',
        exam_group_exams: examIds?.length ? {
          create: examIds.map((examId: number) => ({
            examId: parseInt(String(examId)),
          })),
        } : undefined,
      },
      include: {
        exam_group_exams: {
          include: {
            exams: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: examGroup }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam group:', error);
    return NextResponse.json({ success: false, error: 'Failed to create exam group' }, { status: 500 });
  }
}
