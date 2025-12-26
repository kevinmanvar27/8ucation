import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all books for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isAvailable = searchParams.get('isAvailable');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { bookNo: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
      ];
    }
    if (isAvailable === 'true') {
      where.available = { gt: 0 };
    }

    const [books, total] = await Promise.all([
      prisma.books.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.books.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: books,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch books' }, { status: 500 });
  }
}

// POST - Create new book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = parseInt(session.user.schoolId);
    const body = await request.json();
    const {
      title,
      bookNo,
      isbn,
      author,
      publisher,
      subject,
      rackNo,
      quantity,
      price,
      postDate,
      description,
    } = body;

    if (!title || !bookNo) {
      return NextResponse.json({ success: false, error: 'Book title and number are required' }, { status: 400 });
    }

    const book = await prisma.books.create({
      data: {
        schoolId,
        title,
        bookNo,
        isbn,
        author,
        publisher,
        subject,
        rackNo,
        quantity: quantity ? parseInt(quantity) : 1,
        available: quantity ? parseInt(quantity) : 1,
        price: price ? parseFloat(price) : 0,
        postDate: postDate ? new Date(postDate) : new Date(),
        description,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: book }, { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json({ success: false, error: 'Failed to create book' }, { status: 500 });
  }
}
