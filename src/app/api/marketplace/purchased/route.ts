import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
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

    // Get keys that this user has purchased, used, or owns
    const purchasedKeys = await ActivationKey.find({
      $or: [
        { purchasedBy: auth.user!.id }, // Keys purchased by this user from marketplace
        { usedBy: auth.user!.id }, // Keys used by this user
        { createdBy: auth.user!.id, isForSale: false }, // Keys created by this user that are no longer for sale
        { soldBy: auth.user!.id } // Keys sold by this user (they sold these keys to others)
      ]
    })
      .populate('soldBy', 'name')
      .populate('usedBy', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: purchasedKeys.map(key => ({
        id: key._id,
        key: key.key,
        price: key.price,
        isUsed: key.isUsed,
        soldAt: key.soldAt,
        usedAt: key.usedAt,
        soldBy: key.soldBy ? {
          id: key.soldBy._id,
          name: key.soldBy.name
        } : null,
        usedBy: key.usedBy ? {
          id: key.usedBy._id,
          name: key.usedBy.name
        } : null,
        createdBy: key.createdBy ? {
          id: key.createdBy._id,
          name: key.createdBy.name
        } : null,
        status: getKeyStatus(key)
      }))
    });

  } catch (error: any) {
    console.error('Get purchased keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

function getKeyStatus(key: any) {
  if (key.isUsed) {
    return key.usedBy ? 'used_by_me' : 'used';
  }
  if (key.purchasedBy) {
    return 'purchased';
  }
  if (key.soldBy) {
    return 'sold_by_me';
  }
  return 'available';
}
