import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
import Advertisement from '@/models/Advertisement';
import { authenticateRequest } from '@/middleware/auth';

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

    const { advertisementId } = await request.json();

    if (!advertisementId) {
      return NextResponse.json(
        { success: false, message: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    // Get advertisement details
    const advertisement = await Advertisement.findById(advertisementId);

    if (!advertisement || !advertisement.isActive) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user has already been rewarded for this advertisement
    // Once verified, they cannot share this ad again
    const verifiedShare = await Share.findOne({
      user: auth.user!.id,
      advertisement: advertisementId,
      status: 'verified'
    });

    if (verifiedShare) {
      return NextResponse.json(
        { success: false, message: 'You have already been rewarded for sharing this advertisement. You cannot share it again.' },
        { status: 400 }
      );
    }

    // Check if user already has a pending verification request for this advertisement
    // Allow unlimited shares until verified, but only one pending verification at a time
    const existingPendingShare = await Share.findOne({
      user: auth.user!.id,
      advertisement: advertisementId,
      status: 'pending'
    });

    if (existingPendingShare) {
      return NextResponse.json(
        { success: false, message: 'You already have a pending verification request for this advertisement. Please wait for it to be reviewed before submitting another.' },
        { status: 400 }
      );
    }

    // Check share limit logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sharesToday = await Share.countDocuments({
      user: auth.user!.id,
      createdAt: { $gte: today }
    });

    // Determine share limit based on referral status
    // Base limit
    let dailyLimit = 10;

    // Check if user has any referrals who purchased a key (active referrals)
    // We check this by looking for 'key_activation' commissions earned by this user
    try {
      // Need to import Commission model
      const Commission = (await import('@/models/Commission')).default;
      const hasKeyCommissions = await Commission.exists({
        user: auth.user!.id,
        commissionType: 'key_activation'
      });

      // If user has earned key commissions, they get the boosted limit
      if (hasKeyCommissions) {
        // Limit scales with referral level: (Level + 1) * 10
        // Level 1 -> 20, Level 2 -> 30, etc.
        const userLevel = auth.user!.referralLevel || 1;
        dailyLimit = (userLevel + 1) * 10;
      }
    } catch (err) {
      console.error('Error checking commission status for share limit:', err);
      // Fallback to base limit on error
    }

    if (sharesToday >= dailyLimit) {
      return NextResponse.json(
        { success: false, message: `You have reached your daily share limit of ${dailyLimit}. ${dailyLimit === 10 ? 'Refer friends who purchase keys to increase your limit!' : 'Level up to increase your limit further!'}` },
        { status: 400 }
      );
    }

    // Create share record
    const verificationDeadline = new Date();
    verificationDeadline.setHours(verificationDeadline.getHours() + advertisement.verificationPeriodHours);

    const share = await Share.create({
      user: auth.user!.id,
      advertisement: advertisementId,
      verificationDeadline,
      rewardAmount: advertisement.rewardAmount
    });

    // Update advertisement share count
    await Advertisement.findByIdAndUpdate(advertisementId, {
      $inc: { totalShares: 1 }
    });

    return NextResponse.json({
      success: true,
      message: 'Share created successfully',
      data: {
        id: share._id,
        advertisement: {
          id: advertisement._id,
          title: advertisement.title
        },
        sharedAt: share.sharedAt,
        verificationDeadline: share.verificationDeadline,
        status: share.status,
        rewardAmount: share.rewardAmount
      }
    });

  } catch (error: any) {
    console.error('Create share error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

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

    const shares = await Share.find({ user: auth.user!.id })
      .populate('advertisement', 'title image rewardAmount')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: shares.map(share => ({
        id: share._id,
        advertisement: share.advertisement ? {
          id: share.advertisement._id,
          title: share.advertisement.title,
          image: share.advertisement.image,
          rewardAmount: share.advertisement.rewardAmount
        } : null,
        sharedAt: share.sharedAt,
        verificationDeadline: share.verificationDeadline,
        status: share.status,
        verifiedAt: share.verifiedAt,
        proofImage: share.proofImage,
        rejectionReason: share.rejectionReason,
        rewardAmount: share.rewardAmount,
        isRewardCredited: share.isRewardCredited
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
