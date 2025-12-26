import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List book issues
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const bookId = searchParams.get('bookId');
    const status = searchParams.get('status'); // issued, returned, overdue
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { books: { schoolId } };
    if (memberId) where.memberId = parseInt(memberId);
    if (bookId) where.bookId = parseInt(bookId);
    if (status === 'issued') where.returnDate = null;
    if (status === 'returned') where.returnDate = { not: null };
    if (status === 'overdue') {
      where.returnDate = null;
      where.dueDate = { lt: new Date() };
    }

    const [issues, total] = await Promise.all([
      prisma.book_issues.findMany({
        where,
        include: {
          books: { select: { id: true, title: true, bookNo: true, author: true } },
          library_members: { select: { id: true, memberType: true, libraryCardNo: true } },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book_issues.count({ where }),
    ]);

    // Enrich with member details (student or staff)
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        let memberDetails = null;
        if (issue.library_members.memberType === 'student' && issue.studentId) {
          memberDetails = await prisma.students.findUnique({
            where: { id: issue.studentId },
            select: { id: true, admissionNo: true, firstName: true, lastName: true },
          });
        }
        return { ...issue, memberDetails };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedIssues,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching book issues:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch book issues' }, { status: 500 });
  }
}

// POST - Issue a book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const { bookId, memberId, studentId, issueDate, dueDate } = body;

    if (!bookId || !memberId) {
      return NextResponse.json({ success: false, error: 'Book and member are required' }, { status: 400 });
    }

    // Check book availability
    const book = await prisma.books.findFirst({
      where: { id: parseInt(bookId), schoolId },
    });

    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    if (book.available <= 0) {
      return NextResponse.json({ success: false, error: 'Book not available' }, { status: 400 });
    }

    // Verify member exists
    const member = await prisma.library_members.findUnique({
      where: { id: parseInt(memberId) },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    // Create issue and update book availability
    const [issue] = await prisma.$transaction([
      prisma.book_issues.create({
        data: {
          bookId: parseInt(bookId),
          memberId: parseInt(memberId),
          studentId: studentId ? parseInt(studentId) : null,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
          status: 'issued',
        },
        include: {
          books: { select: { id: true, title: true, bookNo: true } },
          library_members: true,
        },
      }),
      prisma.books.update({
        where: { id: parseInt(bookId) },
        data: { available: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, data: issue }, { status: 201 });
  } catch (error) {
    console.error('Error issuing book:', error);
    return NextResponse.json({ success: false, error: 'Failed to issue book' }, { status: 500 });
  }
}
