import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query: any = {};
    if (status !== 'all') {
      if (status === 'expired') {
        query.verificationDeadline = { $lt: new Date() };
        query.status = { $in: ['pending', 'verified'] };
      } else {
        query.status = status;
      }
    }

    const shares = await Share.find(query)
      .populate('user', 'name')
      .populate('advertisement', 'title image')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      shares: shares.map(share => ({
        _id: share._id,
        user: share.user,
        advertisement: share.advertisement,
        sharedAt: share.sharedAt,
        verificationDeadline: share.verificationDeadline,
        status: share.status,
        rewardAmount: share.rewardAmount,
        proofImage: share.proofImage,
        rejectionReason: share.rejectionReason
      }))
    });

  } catch (error: any) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { shareId, action, rejectionReason } = await request.json();

    if (!shareId || !action) {
      return NextResponse.json(
        { success: false, message: 'Share ID and action are required' },
        { status: 400 }
      );
    }

    const share = await Share.findById(shareId).populate('advertisement', 'title');
    if (!share) {
      return NextResponse.json(
        { success: false, message: 'Share not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Credit user wallet and record transaction
      const user = await User.findById(share.user);
      if (user) {
        const balanceBefore = user.walletBalance;
        const balanceAfter = balanceBefore + share.rewardAmount;

        await User.findByIdAndUpdate(share.user, {
          $inc: { walletBalance: share.rewardAmount }
        });

        // Update share status and flag
        await Share.findByIdAndUpdate(shareId, {
          status: 'verified',
          verifiedAt: new Date(),
          isRewardCredited: true,
          creditedAt: new Date()
        });

        // Create transaction record
        await Transaction.create({
          user: share.user,
          type: 'credit',
          amount: share.rewardAmount,
          reason: 'reward_earned',
          description: `Reward for sharing advertisement: ${share.advertisement?.title || 'Unknown Advertisement'}`,
          reference: share._id,
          referenceModel: 'Share',
          balanceBefore,
          balanceAfter
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Share approved and reward credited successfully'
      });

    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { success: false, message: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      await Share.findByIdAndUpdate(shareId, {
        status: 'rejected',
        rejectionReason,
        verifiedAt: new Date()
        // Note: verifiedBy is not set for admin actions
      });

      return NextResponse.json({
        success: true,
        message: 'Share rejected successfully'
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Update share error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
