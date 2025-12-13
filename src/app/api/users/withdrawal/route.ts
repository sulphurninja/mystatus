import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ActivationKey from '@/models/ActivationKey';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import Transaction from '@/models/Transaction';
import Commission from '@/models/Commission';
import KeyTier from '@/models/KeyTier';
import { verifyToken, getTokenFromRequest } from '@/middleware/auth';
import mongoose from 'mongoose';

// GET - Get user's withdrawal requests and key status
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

    // Get user and their activation key status
    const user = await User.findById(userId);
    let keyStatus = null;

    if (user?.activationKey) {
      const key = await ActivationKey.findOne({ 
        key: user.activationKey,
        usedBy: userId 
      });
      
      if (key) {
        const remainingLimit = key.withdrawalLimit - key.totalWithdrawn;
        keyStatus = {
          hasKey: true,
          key: key.key,
          totalWithdrawn: key.totalWithdrawn,
          withdrawalLimit: key.withdrawalLimit,
          remainingLimit: remainingLimit,
          isPaused: key.isPaused,
          renewalCount: key.renewalCount,
          needsRenewal: key.isPaused || remainingLimit <= 0,
          renewalPrice: key.price
        };
      }
    }

    const withdrawalRequests = await WithdrawalRequest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: {
        keyStatus: keyStatus || { hasKey: false },
        withdrawalRequests: withdrawalRequests.map(req => ({
          id: req._id,
          amount: req.amount,
          status: req.status,
          activationKey: req.activationKey,
          requestedAt: req.requestedAt,
          processedAt: req.processedAt,
          rejectionReason: req.rejectionReason,
          paymentDetails: req.paymentDetails
        }))
      }
    });
  } catch (error: any) {
    console.error('Get withdrawal requests error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new withdrawal request
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
    const { amount, activationKey, paymentDetails } = await request.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

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

      // Check if user has sufficient balance
      if (user.walletBalance < amount) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Insufficient wallet balance' },
          { status: 400 }
        );
      }

      // Check if there's already a pending withdrawal request
      const pendingRequest = await WithdrawalRequest.findOne({
        user: userId,
        status: 'pending'
      }).session(dbSession);

      if (pendingRequest) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'You already have a pending withdrawal request. Please wait for it to be processed.' },
          { status: 400 }
        );
      }

      let userKey = null;
      let keyToUse = null;

      // Check if user already has an activation key assigned
      if (user.activationKey) {
        // User already has a key - use that one
        userKey = await ActivationKey.findOne({
          key: user.activationKey,
          usedBy: userId
        }).session(dbSession);

        if (!userKey) {
          await dbSession.abortTransaction();
          return NextResponse.json(
            { success: false, message: 'Your activation key was not found. Please contact support.' },
            { status: 400 }
          );
        }

        keyToUse = userKey;
      } else {
        // User doesn't have a key - they must provide one
        if (!activationKey || activationKey.length < 6 || activationKey.length > 8) {
          await dbSession.abortTransaction();
          return NextResponse.json(
            { success: false, message: 'Valid activation key is required for your first withdrawal' },
            { status: 400 }
          );
        }

        // Validate activation key - must exist and not be used
        const newKey = await ActivationKey.findOne({
          key: activationKey.toUpperCase(),
          isUsed: false
        }).session(dbSession);

        if (!newKey) {
          await dbSession.abortTransaction();
          return NextResponse.json(
            { success: false, message: 'Invalid or already used activation key' },
            { status: 400 }
          );
        }

        // Mark activation key as used by this user
        await ActivationKey.findByIdAndUpdate(newKey._id, {
          isUsed: true,
          usedBy: userId,
          usedAt: new Date()
        }, { session: dbSession });

        // Update user's activation key
        await User.findByIdAndUpdate(userId, {
          activationKey: activationKey.toUpperCase()
        }, { session: dbSession });

        // Process MLM commissions for key activation (commissions are paid when key is first used, not on registration)
        if (user.referredBy) {
          await processKeyActivationCommissions(userId, user.referredBy.toString(), newKey.price, dbSession);
        }

        keyToUse = newKey;
      }

      // Check if key is paused (withdrawal limit reached)
      if (keyToUse.isPaused) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { 
            success: false, 
            message: `Your key has reached the withdrawal limit of ₹${keyToUse.withdrawalLimit}. Please renew your key to continue withdrawing.`,
            needsRenewal: true,
            renewalPrice: keyToUse.price
          },
          { status: 400 }
        );
      }

      // Check remaining withdrawal limit
      const remainingLimit = keyToUse.withdrawalLimit - keyToUse.totalWithdrawn;
      if (amount > remainingLimit) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { 
            success: false, 
            message: `You can only withdraw ₹${remainingLimit} more with your current key. Total limit is ₹${keyToUse.withdrawalLimit}.`,
            remainingLimit: remainingLimit,
            needsRenewal: remainingLimit <= 0,
            renewalPrice: keyToUse.price
          },
          { status: 400 }
        );
      }

      // Update the key's total withdrawn amount
      const newTotalWithdrawn = keyToUse.totalWithdrawn + amount;
      const shouldPause = newTotalWithdrawn >= keyToUse.withdrawalLimit;
      
      await ActivationKey.findByIdAndUpdate(keyToUse._id, {
        totalWithdrawn: newTotalWithdrawn,
        isPaused: shouldPause
      }, { session: dbSession });

      // Create withdrawal request
      const withdrawalRequest = await WithdrawalRequest.create([{
        user: userId,
        amount,
        activationKey: keyToUse.key,
        status: 'pending',
        requestedAt: new Date(),
        paymentDetails
      }], { session: dbSession });

      await dbSession.commitTransaction();

      const newRemainingLimit = keyToUse.withdrawalLimit - newTotalWithdrawn;
      
      return NextResponse.json({
        success: true,
        message: 'Withdrawal request submitted successfully. Admin will review and process your request.',
        data: {
          id: withdrawalRequest[0]._id,
          amount: withdrawalRequest[0].amount,
          status: withdrawalRequest[0].status,
          requestedAt: withdrawalRequest[0].requestedAt,
          keyStatus: {
            totalWithdrawn: newTotalWithdrawn,
            remainingLimit: newRemainingLimit,
            isPaused: shouldPause,
            needsRenewal: shouldPause
          }
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
    console.error('Create withdrawal request error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Process MLM commissions when a key is activated (first time use)
async function processKeyActivationCommissions(userId: string, referrerId: string, keyPrice: number, session: any) {
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

    console.log(`Processing key activation commissions using tier "${tier.name}" for key price ₹${keyPrice}`);

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
          commissionType: 'key_activation',
          level: chainItem.level,
          amount: commissionAmount,
          description: `Level ${chainItem.level} commission from key activation (${tier.name} tier)`
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
          description: `Level ${chainItem.level} referral bonus from key activation (${tier.name})`,
          balanceBefore: balanceBefore,
          balanceAfter: balanceBefore + commissionAmount
        }], { session });

        console.log(`Paid ₹${commissionAmount} to level ${chainItem.level} referrer for key activation`);
      }
    }
  } catch (error) {
    console.error('Error processing key activation commissions:', error);
    // Don't throw - let the main transaction succeed even if commissions fail
  }
}

