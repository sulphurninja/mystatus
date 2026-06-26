import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SubAdmin from '@/models/SubAdmin';
import { authenticateRequest } from '@/middleware/auth';
import { normalizePermissions } from '@/lib/adminPermissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subAdminId: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    await connectToDatabase();
    const { subAdminId } = await params;
    const { name, email, password, phone, profileImage, permissions, isActive } = await request.json();
    const cleanPermissions = normalizePermissions(permissions);

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    if (cleanPermissions.length === 0) {
      return NextResponse.json({ success: false, message: 'Select at least one permission' }, { status: 400 });
    }

    const subAdmin = await SubAdmin.findById(subAdminId).select('+password');

    if (!subAdmin) {
      return NextResponse.json({ success: false, message: 'Sub-admin not found' }, { status: 404 });
    }

    subAdmin.name = name.trim();
    subAdmin.email = email.trim().toLowerCase();
    subAdmin.phone = phone?.trim() || undefined;
    subAdmin.profileImage = profileImage?.trim() || undefined;
    subAdmin.permissions = cleanPermissions;
    subAdmin.isActive = isActive !== false;
    if (password) {
      subAdmin.password = password;
    }

    await subAdmin.save();

    return NextResponse.json({
      success: true,
      message: 'Sub-admin profile updated successfully',
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
    console.error('Update sub-admin error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Sub-admin with this email already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subAdminId: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    await connectToDatabase();
    const { subAdminId } = await params;
    const subAdmin = await SubAdmin.findByIdAndDelete(subAdminId);

    if (!subAdmin) {
      return NextResponse.json({ success: false, message: 'Sub-admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Sub-admin deleted successfully' });
  } catch (error: any) {
    console.error('Delete sub-admin error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
