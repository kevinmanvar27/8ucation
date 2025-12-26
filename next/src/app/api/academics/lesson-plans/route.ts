import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all lesson plans for the school
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
    const classSectionId = searchParams.get('classSectionId');
    const subjectId = searchParams.get('subjectId');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { lessonName: { contains: search } },
        { subTopic: { contains: search } },
      ];
    }

    if (classSectionId) {
      where.classSectionId = parseInt(classSectionId);
    }

    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }

    if (staffId) {
      where.staffId = parseInt(staffId);
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.lessonDate = {};
      if (startDate) {
        where.lessonDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.lessonDate.lte = new Date(endDate);
      }
    }

    const [lessonPlans, total] = await Promise.all([
      prisma.lesson_plans.findMany({
        where,
        include: {
          class_sections: {
            include: {
              classes: { select: { id: true, className: true } },
              sections: { select: { id: true, sectionName: true } },
            },
          },
          subjects: {
            select: { id: true, name: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true },
          },
          topics: {
            select: { id: true, name: true },
          },
        },
        orderBy: { lessonDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lesson_plans.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: lessonPlans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch lesson plans' }, { status: 500 });
  }
}

// POST - Create new lesson plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const {
      classSectionId,
      subjectId,
      staffId,
      topicId,
      lessonName,
      lessonDate,
      subTopic,
      generalObjectives,
      teachingMethod,
      previousKnowledge,
      comprehensiveQues,
      presentation,
      note,
      youtubeUrl,
      document,
      status,
    } = body;

    if (!subjectId || !lessonName || !lessonDate) {
      return NextResponse.json({
        success: false,
        error: 'Subject, lesson name, and lesson date are required',
      }, { status: 400 });
    }

    const lessonPlan = await prisma.lesson_plans.create({
      data: {
        schoolId,
        classSectionId: classSectionId ? parseInt(classSectionId) : null,
        subjectId: parseInt(subjectId),
        staffId: staffId ? parseInt(staffId) : null,
        topicId: topicId ? parseInt(topicId) : null,
        lessonName,
        lessonDate: new Date(lessonDate),
        subTopic,
        generalObjectives,
        teachingMethod,
        previousKnowledge,
        comprehensiveQues,
        presentation,
        note,
        youtubeUrl,
        document,
        status: status || 'pending',
        createdBy: parseInt(session.user.id),
      },
      include: {
        class_sections: {
          include: {
            classes: { select: { id: true, className: true } },
            sections: { select: { id: true, sectionName: true } },
          },
        },
        subjects: { select: { id: true, name: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
        topics: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: lessonPlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    return NextResponse.json({ success: false, error: 'Failed to create lesson plan' }, { status: 500 });
  }
}
