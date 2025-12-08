import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ActivationKey from '@/models/ActivationKey';
import Commission from '@/models/Commission';
import CommissionRate from '@/models/CommissionRate';
import Transaction from '@/models/Transaction';
import { generateToken } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { name, activationKey, email, phone, profileImage, referralCode } = await request.json();

    // Validate required fields
    if (!name || !activationKey) {
      return NextResponse.json(
        { success: false, message: 'Name and activation key are required' },
        { status: 400 }
      );
    }

    if (activationKey.length < 8 || activationKey.length > 12) {
      return NextResponse.json(
        { success: false, message: 'Activation key must be 8-12 characters long' },
        { status: 400 }
      );
    }

    // Check if activation key exists and is not used
    const key = await ActivationKey.findOne({
      key: activationKey.toUpperCase(),
      isUsed: false
    });

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Invalid or already used activation key' },
        { status: 400 }
      );
    }

    // Find referrer if referral code provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    // Generate unique referral code for new user
    let referralCodeGenerated;
    do {
      referralCodeGenerated = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (await User.findOne({ referralCode: referralCodeGenerated }));

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      activationKey: activationKey.toUpperCase(),
      profileImage,
      referredBy: referrer?._id,
      referralCode: referralCodeGenerated,
      referralLevel: 1
    });

    // Mark activation key as used
    await ActivationKey.findByIdAndUpdate(key._id, {
      isUsed: true,
      usedBy: user._id,
      usedAt: new Date()
    });

    // Process referral commission if referrer exists
    if (referrer) {
      // Update referrer's stats
      await User.findByIdAndUpdate(referrer._id, {
        $inc: {
          totalReferrals: 1,
          activeReferrals: 1
        }
      });

      // Create commission record for direct referral
      const commissionRates = await CommissionRate.find({ isActive: true, level: 1 });
      const rate = commissionRates[0];

      if (rate && rate.referralBonus > 0) {
        // Create commission record
        await Commission.create({
          user: referrer._id,
          referredUser: user._id,
          commissionType: 'referral',
          level: 1,
          amount: rate.referralBonus,
          description: 'Direct referral bonus'
        });

        // Credit to referrer's wallet
        await User.findByIdAndUpdate(referrer._id, {
          $inc: {
            walletBalance: rate.referralBonus,
            totalCommissionEarned: rate.referralBonus
          }
        });

        // Create transaction record
        await Transaction.create({
          user: referrer._id,
          type: 'credit',
          amount: rate.referralBonus,
          reason: 'referral_bonus',
          description: 'Direct referral bonus',
          balanceBefore: referrer.walletBalance,
          balanceAfter: referrer.walletBalance + rate.referralBonus
        });
      }
    }

    // Generate token
    const token = generateToken(user._id.toString(), 'user');

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
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
    console.error('User registration error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Activation key already used or user already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
