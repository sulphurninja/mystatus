import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/middleware/auth';
import connectToDatabase from '@/lib/mongodb';
import SubAdmin from '@/models/SubAdmin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Simple admin check - in production, create a proper Admin model
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mystatus.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email !== adminEmail || password !== adminPassword) {
      await connectToDatabase();

      const subAdmin = await SubAdmin.findOne({
        email: email.trim().toLowerCase(),
        isActive: true
      }).select('+password');

      if (!subAdmin || !(await subAdmin.comparePassword(password))) {
        return NextResponse.json(
          { success: false, message: 'Invalid admin credentials' },
          { status: 401 }
        );
      }

      subAdmin.lastLoginAt = new Date();
      await subAdmin.save();

      const token = generateToken(subAdmin._id.toString(), 'sub-admin');

      return NextResponse.json({
        success: true,
        message: 'Sub-admin login successful',
        data: {
          admin: {
            id: subAdmin._id,
            name: subAdmin.name,
            email: subAdmin.email,
            phone: subAdmin.phone,
            profileImage: subAdmin.profileImage,
            role: 'sub-admin',
            permissions: subAdmin.permissions
          },
          token
        }
      });
    }

    // Generate token with admin type
    const token = generateToken('admin', 'admin');

    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          email: adminEmail,
          role: 'admin',
          permissions: ['*']
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
