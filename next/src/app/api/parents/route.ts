import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const createParentSchema = z.object({
  fatherName: z.string().max(100).optional().nullable(),
  fatherPhone: z.string().max(20).optional().nullable(),
  fatherOccupation: z.string().max(100).optional().nullable(),
  fatherImage: z.string().max(255).optional().nullable(),
  motherName: z.string().max(100).optional().nullable(),
  motherPhone: z.string().max(20).optional().nullable(),
  motherOccupation: z.string().max(100).optional().nullable(),
  motherImage: z.string().max(255).optional().nullable(),
  guardianName: z.string().min(1, 'Guardian name is required').max(100),
  guardianRelation: z.string().max(50).optional().nullable(),
  guardianPhone: z.string().min(1, 'Guardian phone is required').max(20),
  guardianEmail: z.string().email().max(255).optional().nullable(),
  guardianOccupation: z.string().max(100).optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
  guardianImage: z.string().max(255).optional().nullable(),
});

// GET all parents with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const schoolId = Number(session.user.schoolId);
    
    const where: any = {
      schoolId,
    };

    if (search) {
      where.OR = [
        { guardianName: { contains: search } },
        { guardianPhone: { contains: search } },
        { guardianEmail: { contains: search } },
        { fatherName: { contains: search } },
        { motherName: { contains: search } },
      ];
    }

    const [parents, total] = await Promise.all([
      prisma.parents.findMany({
        where,
        select: {
          id: true,
          fatherName: true,
          fatherPhone: true,
          motherName: true,
          motherPhone: true,
          guardianName: true,
          guardianPhone: true,
          guardianEmail: true,
          guardianRelation: true,
          _count: {
            select: { students: true },
          },
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              isActive: true,
            },
            take: 5, // Limit students per parent for performance
          },
        },
        orderBy: { guardianName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.parents.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: parents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch parents' }, { status: 500 });
  }
}

// POST create parent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createParentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    
    // Check for duplicate guardian phone in the same school
    const existing = await prisma.parents.findFirst({
      where: {
        schoolId,
        guardianPhone: validation.data.guardianPhone,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A parent with this guardian phone already exists' },
        { status: 400 }
      );
    }

    const parent = await prisma.parents.create({
      data: {
        schoolId,
        ...validation.data,
      },
      include: {
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json({ success: true, data: parent }, { status: 201 });
  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json({ success: false, error: 'Failed to create parent' }, { status: 500 });
  }
}
