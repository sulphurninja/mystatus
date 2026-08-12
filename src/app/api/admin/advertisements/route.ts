import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import Vendor from '@/models/Vendor';
import { authorizeAdminRequest } from '@/middleware/auth';
import { detectAdMediaType } from '@/lib/adMedia';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(request, ['advertisements.create', 'advertisements.approve']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;
    const search = (searchParams.get('search') || '').trim();

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [advertisements, total] = await Promise.all([
      Advertisement.find(query)
        .populate('vendor', 'name businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Advertisement.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      advertisements: advertisements.map(ad => ({
        _id: ad._id,
        title: ad.title,
        description: ad.description,
        image: ad.image,
        mediaType: detectAdMediaType(ad.image, (ad as any).mediaType),
        rewardAmount: ad.rewardAmount,
        vendor: ad.vendor,
        isActive: ad.isActive,
        totalShares: ad.totalShares,
        totalVerifiedShares: ad.totalVerifiedShares,
        totalRewardsPaid: ad.totalRewardsPaid,
        verificationPeriodHours: ad.verificationPeriodHours,
        commissionEnabled: !!ad.commissionEnabled,
        commissionNote: ad.commissionNote || '',
        createdAt: ad.createdAt,
        activatedAt: ad.activatedAt || (ad.isActive ? ad.createdAt : null)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
        pages: Math.max(1, Math.ceil(total / limit) || 1),
      }
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
    const auth = await authorizeAdminRequest(request, 'advertisements.create');
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
      mediaType,
      rewardAmount,
      vendorId,
      verificationPeriodHours,
      commissionEnabled,
      commissionNote
    } = await request.json();

    // Validate required fields (rewardAmount may be 0)
    if (!title || !description || !image || rewardAmount === undefined || rewardAmount === null || rewardAmount === '' || !vendorId) {
      return NextResponse.json(
        { success: false, message: 'Title, description, media, reward amount, and vendor are required' },
        { status: 400 }
      );
    }

    const resolvedMediaType = detectAdMediaType(image, mediaType);

    const parsedReward = typeof rewardAmount === 'number' ? rewardAmount : parseFloat(rewardAmount);
    if (!Number.isFinite(parsedReward) || parsedReward < 0) {
      return NextResponse.json(
        { success: false, message: 'Reward amount must be a valid non-negative number' },
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
      mediaType: resolvedMediaType,
      rewardAmount: parsedReward,
      vendor: vendorId,
      verificationPeriodHours: verificationPeriodHours !== undefined ? parseInt(verificationPeriodHours) : 8,
      activatedAt: new Date(),
      commissionEnabled: !!commissionEnabled,
      commissionNote: commissionNote ? String(commissionNote).trim().slice(0, 200) : ''
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
        mediaType: detectAdMediaType(populatedAd!.image, (populatedAd as any).mediaType),
        rewardAmount: populatedAd!.rewardAmount,
        vendor: populatedAd!.vendor,
        isActive: populatedAd!.isActive,
        totalShares: populatedAd!.totalShares,
        totalVerifiedShares: populatedAd!.totalVerifiedShares,
        totalRewardsPaid: populatedAd!.totalRewardsPaid,
        verificationPeriodHours: populatedAd!.verificationPeriodHours,
        commissionEnabled: !!populatedAd!.commissionEnabled,
        commissionNote: populatedAd!.commissionNote || '',
        createdAt: populatedAd!.createdAt,
        activatedAt: populatedAd!.activatedAt || populatedAd!.createdAt
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
