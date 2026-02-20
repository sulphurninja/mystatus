import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Package from '@/models/Package';
import { authenticateRequest } from '@/middleware/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();
    const { packageId } = await params;
    const updates = await request.json();

    const pkg = await Package.findByIdAndUpdate(packageId, updates, { new: true, runValidators: true });

    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package updated successfully',
      package: pkg
    });
  } catch (error: any) {
    console.error('Update package error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ packageId: string }> }) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();
    const { packageId } = await params;

    const pkg = await Package.findByIdAndDelete(packageId);

    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete package error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
