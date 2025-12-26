import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Helper to parse schoolId from session
const getSchoolId = (session: { user?: { schoolId?: string | number } } | null) => {
  if (!session?.user?.schoolId) return null;
  return typeof session.user.schoolId === 'string' 
    ? parseInt(session.user.schoolId) 
    : session.user.schoolId;
};

// GET - Fetch single user
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

    const user = await prisma.users.findFirst({
      where: {
        id: parseInt(params.id),
        schoolId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        roles: {
          select: { id: true, name: true },
        },
        staff: {
          select: { firstName: true, lastName: true },
        },
        students: {
          select: { firstName: true, lastName: true },
        },
        parents: {
          select: { guardianName: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
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
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.roleId !== undefined) updateData.roleId = data.roleId ? parseInt(data.roleId) : null;

    // If password is provided, hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.users.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
        roles: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
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

    // Prevent self-deletion
    if (session?.user && params.id === String(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
