import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const schools = await prisma.school.findMany({
      take: 5,
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
      })),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}