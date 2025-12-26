import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// POST - Return a book
export async function POST(
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
    const { returnDate } = body;

    // Find the issue
    const issue = await prisma.book_issues.findFirst({
      where: { id: parseInt(params.id), books: { schoolId } },
      include: { books: true },
    });

    if (!issue) {
      return NextResponse.json({ success: false, error: 'Issue record not found' }, { status: 404 });
    }

    if (issue.returnDate) {
      return NextResponse.json({ success: false, error: 'Book already returned' }, { status: 400 });
    }

    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
    
    // Calculate if overdue for informational purposes
    let overdueDays = 0;
    if (issue.dueDate && actualReturnDate > issue.dueDate) {
      overdueDays = Math.ceil((actualReturnDate.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Update issue and book availability
    const [updatedIssue] = await prisma.$transaction([
      prisma.book_issues.update({
        where: { id: parseInt(params.id) },
        data: {
          returnDate: actualReturnDate,
          status: 'returned',
        },
        include: {
          books: { select: { id: true, title: true, bookNo: true } },
          library_members: true,
        },
      }),
      prisma.books.update({
        where: { id: issue.bookId },
        data: { available: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: overdueDays > 0 ? `Book returned (${overdueDays} days overdue)` : 'Book returned successfully',
    });
  } catch (error) {
    console.error('Error returning book:', error);
    return NextResponse.json({ success: false, error: 'Failed to return book' }, { status: 500 });
  }
}
