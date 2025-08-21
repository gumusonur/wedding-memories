import { appConfig, StorageProvider } from '../config';

/**
 * Image URL utility for storage-agnostic image handling.
 * Generates appropriate URLs based on the configured storage provider.
 */
export class ImageUrlService {
  /**
   * Gets the optimized image URL for display.
   * 
   * @param publicId - The image public ID or full URL
   * @param width - Desired width
   * @param height - Desired height
   * @param quality - Image quality ('auto', 'low', 'medium', 'high')
   * @returns Optimized image URL
   */
  static getImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    quality: 'auto' | 'low' | 'medium' | 'high' = 'auto'
  ): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      return ImageUrlService.getCloudinaryUrl(publicId, width, height, quality);
    } else {
      return ImageUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the thumbnail URL for preview purposes.
   * 
   * @param publicId - The image public ID or full URL
   * @returns Thumbnail URL
   */
  static getThumbnailUrl(publicId: string): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      return ImageUrlService.getCloudinaryUrl(publicId, 400, 300, 'medium');
    } else {
      return ImageUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the full resolution URL for modal viewing.
   * 
   * @param publicId - The image public ID or full URL
   * @returns Full resolution URL
   */
  static getFullUrl(publicId: string): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      return ImageUrlService.getCloudinaryUrl(publicId, 1920, 1080, 'high');
    } else {
      return ImageUrlService.getS3Url(publicId);
    }
  }

  /**
   * Gets the download URL for an image (original quality).
   * 
   * @param publicId - The image public ID or full URL
   * @param format - The image format (jpg, png, etc.)
   * @returns Download URL for the original image
   */
  static getDownloadUrl(publicId: string, format: string): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) return publicId;
      
      // For Cloudinary, return original quality URL
      if (publicId.startsWith('http')) return publicId;
      return `https://res.cloudinary.com/${cloudName}/image/upload/q_100,fl_attachment/${publicId}.${format}`;
    } else {
      // For S3, we need to use the proxy but with a download header
      return ImageUrlService.getS3DownloadUrl(publicId);
    }
  }

  /**
   * Gets the external link URL for viewing the image in a new tab.
   * 
   * @param publicId - The image public ID or full URL
   * @param format - The image format (jpg, png, etc.)
   * @returns External link URL
   */
  static getExternalUrl(publicId: string, format: string): string {
    if (appConfig.storage === StorageProvider.Cloudinary) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) return publicId;
      
      // For Cloudinary, return high-quality URL
      if (publicId.startsWith('http')) return publicId;
      return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto:best,f_auto/${publicId}.${format}`;
    } else {
      // For S3, use the full URL from public_id (which is already the complete URL for S3)
      if (publicId.startsWith('http')) {
        return publicId;
      }
      return ImageUrlService.getS3Url(publicId);
    }
  }

  /**
   * Generates Cloudinary optimized URL.
   */
  private static getCloudinaryUrl(
    publicId: string,
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

    let transformations = [];
    
    if (width && height) {
      transformations.push(`c_scale,w_${width},h_${height}`);
    } else if (width) {
      transformations.push(`c_scale,w_${width}`);
    }
    
    transformations.push(`q_${quality}`);
    transformations.push('f_auto'); // Auto format

    const transformationString = transformations.join(',');
    
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`;
  }

  /**
   * Generates S3/Wasabi URL via proxy for reliable access.
   */
  private static getS3Url(publicId: string): string {
    // If publicId is already a full URL, extract the object key
    let objectKey: string;
    
    if (publicId.startsWith('http')) {
      // Extract the object key from the full URL
      const url = new URL(publicId);
      const pathParts = url.pathname.split('/');
      // Remove empty first element and bucket name to get the object key
      objectKey = pathParts.slice(2).join('/');
    } else {
      objectKey = publicId;
    }

    // Use our proxy API to serve the image
    return `/api/s3-proxy/${objectKey}`;
  }

  /**
   * Generates S3/Wasabi download URL via proxy with download headers.
   */
  private static getS3DownloadUrl(publicId: string): string {
    // If publicId is already a full URL, extract the object key
    let objectKey: string;
    
    if (publicId.startsWith('http')) {
      // Extract the object key from the full URL
      const url = new URL(publicId);
      const pathParts = url.pathname.split('/');
      // Remove empty first element and bucket name to get the object key
      objectKey = pathParts.slice(2).join('/');
    } else {
      objectKey = publicId;
    }

    // Use our proxy API with download parameter
    return `/api/s3-proxy/${objectKey}?download=true`;
  }

  /**
   * Checks if the current storage provider supports image optimization.
   */
  static supportsOptimization(): boolean {
    return appConfig.storage === StorageProvider.Cloudinary;
  }
}

/**
 * Convenience functions for common use cases.
 */
export const getImageUrl = ImageUrlService.getImageUrl;
export const getThumbnailUrl = ImageUrlService.getThumbnailUrl;
export const getFullUrl = ImageUrlService.getFullUrl;
export const getDownloadUrl = ImageUrlService.getDownloadUrl;
export const getExternalUrl = ImageUrlService.getExternalUrl;