import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Commission from '@/models/Commission';
import CommissionRate from '@/models/CommissionRate';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

// Get user's referral information
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const user = await User.findById(auth.user!.id)
      .populate('referredBy', 'name referralCode');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get direct referrals
    const directReferrals = await User.find({ referredBy: user._id })
      .select('name referralCode createdAt isActive')
      .sort({ createdAt: -1 });

    // Get referral statistics
    const totalReferrals = await User.countDocuments({ referredBy: user._id });
    const activeReferrals = await User.countDocuments({
      referredBy: user._id,
      isActive: true
    });

    // Get commission rates for all levels
    const commissionRates = await CommissionRate.find({ isActive: true }).sort({ level: 1 });

    // Get commission breakdown by level
    const commissionBreakdown = [];
    for (let level = 1; level <= 6; level++) {
      const levelCommissions = await Commission.find({
        user: user._id,
        level: level
      });

      const levelRate = commissionRates.find(rate => rate.level === level);

      commissionBreakdown.push({
        level,
        referralBonus: levelRate?.referralBonus || 0,
        levelBonus: levelRate?.levelBonus || 0,
        keyPurchaseBonus: levelRate?.keyPurchaseBonus || 0,
        totalEarned: levelCommissions.reduce((sum, comm) => sum + comm.amount, 0),
        totalCommissions: levelCommissions.length
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        totalReferrals: user.totalReferrals,
        activeReferrals: user.activeReferrals,
        referralLevel: user.referralLevel,
        totalCommissionEarned: user.totalCommissionEarned,
        referredBy: user.referredBy ? {
          name: user.referredBy.name,
          referralCode: user.referredBy.referralCode
        } : null,
        directReferrals: directReferrals.map(ref => ({
          id: ref._id,
          name: ref.name,
          referralCode: ref.referralCode,
          joinedAt: ref.createdAt,
          isActive: ref.isActive
        })),
        stats: {
          totalReferrals,
          activeReferrals,
          pendingReferrals: totalReferrals - activeReferrals
        },
        commissionBreakdown
      }
    });

  } catch (error: any) {
    console.error('Get referral info error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Process referral when a new user registers
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find referrer
    const referrer = await User.findOne({
      referralCode: referralCode.toUpperCase()
    });

    if (!referrer) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Check if user already has a referrer
    const currentUser = await User.findById(auth.user!.id);
    if (currentUser?.referredBy) {
      return NextResponse.json(
        { success: false, message: 'User already has a referrer' },
        { status: 400 }
      );
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update user's referredBy
      await User.findByIdAndUpdate(auth.user!.id, {
        referredBy: referrer._id,
        referralLevel: 1
      }, { session });

      // Update referrer's stats
      await User.findByIdAndUpdate(referrer._id, {
        $inc: {
          totalReferrals: 1,
          activeReferrals: 1
        }
      }, { session });

      // Process referral commission
      const commissionRates = await CommissionRate.find({ isActive: true, level: 1 });
      const rate = commissionRates[0];

      if (rate && rate.referralBonus > 0) {
        const commissionAmount = 500; // Fixed referral bonus for direct referral

        // Create commission record
        await Commission.create([{
          user: referrer._id,
          referredUser: auth.user!.id,
          commissionType: 'referral',
          level: 1,
          amount: commissionAmount,
          description: 'Direct referral bonus'
        }], { session });

        // Credit to referrer's wallet
        await User.findByIdAndUpdate(referrer._id, {
          $inc: {
            walletBalance: commissionAmount,
            totalCommissionEarned: commissionAmount
          }
        }, { session });

        // Create transaction record
        const referrerUser = await User.findById(referrer._id).session(session);
        await Transaction.create([{
          user: referrer._id,
          type: 'credit',
          amount: commissionAmount,
          reason: 'referral_bonus',
          description: 'Direct referral bonus',
          balanceBefore: referrerUser!.walletBalance,
          balanceAfter: referrerUser!.walletBalance + commissionAmount
        }], { session });
      }

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Referral processed successfully',
        data: {
          referrer: {
            name: referrer.name,
            referralCode: referrer.referralCode
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error: any) {
    console.error('Process referral error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
