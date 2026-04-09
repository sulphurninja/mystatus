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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);

    const dateOnly = parseDateOnly(dateParam);

    if (includePayouts) {
      const payoutFilter: any = {};
      if (dateOnly) {
        payoutFilter.payoutDate = dateOnly;
      }

      const payouts = await FranchiseDailyPayout.find(payoutFilter)
        .sort({ payoutDate: -1, createdAt: -1 })
        .limit(limit)
        .populate('paidTo', 'name email referralCode')
        .populate('referredUser', 'name email referralCode')
        .populate('franchiseKey', 'key price');

      return NextResponse.json({
        success: true,
        data: payouts
      });
    }

    const runFilter: any = {};
    if (dateOnly) {
      runFilter.payoutDate = dateOnly;
    }

    const runs = await FranchisePayoutRun.find(runFilter)
      .sort({ payoutDate: -1, createdAt: -1 })
      .limit(limit)
      .populate('plan', 'owner')
      .populate('franchiseKey', 'key price');

    return NextResponse.json({
      success: true,
      data: runs
    });
  } catch (error: any) {
    console.error('Get franchise payouts error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
