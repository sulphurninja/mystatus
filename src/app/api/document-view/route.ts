import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_HOSTS = new Set(['res.cloudinary.com']);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fetchDocument(url: string) {
  return fetch(url, { cache: 'no-store' });
}

function buildCandidateUrls(rawUrl: string, options?: { preferPdf?: boolean }) {
  const candidates = [rawUrl];
  const preferPdf = !!options?.preferPdf;

  if (rawUrl.includes('/image/upload/')) {
    if (preferPdf) {
      candidates.push(rawUrl.replace('/image/upload/', '/raw/upload/fl_attachment:false/'));
      candidates.push(rawUrl.replace('/image/upload/', '/raw/upload/'));
    } else {
      candidates.push(rawUrl.replace('/image/upload/', '/raw/upload/'));
      candidates.push(rawUrl.replace('/image/upload/', '/raw/upload/fl_attachment:false/'));
    }
    candidates.push(rawUrl.replace('/image/upload/', '/image/upload/fl_attachment:false/'));
  }

  if (rawUrl.includes('/raw/upload/')) {
    candidates.push(rawUrl.replace('/raw/upload/', '/raw/upload/fl_attachment:false/'));
    candidates.push(rawUrl.replace('/raw/upload/', '/image/upload/'));
  }

  return [...new Set(candidates)];
}

function extractPublicIdVariants(url: URL) {
  const segments = url.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.findIndex((segment) => segment === 'upload');

  if (uploadIndex === -1) {
    return [];
  }

  const afterUpload = segments.slice(uploadIndex + 1);
  const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdParts = versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;

  if (publicIdParts.length === 0) {
    return [];
  }

  const withExtension = publicIdParts.join('/');
  const withoutExtensionParts = [...publicIdParts];
  const lastPart = withoutExtensionParts[withoutExtensionParts.length - 1] || '';
  withoutExtensionParts[withoutExtensionParts.length - 1] = lastPart.replace(/\.[^.]+$/, '');
  const withoutExtension = withoutExtensionParts.join('/');

  return [...new Set([withExtension, withoutExtension].filter(Boolean))];
}

function isLikelyPdf(url: URL) {
  const pathname = url.pathname.toLowerCase();
  return pathname.endsWith('.pdf') || pathname.includes('/bank-statement/');
}

async function resolveCloudinaryResource(parsedUrl: URL) {
  const publicIds = extractPublicIdVariants(parsedUrl);
  if (publicIds.length === 0) {
    return null;
  }

  const resourceTypes = isLikelyPdf(parsedUrl)
    ? (['raw', 'image'] as const)
    : (['image', 'raw'] as const);

  for (const publicId of publicIds) {
    for (const resourceType of resourceTypes) {
      try {
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: resourceType,
          type: 'upload'
        });

        if (resource?.public_id) {
          const resolvedUrl = cloudinary.url(resource.public_id as string, {
            resource_type: resourceType,
            type: 'upload',
            secure: true,
            ...(resourceType === 'raw' ? { flags: 'attachment:false' } : {}),
            ...(resource.format ? { format: resource.format as string } : {})
          });

          return {
            url: resolvedUrl || (resource.secure_url as string),
            contentType: resource.format === 'pdf' || resourceType === 'raw'
              ? 'application/pdf'
              : undefined
          };
        }
      } catch {
        // Try the next public id or resource type.
      }
    }
  }

  return null;
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

    const resolvedCloudinaryResource = await resolveCloudinaryResource(parsedUrl);
    const preferPdf = isLikelyPdf(parsedUrl);
    const candidateUrls = buildCandidateUrls(
      resolvedCloudinaryResource?.url || parsedUrl.toString(),
      { preferPdf }
    );
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

    const contentType =
      resolvedCloudinaryResource?.contentType ||
      response.headers.get('content-type') ||
      (preferPdf ? 'application/pdf' : 'application/octet-stream');
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
