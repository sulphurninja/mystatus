import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
import { authenticateRequest } from '@/middleware/auth';
import mongoose from 'mongoose';

// GET /api/admin/activation-keys - Get all activation keys
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const skip = (page - 1) * limit;

    const [keys, total] = await Promise.all([
      ActivationKey.find()
        .populate('usedBy', 'name email')
        .populate('soldBy', 'name email')
        .populate('purchasedBy', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivationKey.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      keys: keys.map(key => ({
        _id: key._id,
        key: key.key,
        isUsed: key.isUsed,
        usedBy: key.usedBy ? {
          name: key.usedBy.name,
          email: key.usedBy.email
        } : null,
        usedAt: key.usedAt,
        price: key.price,
        isForSale: key.isForSale,
        soldBy: key.soldBy ? {
          name: key.soldBy.name,
          email: key.soldBy.email
        } : null,
        soldAt: key.soldAt,
        purchasedBy: key.purchasedBy ? {
          name: key.purchasedBy.name,
          email: key.purchasedBy.email
        } : null,
        purchasedAt: key.purchasedAt,
        createdBy: key.createdBy ? {
          name: key.createdBy.name,
          email: key.createdBy.email
        } : null,
        createdAt: key.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
        pages: Math.max(1, Math.ceil(total / limit) || 1),
      }
    });

  } catch (error: any) {
    console.error('Get activation keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/activation-keys - Generate new activation keys
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

    const { count = 10, price = 2000, isForSale = true } = await request.json();
    const createdBy =
      auth.user?.id && mongoose.Types.ObjectId.isValid(auth.user.id)
        ? new mongoose.Types.ObjectId(auth.user.id)
        : undefined;

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { success: false, message: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { success: false, message: 'Price must be non-negative' },
        { status: 400 }
      );
    }

    const keys = [];
    for (let i = 0; i < count; i++) {
      // Generate a unique 8 character alphanumeric key
      let key;
      do {
        key = Math.random().toString(36).substring(2, 10).toUpperCase();
        // Ensure exactly 8 characters
        while (key.length < 8) {
          key += Math.random().toString(36).substring(2, 3).toUpperCase();
        }
        key = key.substring(0, 8);
      } while (await ActivationKey.findOne({ key }));

      keys.push({
        key,
        price,
        isForSale,
        createdBy
      });
    }

    const createdKeys = await ActivationKey.insertMany(keys);

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${count} activation keys`,
      data: createdKeys.map(key => ({
        _id: key._id,
        key: key.key,
        isUsed: key.isUsed,
        createdAt: key.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Generate activation keys error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Duplicate key generated. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
