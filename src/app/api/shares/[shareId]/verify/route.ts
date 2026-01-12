import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
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

    const { shareId } = await params;
    const { proofImage } = await request.json();

    if (!proofImage) {
      return NextResponse.json(
        { success: false, message: 'Proof image is required' },
        { status: 400 }
      );
    }

    // Find the share
    const share = await Share.findById(shareId).populate('advertisement');

    if (!share) {
      return NextResponse.json(
        { success: false, message: 'Share not found' },
        { status: 404 }
      );
    }

    // Check if the share belongs to the authenticated user
    if (share.user.toString() !== auth.user!.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if the share is still pending
    if (share.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Share is not eligible for verification' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update share with proof image (Keep status as pending for admin review)
    const updatedShare = await Share.findByIdAndUpdate(
      shareId,
      {
        proofImage,
        verifiedAt: now
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Verification proof submitted successfully. It is now under review.',
      data: {
        id: share._id,
        status: 'pending',
        verifiedAt: now
      }
    });

  } catch (error: any) {
    console.error('Submit verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
