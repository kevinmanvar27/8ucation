import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get single book
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
    const book = await prisma.books.findFirst({
      where: { id: parseInt(params.id), schoolId },
      include: {
        book_issues: {
          where: { returnDate: null },
          include: {
            library_members: { select: { id: true, memberType: true, libraryCardNo: true } },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch book' }, { status: 500 });
  }
}

// PUT - Update book
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

    const existing = await prisma.books.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    // Calculate available qty change if total qty changed
    const qtyDiff = body.quantity ? parseInt(body.quantity) - existing.quantity : 0;
    const newAvailable = existing.available + qtyDiff;

    const book = await prisma.books.update({
      where: { id: parseInt(params.id) },
      data: {
        title: body.title,
        bookNo: body.bookNo,
        isbn: body.isbn,
        author: body.author,
        publisher: body.publisher,
        subject: body.subject,
        rackNo: body.rackNo,
        quantity: body.quantity ? parseInt(body.quantity) : undefined,
        available: body.quantity ? Math.max(0, newAvailable) : undefined,
        price: body.price ? parseFloat(body.price) : undefined,
        description: body.description,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json({ success: false, error: 'Failed to update book' }, { status: 500 });
  }
}

// DELETE - Delete book
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
    
    const existing = await prisma.books.findFirst({
      where: { id: parseInt(params.id), schoolId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    // Check if book has unreturned issues
    const unreturnedIssues = await prisma.book_issues.count({
      where: { bookId: parseInt(params.id), returnDate: null },
    });

    if (unreturnedIssues > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Cannot delete book with ${unreturnedIssues} unreturned copies` 
      }, { status: 400 });
    }

    await prisma.books.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete book' }, { status: 500 });
  }
}
