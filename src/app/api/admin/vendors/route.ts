import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { authorizeAdminRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Ads admins need the vendor list to attach advertisements
    const auth = await authorizeAdminRequest(request, [
      'vendors.create',
      'vendors.approve',
      'advertisements.create',
      'advertisements.approve'
    ]);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;
    const search = (searchParams.get('search') || '').trim();

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      Vendor.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Vendor.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      vendors: vendors.map(vendor => ({
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        businessName: vendor.businessName,
        phone: vendor.phone,
        walletBalance: vendor.walletBalance,
        adsRemaining: vendor.adsRemaining || 0,
        totalAds: vendor.totalAds,
        totalShares: vendor.totalShares,
        totalEarnings: vendor.totalEarnings,
        status: (vendor as any).status || (vendor.isActive ? 'active' : 'pending'),
        isActive: vendor.isActive,
        createdAt: vendor.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
        pages: Math.max(1, Math.ceil(total / limit) || 1),
      }
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
    const auth = await authorizeAdminRequest(request, 'vendors.create');
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
