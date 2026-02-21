import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { authenticateRequest } from '@/middleware/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    await connectToDatabase();
    const { vendorId } = await params;
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    vendor.password = password;
    await vendor.save();

    return NextResponse.json({ success: true, message: 'Vendor password updated' });
  } catch (error: any) {
    console.error('Vendor reset-password error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
