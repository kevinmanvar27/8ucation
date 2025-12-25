import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const notice = await prisma.notice.create({
      data: {
        schoolId: 1, // Default school ID
        title: data.title,
        description: data.content || null,
        date: new Date(data.publishDate || new Date()),
        publishOn: data.publishDate ? new Date(data.publishDate) : null,
        noticeFor: data.targetAudience?.toLowerCase() || 'all',
        isActive: data.isPublished ?? true,
      },
    });
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}
