import connectToDatabase from '../lib/mongodb';
import ActivationKey from '../models/ActivationKey';

function generateKey(): string {
  let key = Math.random().toString(36).substring(2, 10).toUpperCase();
  // Ensure exactly 8 characters
  while (key.length < 8) {
    key += Math.random().toString(36).substring(2, 3).toUpperCase();
  }
  return key.substring(0, 8);
}

async function generateKeys() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Generate 50 test keys
    const keys = [];
    for (let i = 0; i < 50; i++) {
      keys.push({
        key: generateKey(),
        price: 2000, // Default price
        isForSale: true,
        createdBy: null // System generated
      });
    }

    await ActivationKey.insertMany(keys);
    console.log('Generated 50 activation keys for marketplace');

    process.exit(0);
  } catch (error) {
    console.error('Error generating keys:', error);
    process.exit(1);
  }
}

generateKeys();
