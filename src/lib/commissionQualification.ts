import mongoose from 'mongoose';
import User from '@/models/User';
import Commission, { CommissionType } from '@/models/Commission';
import Transaction from '@/models/Transaction';

type SessionLike = mongoose.ClientSession | null | undefined;

function transactionReasonForCommission(commissionType: CommissionType) {
  return commissionType === 'franchise_daily' ? 'franchise_daily' : 'referral_bonus';
}

export async function getQualifiedCommissionLevel(userId: mongoose.Types.ObjectId | string, session?: SessionLike) {
  const query = User.countDocuments({ referredBy: userId });
  if (session) {
    query.session(session);
  }
  return await query;
}

export async function createQualifiedCommission({
  session,
  userId,
  referredUserId,
  commissionType,
  level,
  amount,
  description
}: {
  session: mongoose.ClientSession;
  userId: mongoose.Types.ObjectId | string;
  referredUserId?: mongoose.Types.ObjectId | string;
  commissionType: CommissionType;
  level: number;
  amount: number;
  description: string;
}) {
  if (amount <= 0) {
    return { created: false, paid: false, commission: null };
  }

  const qualifiedLevel = await getQualifiedCommissionLevel(userId, session);
  
  // Logic for qualification:
  // For franchise_daily: Level 1 is self (0 referrals needed), Level 2 is direct referral (1 referral needed), etc.
  // For others: Level 1 is direct referral (1 referral needed), Level 2 is 2nd gen (2 referrals needed), etc.
  const isQualified = commissionType === 'franchise_daily' 
    ? level <= qualifiedLevel + 1 
    : level <= qualifiedLevel;
    
  const now = new Date();

  const commission = await Commission.create([{
    user: userId,
    referredUser: referredUserId,
    commissionType,
    level,
    amount,
    description,
    payoutStatus: isQualified ? 'paid' : 'pending',
    isPaid: isQualified,
    paidAt: isQualified ? now : undefined
  }], { session });

  if (!isQualified) {
    return { created: true, paid: false, commission: commission[0] };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        walletBalance: amount,
        totalCommissionEarned: amount
      }
    },
    { new: true, session }
  );

  if (!updatedUser) {
    throw new Error('Unable to credit commission recipient');
  }

  await Transaction.create([{
    user: userId,
    type: 'credit',
    amount,
    reason: transactionReasonForCommission(commissionType),
    description,
    reference: commission[0]._id,
    referenceModel: 'Commission',
    balanceBefore: updatedUser.walletBalance - amount,
    balanceAfter: updatedUser.walletBalance
  }], { session });

  return { created: true, paid: true, commission: commission[0] };
}

export async function releaseQualifiedPendingCommissions(
  userId: mongoose.Types.ObjectId | string,
  session: mongoose.ClientSession
) {
  const qualifiedLevel = await getQualifiedCommissionLevel(userId, session);

  const pendingCommissions = await Commission.find({
    user: userId,
    isPaid: false,
    payoutStatus: 'pending',
    amount: { $gt: 0 },
    $or: [
      { commissionType: 'franchise_daily', level: { $lte: qualifiedLevel + 1 } },
      { commissionType: { $ne: 'franchise_daily' }, level: { $lte: qualifiedLevel } }
    ]
  }).sort({ createdAt: 1 }).session(session);

  let releasedCount = 0;
  let releasedAmount = 0;

  for (const pending of pendingCommissions) {
    const releasedCommission = await Commission.findOneAndUpdate(
      { _id: pending._id, isPaid: false, payoutStatus: 'pending' },
      { $set: { isPaid: true, payoutStatus: 'paid', paidAt: new Date() } },
      { new: true, session }
    );

    if (!releasedCommission) {
      continue;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          walletBalance: releasedCommission.amount,
          totalCommissionEarned: releasedCommission.amount
        }
      },
      { new: true, session }
    );

    if (!updatedUser) {
      throw new Error('Unable to release pending commission');
    }

    await Transaction.create([{
      user: userId,
      type: 'credit',
      amount: releasedCommission.amount,
      reason: transactionReasonForCommission(releasedCommission.commissionType),
      description: `Released pending level ${releasedCommission.level} commission`,
      reference: releasedCommission._id,
      referenceModel: 'Commission',
      balanceBefore: updatedUser.walletBalance - releasedCommission.amount,
      balanceAfter: updatedUser.walletBalance
    }], { session });

    releasedCount += 1;
    releasedAmount += releasedCommission.amount;
  }

  return { releasedCount, releasedAmount };
}
