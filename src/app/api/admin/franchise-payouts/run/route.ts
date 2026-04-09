import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { authenticateRequest } from '@/middleware/auth';
import { runDailyFranchisePayouts } from '@/lib/franchisePayouts';

// POST /api/admin/franchise-payouts/run - Trigger daily payout run
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
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
    console.error('Run franchise payouts error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
