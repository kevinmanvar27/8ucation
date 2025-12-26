import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET /api/academics/sections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);

    const sections = await prisma.sections.findMany({
      where: { schoolId },
      orderBy: { sectionName: 'asc' },
      include: {
        _count: {
          select: { class_sections: true },
        },
      },
    });

    // Transform response to use API field names
    const transformedSections = sections.map((section) => ({
      ...section,
      name: section.sectionName,
      orderNo: section.sortOrder,
    }));

    return NextResponse.json({ success: true, data: transformedSections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  sortOrder: z.number().optional(),
});

// POST /api/academics/sections
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validatedData = createSectionSchema.parse(body);

    // Check if section name already exists
    const existing = await prisma.sections.findFirst({
      where: {
        schoolId,
        sectionName: validatedData.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Section name already exists' },
        { status: 400 }
      );
    }

    const section = await prisma.sections.create({
      data: {
        schoolId,
        sectionName: validatedData.name,
        sortOrder: validatedData.sortOrder ?? 0,
        isActive: true,
      },
    });

    // Transform response to use API field names
    return NextResponse.json({
      success: true,
      data: {
        ...section,
        name: section.sectionName,
        orderNo: section.sortOrder,
      },
      message: 'Section created successfully',
    });
  } catch (error) {
    console.error('Error creating section:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
