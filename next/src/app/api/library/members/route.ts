import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all library members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const memberType = searchParams.get('memberType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (search) {
      where.libraryCardNo = { contains: search };
    }
    if (memberType) where.memberType = memberType;

    // Filter by school through student relation
    if (memberType === 'student' || !memberType) {
      where.students = { schoolId };
    }

    const [members, total] = await Promise.all([
      prisma.library_members.findMany({
        where,
        include: {
          students: {
            select: { id: true, admissionNo: true, firstName: true, lastName: true, schoolId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.library_members.count({ where }),
    ]);

    // Filter by school and enrich with member details
    const filteredMembers = members.filter(m => 
      m.memberType === 'student' ? m.students?.schoolId === schoolId : true
    );

    return NextResponse.json({
      success: true,
      data: filteredMembers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching library members:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch library members' }, { status: 500 });
  }
}

// POST - Create new library member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { memberType, studentId, staffId, libraryCardNo } = body;

    if (!memberType) {
      return NextResponse.json({ success: false, error: 'Member type is required' }, { status: 400 });
    }

    if (memberType === 'student' && !studentId) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    // Verify student belongs to the school
    if (studentId) {
      const student = await prisma.students.findFirst({
        where: { id: parseInt(studentId), schoolId },
      });
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }

      // Check if student already has a library membership
      const existingMember = await prisma.library_members.findUnique({
        where: { studentId: parseInt(studentId) },
      });
      if (existingMember) {
        return NextResponse.json({ success: false, error: 'Student already has a library membership' }, { status: 400 });
      }
    }

    // Generate library card number if not provided
    const cardNo = libraryCardNo || `LIB-${memberType.toUpperCase().slice(0, 3)}-${Date.now()}`;

    const member = await prisma.library_members.create({
      data: {
        memberType,
        studentId: studentId ? parseInt(studentId) : null,
        staffId: staffId ? parseInt(staffId) : null,
        libraryCardNo: cardNo,
      },
      include: {
        students: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error('Error creating library member:', error);
    return NextResponse.json({ success: false, error: 'Failed to create library member' }, { status: 500 });
  }
}
