import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const record = await prisma.postalDispatch.update({
      where: { id: parseInt(params.id) },
      data: {
        type: data.type,
        fromTitle: data.type === 'receive' ? data.fromTo : null,
        toTitle: data.type === 'dispatch' ? data.fromTo : null,
        address: data.address || null,
        date: new Date(data.date),
        note: data.notes || null,
        document: data.document || null,
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating postal record:', error);
    return NextResponse.json({ error: 'Failed to update postal record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.postalDispatch.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting postal record:', error);
    return NextResponse.json({ error: 'Failed to delete postal record' }, { status: 500 });
  }
}
