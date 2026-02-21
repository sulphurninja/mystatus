import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { authenticateRequest } from '@/middleware/auth';
import Vendor from '@/models/Vendor';
import Package from '@/models/Package';
import VendorPackage from '@/models/VendorPackage';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    const body = await request.json();
    const { packageId, vendorId, vendorForm } = body;
    console.log('[vendor purchase] payload', { packageId, vendorId, hasVendorForm: !!vendorForm });

    if (!packageId) {
      return NextResponse.json({ success: false, message: 'packageId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return NextResponse.json({ success: false, message: 'Package not found or inactive' }, { status: 404 });
    }

    let vendor = null;

    if (vendorId) {
      vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
      }
      console.log('[vendor purchase] using existing vendor', vendorId);
    } else {
      // create vendor in pending state using minimal form
      const { name, email, businessName, phone } = vendorForm || {};
      if (!name || !businessName || !email) {
        return NextResponse.json({ success: false, message: 'Name, email, and business name are required to create vendor' }, { status: 400 });
      }
      const existing = await Vendor.findOne({ email: email.toLowerCase() });
      if (existing) {
        vendor = existing; // reuse existing
      } else {
        const tempPassword = crypto.randomBytes(8).toString('hex');
        vendor = await Vendor.create({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: tempPassword,
          businessName: businessName.trim(),
          phone: phone?.trim(),
          status: 'pending',
          isActive: false
        });
        console.log('[vendor purchase] created new vendor', vendor._id);
      }
    }

    // load buyer
    const buyer = await User.findById(auth.user!.id);
    if (!buyer) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (buyer.walletBalance < pkg.price) {
      return NextResponse.json({ success: false, message: 'Insufficient wallet balance' }, { status: 400 });
    }

    session.startTransaction();

    // debit buyer wallet
    await User.findByIdAndUpdate(buyer._id, { $inc: { walletBalance: -pkg.price } }, { session });
    console.log('[vendor purchase] debited user wallet', { userId: buyer._id, amount: pkg.price });

    const autoActivate = vendor.status === 'active';
    const vp = await VendorPackage.create([
      {
        vendor: vendor._id,
        package: pkg._id,
        adsAllotted: pkg.adLimit,
        adsUsed: 0,
        price: pkg.price,
        purchasedBy: buyer._id,
        assignedBy: 'user',
        activationStatus: autoActivate ? 'active' : 'pending_approval',
        status: 'active'
      }
    ], { session });

    await Transaction.create([
      {
        user: buyer._id,
        type: 'debit',
        amount: pkg.price,
        reason: 'package_purchase',
        description: `Purchased vendor package "${pkg.name}" for vendor ${vendor.name}`,
        balanceBefore: buyer.walletBalance,
        balanceAfter: buyer.walletBalance - pkg.price
      }
    ], { session });

    // If vendor already active, immediately credit ads and wallet
    if (autoActivate) {
      vendor.adsRemaining += pkg.adLimit;
      const balanceBeforeVendor = vendor.walletBalance || 0;
      const balanceAfterVendor = balanceBeforeVendor + pkg.price;
      vendor.walletBalance = balanceAfterVendor;
      await vendor.save({ session });

      await Transaction.create([
        {
          vendor: vendor._id,
          type: 'credit',
          amount: pkg.price,
          reason: 'package_purchase',
          description: `Auto-activated vendor package "${pkg.name}" (+${pkg.adLimit} ads)`,
          balanceBefore: balanceBeforeVendor,
          balanceAfter: balanceAfterVendor
        }
      ], { session });
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: 'Vendor package recorded. Awaiting admin approval.',
      vendorId: vendor._id,
      vendorPackageId: vp[0]._id,
      autoActivated: autoActivate
    });
  } catch (error: any) {
    console.error('Vendor package purchase error:', error);
    try { await session.abortTransaction(); } catch {}
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  } finally {
    session.endSession();
  }
}
