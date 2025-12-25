import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Helper to safely get schoolId as a number
function getSchoolId(session: { user?: { schoolId?: string | number } } | null): number | null {
  if (!session?.user?.schoolId) return null;
  const schoolId = session.user.schoolId;
  return typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId;
}

// POST - Reset user password
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

    const data = await request.json();

    if (!data.password || data.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify user belongs to the same school
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(params.id),
        schoolId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
