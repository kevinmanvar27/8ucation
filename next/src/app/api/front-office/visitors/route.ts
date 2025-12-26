import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const visitors = await prisma.visitors.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const now = new Date();
    const visitor = await prisma.visitors.create({
      data: {
        schoolId: 1, // Default school ID
        name: data.name,
        phone: data.phone || null,
        purpose: data.purpose,
        toMeet: data.toMeet || null,
        idCard: data.idType && data.idNumber ? `${data.idType}: ${data.idNumber}` : null,
        date: now,
        inTime: now.toTimeString().slice(0, 5),
        note: data.notes || null,
      },
    });
    return NextResponse.json(visitor, { status: 201 });
  } catch (error) {
    console.error('Error creating visitor:', error);
    return NextResponse.json({ error: 'Failed to create visitor' }, { status: 500 });
  }
}
