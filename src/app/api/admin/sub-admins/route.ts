import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SubAdmin from '@/models/SubAdmin';
import { authenticateRequest } from '@/middleware/auth';
import { normalizePermissions } from '@/lib/adminPermissions';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const [subAdmins, total] = await Promise.all([
      SubAdmin.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      SubAdmin.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      subAdmins: subAdmins.map((subAdmin) => ({
        _id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        phone: subAdmin.phone,
        profileImage: subAdmin.profileImage,
        permissions: subAdmin.permissions,
        isActive: subAdmin.isActive,
        lastLoginAt: subAdmin.lastLoginAt,
        createdAt: subAdmin.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit) || 1),
        pages: Math.max(1, Math.ceil(total / limit) || 1),
      },
    });
  } catch (error: any) {
    console.error('Get sub-admins error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    await connectToDatabase();
    const { name, email, password, phone, profileImage, permissions } = await request.json();
    const cleanPermissions = normalizePermissions(permissions);

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (cleanPermissions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Select at least one permission for this sub-admin' },
        { status: 400 }
      );
    }

    const subAdmin = await SubAdmin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone?.trim() || undefined,
      profileImage: profileImage?.trim() || undefined,
      permissions: cleanPermissions,
    });

    return NextResponse.json({
      success: true,
      message: 'Sub-admin profile created successfully',
      subAdmin: {
        _id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        phone: subAdmin.phone,
        profileImage: subAdmin.profileImage,
        permissions: subAdmin.permissions,
        isActive: subAdmin.isActive,
        createdAt: subAdmin.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create sub-admin error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Sub-admin with this email already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
