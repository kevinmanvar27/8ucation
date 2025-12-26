import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all transport routes for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = { schoolId };
    if (search) {
      where.title = { contains: search };
    }

    const routes = await prisma.transport_routes.findMany({
      where,
      include: {
        vehicle_routes: {
          include: {
            vehicles: { select: { id: true, vehicleNo: true, driverName: true } }
          }
        },
        route_pickup_points: {
          include: { pickup_points: true },
          orderBy: { pickupTime: 'asc' }
        },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch routes' }, { status: 500 });
  }
}

// POST - Create new transport route
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { title, fare, isActive, vehicleId, pickupPoints } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Route title is required' }, { status: 400 });
    }

    // Create route
    const route = await prisma.transport_routes.create({
      data: {
        schoolId,
        title,
        fare: fare ? parseFloat(fare) : 0,
        isActive: isActive ?? true,
      },
    });

    // If vehicleId provided, create vehicle-route association
    if (vehicleId) {
      await prisma.vehicle_routes.create({
        data: {
          vehicleId: parseInt(vehicleId),
          routeId: route.id,
        },
      });
    }

    // If pickup points provided, create them
    if (pickupPoints?.length) {
      for (const pp of pickupPoints) {
        // First create or find the pickup point
        let pickupPoint = await prisma.pickup_points.findFirst({
          where: { name: pp.name }
        });
        
        if (!pickupPoint) {
          pickupPoint = await prisma.pickup_points.create({
            data: {
              name: pp.name,
              address: pp.address,
            }
          });
        }

        // Then create the route-pickup association
        await prisma.route_pickup_points.create({
          data: {
            routeId: route.id,
            pickupPointId: pickupPoint.id,
            pickupTime: pp.pickupTime,
          }
        });
      }
    }

    // Fetch the complete route with relations
    const completeRoute = await prisma.transport_routes.findUnique({
      where: { id: route.id },
      include: {
        vehicle_routes: {
          include: { vehicles: true }
        },
        route_pickup_points: {
          include: { pickup_points: true }
        },
      },
    });

    return NextResponse.json({ success: true, data: completeRoute }, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json({ success: false, error: 'Failed to create route' }, { status: 500 });
  }
}