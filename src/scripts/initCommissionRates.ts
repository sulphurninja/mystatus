import connectToDatabase from '../lib/mongodb';
import CommissionRate from '../models/CommissionRate';

async function initCommissionRates() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Check if rates already exist
    const existingRates = await CommissionRate.countDocuments();
    if (existingRates > 0) {
      console.log('Commission rates already initialized');
      return;
    }

    // Default MLM commission structure
    const defaultRates = [
      {
        level: 1,
        referralBonus: 500, // Fixed amount for direct referral
        levelBonus: 5, // 5% from level 1 activities
        keyPurchaseBonus: 5, // 5% when level 1 referrals buy keys
        isActive: true
      },
      {
        level: 2,
        referralBonus: 0, // No direct referral bonus for level 2+
        levelBonus: 4, // 4% from level 2 activities
        keyPurchaseBonus: 4, // 4% when level 2 referrals buy keys
        isActive: true
      },
      {
        level: 3,
        referralBonus: 0,
        levelBonus: 3,
        keyPurchaseBonus: 3,
        isActive: true
      },
      {
        level: 4,
        referralBonus: 0,
        levelBonus: 2,
        keyPurchaseBonus: 2,
        isActive: true
      },
      {
        level: 5,
        referralBonus: 0,
        levelBonus: 1,
        keyPurchaseBonus: 1,
        isActive: true
      },
      {
        level: 6,
        referralBonus: 0,
        levelBonus: 0.5, // 0.5% from deepest level
        keyPurchaseBonus: 0.5,
        isActive: true
      }
    ];

    await CommissionRate.insertMany(defaultRates);
    console.log('Commission rates initialized successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing commission rates:', error);
    process.exit(1);
  }
}

initCommissionRates();
