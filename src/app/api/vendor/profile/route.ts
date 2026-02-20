import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['vendor']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const vendor = await Vendor.findById(auth.user!.id).select('-password');
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        businessName: vendor.businessName,
        businessAddress: vendor.businessAddress,
        phone: vendor.phone,
        walletBalance: vendor.walletBalance,
        adsRemaining: vendor.adsRemaining,
        totalAds: vendor.totalAds,
        totalShares: vendor.totalShares,
        totalEarnings: vendor.totalEarnings,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt
      }
    });
  } catch (error: any) {
    console.error('Vendor profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
