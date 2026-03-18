import mongoose from 'mongoose';
import User from '@/models/User';

export async function awardStarsForFirstActivation(
  userId: string | mongoose.Types.ObjectId,
  session: mongoose.ClientSession
) {
  const user = await User.findById(userId).session(session);
  if (!user || user.activationStarsAwarded) {
    return;
  }

  await User.findByIdAndUpdate(
    user._id,
    {
      $inc: { starRating: 1 },
      $set: { activationStarsAwarded: true }
    },
    { session }
  );

  if (user.referredBy) {
    await User.findByIdAndUpdate(
      user.referredBy,
      { $inc: { starRating: 2 } },
      { session }
    );
  }
}
