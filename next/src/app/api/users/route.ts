import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection and fetch users
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        school: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        school: u.school?.name,
        role: u.role?.name,
        isActive: u.isActive,
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