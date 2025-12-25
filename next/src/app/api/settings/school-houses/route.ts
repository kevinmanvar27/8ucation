import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/settings/school-houses
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
    
    // For now, we'll return some default school houses
    // In a real implementation, these would come from the database
    const houses = [
      { id: '1', name: 'Red House' },
      { id: '2', name: 'Blue House' },
      { id: '3', name: 'Green House' },
      { id: '4', name: 'Yellow House' },
    ];

    return NextResponse.json({ success: true, data: houses });
  } catch (error) {
    console.error('Error fetching school houses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school houses' },
      { status: 500 }
    );
  }
}