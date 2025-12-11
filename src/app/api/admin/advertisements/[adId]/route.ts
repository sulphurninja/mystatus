import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import { authenticateRequest } from '@/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { adId } = await params;
    const { title, description, image, rewardAmount, vendorId, verificationPeriodHours } = await request.json();

    const advertisement = await Advertisement.findByIdAndUpdate(
      adId,
      {
        title,
        description,
        image,
        rewardAmount: parseFloat(rewardAmount),
        vendor: vendorId,
        verificationPeriodHours: parseInt(verificationPeriodHours) || 8,
      },
      { new: true, runValidators: true }
    ).populate('vendor', 'name businessName');

    if (!advertisement) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Advertisement updated successfully',
      advertisement: {
        _id: advertisement._id,
        title: advertisement.title,
        description: advertisement.description,
        image: advertisement.image,
        rewardAmount: advertisement.rewardAmount,
        vendor: advertisement.vendor,
        isActive: advertisement.isActive,
        totalShares: advertisement.totalShares,
        totalVerifiedShares: advertisement.totalVerifiedShares,
        totalRewardsPaid: advertisement.totalRewardsPaid,
        verificationPeriodHours: advertisement.verificationPeriodHours,
        createdAt: advertisement.createdAt,
      }
    });

  } catch (error: any) {
    console.error('Update advertisement error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { adId } = await params;
    const advertisement = await Advertisement.findByIdAndDelete(adId);

    if (!advertisement) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Advertisement deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete advertisement error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

