import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
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

    const vendors = await Vendor.find()
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      vendors: vendors.map(vendor => ({
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        businessName: vendor.businessName,
        phone: vendor.phone,
        walletBalance: vendor.walletBalance,
        totalAds: vendor.totalAds,
        totalShares: vendor.totalShares,
        totalEarnings: vendor.totalEarnings,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Get vendors error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { name, email, password, businessName, phone } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password, and business name are required' },
        { status: 400 }
      );
    }

    // Create vendor
    const vendor = await Vendor.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      businessName: businessName.trim(),
      phone: phone?.trim() || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully',
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        businessName: vendor.businessName,
        phone: vendor.phone,
        walletBalance: vendor.walletBalance,
        totalAds: vendor.totalAds,
        totalShares: vendor.totalShares,
        totalEarnings: vendor.totalEarnings,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt
      }
    });

  } catch (error: any) {
    console.error('Create vendor error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Vendor with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
