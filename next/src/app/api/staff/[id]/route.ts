import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateStaffSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').optional(),
  roleId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  designationId: z.number().int().positive().optional().nullable(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  leavingDate: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNo: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  basicSalary: z.number().optional(),
  contractType: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET single staff
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const staffId = parseInt(params.id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        schoolId,
      },
      include: {
        role: true,
        department: true,
        designation: true,
        user: {
          select: { id: true, username: true, email: true },
        },
        classTeachers: {
          include: {
            classSection: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch staff' }, { status: 500 });
  }
}

// PUT update staff
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const schoolId = Number(session.user.schoolId);
    const staffId = parseInt(params.id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    const data = validation.data;

    // Check if staff exists
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        schoolId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    // Check for duplicate employee ID
    if (data.employeeId) {
      const duplicateEmployeeId = await prisma.staff.findFirst({
        where: {
          schoolId,
          employeeId: data.employeeId,
          id: { not: staffId },
        },
      });

      if (duplicateEmployeeId) {
        return NextResponse.json(
          { success: false, error: 'Employee ID already exists' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email
    if (data.email) {
      const duplicateEmail = await prisma.staff.findFirst({
        where: {
          schoolId,
          email: data.email,
          id: { not: staffId },
        },
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...data };
    
    if (data.dob !== undefined) {
      updateData.dob = data.dob ? new Date(data.dob) : null;
    }
    if (data.joiningDate !== undefined) {
      updateData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;
    }
    if (data.leavingDate !== undefined) {
      updateData.leavingDate = data.leavingDate ? new Date(data.leavingDate) : null;
    }

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: updateData,
      include: {
        role: true,
        department: true,
        designation: true,
        user: {
          select: { id: true, username: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ success: false, error: 'Failed to update staff' }, { status: 500 });
  }
}

// DELETE staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const staffId = parseInt(params.id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Check if staff exists
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        schoolId,
      },
      include: {
        user: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    // Delete staff (cascading will handle related records)
    await prisma.$transaction(async (tx) => {
      // Delete user if exists
      if (staff.user) {
        await tx.user.delete({
          where: { id: staff.user.id },
        });
      }

      // Delete staff
      await tx.staff.delete({
        where: { id: staffId },
      });
    });

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete staff' }, { status: 500 });
  }
}
