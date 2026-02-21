import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Package from '@/models/Package';
import VendorPackage from '@/models/VendorPackage';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();
    const { vendorId } = await params;
    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json(
        { success: false, message: 'Package ID is required' },
        { status: 400 }
      );
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (vendor.status && vendor.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Vendor is not active. Approve vendor before assigning packages.' },
        { status: 400 }
      );
    }

    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return NextResponse.json(
        { success: false, message: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    const vendorPackage = await VendorPackage.create({
      vendor: vendor._id,
      package: pkg._id,
      adsAllotted: pkg.adLimit,
      adsUsed: 0,
      price: pkg.price,
      assignedBy: 'admin'
    });

    const balanceBefore = vendor.walletBalance;
    vendor.adsRemaining += pkg.adLimit;
    vendor.walletBalance += pkg.price;
    await vendor.save();

    await Transaction.create({
      vendor: vendor._id,
      type: 'credit',
      amount: pkg.price,
      reason: 'package_purchase',
      description: `Package "${pkg.name}" assigned - ${pkg.adLimit} ads`,
      reference: vendorPackage._id,
      referenceModel: 'Vendor',
      balanceBefore,
      balanceAfter: vendor.walletBalance
    });

    return NextResponse.json({
      success: true,
      message: `Package "${pkg.name}" assigned to ${vendor.name}. ${pkg.adLimit} ads added.`,
      vendorPackage,
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        adsRemaining: vendor.adsRemaining,
        walletBalance: vendor.walletBalance
      }
    });
  } catch (error: any) {
    console.error('Assign package error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
