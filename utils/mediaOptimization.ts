/**
 * Storage-agnostic media optimization utilities.
 *
 * This module provides utilities that work with any storage provider
 * (Cloudinary, S3/Wasabi) and generate appropriate URLs for both images and videos
 * based on the configured storage provider.
 */

import type { MediaProps } from './types';
import { getImageUrl, getThumbnailUrl, getFullUrl } from './imageUrl';
import { appConfig, StorageProvider } from '../config';

const urlCache = new Map<string, string>();

export function getOptimizedMediaUrl(
  publicId: string,
  format: string,
  resourceType: 'image' | 'video',
  quality: 'thumb' | 'medium' | 'full' = 'medium'
): string {
  const cacheKey = `${publicId}-${resourceType}-${quality}`;
  
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey)!;
  }
  
  let url: string;
  
  if (appConfig.storage === StorageProvider.S3) {
    // For S3, return the presigned URL directly (publicId already contains the full presigned URL)
    url = publicId;
  } else {
    if (resourceType === 'video') {
      switch (quality) {
        case 'thumb':
          url = getThumbnailUrl(publicId, resourceType);
          break;
        case 'medium':
          url = getImageUrl(publicId, resourceType, 720, undefined, 'medium');
          break;
        case 'full':
          url = getFullUrl(publicId, resourceType);
          break;
        default:
          url = getImageUrl(publicId, resourceType, 720, undefined, 'medium');
      }
    } else {
      switch (quality) {
        case 'thumb':
          url = getThumbnailUrl(publicId, resourceType);
          break;
        case 'medium':
          url = getImageUrl(publicId, resourceType, 720, undefined, 'medium');
          break;
        case 'full':
          url = getFullUrl(publicId, resourceType);
          break;
        default:
          url = getImageUrl(publicId, resourceType);
      }
    }
  }
  
  urlCache.set(cacheKey, url);
  return url;
}

/**
 * Generates responsive media sizes for Next.js Image component and video elements
 */
export function getResponsiveMediaSizes(context: 'gallery' | 'modal' | 'thumb'): string {
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
 * Prefetches specific media for modal navigation (only when modal is open)
 */
export function prefetchModalMediaNavigation(items: MediaProps[], currentIndex: number): void {
  if (typeof window === 'undefined') return;

  const indicesToPrefetch = [
    currentIndex - 1, // Previous
    currentIndex + 1, // Next
  ].filter((i) => i >= 0 && i < items.length);

  indicesToPrefetch.forEach((i) => {
    const item = items[i];
    const url = getOptimizedMediaUrl(item.public_id, item.format, item.resource_type, 'full');

    const existing = document.querySelector(`link[href="${url}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = item.resource_type === 'video' ? 'video' : 'image';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
}

/**
 * Determines if a media item should be loaded with priority
 */
export function shouldPrioritize(index: number): boolean {
  return index < 6; // Prioritize first 6 items
}

/**
 * Simple media prefetch utility for immediate use (like on hover)
 */
export function simpleMediaPrefetch(url: string, resourceType: 'image' | 'video'): void {
  if (typeof window === 'undefined') return;

  const existing = document.querySelector(`link[href="${url}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = resourceType;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

/**
 * Prefetch media on user interaction (hover, focus)
 */
export function prefetchMediaOnInteraction(
  item: MediaProps,
  quality: 'thumb' | 'medium' | 'full' = 'full'
): void {
  const url = getOptimizedMediaUrl(item.public_id, item.format, item.resource_type, quality);
  simpleMediaPrefetch(url, item.resource_type);
}

/**
 * Generates optimized props for the storage-aware media component.
 */
export function getOptimizedMediaProps(
  item: MediaProps,
  context: 'gallery' | 'modal' | 'thumb' = 'gallery',
  options: {
    priority?: boolean;
    quality?: 'thumb' | 'medium' | 'full';
  } = {}
) {
  const { priority = false, quality = 'medium' } = options;

  if (item.resource_type === 'video') {
    // For thumbnail context, generate a static image thumbnail instead of video
    if (context === 'thumb') {
      // Generate a static image thumbnail for carousel display
      const thumbnailImageSrc = appConfig.storage === StorageProvider.S3 
        ? item.public_id // Use presigned URL directly for S3
        : (() => {
            // For Cloudinary, generate an image thumbnail from video
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) return item.public_id;
            
            // Generate a still image from the video at 1 second mark
            const publicId = item.public_id.startsWith('http') ? item.public_id : item.public_id;
            if (publicId.startsWith('http')) return publicId;
            
            return `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,w_180,h_120,so_1.0,f_jpg,q_auto/${publicId}`;
          })();

      return {
        src: thumbnailImageSrc,
        alt: `Wedding video thumbnail${item.guestName && item.guestName !== 'Unknown Guest' ? ` shared by ${item.guestName}` : ''}`,
        width: '180',
        height: '120',
        sizes: getResponsiveMediaSizes(context),
        priority: false,
        loading: 'lazy' as const,
        resource_type: 'image' as const, // Treat as image for thumbnail display
        format: 'jpg',
        context,
      };
    }
    
    // For gallery and modal contexts, use video
    const posterUrl = undefined;
    
    // For S3, use presigned URL directly since we don't have quality transformations
    // For Cloudinary, use optimized quality based on context
    const videoSrc = appConfig.storage === StorageProvider.S3 
      ? item.public_id // Use presigned URL directly for S3
      : getOptimizedMediaUrl(item.public_id, item.format, item.resource_type, 
          context === 'gallery' ? 'medium' : 'full');

    return {
      src: videoSrc,
      alt: `Wedding video${item.guestName && item.guestName !== 'Unknown Guest' ? ` shared by ${item.guestName}` : ''}`,
      width: item.width,
      height: item.height,
      sizes: getResponsiveMediaSizes(context),
      priority: false, // Videos should never have priority to avoid blocking image loading
      loading: 'lazy' as const,
      resource_type: 'video' as const,
      poster: posterUrl,
      format: item.format as string,
      controls: context === 'modal', // Add controls for modal view
      context, // Pass context to component
      // Video-specific properties
      videoId: item.videoId,
      duration: item.duration,
      guestName: item.guestName,
    };
  }

  // It's an image, use appropriate URL handling
  const imageSrc = appConfig.storage === StorageProvider.S3 
    ? item.public_id // Use presigned URL directly for S3
    : getOptimizedMediaUrl(item.public_id, item.format, item.resource_type, quality);
    
  return {
    src: imageSrc,
    alt: `Wedding photo${item.guestName && item.guestName !== 'Unknown Guest' ? ` shared by ${item.guestName}` : ''}`,
    width: item.width,
    height: item.height,
    sizes: getResponsiveMediaSizes(context),
    priority,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    ...(item.blurDataUrl
      ? { placeholder: 'blur' as const, blurDataURL: item.blurDataUrl }
      : { placeholder: 'empty' as const }),
    quality: quality === 'thumb' ? 60 : quality === 'medium' ? 80 : 90,
    resource_type: 'image' as const,
    format: item.format as string,
  };
}
