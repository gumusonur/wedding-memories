import { appConfig, StorageProvider } from '../config';

/**
 * Media URL utility for storage-agnostic media handling.
 * Generates appropriate URLs based on the configured storage provider.
 */
export class MediaUrlService {
  /**
   * Gets the optimized media URL for display.
   *
   * @param publicId - The media public ID or full URL
   * @param resourceType - The type of media (image or video)
   * @param width - Desired width
   * @param height - Desired height
   * @param quality - Media quality ('auto', 'low', 'medium', 'high')
   * @returns Optimized media URL
   */
  static getMediaUrl(
    publicId: string,
    resourceType: 'image' | 'video',
    width?: number,
    height?: number,
    quality: 'auto' | 'low' | 'medium' | 'high' = 'auto'
  ): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      return MediaUrlService.getCloudinaryUrl(publicId, resourceType, width, height, quality);
    } else {
      return MediaUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the thumbnail URL for preview purposes.
   *
   * @param publicId - The media public ID or full URL
   * @param resourceType - The type of media (image or video)
   * @returns Thumbnail URL
   */
  static getThumbnailUrl(publicId: string, resourceType: 'image' | 'video'): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      return MediaUrlService.getCloudinaryUrl(publicId, resourceType, 400, 300, 'medium');
    } else {
      return MediaUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the full resolution URL for modal viewing.
   *
   * @param publicId - The media public ID or full URL
   * @param resourceType - The type of media (image or video)
   * @returns Full resolution URL
   */
  static getFullUrl(publicId: string, resourceType: 'image' | 'video'): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      return MediaUrlService.getCloudinaryUrl(
        publicId,
        resourceType,
        undefined,
        undefined,
        resourceType === 'video' ? 'auto' : 'high'
      );
    } else {
      return MediaUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the download URL for a media item (original quality).
   *
   * @param publicId - The media public ID or full URL
   * @param resourceType - The type of media (image or video)
   * @param format - The media format (jpg, mp4, etc.)
   * @returns Download URL for the original media
   */
  static getDownloadUrl(publicId: string, resourceType: 'image' | 'video', format: string): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) return publicId;

      // For Cloudinary, return original quality URL
      if (publicId.startsWith('http')) return publicId;
      const mediaTypePath = resourceType === 'video' ? 'video' : 'image';
      return `https://res.cloudinary.com/${cloudName}/${mediaTypePath}/upload/q_100,fl_attachment/${publicId}.${format}`;
    } else {
      // For S3, return the direct URL (S3 bucket should be configured for public access)
      return MediaUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the external link URL for viewing the media in a new tab.
   *
   * @param publicId - The media public ID or full URL
   * @param resourceType - The type of media (image or video)
   * @param format - The media format (jpg, mp4, etc.)
   * @returns External link URL
   */
  static getExternalUrl(publicId: string, resourceType: 'image' | 'video', format: string): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) return publicId;

      // For Cloudinary, return high-quality URL
      if (publicId.startsWith('http')) return publicId;
      const mediaTypePath = resourceType === 'video' ? 'video' : 'image';
      return `https://res.cloudinary.com/${cloudName}/${mediaTypePath}/upload/q_auto:best,f_auto/${publicId}.${format}`;
    } else {
      // For S3, use the full URL from public_id (which is already the complete URL for S3)
      if (publicId.startsWith('http')) {
        return publicId;
      }
      return MediaUrlService.getS3Url(publicId);
    }
  }

  /**
   * Generates Cloudinary optimized URL.
   */
  private static getCloudinaryUrl(
    publicId: string,
    resourceType: 'image' | 'video',
    width?: number,
    height?: number,
    quality: string = 'auto'
  ): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.warn('Cloudinary cloud name not configured');
      return publicId;
    }

    // If publicId is already a full URL, return it
    if (publicId.startsWith('http')) {
      return publicId;
    }

    const transformations = [];

    // Map named quality values to Cloudinary numeric values
    const qualityMap: { [key: string]: string } = {
      medium: '80',
      high: '90',
      low: '60',
    };
    const finalQuality = qualityMap[quality] || quality;

    if (resourceType === 'video') {
      // Simplified video transformations
      if (width && height) {
        transformations.push(`c_scale,w_${width},h_${height}`);
      }
      transformations.push(`q_${finalQuality}`);
      transformations.push('f_auto'); // Auto format
    } else {
      // Image transformations
      if (width && height) {
        transformations.push(`c_scale,w_${width},h_${height}`);
      }
      transformations.push(`q_${finalQuality}`);
      transformations.push('f_auto');
    }

    const transformationString = transformations.length > 0 ? transformations.join(',') + '/' : '';
    const mediaTypePath = resourceType === 'video' ? 'video' : 'image';

    return `https://res.cloudinary.com/${cloudName}/${mediaTypePath}/upload/${transformationString}${publicId}`;
  }

  /**
   * Generates S3 URL (presigned URLs are returned as-is).
   * S3Service now returns presigned URLs in public_id, so we use them directly.
   */
  private static getS3Url(publicId: string): string {
    // If publicId is already a full URL (presigned URL from S3Service), return it directly
    if (publicId.startsWith('http')) {
      return publicId;
    }

    // Handle legacy s3-proxy URLs - convert them to direct URLs
    if (publicId.startsWith('/api/s3-proxy/')) {
      publicId = publicId.replace('/api/s3-proxy/', '');
    }

    // For S3 keys without full URLs, construct direct URL as fallback
    // Note: This should rarely happen with new presigned URL system
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
    const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;

    if (!bucket) {
      console.warn('S3 bucket not configured');
      return publicId;
    }

    if (endpoint) {
      // Custom endpoint (Wasabi or other S3-compatible service)
      const baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
      return `${baseUrl}/${bucket}/${publicId}`;
    } else {
      // Standard AWS S3 URL
      const region = process.env.AWS_REGION;
      return `https://${bucket}.s3.${region}.amazonaws.com/${publicId}`;
    }
  }

  /**
   * Checks if the current storage provider supports media optimization.
   */
  static supportsOptimization(): boolean {
    return appConfig.storage === StorageProvider.Cloudinary;
  }
}

/**
 * Convenience functions for common use cases.
 */
export const getImageUrl = MediaUrlService.getMediaUrl;
export const getThumbnailUrl = MediaUrlService.getThumbnailUrl;
export const getFullUrl = MediaUrlService.getFullUrl;
export const getDownloadUrl = MediaUrlService.getDownloadUrl;
export const getExternalUrl = MediaUrlService.getExternalUrl;
