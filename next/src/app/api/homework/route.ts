import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for now
    const homework = [
      {
        id: '1',
        title: 'Math Homework',
        description: 'Complete exercises 1-10 on page 25',
        classId: '1',
        sectionId: '1',
        subjectId: '1',
        dueDate: '2025-12-30',
        createdBy: '1',
        createdAt: '2025-12-01',
        class: {
          name: 'Class 1',
        },
        section: {
          name: 'Section A',
        },
        subject: {
          name: 'Mathematics',
        },
        creator: {
          name: 'John Teacher',
        },
      },
      {
        id: '2',
        title: 'Science Project',
        description: 'Prepare a presentation on solar system',
        classId: '2',
        sectionId: '1',
        subjectId: '2',
        dueDate: '2025-12-25',
        createdBy: '2',
        createdAt: '2025-12-05',
        class: {
          name: 'Class 2',
        },
        section: {
          name: 'Section A',
        },
        subject: {
          name: 'Science',
        },
        creator: {
          name: 'Jane Teacher',
        },
      },
    ];

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHomework = homework.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedHomework,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(homework.length / limit),
        total: homework.length,
      },
    });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}