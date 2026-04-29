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
    const advertisement = await Advertisement.findById(adId);

    if (!advertisement) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found' },
        { status: 404 }
      );
    }

    advertisement.isActive = !advertisement.isActive;
    if (advertisement.isActive) {
      advertisement.activatedAt = new Date();
    }
    await advertisement.save();

    return NextResponse.json({
      success: true,
      message: `Advertisement ${advertisement.isActive ? 'activated' : 'deactivated'}`,
      advertisement: {
        _id: advertisement._id,
        isActive: advertisement.isActive,
        activatedAt: advertisement.activatedAt || (advertisement.isActive ? advertisement.createdAt : null),
      }
    });

  } catch (error: any) {
    console.error('Toggle advertisement status error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}



