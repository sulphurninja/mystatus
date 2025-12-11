import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  console.log('🔐 LOGIN API CALLED');
  
  try {
    console.log('📡 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');

    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    const { activationKey } = body;
    console.log('🔑 Activation key received:', activationKey);

    if (!activationKey) {
      console.log('❌ No activation key provided');
      return NextResponse.json(
        { success: false, message: 'Activation key is required' },
        { status: 400 }
      );
    }

    const searchKey = activationKey.toUpperCase();
    console.log('🔍 Searching for user with activation key:', searchKey);
    
    // Find user by activation key
    const user = await User.findOne({ activationKey: searchKey });
    console.log('👤 User found:', user ? { id: user._id, name: user.name, activationKey: user.activationKey } : 'NULL');

    if (!user) {
      // Debug: List all users with their activation keys
      const allUsers = await User.find({}, { name: 1, activationKey: 1 }).limit(10);
      console.log('📋 Sample users in DB:', allUsers.map(u => ({ name: u.name, activationKey: u.activationKey })));
      
      console.log('❌ No user found with this activation key');
      return NextResponse.json(
        { success: false, message: 'Invalid activation key' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user._id.toString(), 'user');
    console.log('🎫 Token generated successfully');

    console.log('✅ Login successful for user:', user.name);
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          activationKey: user.activationKey,
          referralCode: user.referralCode,
          profileImage: user.profileImage,
          walletBalance: user.walletBalance
        },
        token
      }
    });

  } catch (error: any) {
    console.error('❌ User login error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
