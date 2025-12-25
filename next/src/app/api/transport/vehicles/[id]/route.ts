import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get single vehicle
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
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: parseInt(params.id), schoolId },
      include: {
        vehicleRoutes: {
          include: {
            route: {
              include: {
                routePickupPoints: {
                  include: { pickupPoint: true }
                }
              }
            }
          }
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

// PUT - Update vehicle
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

    const existing = await prisma.vehicle.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(params.id) },
      data: {
        vehicleNo: body.vehicleNo,
        vehicleModel: body.vehicleModel,
        manufacturer: body.manufacturer,
        driverName: body.driverName,
        driverLicense: body.driverLicense,
        driverPhone: body.driverPhone,
        capacity: body.capacity ? parseInt(body.capacity) : undefined,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vehicle' }, { status: 500 });
  }
}

// DELETE - Delete vehicle
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
    
    const existing = await prisma.vehicle.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    await prisma.vehicle.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
