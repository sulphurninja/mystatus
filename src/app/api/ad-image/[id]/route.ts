import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import { authenticateRequest } from '@/middleware/auth';

/**
 * Proxies the ad's image from Cloudinary server-side.
 * Avoids CORS so the client can fetch and create a File for sharing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request, ['user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { id } = await params;

    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid advertisement ID' },
        { status: 400 }
      );
    }

    const advertisement = await Advertisement.findById(id);

    if (!advertisement || !advertisement.image) {
      return NextResponse.json(
        { success: false, message: 'Advertisement not found or has no image' },
        { status: 404 }
      );
    }

    if (!advertisement.isActive) {
      return NextResponse.json(
        { success: false, message: 'Advertisement is no longer active' },
        { status: 404 }
      );
    }

    const imageUrl = advertisement.image;
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch image' },
        { status: 502 }
      );
    }

    const blob = await imageResponse.blob();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(advertisement.title)}.jpg"`,
      },
    });
  } catch (error: unknown) {
    console.error('Ad image proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load image' },
      { status: 500 }
    );
  }
}
