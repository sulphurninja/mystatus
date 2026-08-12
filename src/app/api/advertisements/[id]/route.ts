import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import { authenticateRequest } from '@/middleware/auth';
import { detectAdMediaType } from '@/lib/adMedia';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { id } = await params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid advertisement ID format' },
        { status: 400 }
      );
    }

    const advertisement = await Advertisement.findById(id)
      .populate('vendor', 'name email');

    if (!advertisement) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found or has been removed' },
        { status: 404 }
      );
    }

    // Check if ad is active
    if (!advertisement.isActive) {
      return NextResponse.json(
        { success: false, message: 'This advertisement is no longer active' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: advertisement._id,
        title: advertisement.title,
        description: advertisement.description,
        image: advertisement.image,
        imageUrl: advertisement.image,
        mediaType: detectAdMediaType(advertisement.image, (advertisement as any).mediaType),
        rewardAmount: advertisement.rewardAmount,
        reward: advertisement.rewardAmount,
        verificationPeriodHours: advertisement.verificationPeriodHours,
        verificationPeriod: advertisement.verificationPeriodHours === 0 
          ? 'instant' 
          : `${advertisement.verificationPeriodHours}hour`,
        vendor: advertisement.vendor ? {
          id: advertisement.vendor._id,
          name: advertisement.vendor.name,
          email: advertisement.vendor.email
        } : null,
        category: advertisement.category,
        totalShares: advertisement.totalShares,
        totalVerifiedShares: advertisement.totalVerifiedShares,
        isActive: advertisement.isActive,
        createdAt: advertisement.createdAt,
        commissionEnabled: !!advertisement.commissionEnabled,
        commissionNote: advertisement.commissionNote || ''
      }
    });

  } catch (error: any) {
    console.error('Get advertisement error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
