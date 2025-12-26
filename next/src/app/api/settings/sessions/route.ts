import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/settings/sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    
    const sessions = await prisma.sessions.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });

    const data = sessions.map(s => ({
      id: s.id,
      name: s.session,
      startDate: s.startDate,
      endDate: s.endDate,
      isActive: s.isActive,
      isCurrent: s.isActive, // Simplified assumption
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}