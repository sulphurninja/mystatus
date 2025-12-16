import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const user = await User.findById(auth.user!.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        activationKey: user.activationKey,
        referralCode: user.referralCode,
        profileImage: user.profileImage,
        walletBalance: user.walletBalance,
        isActive: user.isActive,
        canShareAds: user.canShareAds,
        createdAt: user.createdAt
      }
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { name, email, phone, profileImage } = await request.json();

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim();
    if (phone) updateData.phone = phone.trim();
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      auth.user!.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        activationKey: user.activationKey,
        referralCode: user.referralCode,
        profileImage: user.profileImage,
        walletBalance: user.walletBalance,
        canShareAds: user.canShareAds
      }
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Email or phone already in use' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
