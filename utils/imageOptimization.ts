/**
 * Next.js optimized image utilities that leverage built-in features.
 *
 * This module provides utilities that work with Next.js Image component
 * to achieve optimal performance using built-in features rather than
 * custom implementations.
 */

import type { ImageProps } from './types';

/**
 * Generates optimized Cloudinary URLs that work well with Next.js Image loader
 */
export function getOptimizedImageUrl(
  publicId: string,
  format: string,
  quality: 'thumb' | 'medium' | 'full' = 'medium'
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const transformations = {
    thumb: 'c_scale,w_180,q_auto,f_auto',
    medium: 'c_scale,w_720,q_auto,f_auto',
    full: 'c_scale,w_1280,q_auto,f_auto',
  };

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations[quality]}/${publicId}.${format}`;
}

/**
 * Generates responsive image sizes for Next.js Image component
 */
export function getResponsiveSizes(context: 'gallery' | 'modal' | 'thumb'): string {
  switch (context) {
    case 'gallery':
      return `
        (max-width: 640px) 100vw,
        (max-width: 1280px) 50vw,
        (max-width: 1536px) 33vw,
        25vw
      `;
    case 'modal':
      return '100vw';
    case 'thumb':
      return '180px';
    default:
      return '50vw';
  }
}

/**
 * Prefetches specific images for modal navigation (only when modal is open)
 */
export function prefetchModalNavigation(images: ImageProps[], currentIndex: number): void {
  if (typeof window === 'undefined') return;

  // Only prefetch immediate next/previous for modal
  const indicesToPrefetch = [
    currentIndex - 1, // Previous
    currentIndex + 1, // Next
  ].filter((i) => i >= 0 && i < images.length);

  indicesToPrefetch.forEach((i) => {
    const image = images[i];
    const url = getOptimizedImageUrl(image.public_id, image.format, 'full');

    // Check if already prefetched
    const existing = document.querySelector(`link[href="${url}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'image';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
}

/**
 * Determines if an image should be loaded with priority
 */
export function shouldPrioritizeImage(
  index: number,
  viewport: 'mobile' | 'desktop' = 'desktop'
): boolean {
  // Load first 6 images with priority on desktop, first 3 on mobile
  const priorityCount = viewport === 'mobile' ? 3 : 6;
  return index < priorityCount;
}

/**
 * Gets the appropriate loading strategy for an image
 */
export function getLoadingStrategy(index: number, total: number): 'eager' | 'lazy' {
  // Load first few images eagerly, rest lazily
  return index < 6 ? 'eager' : 'lazy';
}

/**
 * Simple prefetch utility for immediate use (like on hover)
 */
export function simplePrefetch(url: string): void {
  if (typeof window === 'undefined') return;

  // Check if already prefetched
  const existing = document.querySelector(`link[href="${url}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

/**
 * Prefetch on user interaction (hover, focus)
 */
export function prefetchOnInteraction(
  image: ImageProps,
  quality: 'thumb' | 'medium' | 'full' = 'full'
): void {
  const url = getOptimizedImageUrl(image.public_id, image.format, quality);
  simplePrefetch(url);
}

/**
 * Generates optimized image props for Next.js Image component
 */
export function getOptimizedImageProps(
  image: ImageProps,
  context: 'gallery' | 'modal' | 'thumb' = 'gallery',
  options: {
    priority?: boolean;
    quality?: 'thumb' | 'medium' | 'full';
  } = {}
) {
  const { priority = false, quality = 'medium' } = options;

  return {
    src: getOptimizedImageUrl(image.public_id, image.format, quality),
    alt: `Wedding photo${image.guestName && image.guestName !== 'Unknown Guest' ? ` shared by ${image.guestName}` : ''}`,
    width: quality === 'thumb' ? 180 : quality === 'medium' ? 720 : 1280,
    height: quality === 'thumb' ? 120 : quality === 'medium' ? 480 : 853,
    sizes: getResponsiveSizes(context),
    priority,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    // Only use blur placeholder if blurDataUrl exists
    ...(image.blurDataUrl
      ? {
          placeholder: 'blur' as const,
          blurDataURL: image.blurDataUrl,
        }
      : {
          placeholder: 'empty' as const,
        }),
    quality: quality === 'thumb' ? 60 : quality === 'medium' ? 80 : 90,
  };
}
