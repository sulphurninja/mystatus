import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get all active advertisements with vendor info
    const advertisements = await Advertisement.find({ isActive: true })
      .populate('vendor', 'name businessName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: advertisements.map(ad => ({
        id: ad._id,
        title: ad.title,
        description: ad.description,
        image: ad.image,
        rewardAmount: ad.rewardAmount,
        vendor: {
          id: ad.vendor._id,
          name: ad.vendor.name,
          businessName: ad.vendor.businessName
        },
        totalShares: ad.totalShares,
        verificationPeriodHours: ad.verificationPeriodHours
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
