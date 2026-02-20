import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Advertisement from '@/models/Advertisement';
import VendorPackage from '@/models/VendorPackage';
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

    const totalAds = await Advertisement.countDocuments({ vendor: vendor._id });
    const activeAds = await Advertisement.countDocuments({ vendor: vendor._id, isActive: true });
    const recentAds = await Advertisement.find({ vendor: vendor._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const packageHistory = await VendorPackage.find({ vendor: vendor._id })
      .populate('package', 'name price adLimit')
      .sort({ createdAt: -1 })
      .limit(10);

    const activePackages = await VendorPackage.find({ vendor: vendor._id, status: 'active' })
      .populate('package', 'name price adLimit');

    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          businessName: vendor.businessName,
          phone: vendor.phone,
          walletBalance: vendor.walletBalance,
          adsRemaining: vendor.adsRemaining,
          totalAds: vendor.totalAds,
          totalShares: vendor.totalShares,
          totalEarnings: vendor.totalEarnings,
          isActive: vendor.isActive,
          createdAt: vendor.createdAt
        },
        stats: {
          totalAds,
          activeAds,
          adsRemaining: vendor.adsRemaining
        },
        recentAds,
        packageHistory,
        activePackages
      }
    });
  } catch (error: any) {
    console.error('Vendor dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
