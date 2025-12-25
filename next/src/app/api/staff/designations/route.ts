import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const createDesignationSchema = z.object({
  name: z.string().min(1, 'Designation name is required').max(100),
});

// GET all designations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    
    const designations = await prisma.designation.findMany({
      where: {
        schoolId,
      },
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: designations });
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch designations' }, { status: 500 });
  }
}

// POST create designation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createDesignationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    
    // Check for duplicate
    const existing = await prisma.designation.findFirst({
      where: {
        schoolId,
        name: validation.data.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Designation already exists' },
        { status: 400 }
      );
    }

    const designation = await prisma.designation.create({
      data: {
        schoolId,
        name: validation.data.name,
      },
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: designation }, { status: 201 });
  } catch (error) {
    console.error('Error creating designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to create designation' }, { status: 500 });
  }
}
