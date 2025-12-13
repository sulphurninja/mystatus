import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email, phone, profileImage, referralCode } = body;
    
    console.log('📝 Registration attempt:', { name, email, phone, referralCode });

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    // Referral code is mandatory
    if (!referralCode || !referralCode.trim()) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required. Ask a friend who uses MyStatus for their code.' },
        { status: 400 }
      );
    }

    // Find referrer - referral code is required
    const searchCode = referralCode.toUpperCase();
    console.log('🔍 Searching for referrer with code:', searchCode);
    
    const referrer = await User.findOne({ referralCode: searchCode });
    console.log('👤 Referrer found:', referrer ? { id: referrer._id, name: referrer.name, code: referrer.referralCode } : 'NOT FOUND');

    if (!referrer) {
      console.log('❌ Invalid referral code:', searchCode);
      return NextResponse.json(
        { success: false, message: `Invalid referral code "${searchCode}". Please check and try again.` },
        { status: 400 }
      );
    }

    // Generate token first (before transaction)
    const token = generateToken('temp', 'user'); // We'll update this after user creation

    // Start transaction for user creation and commission processing
    const dbSession = await mongoose.startSession();

    try {
      await dbSession.startTransaction();

      // Generate unique referral code for new user
      let referralCodeGenerated;
      do {
        referralCodeGenerated = Math.random().toString(36).substring(2, 8).toUpperCase();
      } while (await User.findOne({ referralCode: referralCodeGenerated }).session(dbSession));

      // Create user (without activation key - user will add it during withdrawal)
      const user = await User.create([{
        name: name.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
        profileImage,
        referredBy: referrer?._id,
        referralCode: referralCodeGenerated,
        referralLevel: 1
      }], { session: dbSession });

      // Update referrer's stats if referrer exists (NO commissions on registration - commissions are paid on key activation)
      if (referrer) {
        await User.findByIdAndUpdate(referrer._id, {
          $inc: {
            totalReferrals: 1,
            activeReferrals: 1
          }
        }, { session: dbSession });
      }

      // Commit transaction
      await dbSession.commitTransaction();

      // Generate proper token with user ID
      const finalToken = generateToken(user[0]._id.toString(), 'user');

      console.log('✅ User registered successfully:', { id: user[0]._id, name: user[0].name, referralCode: user[0].referralCode });

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user[0]._id,
            name: user[0].name,
            email: user[0].email,
            phone: user[0].phone,
            referralCode: user[0].referralCode,
            profileImage: user[0].profileImage,
            walletBalance: user[0].walletBalance
          },
          token: finalToken
        }
      });

    } catch (error) {
      // Abort transaction on error
      try {
        await dbSession.abortTransaction();
      } catch (abortError) {
        // Ignore abort errors if transaction was already committed
      }
      throw error;
    } finally {
      dbSession.endSession();
    }

  } catch (error: any) {
    console.error('❌ User registration error:', error);
    console.error('Error details:', { code: error.code, message: error.message, stack: error.stack });

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      console.log('Duplicate key error on field:', field);
      return NextResponse.json(
        { success: false, message: `User with this ${field} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

