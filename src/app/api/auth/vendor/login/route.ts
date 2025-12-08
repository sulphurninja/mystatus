import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { generateToken } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if vendor exists and password matches
    const vendor = await Vendor.findOne({ email }).select('+password');

    if (!vendor || !(await vendor.comparePassword(password))) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!vendor.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(vendor._id.toString(), 'vendor');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          businessName: vendor.businessName,
          walletBalance: vendor.walletBalance,
          totalAds: vendor.totalAds,
          totalShares: vendor.totalShares,
          totalEarnings: vendor.totalEarnings
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Vendor login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
