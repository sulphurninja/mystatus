import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Advertisement from '@/models/Advertisement';
import VendorPackage from '@/models/VendorPackage';
import { authenticateRequest } from '@/middleware/auth';
import { detectAdMediaType } from '@/lib/adMedia';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['vendor']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const ads = await Advertisement.find({ vendor: auth.user!.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      ads: ads.map((ad) => ({
        _id: ad._id,
        title: ad.title,
        description: ad.description,
        image: ad.image,
        mediaType: detectAdMediaType(ad.image, (ad as any).mediaType),
        rewardAmount: ad.rewardAmount,
        isActive: ad.isActive,
        totalShares: ad.totalShares,
        totalVerifiedShares: ad.totalVerifiedShares,
        totalRewardsPaid: ad.totalRewardsPaid,
        createdAt: ad.createdAt,
        activatedAt: ad.activatedAt || (ad.isActive ? ad.createdAt : null)
      }))
    });
  } catch (error: any) {
    console.error('Get vendor ads error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['vendor']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const vendor = await Vendor.findById(auth.user!.id);
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (!vendor.isActive) {
      return NextResponse.json(
        { success: false, message: 'Your account is deactivated' },
        { status: 403 }
      );
    }

    if (vendor.adsRemaining <= 0) {
      return NextResponse.json(
        { success: false, message: 'No ads remaining. Please ask admin to assign a package.' },
        { status: 400 }
      );
    }

    const { title, description, image, mediaType, rewardAmount, verificationPeriodHours, commissionEnabled, commissionNote } = await request.json();

    if (!title || !description || !image || rewardAmount === undefined) {
      return NextResponse.json(
        { success: false, message: 'Title, description, media, and reward amount are required' },
        { status: 400 }
      );
    }

    const ad = await Advertisement.create({
      title: title.trim(),
      description: description.trim(),
      image,
      mediaType: detectAdMediaType(image, mediaType),
      rewardAmount,
      vendor: vendor._id,
      verificationPeriodHours: verificationPeriodHours !== undefined && verificationPeriodHours !== null && verificationPeriodHours !== ''
        ? Number(verificationPeriodHours)
        : 8,
      activatedAt: new Date(),
      commissionEnabled: !!commissionEnabled,
      commissionNote: commissionNote ? String(commissionNote).trim().slice(0, 200) : ''
    });

    vendor.adsRemaining -= 1;
    vendor.totalAds += 1;
    await vendor.save();

    // Deduct from active vendor package
    const activePackage = await VendorPackage.findOne({
      vendor: vendor._id,
      status: 'active'
    }).sort({ createdAt: 1 });

    if (activePackage) {
      activePackage.adsUsed += 1;
      if (activePackage.adsUsed >= activePackage.adsAllotted) {
        activePackage.status = 'exhausted';
      }
      await activePackage.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Advertisement created successfully',
      ad,
      adsRemaining: vendor.adsRemaining
    });
  } catch (error: any) {
    console.error('Create vendor ad error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
