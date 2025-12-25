import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const attendanceSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  attendances: z.array(z.object({
    staffId: z.number().int().positive(),
    status: z.enum(['present', 'absent', 'late', 'half_day', 'holiday']),
    checkIn: z.string().optional().nullable(),
    checkOut: z.string().optional().nullable(),
    remark: z.string().optional().nullable(),
  })),
});

// GET staff attendance for a date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const roleId = searchParams.get('roleId');
    const departmentId = searchParams.get('departmentId');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      );
    }

    // Build where clause for staff
    const staffWhere: any = {
      schoolId,
      isActive: true,
    };

    if (roleId) {
      staffWhere.roleId = parseInt(roleId, 10);
    }
    if (departmentId) {
      staffWhere.departmentId = parseInt(departmentId, 10);
    }

    // Get all active staff with their attendance for the date
    const staffList = await prisma.staff.findMany({
      where: staffWhere,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        image: true,
        role: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        staffAttendances: {
          where: {
            date: new Date(date),
          },
        },
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    // Format response
    const staff = staffList.map((s) => ({
      id: s.id,
      employeeId: s.employeeId,
      firstName: s.firstName,
      lastName: s.lastName,
      image: s.image,
      role: s.role,
      department: s.department,
      attendance: s.staffAttendances[0] || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        date,
        staff,
      },
    });
  } catch (error) {
    console.error('Error fetching staff attendance:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST/PUT save staff attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validation = attendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, attendances } = validation.data;
    const attendanceDate = new Date(date);

    // Verify all staff belong to this school
    const staffIds = attendances.map(a => a.staffId);
    const validStaff = await prisma.staff.findMany({
      where: {
        id: { in: staffIds },
        schoolId,
      },
      select: { id: true },
    });

    const validStaffIds = new Set(validStaff.map(s => s.id));
    const invalidStaff = staffIds.filter(id => !validStaffIds.has(id));

    if (invalidStaff.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Some staff members are invalid' },
        { status: 400 }
      );
    }

    // Upsert each attendance record
    const results = await Promise.all(
      attendances.map(async (att) => {
        return prisma.staffAttendance.upsert({
          where: {
            staffId_date: {
              staffId: att.staffId,
              date: attendanceDate,
            },
          },
          update: {
            status: att.status,
            checkIn: att.checkIn ? new Date(`${date}T${att.checkIn}`) : null,
            checkOut: att.checkOut ? new Date(`${date}T${att.checkOut}`) : null,
            remark: att.remark,
          },
          create: {
            staffId: att.staffId,
            date: attendanceDate,
            status: att.status,
            checkIn: att.checkIn ? new Date(`${date}T${att.checkIn}`) : null,
            checkOut: att.checkOut ? new Date(`${date}T${att.checkOut}`) : null,
            remark: att.remark,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Attendance saved for ${results.length} staff members`,
      data: results,
    });
  } catch (error) {
    console.error('Error saving staff attendance:', error);
    return NextResponse.json({ success: false, error: 'Failed to save attendance' }, { status: 500 });
  }
}
