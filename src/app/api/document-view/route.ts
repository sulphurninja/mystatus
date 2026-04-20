import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set(['res.cloudinary.com']);

async function fetchDocument(url: string) {
  return fetch(url, { cache: 'no-store' });
}

function buildCandidateUrls(rawUrl: string) {
  const candidates = [rawUrl];

  if (rawUrl.includes('/image/upload/') && rawUrl.toLowerCase().endsWith('.pdf')) {
    candidates.push(rawUrl.replace('/image/upload/', '/raw/upload/'));
    candidates.push(rawUrl.replace('/image/upload/', '/raw/upload/fl_attachment:false/'));
  }

  if (rawUrl.includes('/raw/upload/') && rawUrl.toLowerCase().endsWith('.pdf')) {
    candidates.push(rawUrl.replace('/raw/upload/', '/image/upload/'));
  }

  return [...new Set(candidates)];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = (searchParams.get('url') || '').trim();

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, message: 'Document URL is required' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid document URL' },
        { status: 400 }
      );
    }

    if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return NextResponse.json(
        { success: false, message: 'Document host is not allowed' },
        { status: 403 }
      );
    }

    const candidateUrls = buildCandidateUrls(parsedUrl.toString());
    let response: Response | null = null;

    for (const candidate of candidateUrls) {
      const attempt = await fetchDocument(candidate);
      if (attempt.ok) {
        response = attempt;
        break;
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to load document' },
        { status: 404 }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const fileName = decodeURIComponent(parsedUrl.pathname.split('/').pop() || 'document');
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('Document view error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
