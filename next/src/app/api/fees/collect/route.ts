import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get fee collection history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const studentFeesMasterId = searchParams.get('studentFeesMasterId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { students: { schoolId } };

    if (studentId) where.studentId = parseInt(studentId);
    if (studentFeesMasterId) where.studentFeesMasterId = parseInt(studentFeesMasterId);
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.fee_payments.findMany({
        where,
        include: {
          students: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
          student_fees_masters: {
            include: { 
              fees_masters: {
                include: { 
                  fee_groups: {
                    include: { fee_group_types: { include: { fee_types: true } } }
                  },
                  classes: true,
                }
              }
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fee_payments.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching fee payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee payments' }, { status: 500 });
  }
}

// POST - Collect fee payment
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
      studentFeesMasterId,
      amount,
      discount,
      fine,
      paymentMode,
      paymentDate,
      transactionId,
      note,
    } = body;

    if (!studentId || !studentFeesMasterId || !amount) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Verify student belongs to school
    const student = await prisma.students.findFirst({
      where: { id: parseInt(studentId), schoolId },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Verify studentFeesMaster exists
    const studentFeesMaster = await prisma.student_fees_masters.findFirst({
      where: { 
        id: parseInt(studentFeesMasterId),
        student_sessions: {
          students: { schoolId }
        }
      },
    });

    if (!studentFeesMaster) {
      return NextResponse.json({ success: false, error: 'Fee assignment not found' }, { status: 404 });
    }

    const payment = await prisma.fee_payments.create({
      data: {
        studentId: parseInt(studentId),
        studentFeesMasterId: parseInt(studentFeesMasterId),
        amount: parseFloat(amount),
        discount: discount ? parseFloat(discount) : 0,
        fine: fine ? parseFloat(fine) : 0,
        paymentMode: paymentMode || 'Cash',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        transactionId,
        note,
        collectedBy: parseInt(session.user.id),
      },
      include: {
        students: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        student_fees_masters: {
          include: { 
            fees_masters: {
              include: {
                fee_groups: {
                  include: { fee_group_types: { include: { fee_types: true } } }
                },
              }
            }
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error('Error collecting fee:', error);
    return NextResponse.json({ success: false, error: 'Failed to collect fee' }, { status: 500 });
  }
}
