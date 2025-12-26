import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get due fees for students
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const sessionId = searchParams.get('sessionId');

    // Build where clause for students
    const whereStudent: any = { schoolId };
    if (studentId) whereStudent.id = parseInt(studentId);

    // Build where clause for student sessions
    const whereSession: any = {};
    if (sessionId) whereSession.sessionId = parseInt(sessionId);
    if (classId) whereSession.class_sections = { classId: parseInt(classId) };

    const students = await prisma.students.findMany({
      where: whereStudent,
      include: {
        student_sessions: {
          where: Object.keys(whereSession).length ? whereSession : undefined,
          include: {
            class_sections: { include: { classes: true, sections: true } },
            sessions: true,
            student_fees_masters: {
              where: { isActive: true },
              include: {
                fees_masters: {
                  include: {
                    fee_groups: {
                      include: {
                        fee_group_types: { include: { fee_types: true } },
                      },
                    },
                    classes: true,
                  },
                },
                fee_payments: true,
              },
            },
          },
        },
      },
    });

    // Calculate due fees for each student
    const dueFeesData = students.map(student => {
      const sessionsData = student.student_sessions.map(ss => {
        // Get all assigned fee types with amounts from StudentFeesMaster
        const assignedFees: any[] = [];
        
        ss.student_fees_masters.forEach(sfm => {
          const feeGroup = sfm.fees_masters.fee_groups;
          feeGroup.fee_group_types.forEach(fgt => {
            assignedFees.push({
              studentFeesMasterId: sfm.id,
              feeGroupTypeId: fgt.id,
              feeTypeId: fgt.feeTypeId,
              feeTypeName: fgt.fee_types.name,
              feeGroupId: feeGroup.id,
              feeGroupName: feeGroup.name,
              amount: fgt.amount,
              dueDate: fgt.dueDate,
              fineType: fgt.fineType,
              finePercent: fgt.finePercent,
              fineAmount: fgt.fineAmount,
            });
          });

          // Calculate paid amounts for this StudentFeesMaster
          const paidAmounts: { [key: number]: number } = {};
          sfm.fee_payments.forEach(fp => {
            // Sum all payments for this fee master
            paidAmounts[sfm.id] = (paidAmounts[sfm.id] || 0) + Number(fp.amount);
          });
        });

        // Calculate total amounts
        let totalAssigned = 0;
        let totalPaid = 0;
        
        ss.student_fees_masters.forEach(sfm => {
          // Total assigned from fee group types
          sfm.fees_masters.fee_groups.fee_group_types.forEach(fgt => {
            totalAssigned += Number(fgt.amount);
          });
          // Total paid
          sfm.fee_payments.forEach(fp => {
            totalPaid += Number(fp.amount);
          });
        });

        const totalDue = totalAssigned - totalPaid;

        // Calculate fine if overdue
        let totalFine = 0;
        assignedFees.forEach(af => {
          if (af.dueDate && new Date() > new Date(af.dueDate)) {
            const dueAmount = Number(af.amount);
            if (af.fineType === 'percentage' && af.finePercent) {
              totalFine += (dueAmount * Number(af.finePercent)) / 100;
            } else if (af.fineType === 'fixed' && af.fineAmount) {
              totalFine += Number(af.fineAmount);
            }
          }
        });

        return {
          sessionId: ss.sessionId,
          sessionName: ss.sessions.session,
          classSection: ss.class_sections ? {
            id: ss.classSectionId,
            className: ss.class_sections.classes.className,
            sectionName: ss.class_sections.sections.sectionName,
          } : null,
          feeDetails: assignedFees,
          totalAssigned,
          totalPaid,
          totalDue,
          totalFine,
          grandTotal: totalDue + totalFine,
        };
      });

      return {
        studentId: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        sessions: sessionsData,
        summary: {
          totalDue: sessionsData.reduce((sum, s) => sum + s.totalDue, 0),
          totalFine: sessionsData.reduce((sum, s) => sum + s.totalFine, 0),
          grandTotal: sessionsData.reduce((sum, s) => sum + s.grandTotal, 0),
        },
      };
    });

    // Filter out students with no due fees if requested
    const onlyDue = searchParams.get('onlyDue') === 'true';
    const filteredData = onlyDue 
      ? dueFeesData.filter(d => d.summary.grandTotal > 0)
      : dueFeesData;

    return NextResponse.json({ 
      success: true, 
      data: filteredData,
      summary: {
        totalStudents: filteredData.length,
        totalDueAmount: filteredData.reduce((sum, d) => sum + d.summary.grandTotal, 0),
      }
    });
  } catch (error) {
    console.error('Error fetching due fees:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch due fees' }, { status: 500 });
  }
}
