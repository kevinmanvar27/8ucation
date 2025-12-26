import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - List all phone call logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const callType = searchParams.get('callType'); // incoming or outgoing
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (callType) where.callType = callType;
    if (date) {
      const searchDate = new Date(date);
      where.date = {
        gte: searchDate,
        lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const [phoneCalls, total] = await Promise.all([
      prisma.phone_call_logs.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.phone_call_logs.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: phoneCalls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching phone calls:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch phone calls' }, { status: 500 });
  }
}

// POST - Create new phone call log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      date,
      description,
      nextFollowUp,
      callDuration,
      note,
      callType,
    } = body;

    if (!name || !callType) {
      return NextResponse.json({ success: false, error: 'Name and call type are required' }, { status: 400 });
    }

    const phoneCall = await prisma.phone_call_logs.create({
      data: {
        name,
        phone,
        date: date ? new Date(date) : new Date(),
        description,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        callDuration,
        note,
        callType,
      },
    });

    return NextResponse.json({ success: true, data: phoneCall }, { status: 201 });
  } catch (error) {
    console.error('Error creating phone call log:', error);
    return NextResponse.json({ success: false, error: 'Failed to create phone call log' }, { status: 500 });
  }
}
