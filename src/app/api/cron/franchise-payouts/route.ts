import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { runDailyFranchisePayouts } from '@/lib/franchisePayouts';

/**
 * Auth for AWS Lambda / EventBridge cron hitting this EC2-hosted app.
 * Requires FRANCHISE_PAYOUT_CRON_SECRET and matching x-cron-secret / Bearer / ?secret=.
 */
async function authorizeCronRequest(request: NextRequest) {
  const secret = process.env.FRANCHISE_PAYOUT_CRON_SECRET;

  if (!secret) {
    console.error('FRANCHISE_PAYOUT_CRON_SECRET is not configured');
    return NextResponse.json(
      { success: false, message: 'Cron secret not configured' },
      { status: 503 }
    );
  }

  const providedHeader = request.headers.get('x-cron-secret') || '';
  const providedQuery = new URL(request.url).searchParams.get('secret') || '';
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (
    providedHeader === secret ||
    providedQuery === secret ||
    bearerToken === secret
  ) {
    return null;
  }

  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  );
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

// GET /api/cron/franchise-payouts - Trigger from schedulers that only support GET
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

// POST /api/cron/franchise-payouts - Preferred entrypoint (AWS Lambda)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return handleCronRequest(request, body);
}
