import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import KeyTier from '@/models/KeyTier';
import { verifyToken, getTokenFromRequest } from '@/middleware/auth';

// GET - Get all key tiers
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const tiers = await KeyTier.find().sort({ minPrice: 1 });

    return NextResponse.json({
      success: true,
      data: tiers
    });
  } catch (error: any) {
    console.error('Get key tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update key tiers
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const tiers = await request.json();

    if (!Array.isArray(tiers)) {
      return NextResponse.json(
        { success: false, message: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Validate tiers
    for (const tier of tiers) {
      if (!tier.name || tier.minPrice === undefined || tier.maxPrice === undefined) {
        return NextResponse.json(
          { success: false, message: 'Each tier must have name, minPrice, and maxPrice' },
          { status: 400 }
        );
      }
      if (tier.minPrice > tier.maxPrice) {
        return NextResponse.json(
          { success: false, message: `Invalid price range for tier "${tier.name}"` },
          { status: 400 }
        );
      }
    }

    // Delete all existing tiers and insert new ones
    await KeyTier.deleteMany({});
    
    const createdTiers = await KeyTier.insertMany(tiers.map(tier => ({
      name: tier.name,
      minPrice: tier.minPrice,
      maxPrice: tier.maxPrice,
      commissions: {
        level1: tier.commissions?.level1 || 0,
        level2: tier.commissions?.level2 || 0,
        level3: tier.commissions?.level3 || 0,
        level4: tier.commissions?.level4 || 0,
        level5: tier.commissions?.level5 || 0,
        level6: tier.commissions?.level6 || 0
      },
      isActive: tier.isActive !== false
    })));

    return NextResponse.json({
      success: true,
      message: 'Key tiers saved successfully',
      data: createdTiers
    });
  } catch (error: any) {
    console.error('Save key tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Initialize default key tiers
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Default tiers
    const defaultTiers = [
      {
        name: 'Standard',
        minPrice: 0,
        maxPrice: 5000,
        commissions: {
          level1: 500,
          level2: 300,
          level3: 200,
          level4: 100,
          level5: 50,
          level6: 50
        },
        isActive: true
      },
      {
        name: 'Premium',
        minPrice: 5001,
        maxPrice: 15000,
        commissions: {
          level1: 1500,
          level2: 900,
          level3: 600,
          level4: 300,
          level5: 150,
          level6: 150
        },
        isActive: true
      },
      {
        name: 'VIP',
        minPrice: 15001,
        maxPrice: 50000,
        commissions: {
          level1: 5000,
          level2: 3000,
          level3: 2000,
          level4: 1000,
          level5: 500,
          level6: 500
        },
        isActive: true
      }
    ];

    // Check if tiers already exist
    const existingCount = await KeyTier.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Key tiers already exist. Delete them first to re-initialize.'
      }, { status: 400 });
    }

    const createdTiers = await KeyTier.insertMany(defaultTiers);

    return NextResponse.json({
      success: true,
      message: 'Default key tiers initialized successfully',
      data: createdTiers
    });
  } catch (error: any) {
    console.error('Initialize key tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

