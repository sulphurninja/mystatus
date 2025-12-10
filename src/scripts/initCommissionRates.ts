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

    // Production-ready MLM commission structure - simplified flat commission system
    const defaultRates = [
      {
        level: 1,
        referralBonus: 500, // ₹500 fixed bonus for direct referral
        levelBonus: 0, // No longer used - simplified to flat amounts
        keyPurchaseBonus: 0, // No longer used - simplified to flat amounts
        isActive: true
      },
      {
        level: 2,
        referralBonus: 300, // ₹300 fixed bonus for level 2 referrals
        levelBonus: 0,
        keyPurchaseBonus: 0,
        isActive: true
      },
      {
        level: 3,
        referralBonus: 200, // ₹200 fixed bonus for level 3 referrals
        levelBonus: 0,
        keyPurchaseBonus: 0,
        isActive: true
      },
      {
        level: 4,
        referralBonus: 100, // ₹100 fixed bonus for level 4 referrals
        levelBonus: 0,
        keyPurchaseBonus: 0,
        isActive: true
      },
      {
        level: 5,
        referralBonus: 50, // ₹50 fixed bonus for level 5 referrals
        levelBonus: 0,
        keyPurchaseBonus: 0,
        isActive: true
      },
      {
        level: 6,
        referralBonus: 50, // ₹50 fixed bonus for level 6 referrals
        levelBonus: 0,
        keyPurchaseBonus: 0,
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
