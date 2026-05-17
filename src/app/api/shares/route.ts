import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
import Advertisement from '@/models/Advertisement';
import User from '@/models/User';
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

    // Validate MongoDB ObjectId format
    if (!advertisementId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid advertisement ID format' },
        { status: 400 }
      );
    }

    // Get advertisement details
    const advertisement = await Advertisement.findById(advertisementId);

    if (!advertisement) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found. It may have been removed.' },
        { status: 404 }
      );
    }

    if (!advertisement.isActive) {
      return NextResponse.json(
        { success: false, message: 'This advertisement is no longer active' },
        { status: 404 }
      );
    }

    // Check if user already has a pending share for this advertisement
    // (unique index also enforces this, but we return a friendly response)
    const existingShare = await Share.findOne({
      user: auth.user!.id,
      advertisement: advertisementId,
      status: 'pending'
    }).populate('advertisement', 'title');

    if (existingShare) {
      // Return the existing pending share instead of creating a duplicate
      return NextResponse.json({
        success: true,
        message: 'You already have a pending share for this advertisement',
        data: {
          id: existingShare._id,
          advertisement: existingShare.advertisement ? {
            id: existingShare.advertisement._id,
            title: existingShare.advertisement.title
          } : null,
          sharedAt: existingShare.sharedAt || existingShare.createdAt,
          verificationDeadline: existingShare.verificationDeadline,
          status: existingShare.status,
          rewardAmount: existingShare.rewardAmount,
          proofImage: existingShare.proofImage || null
        }
      });
    }

    // Allow re-sharing an ad after a 24-hour cooldown from the last share attempt
    // (regardless of status). Pending shares are handled above.
    const cooldownMs = 24 * 60 * 60 * 1000;
    const now = new Date();

    const lastShare = await Share.findOne({
      user: auth.user!.id,
      advertisement: advertisementId
    }).sort({ sharedAt: -1, createdAt: -1 });

    if (lastShare) {
      const lastShareAt = lastShare.sharedAt || lastShare.createdAt;
      const nextAllowedAt = new Date(lastShareAt.getTime() + cooldownMs);
      if (now < nextAllowedAt) {
        const msRemaining = nextAllowedAt.getTime() - now.getTime();
        const hours = Math.floor(msRemaining / (60 * 60 * 1000));
        const minutes = Math.ceil((msRemaining % (60 * 60 * 1000)) / (60 * 1000));

        const remainingText =
          hours <= 0 ? `${minutes} min` : `${hours}h ${minutes}m`;

        return NextResponse.json(
          {
            success: false,
            message: `You can share this ad again in ${remainingText}.`
          },
          { status: 400 }
        );
      }
    }

    // Check share limit logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sharesToday = await Share.countDocuments({
      user: auth.user!.id,
      createdAt: { $gte: today }
    });

    // Base allowance is 10 shares. Each directly referred user with an
    // activation key adds 10 more shares.
    let dailyLimit = 10;

    try {
      const activeKeyReferrals = await User.countDocuments({
        referredBy: auth.user!.id,
        isActive: true,
        activationKey: { $exists: true, $nin: [null, ''] }
      });

      dailyLimit += activeKeyReferrals * 10;
    } catch (err) {
      console.error('Error checking active referral key count for share limit:', err);
      // Fallback to base limit on error
    }

    if (sharesToday >= dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `You have reached your daily share limit of ${dailyLimit}. ${dailyLimit === 10 ? 'Refer friends who activate keys to increase your limit!' : 'Each activated direct referral adds 10 more shares.'}`
        },
        { status: 400 }
      );
    }

    // We still prevent multiple simultaneous pending shares for the same ad,
    // and enforce a 24-hour cooldown after the last share attempt.

    // Create share record with duplicate protection
    const verificationDeadline = new Date();
    verificationDeadline.setHours(verificationDeadline.getHours() + advertisement.verificationPeriodHours);

    let share;
    try {
      share = await Share.create({
        user: auth.user!.id,
        advertisement: advertisementId,
        verificationDeadline,
        rewardAmount: advertisement.rewardAmount,
        status: 'pending'
      });
    } catch (error: any) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        const existingShare = await Share.findOne({
          user: auth.user!.id,
          advertisement: advertisementId,
          status: 'pending'
        }).populate('advertisement', 'title');

        if (existingShare) {
          return NextResponse.json({
            success: true,
            message: 'You already have a pending share for this advertisement',
            data: {
              id: existingShare._id,
              advertisement: existingShare.advertisement ? {
                id: existingShare.advertisement._id,
                title: existingShare.advertisement.title
              } : null,
              sharedAt: existingShare.sharedAt || existingShare.createdAt,
              verificationDeadline: existingShare.verificationDeadline,
              status: existingShare.status,
              rewardAmount: existingShare.rewardAmount,
              proofImage: existingShare.proofImage || null
            }
          });
        }
      }
      throw error;
    }

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
        _id: share._id,
        id: share._id,
        advertisement: share.advertisement ? {
          _id: share.advertisement._id,
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
        proofUrl: share.proofImage,
        rejectionReason: share.rejectionReason,
        rewardAmount: share.rewardAmount,
        reward: share.rewardAmount,
        isRewardCredited: share.isRewardCredited,
        createdAt: share.createdAt || share.sharedAt
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
