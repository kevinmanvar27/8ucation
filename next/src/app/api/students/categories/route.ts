import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/students/categories
export async function GET(request: NextRequest) {
  try {
    // For development/testing purposes, use default school ID
    const schoolId = 1; // Default to Demo School
    
    // Uncomment the following lines for production
    /*
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const schoolId = Number(session.user.schoolId);
    */
    
    // For now, we'll return some default categories
    // In a real implementation, these would come from the database
    const categories = [
      { id: '1', name: 'General' },
      { id: '2', name: 'OBC' },
      { id: '3', name: 'SC' },
      { id: '4', name: 'ST' },
      { id: '5', name: 'Minority' },
    ];

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}