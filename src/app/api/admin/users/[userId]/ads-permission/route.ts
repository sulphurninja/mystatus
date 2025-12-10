import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Toggle the canShareAds permission
    user.canShareAds = !user.canShareAds;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Ad sharing ${user.canShareAds ? 'enabled' : 'disabled'} for user`,
      user: {
        _id: user._id,
        canShareAds: user.canShareAds,
      }
    });

  } catch (error: any) {
    console.error('Toggle ads permission error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
