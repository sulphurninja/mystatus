import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Same simple credential check as admin login.
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mystatus.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification credentials' },
        { status: 401 }
      );
    }

    const token = generateToken('verification', 'verification');

    return NextResponse.json({
      success: true,
      message: 'Verification login successful',
      data: {
        user: {
          email: adminEmail,
          role: 'verification'
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Verification login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
