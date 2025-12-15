import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
import { authenticateRequest } from '@/middleware/auth';

// Get available keys for assignment (unused keys that are for sale)
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

    // Find keys that are:
    // - Not used yet (isUsed: false)
    // - Available for sale (isForSale: true)
    const keys = await ActivationKey.find({
      isUsed: false,
      isForSale: true
    })
      .select('_id key price')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      keys: keys
    });
  } catch (error: any) {
    console.error('Get available keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

