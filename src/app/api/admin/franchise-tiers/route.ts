import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import FranchiseKeyTier from '@/models/FranchiseKeyTier';
import { verifyToken, getTokenFromRequest } from '@/middleware/auth';

function buildDailyCommissions(input: any) {
  const dailyCommissions: Record<string, number> = {};
  for (let level = 1; level <= 30; level++) {
    const key = `level${level}`;
    dailyCommissions[key] = Math.max(0, Number(input?.[key] || 0));
  }
  return dailyCommissions;
}

function buildDefaultDailyCommissions(multiplier: number) {
  const base = [
    50, 25, 15, 12, 10, 8, 6, 5, 5, 4,
    4, 3, 3, 3, 3, 2, 2, 2, 2, 2,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
  ];
  const dailyCommissions: Record<string, number> = {};
  for (let level = 1; level <= 30; level++) {
    const key = `level${level}`;
    dailyCommissions[key] = Math.round(base[level - 1] * multiplier);
  }
  return dailyCommissions;
}

// GET - Get all franchise key tiers
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

    const tiers = await FranchiseKeyTier.find().sort({ minPrice: 1 });

    return NextResponse.json({
      success: true,
      data: tiers
    });
  } catch (error: any) {
    console.error('Get franchise tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update franchise key tiers
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

    await FranchiseKeyTier.deleteMany({});

    const createdTiers = await FranchiseKeyTier.insertMany(tiers.map(tier => ({
      name: tier.name,
      minPrice: tier.minPrice,
      maxPrice: tier.maxPrice,
      dailyCommissions: buildDailyCommissions(tier.dailyCommissions || tier.commissions || {}),
      isActive: tier.isActive !== false
    })));

    return NextResponse.json({
      success: true,
      message: 'Franchise key tiers saved successfully',
      data: createdTiers
    });
  } catch (error: any) {
    console.error('Save franchise tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Initialize default franchise key tiers
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

    const existingCount = await FranchiseKeyTier.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Franchise tiers already exist. Delete them first to re-initialize.'
      }, { status: 400 });
    }

    const defaultTiers = [
      {
        name: 'Starter',
        minPrice: 0,
        maxPrice: 25000,
        dailyCommissions: buildDefaultDailyCommissions(1)
      },
      {
        name: 'Growth',
        minPrice: 25001,
        maxPrice: 100000,
        dailyCommissions: buildDefaultDailyCommissions(2)
      }
    ];

    const createdTiers = await FranchiseKeyTier.insertMany(defaultTiers);

    return NextResponse.json({
      success: true,
      message: 'Default franchise tiers initialized successfully',
      data: createdTiers
    });
  } catch (error: any) {
    console.error('Initialize franchise tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove all franchise key tiers
export async function DELETE(request: NextRequest) {
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

    await FranchiseKeyTier.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Franchise tiers deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete franchise tiers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
