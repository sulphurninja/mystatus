import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PropertyLead from '@/models/PropertyLead';
import LoanApplication from '@/models/LoanApplication';
import { authenticateRequest } from '@/middleware/auth';

const getStringValue = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const getApplicationDocumentUrls = (application: any) => ({
  panCardUrl: getStringValue(
    application.panCardUrl,
    application.documents?.panCardUrl,
    application.documents?.panCard,
    application.documents?.pan,
    application.panCard?.url
  ),
  aadhaarCardUrl: getStringValue(
    application.aadhaarCardUrl,
    application.documents?.aadhaarCardUrl,
    application.documents?.aadhaarCard,
    application.documents?.aadhaar,
    application.aadhaarCard?.url
  ),
  bankStatementUrl: getStringValue(
    application.bankStatementUrl,
    application.documents?.bankStatementUrl,
    application.documents?.bankStatement,
    application.documents?.bank,
    application.bankStatement?.url
  )
});

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      PropertyLead.find(searchQuery)
        .populate('property', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PropertyLead.countDocuments(searchQuery),
    ]);

    const leadPairs = leads
      .map((lead: any) => ({
        email: lead.email,
        contactNumber: lead.contactNumber
      }))
      .filter((pair: any) => pair.email && pair.contactNumber);

    const loanMap = new Map<string, any>();
    if (leadPairs.length > 0) {
      const loanDocs = await LoanApplication.find({
        $or: leadPairs.map((pair: any) => ({
          email: pair.email,
          contactNumber: pair.contactNumber
        }))
      }).select('email contactNumber loanAmount pan aadhaar panCardUrl aadhaarCardUrl bankStatementUrl status createdAt reviewedAt');

      loanDocs.forEach((doc: any) => {
        const key = `${doc.email}|${doc.contactNumber}`;
        loanMap.set(key, doc);
      });
    }

    return NextResponse.json({
      success: true,
      leads: leads.map((lead: any) => ({
        _id: lead._id,
        name: lead.name,
        contactNumber: lead.contactNumber,
        email: lead.email,
        address: lead.address,
        requiresLoan: !!lead.requiresLoan,
        loanAmount: lead.loanAmount,
        referralCode: lead.referralCode || '',
        property: lead.property
          ? { _id: lead.property._id, title: lead.property.title }
          : null,
        createdAt: lead.createdAt,
        loan: (() => {
          const key = `${lead.email}|${lead.contactNumber}`;
          const match = loanMap.get(key);
          if (!match) return null;
          const documentUrls = getApplicationDocumentUrls(match);
          return {
            loanAmount: typeof match.loanAmount === 'number' ? match.loanAmount : lead.loanAmount,
            pan: match.pan,
            aadhaar: match.aadhaar,
            panCardUrl: documentUrls.panCardUrl,
            aadhaarCardUrl: documentUrls.aadhaarCardUrl,
            bankStatementUrl: documentUrls.bankStatementUrl,
            status: match.status || 'pending',
            createdAt: match.createdAt,
            reviewedAt: match.reviewedAt
          };
        })()
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
    console.error('Get property leads error:', error);
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

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const leadId = (searchParams.get('id') || '').trim();

    if (!leadId) {
      return NextResponse.json(
        { success: false, message: 'Lead ID is required' },
        { status: 400 }
      );
    }

    if (!leadId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    const deleted = await PropertyLead.findByIdAndDelete(leadId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete property lead error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
