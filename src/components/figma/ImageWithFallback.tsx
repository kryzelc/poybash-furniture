'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  onClick?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  onClick,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // Fallback placeholder
  const fallbackSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23EFEBE9' width='400' height='400'/%3E%3Ctext fill='%23A1887F' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E`;

  // For external URLs or when dimensions aren't provided, use regular img tag
  const isExternal = src.startsWith('http://') || src.startsWith('https://');
  
  if (isExternal || (!fill && !width && !height)) {
    return (
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        className={className}
        onError={() => setError(true)}
        onClick={onClick}
      />
    );
  }

  // Use Next.js Image for local images with known dimensions
  return (
    <Image
      src={error ? fallbackSrc : src}
      alt={alt}
      className={className}
      width={fill ? undefined : (width || 400)}
      height={fill ? undefined : (height || 400)}
      fill={fill}
      priority={priority}
      onError={() => setError(true)}
      onClick={onClick}
      unoptimized={src.startsWith('/images/')}
    />
  );
}
