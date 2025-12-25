import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(enquiries);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const enquiry = await prisma.enquiry.create({
      data: {
        schoolId: 1, // Default school ID
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        classInterested: data.enquiryFor || null,
        description: data.description || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        status: data.status || 'active',
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        note: data.notes || null,
      },
    });
    return NextResponse.json(enquiry, { status: 201 });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return NextResponse.json({ error: 'Failed to create enquiry' }, { status: 500 });
  }
}
