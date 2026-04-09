import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import FranchisePayoutPlan from '@/models/FranchisePayoutPlan';
import { authenticateRequest } from '@/middleware/auth';

// PATCH /api/admin/franchise-plans/[planId]/toggle - Toggle payout plan active status
export async function PATCH(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { planId } = params;
    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = await FranchisePayoutPlan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'Plan not found' },
        { status: 404 }
      );
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    return NextResponse.json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'paused'} successfully`,
      data: {
        id: plan._id,
        isActive: plan.isActive
      }
    });
  } catch (error: any) {
    console.error('Toggle franchise plan error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
