// Script to remove duplicate pending shares
// Keep only the oldest pending share for each user-advertisement pair

const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mystatus';

async function cleanupDuplicateShares() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Share = mongoose.connection.collection('shares');

    // Find all pending shares
    const pendingShares = await Share.find({ status: 'pending' }).toArray();
    console.log(`📊 Found ${pendingShares.length} pending shares`);

    // Group by user + advertisement
    const groupedShares = {};
    pendingShares.forEach(share => {
      const key = `${share.user}_${share.advertisement}`;
      if (!groupedShares[key]) {
        groupedShares[key] = [];
      }
      groupedShares[key].push(share);
    });

    // Find duplicates
    let totalDuplicates = 0;
    const duplicatesToDelete = [];

    for (const key in groupedShares) {
      const shares = groupedShares[key];
      if (shares.length > 1) {
        console.log(`\n🔍 Found ${shares.length} duplicate shares for ${key}`);
        
        // Sort by creation date (oldest first)
        shares.sort((a, b) => new Date(a.createdAt || a.sharedAt) - new Date(b.createdAt || b.sharedAt));
        
        // Keep the first (oldest), delete the rest
        const toKeep = shares[0];
        const toDelete = shares.slice(1);
        
        console.log(`  ✅ Keeping: ${toKeep._id} (created: ${toKeep.createdAt || toKeep.sharedAt})`);
        toDelete.forEach(share => {
          console.log(`  ❌ Deleting: ${share._id} (created: ${share.createdAt || share.sharedAt})`);
          duplicatesToDelete.push(share._id);
        });
        
        totalDuplicates += toDelete.length;
      }
    }

    if (duplicatesToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${duplicatesToDelete.length} duplicate shares...`);
      const result = await Share.deleteMany({
        _id: { $in: duplicatesToDelete }
      });
      console.log(`✅ Deleted ${result.deletedCount} duplicate shares`);
    } else {
      console.log('\n✅ No duplicates found!');
    }

    console.log('\n📊 Summary:');
    console.log(`  - Total pending shares before: ${pendingShares.length}`);
    console.log(`  - Duplicates removed: ${totalDuplicates}`);
    console.log(`  - Remaining pending shares: ${pendingShares.length - totalDuplicates}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDuplicateShares();
