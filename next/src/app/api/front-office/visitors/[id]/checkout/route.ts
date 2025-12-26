import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const now = new Date();
    const visitor = await prisma.visitors.update({
      where: { id: parseInt(params.id) },
      data: {
        outTime: now.toTimeString().slice(0, 5),
      },
    });
    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Error checking out visitor:', error);
    return NextResponse.json({ error: 'Failed to check out visitor' }, { status: 500 });
  }
}
