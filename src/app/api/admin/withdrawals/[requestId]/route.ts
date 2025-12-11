import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyToken } from '@/middleware/auth';
import mongoose from 'mongoose';

// PUT - Approve or reject a withdrawal request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await connectToDatabase();

    // Verify admin token
    const decoded = await verifyToken(request);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { requestId } = await params;
    const { action, rejectionReason } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const dbSession = await mongoose.startSession();

    try {
      await dbSession.startTransaction();

      const withdrawalRequest = await WithdrawalRequest.findById(requestId).session(dbSession);

      if (!withdrawalRequest) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'Withdrawal request not found' },
          { status: 404 }
        );
      }

      if (withdrawalRequest.status !== 'pending') {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'This withdrawal request has already been processed' },
          { status: 400 }
        );
      }

      const user = await User.findById(withdrawalRequest.user).session(dbSession);
      if (!user) {
        await dbSession.abortTransaction();
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        // Check if user still has sufficient balance
        if (user.walletBalance < withdrawalRequest.amount) {
          await dbSession.abortTransaction();
          return NextResponse.json(
            { success: false, message: 'User has insufficient balance. Current balance: ₹' + user.walletBalance },
            { status: 400 }
          );
        }

        const balanceBefore = user.walletBalance;
        const balanceAfter = balanceBefore - withdrawalRequest.amount;

        // Deduct from user's wallet
        await User.findByIdAndUpdate(user._id, {
          $inc: { walletBalance: -withdrawalRequest.amount }
        }, { session: dbSession });

        // Create transaction record
        await Transaction.create([{
          user: user._id,
          type: 'debit',
          amount: withdrawalRequest.amount,
          reason: 'withdrawal',
          description: `Withdrawal approved - Request #${requestId.slice(-6)}`,
          balanceBefore,
          balanceAfter
        }], { session: dbSession });

        // Update withdrawal request
        await WithdrawalRequest.findByIdAndUpdate(requestId, {
          status: 'approved',
          processedAt: new Date(),
          processedBy: decoded.userId
        }, { session: dbSession });

      } else if (action === 'reject') {
        // Update withdrawal request
        await WithdrawalRequest.findByIdAndUpdate(requestId, {
          status: 'rejected',
          processedAt: new Date(),
          processedBy: decoded.userId,
          rejectionReason
        }, { session: dbSession });
      }

      await dbSession.commitTransaction();

      return NextResponse.json({
        success: true,
        message: action === 'approve' 
          ? 'Withdrawal request approved successfully. User wallet has been debited.' 
          : 'Withdrawal request rejected.',
        data: {
          requestId,
          action,
          processedAt: new Date()
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
    console.error('Process withdrawal request error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get a single withdrawal request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await connectToDatabase();

    const decoded = await verifyToken(request);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { requestId } = await params;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId)
      .populate('user', 'name email phone referralCode walletBalance activationKey');

    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: withdrawalRequest._id,
        user: withdrawalRequest.user,
        amount: withdrawalRequest.amount,
        activationKey: withdrawalRequest.activationKey,
        status: withdrawalRequest.status,
        requestedAt: withdrawalRequest.requestedAt,
        processedAt: withdrawalRequest.processedAt,
        rejectionReason: withdrawalRequest.rejectionReason,
        paymentDetails: withdrawalRequest.paymentDetails
      }
    });
  } catch (error: any) {
    console.error('Get withdrawal request error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

