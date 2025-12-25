import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET /api/academics/classes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const withSections = searchParams.get('withSections') === 'true';

    // Fetch classes with or without sections
    if (withSections) {
      const classes = await prisma.class.findMany({
        where: { schoolId },
        orderBy: { sortOrder: 'asc' },
        include: {
          classSections: {
            include: {
              section: true,
            },
            orderBy: { section: { sectionName: 'asc' } },
          },
        },
      });

      const data = classes.map(c => ({
        id: c.id,
        name: c.className,
        orderNo: c.sortOrder,
        isActive: c.isActive,
        sections: c.classSections.map(cs => ({
          id: cs.section.id,
          name: cs.section.sectionName,
        })),
      }));

      return NextResponse.json({ success: true, data });
    }

    const classes = await prisma.class.findMany({
      where: { schoolId },
      orderBy: { sortOrder: 'asc' },
    });

    const data = classes.map(c => ({
      id: c.id,
      name: c.className,
      orderNo: c.sortOrder,
      isActive: c.isActive,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  orderNo: z.number().optional(),
  sectionIds: z.array(z.number()).optional(),
});

// POST /api/academics/classes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validatedData = createClassSchema.parse(body);

    // Check if class name already exists
    const existing = await prisma.class.findFirst({
      where: {
        schoolId,
        className: validatedData.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Class name already exists' },
        { status: 400 }
      );
    }

    // Get max order number
    const maxOrder = await prisma.class.aggregate({
      where: { schoolId },
      _max: { sortOrder: true },
    });

    const newClass = await prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: {
          schoolId,
          className: validatedData.name,
          sortOrder: validatedData.orderNo ?? (maxOrder._max.sortOrder || 0) + 1,
          isActive: true,
        },
      });

      // Assign sections if provided
      if (validatedData.sectionIds?.length) {
        await tx.classSection.createMany({
          data: validatedData.sectionIds.map(sectionId => ({
            schoolId,
            classId: created.id,
            sectionId,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      data: newClass,
      message: 'Class created successfully',
    });
  } catch (error) {
    console.error('Error creating class:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
