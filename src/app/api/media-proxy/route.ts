import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';
import { detectAdMediaType, guessFilenameFromUrl, mimeFromMediaType } from '@/lib/adMedia';

const ALLOWED_HOST_SUFFIXES = [
  'res.cloudinary.com',
  'cloudinary.com',
];

function isAllowedMediaUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

/**
 * Authenticated proxy so the Web Share API can attach ad media as a File
 * even when the CDN blocks cross-origin fetch from the browser.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['user', 'admin', 'sub-admin', 'vendor']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const url = request.nextUrl.searchParams.get('url') || '';
    if (!url || !isAllowedMediaUrl(url)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or disallowed media URL' },
        { status: 400 }
      );
    }

    const upstream = await fetch(url, {
      headers: { Accept: 'image/*,video/*,*/*' },
      cache: 'force-cache',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, message: `Upstream media fetch failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const mediaType = detectAdMediaType(url, upstream.headers.get('content-type'));
    const filename = guessFilenameFromUrl(url, mediaType);
    const contentType =
      upstream.headers.get('content-type') || mimeFromMediaType(mediaType, filename);
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Media-Type': mediaType,
        'X-Filename': filename,
      },
    });
  } catch (error: any) {
    console.error('Media proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to proxy media', error: error.message },
      { status: 500 }
    );
  }
}
