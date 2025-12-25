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

// GET - Fetch school settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        website: true,
        currencySymbol: true,
        currencyCode: true,
        dateFormat: true,
        timezone: true,
      },
    });

    return NextResponse.json(school || {});
  } catch (error) {
    console.error('Error fetching school settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update school settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = getSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: data.name,
        code: data.code,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        website: data.website,
        currencySymbol: data.currencySymbol,
        currencyCode: data.currencyCode,
        dateFormat: data.dateFormat,
        timezone: data.timezone,
      },
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error updating school settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
