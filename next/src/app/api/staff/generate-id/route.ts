import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/staff/generate-id - Generate unique employee ID
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const schoolId = Number(session.user.schoolId);

    // Get school code for prefix
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { code: true, name: true },
    });

    // Get the latest employee ID for this school
    const latestStaff = await prisma.staff.findFirst({
      where: {
        schoolId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        employeeId: true,
      },
    });

    // Generate new employee ID
    const prefix = school?.code || 'EMP';
    const year = new Date().getFullYear().toString().slice(-2);
    
    let nextNumber = 1;
    
    if (latestStaff?.employeeId) {
      // Extract number from existing ID (format: PREFIX-YY-XXXX)
      const match = latestStaff.employeeId.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Pad number to 4 digits
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    const employeeId = `${prefix}-${year}-${paddedNumber}`;

    // Verify uniqueness
    const exists = await prisma.staff.findFirst({
      where: {
        schoolId,
        employeeId,
      },
    });

    if (exists) {
      // If exists, increment and try again
      const newPaddedNumber = (nextNumber + 1).toString().padStart(4, '0');
      return NextResponse.json({ success: true, data: `${prefix}-${year}-${newPaddedNumber}` });
    }

    return NextResponse.json({ success: true, data: employeeId });
  } catch (error) {
    console.error('Error generating employee ID:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate employee ID' },
      { status: 500 }
    );
  }
}
