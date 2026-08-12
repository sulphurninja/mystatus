export type AdMediaType = 'image' | 'video';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp)(\?|$)/i;

/** Infer media type from URL or MIME (Cloudinary video URLs often contain /video/upload/). */
export function detectAdMediaType(url?: string | null, mimeOrHint?: string | null): AdMediaType {
  const hint = (mimeOrHint || '').toLowerCase();
  if (hint.startsWith('video/') || hint === 'video') return 'video';
  if (hint.startsWith('image/') || hint === 'image') return 'image';

  const value = url || '';
  if (!value) return 'image';

  if (VIDEO_EXT.test(value) || /\/video\/upload\//i.test(value) || value.includes('resource_type=video')) {
    return 'video';
  }
  if (IMAGE_EXT.test(value) || /\/image\/upload\//i.test(value)) {
    return 'image';
  }

  return 'image';
}

export function isVideoMedia(url?: string | null, mediaType?: string | null): boolean {
  return detectAdMediaType(url, mediaType) === 'video';
}

export function guessFilenameFromUrl(url: string, mediaType: AdMediaType): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop() || `ad-media.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
    if (/\.[a-z0-9]+$/i.test(base)) return base;
    return `${base}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
  } catch {
    return mediaType === 'video' ? 'ad-media.mp4' : 'ad-media.jpg';
  }
}

export function mimeFromMediaType(mediaType: AdMediaType, filename?: string): string {
  const lower = (filename || '').toLowerCase();
  if (mediaType === 'video') {
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}
