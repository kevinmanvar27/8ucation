import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/roles - List all roles for the school
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    
    const roles = await prisma.role.findMany({
      where: {
        schoolId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isSystem: true,
        isActive: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    // Check for duplicate slug
    const existing = await prisma.role.findFirst({
      where: {
        schoolId,
        slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A role with this name already exists' },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        schoolId,
        name,
        slug,
        isSystem: false,
        permissions: permissionIds?.length > 0 ? {
          create: permissionIds.map((permissionId: number) => ({
            permissionId,
          })),
        } : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
