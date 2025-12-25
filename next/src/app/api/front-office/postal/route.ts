import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const records = await prisma.postalDispatch.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching postal records:', error);
    return NextResponse.json({ error: 'Failed to fetch postal records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Generate reference number
    const count = await prisma.postalDispatch.count();
    const prefix = data.type === 'receive' ? 'IN' : 'OUT';
    const referenceNo = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    
    const record = await prisma.postalDispatch.create({
      data: {
        referenceNo,
        type: data.type, // 'dispatch' or 'receive'
        fromTitle: data.type === 'receive' ? data.fromTo : null,
        toTitle: data.type === 'dispatch' ? data.fromTo : null,
        address: data.address || null,
        date: new Date(data.date),
        note: data.notes || null,
        document: data.document || null,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating postal record:', error);
    return NextResponse.json({ error: 'Failed to create postal record' }, { status: 500 });
  }
}
