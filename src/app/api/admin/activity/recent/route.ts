import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    // Get recent shares with user and advertisement info
    const recentShares = await Share.find()
      .populate('user', 'name')
      .populate('advertisement', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent vendor registrations
    const recentVendors = await Vendor.find()
      .sort({ createdAt: -1 })
      .limit(3);

    const activities = [];

    // Add share activities
    recentShares.forEach(share => {
      activities.push({
        id: `share-${share._id}`,
        title: 'New Share Created',
        description: `${share.user?.name || 'User'} shared "${share.advertisement?.title || 'Ad'}"`,
        icon: '📱',
        time: new Date(share.createdAt).toLocaleString(),
        type: 'share'
      });
    });

    // Add user registration activities
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        title: 'New User Registered',
        description: `${user.name} joined the platform`,
        icon: '👤',
        time: new Date(user.createdAt).toLocaleString(),
        type: 'user'
      });
    });

    // Add vendor registration activities
    recentVendors.forEach(vendor => {
      activities.push({
        id: `vendor-${vendor._id}`,
        title: 'New Vendor Added',
        description: `${vendor.businessName} joined as a vendor`,
        icon: '🏪',
        time: new Date(vendor.createdAt).toLocaleString(),
        type: 'vendor'
      });
    });

    // Sort by time and take latest 10
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, 10)
    });

  } catch (error: any) {
    console.error('Get recent activity error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
