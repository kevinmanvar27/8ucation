import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all alumni for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const passingYear = searchParams.get('passingYear');

    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { currentCompany: { contains: search } },
      ];
    }

    if (passingYear) {
      where.passingYear = passingYear;
    }

    const [alumni, total] = await Promise.all([
      prisma.alumni.findMany({
        where,
        include: {
          students: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
            },
          },
          alumni_events_attendees: {
            include: {
              alumni_events: {
                select: {
                  id: true,
                  title: true,
                  eventDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alumni.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: alumni,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch alumni' }, { status: 500 });
  }
}

// POST - Create new alumni record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      passingYear,
      currentJob,
      currentCompany,
      currentCity,
      currentCountry,
      linkedinUrl,
      photo,
    } = body;

    if (!firstName) {
      return NextResponse.json({ success: false, error: 'First name is required' }, { status: 400 });
    }

    const alumniRecord = await prisma.alumni.create({
      data: {
        schoolId,
        studentId: studentId ? parseInt(studentId) : null,
        firstName,
        lastName,
        email,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        passingYear,
        currentJob,
        currentCompany,
        currentCity,
        currentCountry,
        linkedinUrl,
        photo,
      },
      include: {
        students: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: alumniRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating alumni:', error);
    return NextResponse.json({ success: false, error: 'Failed to create alumni record' }, { status: 500 });
  }
}
