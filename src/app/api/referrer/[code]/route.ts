import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// GET - Get referrer info by referral code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await connectToDatabase();

    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ referralCode: code.toUpperCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        referralCode: user.referralCode,
        isActive: user.isActive
      }
    });
  } catch (error: any) {
    console.error('Get referrer info error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

