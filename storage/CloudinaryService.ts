import cloudinary from '../utils/cloudinary';
import generateBlurPlaceholder from '../utils/generateBlurPlaceholder';
import { StorageService, UploadResult } from './StorageService';
import type { MediaProps } from '../utils/types';

/**
 * Cloudinary implementation of the StorageService interface.
 * 
 * Stores wedding photos in Cloudinary with organized folder structure:
 * - wedding/ (base folder)
 * - wedding/{guestName}/ (when guest isolation is used)
 */
export class CloudinaryService implements StorageService {
  private readonly baseFolder = 'wedding';

  /**
   * Uploads a file to Cloudinary with guest-specific folder organization.
   * 
   * @param file - The file to upload
   * @param guestName - Optional guest name for folder organization
   * @returns Promise that resolves to upload result with metadata
   */
  async upload(file: File, guestName?: string): Promise<UploadResult> {
    try {
      // Convert file to base64 data URI
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      // Always create guest-specific folders when guest name is provided
      const folder = guestName 
        ? `${this.baseFolder}/${guestName}` 
        : this.baseFolder;

      // Upload to Cloudinary with both folder structure AND context
      const result = await cloudinary.v2.uploader.upload(dataURI, {
        folder,
        context: guestName ? { guest: guestName } : undefined,
        resource_type: file.type.startsWith('video/') ? 'video' : 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: file.type.startsWith('video/') ? 'video' : 'image',
        created_at: result.created_at,
      };
    } catch (error) {
      console.error('Failed to upload to Cloudinary:', error);
      throw new Error('Failed to upload photo to Cloudinary');
    }
  }

  /**
   * Lists all photos from Cloudinary with metadata.
   * 
   * @param guestName - Optional guest name to filter photos
   * @returns Promise that resolves to an array of photo data with metadata
   */
  async list(guestName?: string): Promise<MediaProps[]> {
    try {
      // Build search expression based on guest filtering
      let expression = `folder:${this.baseFolder}/*`;
      if (guestName) {
        // Search specifically in the guest's folder
        expression = `folder:${this.baseFolder}/${guestName}/*`;
      }

      // Search for images with context
      const searchResults = await cloudinary.v2.search
        .expression(expression)
        .sort_by('created_at', 'desc')
        .max_results(400)
        .with_field('context')
        .execute();

      // Transform to ImageProps format
      const transformedMedia: MediaProps[] = searchResults.resources.map(
        (resource: any, index: number) => ({
          id: index,
          height: resource.height?.toString() || '480',
          width: resource.width?.toString() || '720',
          public_id: resource.public_id,
          format: resource.format,
          resource_type: resource.resource_type, // Add resource_type
          guestName: resource.context?.guest || guestName || 'Unknown Guest',
          uploadDate: resource.created_at,
        })
      );

      // Generate blur placeholders
      const blurPlaceholderPromises = transformedMedia.map((mediaItem) => {
        // Only generate blur for images
        if (mediaItem.resource_type === 'image') {
          // Find the original resource for this image
          const originalResource = searchResults.resources.find((resource: any) => 
            resource.public_id === mediaItem.public_id
          );
          return generateBlurPlaceholder(originalResource);
        }
        return Promise.resolve(undefined); // Return undefined for videos
      });

      const blurPlaceholders = await Promise.all(blurPlaceholderPromises);

      // Add blur placeholders to images
      transformedMedia.forEach((mediaItem, index) => {
        if (mediaItem.resource_type === 'image') {
          mediaItem.blurDataUrl = blurPlaceholders[index];
        }
      });

      return transformedMedia;
    } catch (error) {
      console.error('Failed to list photos from Cloudinary:', error);
      throw new Error('Failed to retrieve photos from Cloudinary');
    }
  }
}