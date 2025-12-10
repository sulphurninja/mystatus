import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CommissionRate from '@/models/CommissionRate';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const rates = await CommissionRate.find({}).sort({ level: 1 });

    return NextResponse.json({
      success: true,
      data: rates
    });

  } catch (error: any) {
    console.error('Get commission rates error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const rates = await request.json();

    // Validate rates array
    if (!Array.isArray(rates)) {
      return NextResponse.json(
        { success: false, message: 'Rates must be an array' },
        { status: 400 }
      );
    }

    // Validate each rate object
    for (const rate of rates) {
      if (!rate.level || rate.level < 1 || rate.level > 6) {
        return NextResponse.json(
          { success: false, message: `Invalid level: ${rate.level}. Must be between 1-6` },
          { status: 400 }
        );
      }
      if (rate.referralBonus < 0 || rate.levelBonus < 0 || rate.keyPurchaseBonus < 0) {
        return NextResponse.json(
          { success: false, message: 'Commission rates cannot be negative' },
          { status: 400 }
        );
      }
      if (rate.levelBonus > 100 || rate.keyPurchaseBonus > 100) {
        return NextResponse.json(
          { success: false, message: 'Percentage rates cannot exceed 100%' },
          { status: 400 }
        );
      }
    }

    // Clear existing rates
    await CommissionRate.deleteMany({});

    // Insert new rates
    const newRates = await CommissionRate.insertMany(rates);

    return NextResponse.json({
      success: true,
      message: 'Commission rates updated successfully',
      data: newRates
    });

  } catch (error: any) {
    console.error('Update commission rates error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Initialize default commission rates (for first-time setup)
export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    // Check if rates already exist
    const existingRates = await CommissionRate.countDocuments();
    if (existingRates > 0) {
      return NextResponse.json(
        { success: false, message: 'Commission rates already exist. Use POST to update.' },
        { status: 400 }
      );
    }

    // Default production-ready rates
    const defaultRates = [
      { level: 1, referralBonus: 500, levelBonus: 5, keyPurchaseBonus: 5, isActive: true },
      { level: 2, referralBonus: 0, levelBonus: 4, keyPurchaseBonus: 4, isActive: true },
      { level: 3, referralBonus: 0, levelBonus: 3, keyPurchaseBonus: 3, isActive: true },
      { level: 4, referralBonus: 0, levelBonus: 2, keyPurchaseBonus: 2, isActive: true },
      { level: 5, referralBonus: 0, levelBonus: 1, keyPurchaseBonus: 1, isActive: true },
      { level: 6, referralBonus: 0, levelBonus: 0.5, keyPurchaseBonus: 0.5, isActive: true },
    ];

    const newRates = await CommissionRate.insertMany(defaultRates);

    return NextResponse.json({
      success: true,
      message: 'Default commission rates initialized successfully',
      data: newRates
    });

  } catch (error: any) {
    console.error('Initialize commission rates error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}


