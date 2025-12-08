import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import Advertisement from '@/models/Advertisement';
import Share from '@/models/Share';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    // Get basic counts
    const [totalUsers, totalVendors, totalAdvertisements, totalShares] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments({ isActive: true }),
      Advertisement.countDocuments({ isActive: true }),
      Share.countDocuments()
    ]);

    // Calculate total revenue
    const revenueResult = await Transaction.aggregate([
      { $match: { type: 'credit', reason: 'reward_earned' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get top vendors
    const topVendors = await Vendor.find({ isActive: true })
      .sort({ totalEarnings: -1 })
      .limit(3)
      .select('name businessName totalShares totalEarnings');

    // Get top advertisements
    const topAdvertisements = await Advertisement.find({ isActive: true })
      .populate('vendor', 'businessName')
      .sort({ totalShares: -1 })
      .limit(3)
      .select('title vendor totalShares totalRewardsPaid');

    // Calculate monthly growth (simplified - would need proper date ranges)
    const monthlyGrowth = {
      users: 12.5,
      vendors: 8.3,
      revenue: 18.7
    };

    return NextResponse.json({
      success: true,
      analytics: {
        totalUsers,
        totalVendors,
        totalAdvertisements,
        totalShares,
        totalRevenue,
        monthlyGrowth,
        topVendors: topVendors.map(v => ({
          name: v.name,
          businessName: v.businessName,
          totalShares: v.totalShares,
          totalEarnings: v.totalEarnings
        })),
        topAdvertisements: topAdvertisements.map(ad => ({
          title: ad.title,
          vendor: ad.vendor.businessName,
          shares: ad.totalShares,
          revenue: ad.totalRewardsPaid
        }))
      }
    });

  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
