import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET /api/academics/subjects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { subjectGroupSubjects: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
  type: z.enum(['theory', 'practical']).default('theory'),
  isActive: z.boolean().default(true),
});

// POST /api/academics/subjects
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validatedData = createSubjectSchema.parse(body);

    // Check if subject name already exists (unique constraint)
    const existingName = await prisma.subject.findFirst({
      where: {
        schoolId,
        name: validatedData.name,
      },
    });

    if (existingName) {
      return NextResponse.json(
        { success: false, error: 'Subject name already exists' },
        { status: 400 }
      );
    }

    // Check if subject code already exists (if provided)
    if (validatedData.code) {
      const existingCode = await prisma.subject.findFirst({
        where: {
          schoolId,
          code: validatedData.code,
        },
      });

      if (existingCode) {
        return NextResponse.json(
          { success: false, error: 'Subject code already exists' },
          { status: 400 }
        );
      }
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId,
        name: validatedData.name,
        code: validatedData.code,
        type: validatedData.type,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
