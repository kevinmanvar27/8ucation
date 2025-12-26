import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
});

// GET all departments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    
    const departments = await prisma.departments.findMany({
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

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST create department
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createDepartmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    
    // Check for duplicate
    const existing = await prisma.departments.findFirst({
      where: {
        schoolId,
        name: validation.data.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Department already exists' },
        { status: 400 }
      );
    }

    const department = await prisma.departments.create({
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

    return NextResponse.json({ success: true, data: department }, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ success: false, error: 'Failed to create department' }, { status: 500 });
  }
}
