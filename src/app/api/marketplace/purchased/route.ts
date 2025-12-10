import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
import Commission from '@/models/Commission';
import User from '@/models/User';
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
      .populate('purchasedBy', 'name')
      .sort({ createdAt: -1 });

    // Get commission data for keys that led to referrals
    const keysWithCommissions = await Promise.all(
      purchasedKeys.map(async (key) => {
        let commissionInfo = null;

        // If this key was used by someone and the current user created it (sold it),
        // check if there are commissions earned from this referral
        if (key.usedBy && key.createdBy && key.createdBy._id.toString() === auth.user!.id) {
          // Find commissions earned from this referred user
          const commissions = await Commission.find({
            user: auth.user!.id,
            referredUser: key.usedBy._id
          }).sort({ createdAt: -1 });

          if (commissions.length > 0) {
            const totalCommission = commissions.reduce((sum, comm) => sum + comm.amount, 0);
            commissionInfo = {
              totalEarned: totalCommission,
              commissionCount: commissions.length,
              lastCommission: commissions[0].amount,
              lastCommissionDate: commissions[0].createdAt
            };
          }
        }

        return {
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
          purchasedBy: key.purchasedBy ? {
            id: key.purchasedBy._id,
            name: key.purchasedBy.name
          } : null,
          createdBy: key.createdBy ? {
            id: key.createdBy._id,
            name: key.createdBy.name
          } : null,
          status: getKeyStatus(key, auth.user!.id),
          commissionInfo
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: keysWithCommissions
    });

  } catch (error: any) {
    console.error('Get purchased keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

function getKeyStatus(key: any, currentUserId: string) {
  if (key.isUsed) {
    // Check if the current user is the one who used this key
    if (key.usedBy && key.usedBy._id.toString() === currentUserId) {
      return 'used_by_me';
    }
    // Key was used by someone else
    return 'used';
  }
  if (key.purchasedBy && key.purchasedBy.toString() === currentUserId) {
    return 'purchased';
  }
  if (key.soldBy && key.soldBy.toString() === currentUserId) {
    return 'sold_by_me';
  }
  return 'available';
}
