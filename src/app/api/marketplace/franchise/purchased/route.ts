import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import FranchiseKey from '@/models/FranchiseKey';
import FranchisePayoutPlan from '@/models/FranchisePayoutPlan';
import { authenticateRequest } from '@/middleware/auth';

// GET - Get user's purchased franchise keys
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const keys = await FranchiseKey.find({
      purchasedBy: auth.user!.id
    }).sort({ purchasedAt: -1 });

    const plans = await FranchisePayoutPlan.find({
      owner: auth.user!.id
    }).select('franchiseKey isActive lastPaidAt startDate');

    const planMap = new Map<string, any>();
    plans.forEach(plan => {
      planMap.set(plan.franchiseKey.toString(), plan);
    });

    return NextResponse.json({
      success: true,
      data: keys.map(key => {
        const plan = planMap.get(key._id.toString());
        return {
          id: key._id,
          key: key.key,
          price: key.price,
          status: key.isUsed ? 'active' : 'purchased',
          purchasedAt: key.purchasedAt,
          usedAt: key.usedAt,
          isForSale: key.isForSale,
          plan: plan
            ? {
                id: plan._id,
                isActive: plan.isActive,
                lastPaidAt: plan.lastPaidAt,
                startDate: plan.startDate
              }
            : null
        };
      })
    });
  } catch (error: any) {
    console.error('Get purchased franchise keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
