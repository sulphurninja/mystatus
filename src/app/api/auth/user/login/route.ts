import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { activationKey } = await request.json();

    if (!activationKey) {
      return NextResponse.json(
        { success: false, message: 'Activation key is required' },
        { status: 400 }
      );
    }

    // Find user by activation key
    const user = await User.findOne({ activationKey: activationKey.toUpperCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid activation key' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user._id.toString(), 'user');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          activationKey: user.activationKey,
          profileImage: user.profileImage,
          walletBalance: user.walletBalance
        },
        token
      }
    });

  } catch (error: any) {
    console.error('User login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
