import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { userId } = await params;
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get referral information
    const referralInfo = await getReferralInfo(user._id);

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        activationKey: user.activationKey,
        walletBalance: user.walletBalance,
        referralLevel: user.referralLevel,
        referralCode: user.referralCode,
        isActive: user.isActive,
        canShareAds: user.canShareAds,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        totalCommissionEarned: user.totalCommissionEarned,
      },
      referralInfo
    });

  } catch (error: any) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get referral information
async function getReferralInfo(userId: string) {
  try {
    // Get direct referrals (users who were referred by this user)
    const directReferrals = await User.find({ referredBy: userId })
      .select('name referralCode isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalReferrals = directReferrals.length;
    const activeReferrals = directReferrals.filter(ref => ref.isActive).length;
    const pendingReferrals = totalReferrals - activeReferrals;

    // Get the user's current data for commission info
    const user = await User.findById(userId).select('referralLevel totalCommissionEarned').lean();

    // Create commission breakdown (simplified for now)
    const commissionBreakdown = [
      {
        level: 1,
        referralBonus: 50, // This should come from commission rates
        levelBonus: 0,
        keyPurchaseBonus: 0,
        totalEarned: user?.totalCommissionEarned || 0,
        totalCommissions: totalReferrals
      }
    ];

    return {
      totalReferrals,
      activeReferrals,
      referralLevel: user?.referralLevel || 1,
      totalCommissionEarned: user?.totalCommissionEarned || 0,
      directReferrals: directReferrals.map(ref => ({
        id: ref._id,
        name: ref.name,
        referralCode: ref.referralCode,
        joinedAt: ref.createdAt.toISOString(),
        isActive: ref.isActive,
      })),
      commissionBreakdown,
      stats: {
        totalReferrals,
        activeReferrals,
        pendingReferrals,
      }
    };
  } catch (error) {
    console.error('Error getting referral info:', error);
    return {
      totalReferrals: 0,
      activeReferrals: 0,
      referralLevel: 1,
      totalCommissionEarned: 0,
      directReferrals: [],
      commissionBreakdown: [],
      stats: {
        totalReferrals: 0,
        activeReferrals: 0,
        pendingReferrals: 0,
      }
    };
  }
}
