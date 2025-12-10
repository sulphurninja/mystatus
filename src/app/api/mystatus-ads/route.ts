import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MyStatusAd from '@/models/MyStatusAd';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get all active MyStatus ads
    const mystatusAds = await MyStatusAd.find({ isActive: true })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: mystatusAds.map(ad => ({
        id: ad._id,
        title: ad.title,
        description: ad.description,
        image: ad.image,
        category: ad.category,
        totalShares: ad.totalShares
      }))
    });

  } catch (error: any) {
    console.error('Get MyStatus ads error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
