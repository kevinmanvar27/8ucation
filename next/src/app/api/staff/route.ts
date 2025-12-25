import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createStaffSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  roleId: z.number().int().positive('Role is required'),
  departmentId: z.number().int().positive().optional().nullable(),
  designationId: z.number().int().positive().optional().nullable(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNo: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  basicSalary: z.number().optional().default(0),
  contractType: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  createLogin: z.boolean().optional().default(false),
  password: z.string().optional(),
});

// GET all staff
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleId = searchParams.get('roleId');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (roleId) {
      where.roleId = parseInt(roleId);
    }

    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          role: {
            select: { id: true, name: true },
          },
          department: {
            select: { id: true, name: true },
          },
          designation: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.staff.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch staff' }, { status: 500 });
  }
}

// POST create staff
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validation = createStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check for duplicate employee ID
    const existingStaff = await prisma.staff.findFirst({
      where: {
        schoolId,
        employeeId: data.employeeId,
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingEmail = await prisma.staff.findFirst({
      where: {
        schoolId,
        email: data.email,
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create staff with optional user login
    const result = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          schoolId,
          employeeId: data.employeeId,
          roleId: data.roleId,
          departmentId: data.departmentId || null,
          designationId: data.designationId || null,
          firstName: data.firstName,
          lastName: data.lastName || null,
          gender: data.gender,
          dob: data.dob ? new Date(data.dob) : null,
          email: data.email,
          phone: data.phone || null,
          emergencyPhone: data.emergencyPhone || null,
          maritalStatus: data.maritalStatus || null,
          image: data.image || null,
          currentAddress: data.currentAddress || null,
          permanentAddress: data.permanentAddress || null,
          qualification: data.qualification || null,
          experience: data.experience || null,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
          bankName: data.bankName || null,
          bankAccountNo: data.bankAccountNo || null,
          ifscCode: data.ifscCode || null,
          panNumber: data.panNumber || null,
          basicSalary: data.basicSalary || 0,
          contractType: data.contractType || null,
          facebook: data.facebook || null,
          twitter: data.twitter || null,
          linkedin: data.linkedin || null,
          instagram: data.instagram || null,
          note: data.note || null,
        },
        include: {
          role: true,
          department: true,
          designation: true,
        },
      });

      // Create user login if requested
      if (data.createLogin && data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await tx.user.create({
          data: {
            schoolId,
            username: data.email,
            password: hashedPassword,
            email: data.email,
            userType: 'staff',
            roleId: data.roleId,
            staffId: staff.id,
          },
        });
      }

      return staff;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ success: false, error: 'Failed to create staff' }, { status: 500 });
  }
}
