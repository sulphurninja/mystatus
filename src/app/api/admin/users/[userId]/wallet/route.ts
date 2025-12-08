import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { authenticateRequest } from '@/middleware/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { userId } = await params;
    const { amount, reason, description } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's wallet balance
    const previousBalance = user.walletBalance;
    const newBalance = previousBalance + amount;

    await User.findByIdAndUpdate(userId, {
      walletBalance: newBalance
    });

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'credit',
      amount: amount,
      reason: reason || 'admin_credit',
      description: description || `Admin credited ₹${amount}`,
      balanceBefore: previousBalance,
      balanceAfter: newBalance
    });

    return NextResponse.json({
      success: true,
      message: `₹${amount} successfully added to ${user.name}'s wallet`,
      data: {
        previousBalance,
        newBalance,
        amount
      }
    });

  } catch (error: any) {
    console.error('Admin wallet credit error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
