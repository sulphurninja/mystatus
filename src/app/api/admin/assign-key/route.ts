import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ActivationKey from '@/models/ActivationKey';
import Transaction from '@/models/Transaction';
import Commission from '@/models/Commission';
import KeyTier from '@/models/KeyTier';
import { authenticateRequest } from '@/middleware/auth';

// Assign an activation key to a user (admin action)
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { userId, keyId } = await request.json();

    if (!userId || !keyId) {
      return NextResponse.json(
        { success: false, message: 'User ID and Key ID are required' },
        { status: 400 }
      );
    }

    // Get the key
    const key = await ActivationKey.findById(keyId);
    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Key not found' },
        { status: 404 }
      );
    }

    if (key.isUsed) {
      return NextResponse.json(
        { success: false, message: 'Key is already activated' },
        { status: 400 }
      );
    }

    if (!key.isForSale) {
      return NextResponse.json(
        { success: false, message: 'Key is not available for assignment' },
        { status: 400 }
      );
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.activationKey) {
      return NextResponse.json(
        { success: false, message: 'User already has an activation key' },
        { status: 400 }
      );
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Assign the key to the user (marked as used)
      await ActivationKey.findByIdAndUpdate(
        key._id,
        {
          isUsed: true,
          usedBy: user._id,
          usedAt: new Date(),
          isForSale: false,
          purchasedBy: user._id,
          purchasedAt: new Date()
        },
        { session }
      );

      // Update user with the activation key
      await User.findByIdAndUpdate(
        user._id,
        { activationKey: key.key },
        { session }
      );

      // Create transaction record (admin assignment - no debit from user)
      await Transaction.create(
        [{
          user: user._id,
          type: 'credit', // Mark as credit to indicate it's a gift/assignment
          amount: key.price,
          reason: 'key_activation',
          description: `Admin assigned activation key: ${key.key}`,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance
        }],
        { session }
      );

      // Process MLM commissions for the assignment (if user has a referrer)
      if (user.referredBy) {
        await processMLMCommissionsForAssignment(
          user._id.toString(),
          user.referredBy.toString(),
          key.price,
          session
        );
      }

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Key assigned successfully',
        data: {
          key: key.key,
          userId: user._id,
          userName: user.name
        }
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error('Assign key error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Process MLM commissions for key assignment (same as purchase)
async function processMLMCommissionsForAssignment(
  userId: string,
  referrerId: string,
  keyPrice: number,
  session: any
) {
  try {
    // Find the tier for this key price
    const tier = await KeyTier.findOne({
      minPrice: { $lte: keyPrice },
      maxPrice: { $gte: keyPrice },
      isActive: true
    }).session(session);

    if (!tier) {
      console.log(`No tier found for key price: ₹${keyPrice}`);
      return;
    }

    console.log(`Using tier "${tier.name}" for assigned key price ₹${keyPrice}`);

    // Build referral chain (up to 6 levels)
    const referralChain = [];
    let currentReferrerId = referrerId;

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

    // Process commissions for each level using tier rates
    for (const chainItem of referralChain) {
      const levelKey = `level${chainItem.level}` as keyof typeof tier.commissions;
      const commissionAmount = tier.commissions[levelKey] || 0;

      if (commissionAmount > 0) {
        // Get current balance before updating
        const currentUser = await User.findById(chainItem.userId).session(session);
        if (!currentUser) continue;

        const balanceBefore = currentUser.walletBalance;

        // Create commission record
        await Commission.create(
          [{
            user: chainItem.userId,
            referredUser: userId,
            commissionType: 'key_activation',
            level: chainItem.level,
            amount: commissionAmount,
            description: `Level ${chainItem.level} commission from admin key assignment (${tier.name} tier)`
          }],
          { session }
        );

        // Credit to user's wallet
        await User.findByIdAndUpdate(
          chainItem.userId,
          {
            $inc: {
              walletBalance: commissionAmount,
              totalCommissionEarned: commissionAmount
            }
          },
          { session }
        );

        // Create transaction record with correct balance values
        await Transaction.create(
          [{
            user: chainItem.userId,
            type: 'credit',
            amount: commissionAmount,
            reason: 'referral_bonus',
            description: `Level ${chainItem.level} referral bonus from admin key assignment (${tier.name})`,
            balanceBefore: balanceBefore,
            balanceAfter: balanceBefore + commissionAmount
          }],
          { session }
        );

        console.log(`Paid ₹${commissionAmount} to level ${chainItem.level} referrer for key assignment`);
      }
    }
  } catch (error) {
    console.error('Error processing MLM commissions for assignment:', error);
    // Don't throw - let the main transaction succeed even if commissions fail
  }
}

