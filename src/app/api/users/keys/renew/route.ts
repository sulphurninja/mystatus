import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ActivationKey from '@/models/ActivationKey';
import Transaction from '@/models/Transaction';
import Commission from '@/models/Commission';
import KeyTier from '@/models/KeyTier';
import { verifyToken, getTokenFromRequest } from '@/middleware/auth';

// POST - Renew user's activation key
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Start transaction
    const dbSession = await mongoose.startSession();

    try {
      await dbSession.startTransaction();

      // Get user
      const user = await User.findById(userId).session(dbSession);
      if (!user) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user has an activation key
      if (!user.activationKey) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'You do not have an activation key to renew' },
          { status: 400 }
        );
      }

      // Get the user's key
      const key = await ActivationKey.findOne({
        key: user.activationKey,
        usedBy: userId
      }).session(dbSession);

      if (!key) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Your activation key was not found' },
          { status: 400 }
        );
      }

      // Check if key actually needs renewal
      if (!key.isPaused && key.totalWithdrawn < key.withdrawalLimit) {
        await dbSession.abortTransaction();
        const remaining = key.withdrawalLimit - key.totalWithdrawn;
        return NextResponse.json(
          { 
            success: false, 
            message: `Your key is still active with ₹${remaining} withdrawal limit remaining. No renewal needed yet.` 
          },
          { status: 400 }
        );
      }

      const renewalPrice = key.price;

      // Check if user has enough balance
      if (user.walletBalance < renewalPrice) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: `Insufficient balance. Renewal costs ₹${renewalPrice}` },
          { status: 400 }
        );
      }

      // Deduct renewal price from user's wallet
      const balanceBefore = user.walletBalance;
      await User.findByIdAndUpdate(userId, {
        $inc: { walletBalance: -renewalPrice }
      }, { session: dbSession });

      // Reset the key's withdrawal counter and unpause it
      await ActivationKey.findByIdAndUpdate(key._id, {
        totalWithdrawn: 0,
        isPaused: false,
        renewalCount: key.renewalCount + 1,
        lastRenewedAt: new Date()
      }, { session: dbSession });

      // Create transaction record for renewal
      await Transaction.create([{
        user: userId,
        type: 'debit',
        amount: renewalPrice,
        reason: 'key_renewal',
        description: `Renewed activation key: ${key.key} (Renewal #${key.renewalCount + 1})`,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore - renewalPrice
      }], { session: dbSession });

      // Process MLM commissions for the renewal (same as key purchase)
      // The user who SOLD the key originally gets the payment
      if (key.soldBy || key.createdBy) {
        const sellerId = key.soldBy || key.createdBy;
        
        // Get seller's current balance
        const seller = await User.findById(sellerId).session(dbSession);
        if (seller) {
          const sellerBalanceBefore = seller.walletBalance;
          
          // Credit the renewal amount to the seller
          await User.findByIdAndUpdate(sellerId, {
            $inc: { walletBalance: renewalPrice }
          }, { session: dbSession });

          // Create transaction record for seller
          await Transaction.create([{
            user: sellerId,
            type: 'credit',
            amount: renewalPrice,
            reason: 'key_renewal_income',
            description: `Key renewal income from user: ${user.name} (Key: ${key.key})`,
            balanceBefore: sellerBalanceBefore,
            balanceAfter: sellerBalanceBefore + renewalPrice
          }], { session: dbSession });
        }
      }

      // Process MLM commissions for parent referrers
      if (user.referredBy) {
        await processRenewalCommissions(userId, user.referredBy.toString(), renewalPrice, dbSession);
      }

      await dbSession.commitTransaction();

      return NextResponse.json({
        success: true,
        message: `Key renewed successfully! You can now withdraw up to ₹${key.withdrawalLimit} more.`,
        data: {
          key: key.key,
          renewalPrice: renewalPrice,
          newWithdrawalLimit: key.withdrawalLimit,
          renewalCount: key.renewalCount + 1,
          newBalance: balanceBefore - renewalPrice
        }
      });

    } catch (error) {
      try {
        await dbSession.abortTransaction();
      } catch (abortError) {
        // Ignore abort errors
      }
      throw error;
    } finally {
      dbSession.endSession();
    }

  } catch (error: any) {
    console.error('Key renewal error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Process MLM commissions for key renewal using Key Tiers
async function processRenewalCommissions(userId: string, referrerId: string, keyPrice: number, session: any) {
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

    console.log(`Using tier "${tier.name}" for key price ₹${keyPrice}`);

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
        currentReferrerId = referrer.referredBy?.toString();
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
        await Commission.create([{
          user: chainItem.userId,
          referredUser: userId,
          commissionType: 'key_renewal',
          level: chainItem.level,
          amount: commissionAmount,
          description: `Level ${chainItem.level} commission from key renewal (${tier.name} tier)`
        }], { session });

        // Credit to user's wallet
        await User.findByIdAndUpdate(chainItem.userId, {
          $inc: {
            walletBalance: commissionAmount,
            totalCommissionEarned: commissionAmount
          }
        }, { session });

        // Create transaction record
        await Transaction.create([{
          user: chainItem.userId,
          type: 'credit',
          amount: commissionAmount,
          reason: 'referral_bonus',
          description: `Level ${chainItem.level} referral bonus from key renewal (${tier.name})`,
          balanceBefore: balanceBefore,
          balanceAfter: balanceBefore + commissionAmount
        }], { session });

        console.log(`Paid ₹${commissionAmount} to level ${chainItem.level} referrer`);
      }
    }
  } catch (error) {
    console.error('Error processing renewal commissions:', error);
    // Don't throw - let the main transaction succeed even if commissions fail
  }
}

// GET - Get user's key status
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.activationKey) {
      return NextResponse.json({
        success: true,
        data: {
          hasKey: false,
          message: 'You need to use an activation key during your first withdrawal'
        }
      });
    }

    // Get the user's key
    const key = await ActivationKey.findOne({
      key: user.activationKey,
      usedBy: userId
    });

    if (!key) {
      return NextResponse.json({
        success: true,
        data: {
          hasKey: false,
          message: 'Your activation key was not found'
        }
      });
    }

    const remainingLimit = key.withdrawalLimit - key.totalWithdrawn;

    return NextResponse.json({
      success: true,
      data: {
        hasKey: true,
        key: key.key,
        totalWithdrawn: key.totalWithdrawn,
        withdrawalLimit: key.withdrawalLimit,
        remainingLimit: remainingLimit,
        isPaused: key.isPaused,
        needsRenewal: key.isPaused || remainingLimit <= 0,
        renewalPrice: key.price,
        renewalCount: key.renewalCount,
        lastRenewedAt: key.lastRenewedAt
      }
    });

  } catch (error: any) {
    console.error('Get key status error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

