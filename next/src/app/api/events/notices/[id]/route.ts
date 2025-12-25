import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const notice = await prisma.notice.update({
      where: { id: parseInt(params.id) },
      data: {
        title: data.title,
        description: data.content || null,
        date: new Date(data.publishDate || new Date()),
        publishOn: data.publishDate ? new Date(data.publishDate) : null,
        noticeFor: data.targetAudience?.toLowerCase() || 'all',
        isActive: data.isPublished,
      },
    });
    return NextResponse.json(notice);
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.notice.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
