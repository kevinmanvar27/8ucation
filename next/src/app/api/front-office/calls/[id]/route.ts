import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const call = await prisma.phoneCallLog.update({
      where: { id: parseInt(params.id) },
      data: {
        callType: data.type,
        name: data.name,
        phone: data.phone || null,
        date: new Date(data.callDate),
        description: data.purpose || null,
        note: data.notes || null,
        callDuration: data.duration ? String(data.duration) : null,
        nextFollowUp: data.followUpDate ? new Date(data.followUpDate) : null,
      },
    });
    return NextResponse.json(call);
  } catch (error) {
    console.error('Error updating call log:', error);
    return NextResponse.json({ error: 'Failed to update call log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.phoneCallLog.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting call log:', error);
    return NextResponse.json({ error: 'Failed to delete call log' }, { status: 500 });
  }
}
