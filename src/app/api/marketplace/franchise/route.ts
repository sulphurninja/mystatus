import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import FranchiseKey from '@/models/FranchiseKey';
import FranchiseKeyTier from '@/models/FranchiseKeyTier';
import FranchisePayoutPlan from '@/models/FranchisePayoutPlan';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

// GET - Available franchise keys
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

    const availableKeys = await FranchiseKey.find({
      isUsed: false,
      isForSale: true
    }).populate('createdBy', 'name referralCode');

    return NextResponse.json({
      success: true,
      data: availableKeys.map(key => ({
        id: key._id,
        name: key.price >= 50000 ? 'Franchise Pro' : key.price >= 20000 ? 'Franchise Growth' : 'Franchise Starter',
        description: 'Daily recurring payout to upline up to 30 levels',
        price: key.price,
        validityDays: 0,
        features: [
          'Daily recurring payouts',
          'Upline commissions up to 30 levels',
          'Admin-configured per-level amounts',
          'Auto-activation on purchase'
        ],
        createdBy: key.createdBy ? {
          id: key.createdBy._id,
          name: key.createdBy.name,
          referralCode: key.createdBy.referralCode
        } : null
      }))
    });
  } catch (error: any) {
    console.error('Get franchise marketplace keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Purchase and activate a franchise key
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

    const { keyId } = await request.json();
    if (!keyId) {
      return NextResponse.json(
        { success: false, message: 'Key ID is required' },
        { status: 400 }
      );
    }

    const key = await FranchiseKey.findById(keyId);
    if (!key || key.isUsed || !key.isForSale) {
      return NextResponse.json(
        { success: false, message: 'Key not available' },
        { status: 400 }
      );
    }

    const buyer = await User.findById(auth.user!.id);
    if (!buyer) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (buyer.walletBalance < key.price) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const tier = await FranchiseKeyTier.findOne({
      minPrice: { $lte: key.price },
      maxPrice: { $gte: key.price },
      isActive: true
    });

    if (!tier) {
      return NextResponse.json(
        { success: false, message: 'No franchise tier configured for this key price' },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await User.findByIdAndUpdate(buyer._id, {
        $inc: { walletBalance: -key.price }
      }, { session });

      if (key.createdBy) {
        await User.findByIdAndUpdate(key.createdBy, {
          $inc: { walletBalance: key.price }
        }, { session });
      }

      const now = new Date();
      // Store as UTC date-only so the plan is eligible for the purchase day's payout run
      const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const plan = await FranchisePayoutPlan.create([{
        franchiseKey: key._id,
        owner: buyer._id,
        tier: tier._id,
        dailyCommissions: tier.dailyCommissions,
        maxLevels: 30,
        startDate,
        isActive: true
      }], { session });

      await FranchiseKey.findByIdAndUpdate(key._id, {
        soldBy: key.createdBy,
        soldAt: now,
        purchasedBy: buyer._id,
        purchasedAt: now,
        isForSale: false,
        isUsed: true,
        usedBy: buyer._id,
        usedAt: now,
        tierId: tier._id,
        payoutPlan: plan[0]._id
      }, { session });

      await Transaction.create([{
        user: buyer._id,
        type: 'debit',
        amount: key.price,
        reason: 'franchise_key_purchase',
        description: `Purchased franchise key: ${key.key}`,
        balanceBefore: buyer.walletBalance,
        balanceAfter: buyer.walletBalance - key.price
      }], { session });

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Franchise key purchased and activated',
        data: {
          key: key.key,
          price: key.price,
          planId: plan[0]._id
        }
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error('Purchase franchise key error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
