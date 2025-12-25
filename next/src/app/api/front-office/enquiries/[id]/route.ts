import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const enquiry = await prisma.enquiry.update({
      where: { id: parseInt(params.id) },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        classInterested: data.enquiryFor || null,
        description: data.description || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        status: data.status,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        note: data.notes || null,
      },
    });
    return NextResponse.json(enquiry);
  } catch (error) {
    console.error('Error updating enquiry:', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.enquiry.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
  }
}
