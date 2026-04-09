import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { runDailyFranchisePayouts } from '@/lib/franchisePayouts';

// POST /api/cron/franchise-payouts - Trigger daily payouts (cron-safe)
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.FRANCHISE_PAYOUT_CRON_SECRET;
    const provided = request.headers.get('x-cron-secret') || '';

    if (secret && provided !== secret) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const summary = await runDailyFranchisePayouts({
      date: body?.date,
      limit: body?.limit
    });

    return NextResponse.json({
      success: true,
      message: 'Franchise payouts processed',
      data: summary
    });
  } catch (error: any) {
    console.error('Cron franchise payouts error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
