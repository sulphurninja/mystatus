import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import LoanApplication from '@/models/LoanApplication';
import PropertyLead from '@/models/PropertyLead';
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

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const query: any = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.$and = query.$and || [];
      if (status === 'pending') {
        query.$and.push({
          $or: [
            { status: 'pending' },
            { status: { $exists: false } },
            { status: null }
          ]
        });
      } else {
        query.$and.push({ status });
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } },
        { pan: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await LoanApplication.find(query)
      .populate('property', 'title')
      .sort({ createdAt: -1 });

    const leadPairs = applications
      .map((application: any) => ({
        email: application.email,
        contactNumber: application.contactNumber
      }))
      .filter((pair: any) => pair.email && pair.contactNumber);

    const leadMap = new Map<string, any>();
    if (leadPairs.length > 0) {
      const leads = await PropertyLead.find({
        $or: leadPairs.map((pair: any) => ({
          email: pair.email,
          contactNumber: pair.contactNumber
        }))
      }).select('email contactNumber loanAmount');

      leads.forEach((lead: any) => {
        leadMap.set(`${lead.email}|${lead.contactNumber}`, lead);
      });
    }

    return NextResponse.json({
      success: true,
      data: applications.map((application: any) => {
        const matchingLead = leadMap.get(`${application.email}|${application.contactNumber}`);
        const loanAmount = typeof application.loanAmount === 'number'
          ? application.loanAmount
          : typeof matchingLead?.loanAmount === 'number'
            ? matchingLead.loanAmount
            : null;

        return {
          _id: application._id,
          name: application.name,
          contactNumber: application.contactNumber,
          email: application.email,
          loanAmount,
          pan: application.pan,
          aadhaar: application.aadhaar,
          referralCode: application.referralCode || '',
          panCardUrl: application.panCardUrl,
          aadhaarCardUrl: application.aadhaarCardUrl,
          bankStatementUrl: application.bankStatementUrl,
          status: application.status || 'pending',
          reviewedAt: application.reviewedAt,
          property: application.property
            ? { _id: application.property._id, title: application.property.title }
            : null,
          createdAt: application.createdAt
        };
      })
    });
  } catch (error: any) {
    console.error('Get loan applications error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const status = typeof body.status === 'string' ? body.status.trim() : '';

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Valid application ID is required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status must be approved or rejected' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatePayload: Record<string, unknown> = {
      status,
      reviewedAt: new Date()
    };

    if (auth.user?.id && mongoose.isValidObjectId(auth.user.id)) {
      updatePayload.reviewedBy = auth.user.id;
    }

    const updated = await LoanApplication.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    ).populate('property', 'title');

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Loan application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Loan request ${status} successfully`,
      data: {
        _id: updated._id,
        status: updated.status,
        reviewedAt: updated.reviewedAt
      }
    });
  } catch (error: any) {
    console.error('Update loan application error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = (searchParams.get('id') || '').trim();

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Valid application ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await LoanApplication.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Loan application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Loan request deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete loan application error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
