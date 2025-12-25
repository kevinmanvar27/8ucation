import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to parse schoolId from session
const getSchoolId = (session: { user?: { schoolId?: string | number } } | null) => {
  if (!session?.user?.schoolId) return null;
  return typeof session.user.schoolId === 'string' 
    ? parseInt(session.user.schoolId) 
    : session.user.schoolId;
};

// GET - Fetch all sessions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { schoolId },
      orderBy: { session: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const newSession = await prisma.session.create({
      data: {
        schoolId,
        session: data.session,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: false,
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
