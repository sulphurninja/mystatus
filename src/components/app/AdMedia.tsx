'use client';

import { isVideoMedia } from '@/lib/adMedia';

export default function AdMedia({
  src,
  alt,
  mediaType,
  className = 'w-full h-full object-cover',
  controls = true,
}: {
  src?: string | null;
  alt: string;
  mediaType?: string | null;
  className?: string;
  controls?: boolean;
}) {
  if (!src) return null;

  if (isVideoMedia(src, mediaType)) {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        playsInline
        muted
        loop
        preload="metadata"
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
