import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const calls = await prisma.phoneCallLog.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const call = await prisma.phoneCallLog.create({
      data: {
        callType: data.type, // 'incoming' or 'outgoing'
        name: data.name,
        phone: data.phone || null,
        date: new Date(data.callDate),
        description: data.purpose || null,
        note: data.notes || null,
        callDuration: data.duration ? String(data.duration) : null,
        nextFollowUp: data.followUpDate ? new Date(data.followUpDate) : null,
      },
    });
    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error('Error creating call log:', error);
    return NextResponse.json({ error: 'Failed to create call log' }, { status: 500 });
  }
}
