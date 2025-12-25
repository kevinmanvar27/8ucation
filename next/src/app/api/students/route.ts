import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET /api/students - List all students with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const classSectionId = searchParams.get('classSectionId') || '';
    const status = searchParams.get('status') || 'active';
    const sessionId = searchParams.get('sessionId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      schoolId,
    };

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNo: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Class/Section filter via StudentSession
    if (classSectionId || sessionId) {
      where.studentSessions = {
        some: {
          ...(classSectionId && { classSectionId: parseInt(classSectionId) }),
          ...(sessionId && { sessionId: parseInt(sessionId) }),
        },
      };
    }

    // Get students with related data
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: {
            select: {
              fatherName: true,
              motherName: true,
              guardianPhone: true,
            },
          },
          studentSessions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              classSection: {
                include: {
                  class: { select: { className: true } },
                  section: { select: { sectionName: true } },
                },
              },
              session: { select: { session: true } },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Transform data
    const data = students.map((student) => {
      const currentSession = student.studentSessions[0];
      return {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        dob: student.dob,
        image: student.image,
        isActive: student.isActive,
        currentSession: currentSession ? {
          class: currentSession.classSection?.class?.className,
          section: currentSession.classSection?.section?.sectionName,
          session: currentSession.session?.session,
          rollNo: currentSession.rollNo,
        } : null,
        parent: student.parent,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// Validation schema for creating a student
const createStudentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().min(1, 'Date of birth is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  admissionDate: z.string().optional(),
  bloodGroup: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  caste: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  motherTongue: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  // Class assignment
  classId: z.number().optional(),
  sectionId: z.number().optional(),
  sessionId: z.number().optional(),
  rollNo: z.string().optional().nullable(),
  // Parent info
  fatherName: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  fatherOccupation: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  motherOccupation: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
  // Transport
  routePickupPointId: z.number().optional().nullable(),
  // Hostel
  hostelRoomId: z.number().optional().nullable(),
});

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = Number(session.user.schoolId);
    const body = await request.json();
    const validatedData = createStudentSchema.parse(body);

    // Check if admission number already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        schoolId,
        admissionNo: validatedData.admissionNo,
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Admission number already exists' },
        { status: 400 }
      );
    }

    // Create student with session in a transaction
    const student = await prisma.$transaction(async (tx) => {
      // Create student with flat parent fields
      const newStudent = await tx.student.create({
        data: {
          schoolId,
          admissionNo: validatedData.admissionNo,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          gender: validatedData.gender,
          dob: new Date(validatedData.dob),
          email: validatedData.email,
          phone: validatedData.phone,
          admissionDate: validatedData.admissionDate ? new Date(validatedData.admissionDate) : new Date(),
          bloodGroup: validatedData.bloodGroup,
          religion: validatedData.religion,
          caste: validatedData.caste,
          category: validatedData.category,
          motherTongue: validatedData.motherTongue,
          currentAddress: validatedData.currentAddress,
          permanentAddress: validatedData.permanentAddress,
          // Parent info stored directly on student
          fatherName: validatedData.fatherName,
          fatherPhone: validatedData.fatherPhone,
          fatherOccupation: validatedData.fatherOccupation,
          motherName: validatedData.motherName,
          motherPhone: validatedData.motherPhone,
          motherOccupation: validatedData.motherOccupation,
          guardianName: validatedData.guardianName,
          guardianRelation: validatedData.guardianRelation,
          guardianPhone: validatedData.guardianPhone,
          guardianEmail: validatedData.guardianEmail,
          guardianAddress: validatedData.guardianAddress,
          // Transport & Hostel
          routePickupPointId: validatedData.routePickupPointId,
          hostelRoomId: validatedData.hostelRoomId,
          isActive: true,
        },
      });

      // Create student session if class is provided
      if (validatedData.classId && validatedData.sectionId && validatedData.sessionId) {
        // Find the class-section mapping
        const classSection = await tx.classSection.findFirst({
          where: {
            classId: validatedData.classId,
            sectionId: validatedData.sectionId,
          },
        });
        
        if (classSection) {
          await tx.studentSession.create({
            data: {
              studentId: newStudent.id,
              sessionId: validatedData.sessionId,
              classSectionId: classSection.id,
              rollNo: validatedData.rollNo,
            },
          });
        }
      }

      return newStudent;
    });

    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (error) {
    console.error('Error creating student:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
