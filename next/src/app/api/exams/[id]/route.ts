import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get single exam
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const exam = await prisma.exam.findFirst({
      where: { id: parseInt(params.id), schoolId },
      include: {
        examSchedules: { include: { session: true } },
        examSubjects: {
          include: {
            subject: true,
            examResults: {
              include: {
                student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch exam' }, { status: 500 });
  }
}

// PUT - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { name, description, isPublished, isActive } = body;

    // Verify exam belongs to school
    const existing = await prisma.exam.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    const exam = await prisma.exam.update({
      where: { id: parseInt(params.id) },
      data: { name, description, isPublished, isActive },
      include: {
        examSchedules: { include: { session: true } },
        examSubjects: { include: { subject: true } },
      },
    });

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ success: false, error: 'Failed to update exam' }, { status: 500 });
  }
}

// DELETE - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    
    // Verify exam belongs to school
    const existing = await prisma.exam.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    await prisma.exam.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete exam' }, { status: 500 });
  }
}
