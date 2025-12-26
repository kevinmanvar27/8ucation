import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all vehicles for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { vehicleNo: { contains: search } },
        { vehicleModel: { contains: search } },
        { driverName: { contains: search } },
      ];
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const vehicles = await prisma.vehicles.findMany({
      where,
      include: {
        // Fixed: vehicleRoutes -> vehicle_routes, route -> transport_routes
        vehicle_routes: {
          include: {
            transport_routes: { select: { id: true, title: true } }
          }
        },
      },
      orderBy: { vehicleNo: 'asc' },
    });

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

// POST - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const {
      vehicleNo,
      vehicleModel,
      manufacturer,
      driverName,
      driverLicense,
      driverPhone,
      capacity,
      isActive,
    } = body;

    if (!vehicleNo) {
      return NextResponse.json({ success: false, error: 'Vehicle number is required' }, { status: 400 });
    }

    const vehicle = await prisma.vehicles.create({
      data: {
        schoolId,
        vehicleNo,
        vehicleModel,
        manufacturer,
        driverName,
        driverLicense,
        driverPhone,
        capacity: capacity ? parseInt(capacity) : 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vehicle' }, { status: 500 });
  }
}
