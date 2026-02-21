import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { authenticateRequest } from '@/middleware/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();
    const { name, email, phone, businessName } = await request.json();

    if (!name || !email || !businessName) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and business name are required' },
        { status: 400 }
      );
    }

    const existing = await Vendor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Vendor with this email already exists' },
        { status: 400 }
      );
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');

    const vendor = await Vendor.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: tempPassword,
      businessName: businessName.trim(),
      phone: phone?.trim(),
      status: 'pending',
      isActive: false
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor created in pending state. Awaiting admin approval.',
      vendorId: vendor._id,
      tempPassword
    });
  } catch (error: any) {
    console.error('Vendor register error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
