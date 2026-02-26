import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/middleware/auth';
import { calculateWithdrawalCharges } from '@/lib/withdrawalCharges';

// GET - Get all withdrawal requests (admin)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Verify admin token
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }

    const total = await WithdrawalRequest.countDocuments(query);
    const withdrawalRequests = await WithdrawalRequest.find(query)
      .populate('user', 'name email phone referralCode walletBalance')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: withdrawalRequests.map(req => {
          const computed = calculateWithdrawalCharges(req.amount);
          return {
            id: req._id,
            user: req.user,
            amount: req.amount,
            tdsRate: req.tdsRate ?? computed.tdsRate,
            adminRate: req.adminRate ?? computed.adminRate,
            tdsAmount: req.tdsAmount ?? computed.tdsAmount,
            adminCharge: req.adminCharge ?? computed.adminAmount,
            totalDeduction: req.totalDeduction ?? computed.totalDeduction,
            netAmount: req.netAmount ?? computed.netAmount,
            activationKey: req.activationKey,
            status: req.status,
            requestedAt: req.requestedAt,
            processedAt: req.processedAt,
            rejectionReason: req.rejectionReason,
            paymentDetails: req.paymentDetails
          };
        }),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          pending: await WithdrawalRequest.countDocuments({ status: 'pending' }),
          approved: await WithdrawalRequest.countDocuments({ status: 'approved' }),
          rejected: await WithdrawalRequest.countDocuments({ status: 'rejected' })
        }
      }
    });
  } catch (error: any) {
    console.error('Get withdrawal requests error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}