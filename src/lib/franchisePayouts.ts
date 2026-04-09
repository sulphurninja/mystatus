import mongoose from 'mongoose';
import User from '@/models/User';
import Commission from '@/models/Commission';
import Transaction from '@/models/Transaction';
import FranchisePayoutPlan from '@/models/FranchisePayoutPlan';
import FranchisePayoutRun from '@/models/FranchisePayoutRun';
import FranchiseDailyPayout from '@/models/FranchiseDailyPayout';

export type FranchisePayoutRunSummary = {
  payoutDate: Date;
  totalPlans: number;
  processedPlans: number;
  skippedPlans: number;
  totalPaid: number;
  totalRecipients: number;
};

function toDateOnly(value?: string | Date): Date {
  if (!value) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const parts = value.split('-').map(part => parseInt(part, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function getDailyAmount(dailyCommissions: any, level: number): number {
  const key = `level${level}`;
  return typeof dailyCommissions?.[key] === 'number' ? dailyCommissions[key] : 0;
}

export async function runDailyFranchisePayouts(input?: { date?: string | Date; limit?: number }) {
  const payoutDate = toDateOnly(input?.date);
  const limit = input?.limit && input.limit > 0 ? input.limit : undefined;

  const plans = await FranchisePayoutPlan.find({
    isActive: true,
    startDate: { $lte: payoutDate },
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: payoutDate } }]
  }).limit(limit || 0);

  let processedPlans = 0;
  let skippedPlans = 0;
  let totalPaid = 0;
  let totalRecipients = 0;

  for (const plan of plans) {
    let runRecord;
    try {
      const existingRun = await FranchisePayoutRun.findOne({
        plan: plan._id,
        payoutDate
      });

      if (existingRun) {
        if (existingRun.status === 'completed' || existingRun.status === 'processing') {
          skippedPlans += 1;
          continue;
        }

        runRecord = await FranchisePayoutRun.findByIdAndUpdate(
          existingRun._id,
          { status: 'processing', totalPaid: 0, totalRecipients: 0, errorMessage: undefined },
          { new: true }
        );
      } else {
        runRecord = await FranchisePayoutRun.create({
          plan: plan._id,
          franchiseKey: plan.franchiseKey,
          payoutDate,
          status: 'processing'
        });
      }
      if (!runRecord) {
        throw new Error('Unable to initialize payout run');
      }
    } catch (error: any) {
      throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const owner = await User.findById(plan.owner).select('referredBy').session(session);
      let currentReferrerId = owner?.referredBy;

      let planPaid = 0;
      let planRecipients = 0;

      for (let level = 1; level <= plan.maxLevels && currentReferrerId; level++) {
        const referrer = await User.findById(currentReferrerId).session(session);
        if (!referrer) break;

        const amount = getDailyAmount(plan.dailyCommissions, level);
        if (amount > 0) {
          const balanceBefore = referrer.walletBalance;

          const commission = await Commission.create([{
            user: referrer._id,
            referredUser: plan.owner,
            commissionType: 'franchise_daily',
            level,
            amount,
            description: `Level ${level} daily franchise payout`
          }], { session });

          await User.findByIdAndUpdate(referrer._id, {
            $inc: {
              walletBalance: amount,
              totalCommissionEarned: amount
            }
          }, { session });

          const transaction = await Transaction.create([{
            user: referrer._id,
            type: 'credit',
            amount,
            reason: 'franchise_daily',
            description: `Level ${level} franchise daily payout`,
            balanceBefore,
            balanceAfter: balanceBefore + amount
          }], { session });

          await FranchiseDailyPayout.create([{
            plan: plan._id,
            franchiseKey: plan.franchiseKey,
            paidTo: referrer._id,
            referredUser: plan.owner,
            level,
            amount,
            payoutDate,
            commission: commission[0]?._id,
            transaction: transaction[0]?._id
          }], { session });

          planPaid += amount;
          planRecipients += 1;
        }

        currentReferrerId = referrer.referredBy;
      }

      await FranchisePayoutPlan.findByIdAndUpdate(plan._id, {
        lastPaidAt: payoutDate
      }, { session });

      await session.commitTransaction();
      processedPlans += 1;
      totalPaid += planPaid;
      totalRecipients += planRecipients;

      await FranchisePayoutRun.findByIdAndUpdate(runRecord._id, {
        status: 'completed',
        totalPaid: planPaid,
        totalRecipients: planRecipients
      });
    } catch (error: any) {
      await session.abortTransaction();
      await FranchisePayoutRun.findByIdAndUpdate(runRecord._id, {
        status: 'failed',
        errorMessage: error?.message || 'Unknown error'
      });
    } finally {
      session.endSession();
    }
  }

  const summary: FranchisePayoutRunSummary = {
    payoutDate,
    totalPlans: plans.length,
    processedPlans,
    skippedPlans,
    totalPaid,
    totalRecipients
  };

  return summary;
}
