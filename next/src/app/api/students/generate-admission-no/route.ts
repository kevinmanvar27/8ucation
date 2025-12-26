import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/students/generate-admission-no
export async function GET(request: NextRequest) {
  try {
    // For development/testing purposes, use default school ID
    const schoolId = 1; // Default to Demo School
    
    // Uncomment the following lines for production
    /*
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const schoolId = Number(session.user.schoolId);
    */
    
    // Get current year
    const year = new Date().getFullYear();
    
    // Get the latest student to determine the next admission number
    const latestStudent = await prisma.students.findFirst({
      where: { schoolId },
      orderBy: { id: 'desc' },
    });

    // Generate admission number
    let nextNumber = 1;
    if (latestStudent) {
      // Extract the number part from the latest admission number
      const lastAdmissionNo = latestStudent.admissionNo;
      const match = lastAdmissionNo.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format the admission number as YYYYXXXX where XXXX is a 4-digit number
    const admissionNo = `${year}${nextNumber.toString().padStart(4, '0')}`;

    return NextResponse.json({ success: true, data: admissionNo });
  } catch (error) {
    console.error('Error generating admission number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate admission number' },
      { status: 500 }
    );
  }
}