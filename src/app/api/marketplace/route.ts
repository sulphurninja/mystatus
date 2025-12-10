import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Commission from '@/models/Commission';
import CommissionRate from '@/models/CommissionRate';
import { authenticateRequest } from '@/middleware/auth';

// Get user's purchased keys
export async function PATCH(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const purchasedKeys = await ActivationKey.find({
      $or: [
        { soldBy: auth.user!.id }, // Keys sold by this user
        { _id: { $in: await getUsedKeysByUser(auth.user!.id) } } // Keys used by this user
      ]
    }).populate('soldBy', 'name')
      .populate('usedBy', 'name')
      .sort({ soldAt: -1 });

    return NextResponse.json({
      success: true,
      data: purchasedKeys.map(key => ({
        id: key._id,
        key: key.key,
        price: key.price,
        isUsed: key.isUsed,
        soldAt: key.soldAt,
        usedAt: key.usedAt,
        soldBy: key.soldBy ? {
          id: key.soldBy._id,
          name: key.soldBy.name
        } : null,
        usedBy: key.usedBy ? {
          id: key.usedBy._id,
          name: key.usedBy.name
        } : null,
        createdAt: key.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Get purchased keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get keys used by a user
async function getUsedKeysByUser(userId: string) {
  const usedKeys = await ActivationKey.find({ usedBy: userId }).select('_id');
  return usedKeys.map(key => key._id);
}

// Get available keys for sale
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

    const availableKeys = await ActivationKey.find({
      isUsed: false,
      isForSale: true
    }).populate('createdBy', 'name referralCode');

    return NextResponse.json({
      success: true,
      data: availableKeys.map(key => ({
        id: key._id,
        key: key.key,
        price: key.price,
        createdBy: key.createdBy ? {
          id: key.createdBy._id,
          name: key.createdBy.name,
          referralCode: key.createdBy.referralCode
        } : null
      }))
    });

  } catch (error: any) {
    console.error('Get marketplace keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Purchase a key
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

    const { keyId, referralCode } = await request.json();

    if (!keyId) {
      return NextResponse.json(
        { success: false, message: 'Key ID is required' },
        { status: 400 }
      );
    }

    // Get the key
    const key = await ActivationKey.findById(keyId);
    if (!key || key.isUsed || !key.isForSale) {
      return NextResponse.json(
        { success: false, message: 'Key not available' },
        { status: 400 }
      );
    }

    // Get buyer
    const buyer = await User.findById(auth.user!.id);
    if (!buyer) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if buyer has enough balance
    if (buyer.walletBalance < key.price) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Find referrer if referral code provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from buyer
      await User.findByIdAndUpdate(buyer._id, {
        $inc: { walletBalance: -key.price }
      }, { session });

      // Add to seller if different from system
      if (key.createdBy) {
        await User.findByIdAndUpdate(key.createdBy, {
          $inc: { walletBalance: key.price }
        }, { session });
      }

      // Update key as sold
      await ActivationKey.findByIdAndUpdate(key._id, {
        soldBy: key.createdBy,
        soldAt: new Date(),
        purchasedBy: buyer._id,
        purchasedAt: new Date(),
        isForSale: false
      }, { session });

      // Create transaction record
      await Transaction.create([{
        user: buyer._id,
        type: 'debit',
        amount: key.price,
        reason: 'key_purchase',
        description: `Purchased activation key: ${key.key}`,
        balanceBefore: buyer.walletBalance,
        balanceAfter: buyer.walletBalance - key.price
      }], { session });

      // Handle MLM commissions if referrer exists
      if (referrer) {
        await processMLMCommissions(buyer._id, referrer._id, key.price, session);
      }

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Key purchased successfully',
        data: {
          key: key.key,
          price: key.price
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error: any) {
    console.error('Purchase key error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Process MLM commissions
async function processMLMCommissions(buyerId: string, referrerId: string, amount: number, session: any) {
  const commissionRates = await CommissionRate.find({ isActive: true }).sort({ level: 1 });

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

  // Process commissions for each level
  for (const chainItem of referralChain) {
    const rate = commissionRates.find(r => r.level === chainItem.level);
    if (rate && rate.keyPurchaseBonus > 0) {
      const commissionAmount = (amount * rate.keyPurchaseBonus) / 100;

      // Get current balance before updating
      const currentUser = await User.findById(chainItem.userId).session(session);
      const balanceBefore = currentUser!.walletBalance;

      // Create commission record
      await Commission.create([{
        user: chainItem.userId,
        referredUser: buyerId,
        commissionType: 'key_purchase',
        level: chainItem.level,
        amount: commissionAmount,
        description: `Level ${chainItem.level} commission from key purchase`
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
        description: `Level ${chainItem.level} referral bonus`,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore + commissionAmount
      }], { session });
    }
  }
}
