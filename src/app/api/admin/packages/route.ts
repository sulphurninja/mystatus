import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Package from '@/models/Package';
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

    const packages = await Package.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      packages
    });
  } catch (error: any) {
    console.error('Get packages error:', error);
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

    const { name, description, price, adLimit } = await request.json();

    if (!name || price === undefined || !adLimit) {
      return NextResponse.json(
        { success: false, message: 'Name, price, and ad limit are required' },
        { status: 400 }
      );
    }

    const pkg = await Package.create({
      name: name.trim(),
      description: description?.trim() || '',
      price,
      adLimit
    });

    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      package: pkg
    });
  } catch (error: any) {
    console.error('Create package error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
