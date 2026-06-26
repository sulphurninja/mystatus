import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(request);

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    if (auth.isMainAdmin) {
      return NextResponse.json({
        success: true,
        admin: {
          id: 'admin',
          email: process.env.ADMIN_EMAIL || 'admin@mystatus.com',
          role: 'admin',
          permissions: ['*'],
        },
      });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: auth.subAdmin!._id,
        name: auth.subAdmin!.name,
        email: auth.subAdmin!.email,
        phone: auth.subAdmin!.phone,
        profileImage: auth.subAdmin!.profileImage,
        role: 'sub-admin',
        permissions: auth.subAdmin!.permissions,
        isActive: auth.subAdmin!.isActive,
      },
    });
  } catch (error: any) {
    console.error('Admin profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
