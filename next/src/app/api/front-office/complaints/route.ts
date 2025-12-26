import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const complaints = await prisma.complaints.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const complaint = await prisma.complaints.create({
      data: {
        schoolId: 1, // Default school ID
        complaintType: data.complainantType || 'General',
        source: data.source || null,
        name: data.complainantName,
        phone: data.phone || null,
        email: data.email || null,
        date: new Date(),
        description: data.description || null,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        status: data.status || 'pending',
        note: data.subject || null,
      },
    });
    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
