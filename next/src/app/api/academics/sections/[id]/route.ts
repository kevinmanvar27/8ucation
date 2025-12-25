import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required').max(50), // API uses 'name', DB uses 'sectionName'
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

// GET single section
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sectionId = parseInt(params.id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);

    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        schoolId,
      },
      include: {
        classSections: {
          include: {
            class: true,
          },
        },
        _count: {
          select: {
            classSections: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch section' }, { status: 500 });
  }
}

// PUT update section
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSectionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const sectionId = parseInt(params.id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);

    // Check if section exists
    const existingSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
        schoolId,
      },
    });

    if (!existingSection) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Check for duplicate name
    const duplicateSection = await prisma.section.findFirst({
      where: {
        schoolId,
        sectionName: validation.data.name,
        id: { not: sectionId },
      },
    });

    if (duplicateSection) {
      return NextResponse.json(
        { success: false, error: 'A section with this name already exists' },
        { status: 400 }
      );
    }

    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        sectionName: validation.data.name,
        isActive: validation.data.isActive,
        sortOrder: validation.data.sortOrder,
      },
      include: {
        _count: {
          select: {
            classSections: true,
          },
        },
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
    });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json({ success: false, error: 'Failed to update section' }, { status: 500 });
  }
}

// DELETE section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sectionId = parseInt(params.id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const schoolId = Number(session.user.schoolId);

    // Check if section exists
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        schoolId,
      },
      include: {
        _count: {
          select: {
            classSections: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Check if section is assigned to any classes
    if (section._count.classSections > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete section. It is assigned to ${section._count.classSections} class(es). Remove the section from all classes first.` },
        { status: 400 }
      );
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete section' }, { status: 500 });
  }
}
