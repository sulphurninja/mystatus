import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ActivationKey from '@/models/ActivationKey';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import KeyTier from '@/models/KeyTier';
import { verifyToken, getTokenFromRequest } from '@/middleware/auth';
import mongoose from 'mongoose';
import { calculateWithdrawalCharges } from '@/lib/withdrawalCharges';
import { awardStarsForFirstActivation } from '@/lib/starRating';
import { createQualifiedCommission } from '@/lib/commissionQualification';

const MIN_WITHDRAWAL_AMOUNT = 2500;

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
          netAmount: req.netAmount,
          totalDeduction: req.totalDeduction,
          tdsAmount: req.tdsAmount,
          adminCharge: req.adminCharge,
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
    const { amount, paymentDetails } = await request.json();

    // Validate amount
    if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { success: false, message: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}` },
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

      const normalizedKey = (user.activationKey || '').trim().toUpperCase();

      // User must have an activation key to withdraw
      if (!normalizedKey) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'You need an activation key to withdraw. Please purchase one from the marketplace.' },
          { status: 400 }
        );
      }

      if (normalizedKey !== user.activationKey) {
        await User.findByIdAndUpdate(
          user._id,
          { activationKey: normalizedKey },
          { session: dbSession }
        );
      }

      // Get user's assigned key
      let userKey = await ActivationKey.findOne({
        key: normalizedKey,
        usedBy: userId
      }).session(dbSession);
      let didActivateKey = false;

      // Fallback: user has a key linked but activationKey value is wrong
      if (!userKey) {
        const linkedKey = await ActivationKey.findOne({
          usedBy: userId
        }).session(dbSession);

        if (linkedKey) {
          await User.findByIdAndUpdate(
            user._id,
            { activationKey: linkedKey.key },
            { session: dbSession }
          );
          userKey = linkedKey;
        }
      }

      // Fallback: key exists but not linked to the user yet
      if (!userKey) {
        const looseKey = await ActivationKey.findOne({
          key: normalizedKey
        }).session(dbSession);

        if (!looseKey) {
          const createdKeys = await ActivationKey.create([{
            key: normalizedKey,
            isUsed: true,
            usedBy: user._id,
            usedAt: new Date(),
            isForSale: false,
            purchasedBy: user._id,
            purchasedAt: new Date()
          }], { session: dbSession });

          userKey = await ActivationKey.findById(createdKeys[0]._id).session(dbSession);
          didActivateKey = true;
        } else {
          if (looseKey.usedBy && looseKey.usedBy.toString() !== userId) {
            await dbSession.abortTransaction();
            return NextResponse.json(
              { success: false, message: 'Activation key belongs to another user.' },
              { status: 400 }
            );
          }

          await ActivationKey.findByIdAndUpdate(
            looseKey._id,
            {
              isUsed: true,
              usedBy: user._id,
              usedAt: looseKey.usedAt || new Date(),
              isForSale: false,
              purchasedBy: looseKey.purchasedBy || user._id,
              purchasedAt: looseKey.purchasedAt || new Date()
            },
            { session: dbSession }
          );

          userKey = await ActivationKey.findById(looseKey._id).session(dbSession);
          didActivateKey = true;
        }
      }

      if (!userKey) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Your activation key was not found. Please contact support.' },
          { status: 400 }
        );
      }

      if (didActivateKey) {
        await awardStarsForFirstActivation(user._id, dbSession);

        if (user.referredBy && userKey) {
          await processKeyActivationCommissions(
            user._id.toString(),
            user.referredBy.toString(),
            userKey.price,
            dbSession
          );
        }
      }

      const keyToUse = userKey;

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

      const {
        tdsRate,
        adminRate,
        tdsAmount,
        adminAmount,
        totalDeduction,
        netAmount
      } = calculateWithdrawalCharges(amount);

      // Create withdrawal request
      const withdrawalRequest = await WithdrawalRequest.create([{
        user: userId,
        amount,
        tdsRate,
        adminRate,
        tdsAmount,
        adminCharge: adminAmount,
        totalDeduction,
        netAmount,
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
          netAmount: withdrawalRequest[0].netAmount,
          totalDeduction: withdrawalRequest[0].totalDeduction,
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
      } catch {
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
async function processKeyActivationCommissions(
  userId: string,
  referrerId: string,
  keyPrice: number,
  session: mongoose.ClientSession
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
        const result = await createQualifiedCommission({
          session,
          userId: chainItem.userId,
          referredUserId: userId,
          commissionType: 'key_activation',
          level: chainItem.level,
          amount: commissionAmount,
          description: `Level ${chainItem.level} commission from key activation (${tier.name} tier)`
        });

        console.log(`${result.paid ? 'Paid' : 'Locked'} ₹${commissionAmount} level ${chainItem.level} key activation commission`);
      }
    }
  } catch (error) {
    console.error('Error processing key activation commissions:', error);
    // Don't throw - let the main transaction succeed even if commissions fail
  }
}
