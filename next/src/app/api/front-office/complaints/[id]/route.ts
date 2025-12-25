import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const complaint = await prisma.complaint.update({
      where: { id: parseInt(params.id) },
      data: {
        complaintType: data.complainantType || 'General',
        name: data.complainantName,
        phone: data.phone || null,
        email: data.email || null,
        description: data.description || null,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        status: data.status,
        actionTaken: data.resolution || null,
        note: data.subject || null,
      },
    });
    return NextResponse.json(complaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.complaint.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
