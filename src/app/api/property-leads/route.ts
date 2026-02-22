import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import PropertyLead from '@/models/PropertyLead';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const contactNumber = typeof body.contactNumber === 'string' ? body.contactNumber.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : '';
    const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';
    const requiresLoan = typeof body.requiresLoan === 'boolean' ? body.requiresLoan : false;

    if (!name || !contactNumber || !email || !address || !propertyId) {
      return NextResponse.json(
        { success: false, message: 'Name, contact number, email, address, and property ID are required' },
        { status: 400 }
      );
    }

    if (!propertyId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid property ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const advertisement = await Advertisement.findById(propertyId);
    if (!advertisement || !advertisement.isActive) {
      return NextResponse.json(
        { success: false, message: 'Property not found or inactive' },
        { status: 404 }
      );
    }

    const lead = await PropertyLead.create({
      name,
      contactNumber,
      email: email.toLowerCase(),
      address,
      requiresLoan,
      property: propertyId,
      referralCode: referralCode || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      data: { id: lead._id }
    });
  } catch (error: any) {
    console.error('Create property lead error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
