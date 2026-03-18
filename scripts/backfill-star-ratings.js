const mongoose = require('mongoose');

function getMongoUri() {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error('MONGODB_URI is not set');
  }

  return rawUri.trim().replace(/`+$/, '');
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const mongoUri = getMongoUri();

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
  });

  const userCollection = mongoose.connection.collection('users');
  const activationKeyCollection = mongoose.connection.collection('activationkeys');

  const [users, activatedByKeyField, activatedByUsage] = await Promise.all([
    userCollection
      .find({}, { projection: { _id: 1, referredBy: 1, activationKey: 1 } })
      .toArray(),
    userCollection
      .find(
        { activationKey: { $exists: true, $nin: [null, ''] } },
        { projection: { _id: 1 } }
      )
      .toArray(),
    activationKeyCollection
      .find(
        { usedBy: { $exists: true, $ne: null } },
        { projection: { usedBy: 1 } }
      )
      .toArray(),
  ]);

  const activatedUserIds = new Set();

  for (const user of activatedByKeyField) {
    activatedUserIds.add(String(user._id));
  }

  for (const key of activatedByUsage) {
    if (key.usedBy) {
      activatedUserIds.add(String(key.usedBy));
    }
  }

  const starByUserId = new Map();
  const activationAwardByUserId = new Map();

  for (const user of users) {
    const userId = String(user._id);
    const isActivated = activatedUserIds.has(userId);

    starByUserId.set(userId, 0);
    activationAwardByUserId.set(userId, isActivated);
  }

  for (const user of users) {
    const userId = String(user._id);
    const isActivated = activatedUserIds.has(userId);

    if (!isActivated) {
      continue;
    }

    starByUserId.set(userId, (starByUserId.get(userId) || 0) + 1);

    const referrerId = user.referredBy ? String(user.referredBy) : null;
    if (referrerId && referrerId !== userId && starByUserId.has(referrerId)) {
      starByUserId.set(referrerId, (starByUserId.get(referrerId) || 0) + 2);
    }
  }

  const operations = users.map((user) => {
    const userId = String(user._id);

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            starRating: starByUserId.get(userId) || 0,
            activationStarsAwarded: activationAwardByUserId.get(userId) || false,
          },
        },
      },
    };
  });

  const totalActivatedUsers = Array.from(activationAwardByUserId.values()).filter(Boolean).length;
  const totalStarsAssigned = Array.from(starByUserId.values()).reduce((sum, stars) => sum + stars, 0);

  console.log(`Users scanned: ${users.length}`);
  console.log(`Activated users found: ${totalActivatedUsers}`);
  console.log(`Total stars to assign: ${totalStarsAssigned}`);

  if (isDryRun) {
    console.log('Dry run only. No database changes were made.');
    return;
  }

  if (operations.length > 0) {
    const result = await userCollection.bulkWrite(operations, { ordered: false });
    console.log(`Matched users: ${result.matchedCount}`);
    console.log(`Modified users: ${result.modifiedCount}`);
  } else {
    console.log('No users found to update.');
  }
}

main()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Star rating backfill completed.');
  })
  .catch(async (error) => {
    console.error('Star rating backfill failed:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
