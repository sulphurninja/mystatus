import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { authenticateRequest } from '@/middleware/auth';
import FranchisePayoutRun from '@/models/FranchisePayoutRun';
import FranchiseDailyPayout from '@/models/FranchiseDailyPayout';

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  const parts = value.split('-').map(part => parseInt(part, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

// GET /api/admin/franchise-payouts - List payout runs or daily payouts
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

    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const includePayouts = url.searchParams.get('payouts') === 'true';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);
    const skip = (page - 1) * limit;

    const dateOnly = parseDateOnly(dateParam);

    if (includePayouts) {
      const payoutFilter: any = {};
      if (dateOnly) {
        payoutFilter.payoutDate = dateOnly;
      }

      const [payouts, total] = await Promise.all([
        FranchiseDailyPayout.find(payoutFilter)
          .sort({ payoutDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('paidTo', 'name email referralCode')
          .populate('referredUser', 'name email referralCode')
          .populate('franchiseKey', 'key price'),
        FranchiseDailyPayout.countDocuments(payoutFilter),
      ]);

      return NextResponse.json({
        success: true,
        data: payouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit) || 1),
          pages: Math.max(1, Math.ceil(total / limit) || 1),
        }
      });
    }

    const runFilter: any = {};
    if (dateOnly) {
      runFilter.payoutDate = dateOnly;
    }

    const [runs, total] = await Promise.all([
      FranchisePayoutRun.find(runFilter)
        .sort({ payoutDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('plan', 'owner')
        .populate('franchiseKey', 'key price'),
      FranchisePayoutRun.countDocuments(runFilter),
    ]);

    return NextResponse.json({
      success: true,
      data: runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
        pages: Math.max(1, Math.ceil(total / limit) || 1),
      }
    });
  } catch (error: any) {
    console.error('Get franchise payouts error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
