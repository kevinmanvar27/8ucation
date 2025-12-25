import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get single transport route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const route = await prisma.transportRoute.findFirst({
      where: { id: parseInt(params.id), schoolId },
      include: {
        vehicleRoutes: {
          include: { vehicle: true }
        },
        routePickupPoints: {
          include: { pickupPoint: true },
          orderBy: { pickupTime: 'asc' }
        },
      },
    });

    if (!route) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: route });
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch route' }, { status: 500 });
  }
}

// PUT - Update transport route
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { title, fare, isActive, vehicleId, pickupPoints } = body;

    const existing = await prisma.transportRoute.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
    }

    // Update route and handle pickup points
    const route = await prisma.$transaction(async (tx) => {
      // Update the route
      const updatedRoute = await tx.transportRoute.update({
        where: { id: parseInt(params.id) },
        data: {
          title,
          fare: fare ? parseFloat(fare) : undefined,
          isActive,
        },
      });

      // Handle vehicle association if provided
      if (vehicleId !== undefined) {
        // Remove existing vehicle associations
        await tx.vehicleRoute.deleteMany({
          where: { routeId: parseInt(params.id) },
        });

        // Create new association if vehicleId provided
        if (vehicleId) {
          await tx.vehicleRoute.create({
            data: {
              vehicleId: parseInt(vehicleId),
              routeId: parseInt(params.id),
            },
          });
        }
      }

      // Handle pickup points if provided
      if (pickupPoints) {
        // Delete existing route-pickup associations
        await tx.routePickupPoint.deleteMany({
          where: { routeId: parseInt(params.id) },
        });

        // Create new pickup points and associations
        for (const pp of pickupPoints) {
          let pickupPoint = await tx.pickupPoint.findFirst({
            where: { name: pp.name }
          });
          
          if (!pickupPoint) {
            pickupPoint = await tx.pickupPoint.create({
              data: {
                name: pp.name,
                address: pp.address,
              }
            });
          }

          await tx.routePickupPoint.create({
            data: {
              routeId: parseInt(params.id),
              pickupPointId: pickupPoint.id,
              pickupTime: pp.pickupTime,
            }
          });
        }
      }

      return updatedRoute;
    });

    // Fetch updated route with relations
    const fullRoute = await prisma.transportRoute.findFirst({
      where: { id: parseInt(params.id) },
      include: {
        vehicleRoutes: {
          include: { vehicle: true }
        },
        routePickupPoints: {
          include: { pickupPoint: true },
          orderBy: { pickupTime: 'asc' }
        },
      },
    });

    return NextResponse.json({ success: true, data: fullRoute });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ success: false, error: 'Failed to update route' }, { status: 500 });
  }
}

// DELETE - Delete transport route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    
    const existing = await prisma.transportRoute.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
    }

    await prisma.transportRoute.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete route' }, { status: 500 });
  }
}
