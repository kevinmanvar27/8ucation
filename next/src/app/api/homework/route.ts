import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all homework for the school
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
    const classId = searchParams.get('classId');
    const classSectionId = searchParams.get('classSectionId');
    const subjectId = searchParams.get('subjectId');

    const where: any = { schoolId };

    if (search) {
      where.title = { contains: search };
    }

    if (classId) {
      where.classId = parseInt(classId);
    }

    if (classSectionId) {
      where.classSectionId = parseInt(classSectionId);
    }

    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    const [homeworks, total] = await Promise.all([
      prisma.homeworks.findMany({
        where,
        include: {
          classes: {
            select: { id: true, className: true },
          },
          class_sections: {
            include: {
              sections: { select: { id: true, sectionName: true } },
            },
          },
          subjects: {
            select: { id: true, name: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true },
          },
          homework_submissions: {
            select: {
              id: true,
              studentId: true,
              status: true,
              marks: true,
              submittedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.homeworks.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: homeworks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch homework' }, { status: 500 });
  }
}

// POST - Create new homework
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const {
      classId,
      classSectionId,
      subjectId,
      staffId,
      title,
      description,
      homeworkDate,
      submissionDate,
      document,
    } = body;

    if (!classId || !classSectionId || !subjectId || !title || !homeworkDate || !submissionDate) {
      return NextResponse.json({
        success: false,
        error: 'Class, section, subject, title, homework date, and submission date are required',
      }, { status: 400 });
    }

    const homework = await prisma.homeworks.create({
      data: {
        schoolId,
        classId: parseInt(classId),
        classSectionId: parseInt(classSectionId),
        subjectId: parseInt(subjectId),
        staffId: staffId ? parseInt(staffId) : parseInt(session.user.id),
        title,
        description,
        homeworkDate: new Date(homeworkDate),
        submissionDate: new Date(submissionDate),
        document,
      },
      include: {
        classes: { select: { id: true, className: true } },
        class_sections: {
          include: { sections: { select: { id: true, sectionName: true } } },
        },
        subjects: { select: { id: true, name: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: homework }, { status: 201 });
  } catch (error) {
    console.error('Error creating homework:', error);
    return NextResponse.json({ success: false, error: 'Failed to create homework' }, { status: 500 });
  }
}