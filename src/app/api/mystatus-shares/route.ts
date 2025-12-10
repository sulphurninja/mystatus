import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MyStatusShare from '@/models/MyStatusShare';
import MyStatusAd from '@/models/MyStatusAd';
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

    return NextResponse.json({
      success: true,
      message: 'MyStatus ad shared successfully',
      data: {
        id: share._id,
        mystatusAd: {
          id: mystatusAd._id,
          title: mystatusAd.title
        },
        sharedAt: share.sharedAt,
        status: share.status
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
