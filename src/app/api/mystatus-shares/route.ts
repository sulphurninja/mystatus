import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MyStatusShare from '@/models/MyStatusShare';
import MyStatusAd from '@/models/MyStatusAd';
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

    const { mystatusAdId } = await request.json();

    if (!mystatusAdId) {
      return NextResponse.json(
        { success: false, message: 'MyStatus Ad ID is required' },
        { status: 400 }
      );
    }

    // Get MyStatus ad details
    const mystatusAd = await MyStatusAd.findById(mystatusAdId);

    if (!mystatusAd || !mystatusAd.isActive) {
      return NextResponse.json(
        { success: false, message: 'MyStatus ad not found or inactive' },
        { status: 404 }
      );
    }

    // Get user to check onboarding status
    const user = await User.findById(auth.user!.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Create share record (MyStatus shares don't need verification)
    const share = await MyStatusShare.create({
      user: auth.user!.id,
      mystatusAd: mystatusAdId,
      status: 'shared'
    });

    // Update MyStatus ad share count
    await MyStatusAd.findByIdAndUpdate(mystatusAdId, {
      $inc: { totalShares: 1 }
    });

    // Check if user can progress their 8-day onboarding challenge
    let onboardingProgress = null;
    if (user.onboardingDaysCompleted < 8) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let canProgress = true;
      if (user.lastOnboardingShareDate) {
        const lastShare = new Date(user.lastOnboardingShareDate);
        lastShare.setHours(0, 0, 0, 0);
        canProgress = lastShare < today; // Only progress if last share was before today
      }
      
      if (canProgress) {
        // Progress to next day!
        const newDaysCompleted = user.onboardingDaysCompleted + 1;
        await User.findByIdAndUpdate(auth.user!.id, {
          onboardingDaysCompleted: newDaysCompleted,
          lastOnboardingShareDate: new Date()
        });
        
        onboardingProgress = {
          daysCompleted: newDaysCompleted,
          daysRemaining: 8 - newDaysCompleted,
          justCompletedDay: true,
          canAccessPaidAds: newDaysCompleted >= 8
        };
        
        console.log(`User ${user.name} completed onboarding day ${newDaysCompleted}/8`);
      } else {
        // Already shared today
        onboardingProgress = {
          daysCompleted: user.onboardingDaysCompleted,
          daysRemaining: 8 - user.onboardingDaysCompleted,
          justCompletedDay: false,
          alreadySharedToday: true,
          canAccessPaidAds: false
        };
      }
    } else {
      // Already completed onboarding
      onboardingProgress = {
        daysCompleted: 8,
        daysRemaining: 0,
        justCompletedDay: false,
        canAccessPaidAds: true
      };
    }

    return NextResponse.json({
      success: true,
      message: onboardingProgress?.justCompletedDay 
        ? `Day ${onboardingProgress.daysCompleted} completed! ${onboardingProgress.daysRemaining} days remaining.`
        : 'MyStatus ad shared successfully',
      data: {
        id: share._id,
        mystatusAd: {
          id: mystatusAd._id,
          title: mystatusAd.title
        },
        sharedAt: share.sharedAt,
        status: share.status,
        onboardingProgress
      }
    });

  } catch (error: any) {
    console.error('Create MyStatus share error:', error);
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

    const shares = await MyStatusShare.find({ user: auth.user!.id })
      .populate('mystatusAd', 'title image category')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: shares.map(share => ({
        id: share._id,
        mystatusAd: {
          id: share.mystatusAd._id,
          title: share.mystatusAd.title,
          image: share.mystatusAd.image,
          category: share.mystatusAd.category
        },
        sharedAt: share.sharedAt,
        status: share.status
      }))
    });

  } catch (error: any) {
    console.error('Get MyStatus shares error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
