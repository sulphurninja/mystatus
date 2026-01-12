import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import Vendor from '@/models/Vendor';
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

    const advertisements = await Advertisement.find()
      .populate('vendor', 'name businessName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      advertisements: advertisements.map(ad => ({
        _id: ad._id,
        title: ad.title,
        description: ad.description,
        image: ad.image,
        rewardAmount: ad.rewardAmount,
        vendor: ad.vendor,
        isActive: ad.isActive,
        totalShares: ad.totalShares,
        totalVerifiedShares: ad.totalVerifiedShares,
        totalRewardsPaid: ad.totalRewardsPaid,
        verificationPeriodHours: ad.verificationPeriodHours,
        createdAt: ad.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Get advertisements error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const {
      title,
      description,
      image,
      rewardAmount,
      vendorId,
      verificationPeriodHours
    } = await request.json();

    // Validate required fields
    if (!title || !description || !image || !rewardAmount || !vendorId) {
      return NextResponse.json(
        { success: false, message: 'Title, description, image, reward amount, and vendor are required' },
        { status: 400 }
      );
    }

    // Validate vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: 'Invalid vendor selected' },
        { status: 400 }
      );
    }

    // Create advertisement
    const advertisement = await Advertisement.create({
      title: title.trim(),
      description: description.trim(),
      image,
      rewardAmount: parseFloat(rewardAmount),
      vendor: vendorId,
      verificationPeriodHours: verificationPeriodHours !== undefined ? parseInt(verificationPeriodHours) : 8
    });

    // Update vendor's totalAds count
    await Vendor.findByIdAndUpdate(vendorId, { $inc: { totalAds: 1 } });

    const populatedAd = await Advertisement.findById(advertisement._id)
      .populate('vendor', 'name businessName');

    return NextResponse.json({
      success: true,
      message: 'Advertisement created successfully',
      advertisement: {
        _id: populatedAd!._id,
        title: populatedAd!.title,
        description: populatedAd!.description,
        image: populatedAd!.image,
        rewardAmount: populatedAd!.rewardAmount,
        vendor: populatedAd!.vendor,
        isActive: populatedAd!.isActive,
        totalShares: populatedAd!.totalShares,
        totalVerifiedShares: populatedAd!.totalVerifiedShares,
        totalRewardsPaid: populatedAd!.totalRewardsPaid,
        verificationPeriodHours: populatedAd!.verificationPeriodHours,
        createdAt: populatedAd!.createdAt
      }
    });

  } catch (error: any) {
    console.error('Create advertisement error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Duplicate entry found' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
