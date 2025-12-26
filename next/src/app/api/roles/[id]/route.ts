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

// GET - Fetch single role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await prisma.roles.findFirst({
      where: {
        id: parseInt(params.id),
        schoolId,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Check if role is system role
    const existingRole = await prisma.roles.findFirst({
      where: {
        id: parseInt(params.id),
        schoolId,
      },
    });

    if (existingRole?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system role' },
        { status: 400 }
      );
    }

    const role = await prisma.roles.update({
      where: { id: parseInt(params.id) },
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if role is system role
    const existingRole = await prisma.roles.findFirst({
      where: {
        id: parseInt(params.id),
        schoolId,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (existingRole?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 400 }
      );
    }

    if (existingRole?._count?.staff && existingRole._count.staff > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users' },
        { status: 400 }
      );
    }

    await prisma.roles.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
