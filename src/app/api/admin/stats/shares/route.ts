import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Share from '@/models/Share';
import Transaction from '@/models/Transaction';
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

    // Get total shares count
    const count = await Share.countDocuments();

    // Get pending verifications
    const pending = await Share.countDocuments({ status: 'pending' });

    // Calculate total revenue from transactions
    const revenueResult = await Transaction.aggregate([
      { $match: { type: 'credit', reason: 'reward_earned' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return NextResponse.json({
      success: true,
      count,
      pending,
      revenue
    });

  } catch (error: any) {
    console.error('Get shares stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
