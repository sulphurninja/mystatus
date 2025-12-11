import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ActivationKey from '@/models/ActivationKey';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import Transaction from '@/models/Transaction';
import { verifyToken } from '@/middleware/auth';
import mongoose from 'mongoose';

// GET - Get user's withdrawal requests
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const decoded = await verifyToken(request);
    if (!decoded || decoded.type !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    const withdrawalRequests = await WithdrawalRequest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: withdrawalRequests.map(req => ({
        id: req._id,
        amount: req.amount,
        status: req.status,
        activationKey: req.activationKey,
        requestedAt: req.requestedAt,
        processedAt: req.processedAt,
        rejectionReason: req.rejectionReason,
        paymentDetails: req.paymentDetails
      }))
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

    const decoded = await verifyToken(request);
    if (!decoded || decoded.type !== 'user') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const { amount, activationKey, paymentDetails } = await request.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    // Validate activation key
    if (!activationKey || activationKey.length < 6 || activationKey.length > 8) {
      return NextResponse.json(
        { success: false, message: 'Valid activation key is required for withdrawal' },
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

      // Validate activation key - must exist and not be used
      const key = await ActivationKey.findOne({
        key: activationKey.toUpperCase(),
        isUsed: false
      }).session(dbSession);

      if (!key) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Invalid or already used activation key' },
          { status: 400 }
        );
      }

      // Mark activation key as used by this user
      await ActivationKey.findByIdAndUpdate(key._id, {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date()
      }, { session: dbSession });

      // Update user's activation key if they don't have one
      if (!user.activationKey) {
        await User.findByIdAndUpdate(userId, {
          activationKey: activationKey.toUpperCase()
        }, { session: dbSession });
      }

      // Create withdrawal request
      const withdrawalRequest = await WithdrawalRequest.create([{
        user: userId,
        amount,
        activationKey: activationKey.toUpperCase(),
        status: 'pending',
        requestedAt: new Date(),
        paymentDetails
      }], { session: dbSession });

      await dbSession.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Withdrawal request submitted successfully. Admin will review and process your request.',
        data: {
          id: withdrawalRequest[0]._id,
          amount: withdrawalRequest[0].amount,
          status: withdrawalRequest[0].status,
          requestedAt: withdrawalRequest[0].requestedAt
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

