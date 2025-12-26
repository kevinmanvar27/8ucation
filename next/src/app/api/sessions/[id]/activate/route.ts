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

// POST - Activate a session (deactivate all others)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Deactivate all sessions for this school
    await prisma.sessions.updateMany({
      where: { schoolId },
      data: { isActive: false },
    });

    // Activate the selected session
    const academicSession = await prisma.sessions.update({
      where: { id: parseInt(params.id) },
      data: { isActive: true },
    });

    return NextResponse.json(academicSession);
  } catch (error) {
    console.error('Error activating session:', error);
    return NextResponse.json({ error: 'Failed to activate session' }, { status: 500 });
  }
}
