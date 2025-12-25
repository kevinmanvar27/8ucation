import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get student transport assignments (students with routePickupPointId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const pickupPointId = searchParams.get('pickupPointId');

    // Get students assigned to transport (have a routePickupPointId)
    const where: any = { 
      schoolId,
      routePickupPointId: { not: null },
    };

    // Filter by route if provided
    if (routeId) {
      where.routePickupPoint = { routeId: parseInt(routeId) };
    }
    if (pickupPointId) {
      where.routePickupPointId = parseInt(pickupPointId);
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        routePickupPointId: true,
        routePickupPoint: {
          select: {
            id: true,
            pickupTime: true,
            route: { select: { id: true, title: true, fare: true } },
            pickupPoint: { select: { id: true, name: true, address: true } },
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching transport assignments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transport assignments' }, { status: 500 });
  }
}

// POST - Assign student to transport route (set routePickupPointId on student)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { studentId, routePickupPointId } = body;

    if (!studentId || !routePickupPointId) {
      return NextResponse.json({ success: false, error: 'Student ID and route pickup point are required' }, { status: 400 });
    }

    // Verify student belongs to school
    const student = await prisma.student.findFirst({
      where: { id: parseInt(studentId), schoolId },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Verify route pickup point exists and route belongs to school
    const routePickupPoint = await prisma.routePickupPoint.findFirst({
      where: { 
        id: parseInt(routePickupPointId),
        route: { schoolId },
      },
      include: {
        route: { select: { id: true, title: true, fare: true } },
        pickupPoint: { select: { id: true, name: true } },
      },
    });

    if (!routePickupPoint) {
      return NextResponse.json({ success: false, error: 'Route pickup point not found' }, { status: 404 });
    }

    // Update student with transport assignment
    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { routePickupPointId: parseInt(routePickupPointId) },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        routePickupPoint: {
          select: {
            id: true,
            pickupTime: true,
            route: { select: { id: true, title: true, fare: true } },
            pickupPoint: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedStudent }, { status: 201 });
  } catch (error) {
    console.error('Error assigning transport:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign transport' }, { status: 500 });
  }
}

// DELETE - Remove student transport assignment (clear routePickupPointId)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    // Verify student belongs to school
    const student = await prisma.student.findFirst({
      where: { id: parseInt(studentId), schoolId },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Remove transport assignment
    await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { routePickupPointId: null },
    });

    return NextResponse.json({ success: true, message: 'Transport assignment removed' });
  } catch (error) {
    console.error('Error removing transport assignment:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove transport assignment' }, { status: 500 });
  }
}
