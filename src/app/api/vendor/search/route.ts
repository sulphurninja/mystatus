import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { authenticateRequest } from '@/middleware/auth';

const MAX_RESULTS = 10;

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    await connectToDatabase();

    const regex = new RegExp(query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    const vendors = await Vendor.find({
      $or: [{ email: regex }, { phone: regex }, { name: regex }, { businessName: regex }]
    })
      .select('name email phone businessName status isActive adsRemaining')
      .limit(MAX_RESULTS);

    return NextResponse.json({
      success: true,
      data: vendors.map(v => ({
        id: v._id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        businessName: v.businessName,
        status: v.status,
        isActive: v.isActive,
        adsRemaining: v.adsRemaining
      }))
    });
  } catch (error: any) {
    console.error('Vendor search error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
