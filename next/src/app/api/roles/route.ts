import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to parse schoolId from session
const getSchoolId = (session: { user?: { schoolId?: string | number } } | null) => {
  if (!session?.user?.schoolId) return null;
  return typeof session.user.schoolId === 'string' 
    ? parseInt(session.user.schoolId) 
    : session.user.schoolId;
};

// GET - Fetch all roles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: { staff: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const role = await prisma.role.create({
      data: {
        schoolId,
        name: data.name,
        slug,
        permissions: data.permissions || [],
        isSystem: false,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
