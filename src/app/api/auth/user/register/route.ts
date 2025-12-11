import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Commission from '@/models/Commission';
import CommissionRate from '@/models/CommissionRate';
import Transaction from '@/models/Transaction';
import { generateToken } from '@/middleware/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { name, email, phone, profileImage, referralCode } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    // Referral code is mandatory
    if (!referralCode || !referralCode.trim()) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required. Ask a friend who uses MyStatus for their code.' },
        { status: 400 }
      );
    }

    // Find referrer - referral code is required
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });

    if (!referrer) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Generate token first (before transaction)
    const token = generateToken('temp', 'user'); // We'll update this after user creation

    // Start transaction for user creation and commission processing
    const dbSession = await mongoose.startSession();

    try {
      await dbSession.startTransaction();

      // Generate unique referral code for new user
      let referralCodeGenerated;
      do {
        referralCodeGenerated = Math.random().toString(36).substring(2, 8).toUpperCase();
      } while (await User.findOne({ referralCode: referralCodeGenerated }).session(dbSession));

      // Create user (without activation key - user will add it during withdrawal)
      const user = await User.create([{
        name: name.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
        profileImage,
        referredBy: referrer?._id,
        referralCode: referralCodeGenerated,
        referralLevel: 1
      }], { session: dbSession });

      // Process referral commission if referrer exists
      if (referrer) {
        // Update referrer's stats
        await User.findByIdAndUpdate(referrer._id, {
          $inc: {
            totalReferrals: 1,
            activeReferrals: 1
          }
        }, { session: dbSession });

        // Process MLM commissions for registration
        await processRegistrationCommissions(user[0]._id, referrer._id, dbSession);
      }

      // Commit transaction
      await dbSession.commitTransaction();

      // Generate proper token with user ID
      const finalToken = generateToken(user[0]._id.toString(), 'user');

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user[0]._id,
            name: user[0].name,
            email: user[0].email,
            phone: user[0].phone,
            referralCode: user[0].referralCode,
            profileImage: user[0].profileImage,
            walletBalance: user[0].walletBalance
          },
          token: finalToken
        }
      });

    } catch (error) {
      // Abort transaction on error
      try {
        await dbSession.abortTransaction();
      } catch (abortError) {
        // Ignore abort errors if transaction was already committed
      }
      throw error;
    } finally {
      dbSession.endSession();
    }

  } catch (error: any) {
    console.error('User registration error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Process cascading commissions for registration
async function processRegistrationCommissions(newUserId: string, directReferrerId: string, session: any) {
  const commissionRates = await CommissionRate.find({ isActive: true }).sort({ level: 1 });

  // Build referral chain (up to 6 levels)
  const referralChain = [];
  let currentReferrerId = directReferrerId;

  for (let level = 1; level <= 6 && currentReferrerId; level++) {
    const referrer = await User.findById(currentReferrerId).session(session);
    if (referrer) {
      referralChain.push({
        userId: referrer._id,
        level: level
      });
      currentReferrerId = referrer.referredBy;
    } else {
      break;
    }
  }

  // Process commissions for each level
  for (const chainItem of referralChain) {
    const rate = commissionRates.find(r => r.level === chainItem.level);
    if (rate && rate.referralBonus > 0) {
      // Each level gets its fixed referral bonus amount
      const commissionAmount = rate.referralBonus;

      if (commissionAmount > 0) {
        // Get current balance before updating
        const currentUser = await User.findById(chainItem.userId).session(session);
        const balanceBefore = currentUser!.walletBalance;

        // Create commission record
        await Commission.create([{
          user: chainItem.userId,
          referredUser: newUserId,
          commissionType: 'referral',
          level: chainItem.level,
          amount: commissionAmount,
          description: chainItem.level === 1
            ? 'Direct referral bonus'
            : `Level ${chainItem.level} network referral bonus`
        }], { session });

        // Credit to user's wallet
        await User.findByIdAndUpdate(chainItem.userId, {
          $inc: {
            walletBalance: commissionAmount,
            totalCommissionEarned: commissionAmount
          }
        }, { session });

        // Create transaction record with correct balance values
        await Transaction.create([{
          user: chainItem.userId,
          type: 'credit',
          amount: commissionAmount,
          reason: 'referral_bonus',
          description: chainItem.level === 1
            ? 'Direct referral bonus'
            : `Level ${chainItem.level} referral bonus`,
          balanceBefore: balanceBefore,
          balanceAfter: balanceBefore + commissionAmount
        }], { session });
      }
    }
  }
}
