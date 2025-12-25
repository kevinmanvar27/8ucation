import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/hostel
export async function GET(request: NextRequest) {
  try {
    // For development/testing purposes, use default school ID
    const schoolId = 1; // Default to Demo School
    
    // Uncomment the following lines for production
    /*
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const schoolId = Number(session.user.schoolId);
    */
    const { searchParams } = new URL(request.url);
    const withRooms = searchParams.get('withRooms') === 'true';

    if (withRooms) {
      const hostels = await prisma.hostel.findMany({
        where: { schoolId, isActive: true },
        include: {
          rooms: true,
        },
      });

      const data = hostels.map(hostel => ({
        id: hostel.id,
        name: hostel.name,
        type: hostel.type,
        address: hostel.address,
        intake: hostel.intake,
        rooms: hostel.rooms.map(room => ({
          id: room.id,
          roomNo: room.roomNo,
          noOfBeds: room.noOfBeds,
          costPerBed: room.costPerBed,
        })),
      }));

      return NextResponse.json({ success: true, data });
    }

    const hostels = await prisma.hostel.findMany({
      where: { schoolId, isActive: true },
    });

    const data = hostels.map(hostel => ({
      id: hostel.id,
      name: hostel.name,
      type: hostel.type,
      address: hostel.address,
      intake: hostel.intake,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching hostels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hostels' },
      { status: 500 }
    );
  }
}