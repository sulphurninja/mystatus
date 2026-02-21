import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Package from '@/models/Package';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });

    return NextResponse.json({
      success: true,
      data: packages.map(pkg => ({
        id: pkg._id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        adLimit: pkg.adLimit
      }))
    });
  } catch (error: any) {
    console.error('Get vendor packages error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
