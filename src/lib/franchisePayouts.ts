import mongoose from 'mongoose';
import User from '@/models/User';
import FranchisePayoutPlan from '@/models/FranchisePayoutPlan';
import FranchisePayoutRun from '@/models/FranchisePayoutRun';
import FranchiseDailyPayout from '@/models/FranchiseDailyPayout';
import { createQualifiedCommission } from '@/lib/commissionQualification';

export type FranchisePayoutRunSummary = {
  payoutDate: Date;
  totalPlans: number;
  processedPlans: number;
  skippedPlans: number;
  failedPlans: number;
  totalPaid: number;
  totalRecipients: number;
};

/** Stuck "processing" runs older than this are retried (crash/timeout recovery). */
const STALE_PROCESSING_MS = 15 * 60 * 1000;

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
  const value = Number(dailyCommissions?.[key]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

async function createFranchisePayoutEntry({
  session,
  plan,
  recipientId,
  referredUserId,
  level,
  amount,
  payoutDate,
  description
}: {
  session: mongoose.ClientSession;
  plan: any;
  recipientId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  level: number;
  amount: number;
  payoutDate: Date;
  description: string;
}) {
  const recipient = await User.findById(recipientId).session(session);
  if (!recipient || amount <= 0) {
    return { created: false, paid: false };
  }

  // Idempotent: skip if this plan/day/level/recipient was already written
  const existingPayout = await FranchiseDailyPayout.findOne({
    plan: plan._id,
    payoutDate,
    paidTo: recipient._id,
    level
  }).session(session);

  if (existingPayout) {
    return { created: false, paid: false, alreadyExists: true };
  }

  const result = await createQualifiedCommission({
    session,
    userId: recipient._id,
    referredUserId,
    commissionType: 'franchise_daily',
    level,
    amount,
    description
  });

  await FranchiseDailyPayout.create([{
    plan: plan._id,
    franchiseKey: plan.franchiseKey,
    paidTo: recipient._id,
    referredUser: referredUserId,
    level,
    amount,
    payoutDate,
    commission: result.commission?._id
  }], { session });

  return { created: true, paid: result.paid };
}

async function initializePayoutRun(plan: any, payoutDate: Date) {
  const existingRun = await FranchisePayoutRun.findOne({
    plan: plan._id,
    payoutDate
  });

  if (existingRun) {
    if (existingRun.status === 'completed') {
      return { skip: true as const, runRecord: existingRun };
    }

    if (existingRun.status === 'processing') {
      const touchedAt = existingRun.updatedAt || existingRun.createdAt;
      const ageMs = Date.now() - new Date(touchedAt).getTime();
      if (ageMs < STALE_PROCESSING_MS) {
        return { skip: true as const, runRecord: existingRun };
      }
    }

    const runRecord = await FranchisePayoutRun.findByIdAndUpdate(
      existingRun._id,
      { status: 'processing', totalPaid: 0, totalRecipients: 0, errorMessage: undefined },
      { new: true }
    );

    if (!runRecord) {
      throw new Error('Unable to reset payout run');
    }

    return { skip: false as const, runRecord };
  }

  const runRecord = await FranchisePayoutRun.create({
    plan: plan._id,
    franchiseKey: plan.franchiseKey,
    payoutDate,
    status: 'processing'
  });

  return { skip: false as const, runRecord };
}

export async function runDailyFranchisePayouts(input?: { date?: string | Date; limit?: number }) {
  const payoutDate = toDateOnly(input?.date);
  const limit = input?.limit && input.limit > 0 ? input.limit : undefined;

  // startDate may be a full timestamp from older purchases; compare against end of payout day
  // so same-calendar-day purchases are included.
  const payoutDayEnd = new Date(payoutDate);
  payoutDayEnd.setUTCHours(23, 59, 59, 999);

  const plans = await FranchisePayoutPlan.find({
    isActive: true,
    startDate: { $lte: payoutDayEnd },
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: payoutDate } }]
  }).limit(limit || 0);

  let processedPlans = 0;
  let skippedPlans = 0;
  let failedPlans = 0;
  let totalPaid = 0;
  let totalRecipients = 0;

  for (const plan of plans) {
    let runRecord;

    try {
      const init = await initializePayoutRun(plan, payoutDate);
      if (init.skip) {
        skippedPlans += 1;
        continue;
      }
      runRecord = init.runRecord;
    } catch (error: any) {
      console.error(`Franchise payout init failed for plan ${plan._id}:`, error?.message || error);
      failedPlans += 1;
      continue;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const owner = await User.findById(plan.owner).select('referredBy').session(session);
      if (!owner) {
        throw new Error('Payout plan owner not found');
      }

      let currentReferrerId = owner.referredBy;
      let planPaid = 0;
      let planRecipients = 0;

      for (let level = 1; level <= plan.maxLevels; level++) {
        const amount = getDailyAmount(plan.dailyCommissions, level);
        if (amount <= 0) {
          if (level > 1 && !currentReferrerId) {
            break;
          }
          continue;
        }

        if (level === 1) {
          const created = await createFranchisePayoutEntry({
            session,
            plan,
            recipientId: owner._id,
            referredUserId: owner._id,
            level,
            amount,
            payoutDate,
            description: 'Level 1 franchise daily payout for key purchaser'
          });

          if (created.paid) {
            planPaid += amount;
            planRecipients += 1;
          }
          continue;
        }

        if (!currentReferrerId) {
          break;
        }

        const referrer = await User.findById(currentReferrerId).select('referredBy').session(session);
        if (!referrer) {
          break;
        }

        const created = await createFranchisePayoutEntry({
          session,
          plan,
          recipientId: referrer._id,
          referredUserId: owner._id,
          level,
          amount,
          payoutDate,
          description: `Level ${level} franchise daily payout`
        });

        if (created.paid) {
          planPaid += amount;
          planRecipients += 1;
        }

        currentReferrerId = referrer.referredBy;
      }

      await FranchisePayoutPlan.findByIdAndUpdate(plan._id, {
        lastPaidAt: payoutDate
      }, { session });

      // Mark completed inside the transaction so we never leave paid rows stuck as "processing"
      await FranchisePayoutRun.findByIdAndUpdate(runRecord._id, {
        status: 'completed',
        totalPaid: planPaid,
        totalRecipients: planRecipients,
        errorMessage: undefined
      }, { session });

      await session.commitTransaction();
      processedPlans += 1;
      totalPaid += planPaid;
      totalRecipients += planRecipients;
    } catch (error: any) {
      await session.abortTransaction();
      failedPlans += 1;
      await FranchisePayoutRun.findByIdAndUpdate(runRecord._id, {
        status: 'failed',
        errorMessage: error?.message || 'Unknown error'
      });
      console.error(`Franchise payout failed for plan ${plan._id}:`, error?.message || error);
    } finally {
      session.endSession();
    }
  }

  const summary: FranchisePayoutRunSummary = {
    payoutDate,
    totalPlans: plans.length,
    processedPlans,
    skippedPlans,
    failedPlans,
    totalPaid,
    totalRecipients
  };

  return summary;
}
