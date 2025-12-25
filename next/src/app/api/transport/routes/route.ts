import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/transport/routes
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
    const withPickupPoints = searchParams.get('withPickupPoints') === 'true';

    if (withPickupPoints) {
      const routes = await prisma.transportRoute.findMany({
        where: { schoolId, isActive: true },
        include: {
          routePickupPoints: {
            include: {
              pickupPoint: true,
            },
          },
        },
      });

      const data = routes.map(route => ({
        id: route.id,
        name: route.title,
        fare: route.fare,
        pickupPoints: route.routePickupPoints.map(rpp => ({
          id: rpp.pickupPoint.id,
          name: rpp.pickupPoint.name,
        })),
      }));

      return NextResponse.json({ success: true, data });
    }

    const routes = await prisma.transportRoute.findMany({
      where: { schoolId, isActive: true },
    });

    const data = routes.map(route => ({
      id: route.id,
      name: route.title,
      fare: route.fare,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching transport routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transport routes' },
      { status: 500 }
    );
  }
}