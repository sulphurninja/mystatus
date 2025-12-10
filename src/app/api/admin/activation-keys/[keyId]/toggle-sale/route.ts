import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ActivationKey from '@/models/ActivationKey';
import { authenticateRequest } from '@/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { keyId } = await params;
    const key = await ActivationKey.findById(keyId);
    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Activation key not found' },
        { status: 404 }
      );
    }

    // Toggle the isForSale status
    key.isForSale = !key.isForSale;
    await key.save();

    return NextResponse.json({
      success: true,
      message: `Key ${key.isForSale ? 'put for sale' : 'removed from sale'}`,
      key: {
        _id: key._id,
        key: key.key,
        isForSale: key.isForSale,
      }
    });

  } catch (error: any) {
    console.error('Toggle key sale error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
