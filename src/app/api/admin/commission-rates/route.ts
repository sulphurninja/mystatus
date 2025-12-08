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
