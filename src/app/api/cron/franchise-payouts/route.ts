import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { runDailyFranchisePayouts } from '@/lib/franchisePayouts';

async function authorizeCronRequest(request: NextRequest) {
  const secret = process.env.FRANCHISE_PAYOUT_CRON_SECRET;
  const providedHeader = request.headers.get('x-cron-secret') || '';
  const providedQuery = new URL(request.url).searchParams.get('secret') || '';

  if (secret && providedHeader !== secret && providedQuery !== secret) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

async function handleCronRequest(request: NextRequest, body?: { date?: string; limit?: number }) {
  try {
    const authError = await authorizeCronRequest(request);
    if (authError) {
      return authError;
    }

    await connectToDatabase();

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

// GET /api/cron/franchise-payouts - Trigger daily payouts from a scheduler
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  return handleCronRequest(request, {
    date,
    limit: Number.isFinite(limit) ? limit : undefined
  });
}

// POST /api/cron/franchise-payouts - Trigger daily payouts manually or from cron
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return handleCronRequest(request, body);
}
