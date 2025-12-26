import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
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
    const route = await prisma.transport_routes.findFirst({
      where: { id: parseInt(params.id), schoolId },
      include: {
        // Fixed: vehicleRoutes -> vehicle_routes, vehicle -> vehicles
        vehicle_routes: {
          include: { vehicles: true }
        },
        // Fixed: routePickupPoints -> route_pickup_points, pickupPoint -> pickup_points
        route_pickup_points: {
          include: { pickup_points: true },
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

    const existing = await prisma.transport_routes.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
    }

    // Update route and handle pickup points
    const route = await prisma.$transaction(async (tx) => {
      // Fixed: tx.transportRoute -> tx.transport_routes
      const updatedRoute = await tx.transport_routes.update({
        where: { id: parseInt(params.id) },
        data: {
          title,
          fare: fare ? parseFloat(fare) : undefined,
          isActive,
        },
      });

      // Handle vehicle association if provided
      if (vehicleId !== undefined) {
        // Fixed: tx.vehicleRoute -> tx.vehicle_routes
        await tx.vehicle_routes.deleteMany({
          where: { routeId: parseInt(params.id) },
        });

        // Create new association if vehicleId provided
        if (vehicleId) {
          // Fixed: tx.vehicleRoute -> tx.vehicle_routes
          await tx.vehicle_routes.create({
            data: {
              vehicleId: parseInt(vehicleId),
              routeId: parseInt(params.id),
            },
          });
        }
      }

      // Handle pickup points if provided
      if (pickupPoints) {
        // Fixed: tx.routePickupPoint -> tx.route_pickup_points
        await tx.route_pickup_points.deleteMany({
          where: { routeId: parseInt(params.id) },
        });

        // Create new pickup points and associations
        for (const pp of pickupPoints) {
          // Fixed: tx.pickupPoint -> tx.pickup_points
          let pickupPoint = await tx.pickup_points.findFirst({
            where: { name: pp.name }
          });
          
          if (!pickupPoint) {
            // Fixed: tx.pickupPoint -> tx.pickup_points
            pickupPoint = await tx.pickup_points.create({
              data: {
                name: pp.name,
                address: pp.address,
              }
            });
          }

          // Fixed: tx.routePickupPoint -> tx.route_pickup_points
          await tx.route_pickup_points.create({
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
    const fullRoute = await prisma.transport_routes.findFirst({
      where: { id: parseInt(params.id) },
      include: {
        // Fixed: vehicleRoutes -> vehicle_routes, vehicle -> vehicles
        vehicle_routes: {
          include: { vehicles: true }
        },
        // Fixed: routePickupPoints -> route_pickup_points, pickupPoint -> pickup_points
        route_pickup_points: {
          include: { pickup_points: true },
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
    
    const existing = await prisma.transport_routes.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
    }

    await prisma.transport_routes.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete route' }, { status: 500 });
  }
}
