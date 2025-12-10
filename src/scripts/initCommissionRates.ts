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

    // Production-ready MLM commission structure
    const defaultRates = [
      {
        level: 1,
        referralBonus: 500, // ₹500 fixed bonus for direct referral
        levelBonus: 5, // 5% from level 1 network activities
        keyPurchaseBonus: 5, // 5% when level 1 referrals buy keys
        isActive: true
      },
      {
        level: 2,
        referralBonus: 0, // No direct referral bonus for level 2+
        levelBonus: 4, // 4% from level 2 network activities (₹20 from ₹500 referral)
        keyPurchaseBonus: 4, // 4% when level 2 referrals buy keys
        isActive: true
      },
      {
        level: 3,
        referralBonus: 0,
        levelBonus: 3, // 3% from level 3 network activities (₹15 from ₹500 referral)
        keyPurchaseBonus: 3, // 3% when level 3 referrals buy keys
        isActive: true
      },
      {
        level: 4,
        referralBonus: 0,
        levelBonus: 2, // 2% from level 4 network activities (₹10 from ₹500 referral)
        keyPurchaseBonus: 2, // 2% when level 4 referrals buy keys
        isActive: true
      },
      {
        level: 5,
        referralBonus: 0,
        levelBonus: 1, // 1% from level 5 network activities (₹5 from ₹500 referral)
        keyPurchaseBonus: 1, // 1% when level 5 referrals buy keys
        isActive: true
      },
      {
        level: 6,
        referralBonus: 0,
        levelBonus: 0.5, // 0.5% from deepest level (₹2.50 from ₹500 referral)
        keyPurchaseBonus: 0.5, // 0.5% when level 6 referrals buy keys
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
