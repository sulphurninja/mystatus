import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Commission from '@/models/Commission';
import KeyTier from '@/models/KeyTier';
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

      // Handle MLM commissions based on buyer's referral chain
      // Use buyer's referredBy (their original referrer) for the commission chain
      if (buyer.referredBy) {
        await processMLMCommissions(buyer._id.toString(), buyer.referredBy.toString(), key.price, session);
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

// Process MLM commissions using Key Tiers
async function processMLMCommissions(buyerId: string, referrerId: string, keyPrice: number, session: any) {
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
        await Commission.create([{
          user: chainItem.userId,
          referredUser: buyerId,
          commissionType: 'key_purchase',
          level: chainItem.level,
          amount: commissionAmount,
          description: `Level ${chainItem.level} commission from key purchase (${tier.name} tier)`
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
          description: `Level ${chainItem.level} referral bonus from key purchase (${tier.name})`,
          balanceBefore: balanceBefore,
          balanceAfter: balanceBefore + commissionAmount
        }], { session });

        console.log(`Paid ₹${commissionAmount} to level ${chainItem.level} referrer`);
      }
    }
  } catch (error) {
    console.error('Error processing MLM commissions:', error);
    // Don't throw - let the main transaction succeed even if commissions fail
  }
}
