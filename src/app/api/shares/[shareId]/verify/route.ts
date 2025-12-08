import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
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

    // Check if the share is still pending and within verification period
    if (share.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Share is not eligible for verification' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > share.verificationDeadline) {
      // Mark as expired
      await Share.findByIdAndUpdate(shareId, { status: 'expired' });
      return NextResponse.json(
        { success: false, message: 'Verification period has expired' },
        { status: 400 }
      );
    }

    // Update share with proof image
    await Share.findByIdAndUpdate(shareId, {
      proofImage,
      verifiedAt: now,
      status: 'verified' // For now, auto-verify. In production, this should be reviewed by admin
    });

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully',
      data: {
        id: share._id,
        status: 'verified',
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
