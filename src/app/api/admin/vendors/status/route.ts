import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import VendorPackage from '@/models/VendorPackage';
import Transaction from '@/models/Transaction';
import { authorizeAdminRequest } from '@/middleware/auth';

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(request, 'vendors.approve');
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    await connectToDatabase();
    const { vendorId, status } = await request.json();
    console.log('[vendor status] payload', { vendorId, status });

    if (!vendorId || !['pending', 'active', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'vendorId and valid status are required' }, { status: 400 });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }
    console.log('[vendor status] found vendor', vendorId, 'current status', vendor.status);

    vendor.status = status as any;
    vendor.isActive = status === 'active';
    await vendor.save();

    let activatedPackages = 0;

    if (status === 'active') {
      const pendingPackages = await VendorPackage.find({
        vendor: vendorId,
        activationStatus: 'pending_approval'
      });
      console.log('[vendor status] pending packages', pendingPackages.length);

      for (const vp of pendingPackages) {
        vendor.adsRemaining += vp.adsAllotted;
        vp.activationStatus = 'active';
        activatedPackages += 1;

        const balanceBefore = vendor.walletBalance || 0;
        const balanceAfter = balanceBefore + vp.price;
        vendor.walletBalance = balanceAfter;

        await Transaction.create({
          vendor: vendor._id,
          type: 'credit',
          amount: vp.price,
          reason: 'package_purchase',
          description: `Package "${vp.package}" activated, ads +${vp.adsAllotted}`,
          balanceBefore,
          balanceAfter
        });

        await vp.save();
      }

      await vendor.save();
    }

    return NextResponse.json({
      success: true,
      message: `Vendor updated to ${status}. Activated packages: ${activatedPackages}`
    });
  } catch (error: any) {
    console.error('Vendor status update error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
