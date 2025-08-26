import cloudinary from '../utils/cloudinary';
import generateBlurPlaceholder from '../utils/generateBlurPlaceholder';
import { StorageService, UploadResult, VideoUploadData, PresignedUploadResponse, VideoMetadata } from './StorageService';
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
        (resource: any, index: number) => {
          console.log(`[DEBUG CloudinaryService] Resource ${index}: public_id="${resource.public_id}", context=${JSON.stringify(resource.context)}`);
          
          // Test direct Cloudinary URL
          const testUrl = `https://res.cloudinary.com/dlegcbcvj/image/upload/${resource.public_id}`;
          console.log(`[DEBUG CloudinaryService] Test URL: ${testUrl}`);
          
          return {
            id: index,
            height: resource.height?.toString() || '480',
            width: resource.width?.toString() || '720',
            public_id: resource.public_id,
            format: resource.format,
            resource_type: resource.resource_type, // Add resource_type
            guestName: resource.context?.guest || guestName || 'Unknown Guest',
            uploadDate: resource.created_at,
          };
        }
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

  /**
   * Uploads a video file to Cloudinary.
   * Note: Cloudinary has a 100MB limit for video uploads.
   */
  async uploadVideo(buffer: Buffer, options: VideoUploadData): Promise<UploadResult> {
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    
    if (options.fileSize > MAX_VIDEO_SIZE) {
      throw new Error(`Video file size (${Math.round(options.fileSize / 1024 / 1024)}MB) exceeds Cloudinary's 100MB limit. Please use a smaller file or switch to S3 storage.`);
    }

    try {
      const result = await cloudinary.v2.uploader.upload(
        `data:${options.fileType};base64,${buffer.toString('base64')}`,
        {
          resource_type: 'video',
          folder: process.env.CLOUDINARY_FOLDER,
          context: `guest=${options.guestName}`,
          public_id: `${options.guestName}_${options.videoId}`,
        }
      );

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width || 720,
        height: result.height || 480,
        format: result.format || 'mp4',
        resource_type: 'video',
        created_at: result.created_at,
        duration: result.duration,
      };
    } catch (error) {
      console.error('Failed to upload video to Cloudinary:', error);
      throw new Error('Failed to upload video to Cloudinary');
    }
  }

  /**
   * Cloudinary doesn't support presigned URLs like S3.
   * This method throws an error to indicate videos should be uploaded via uploadVideo method.
   */
  async generateVideoUploadUrl(options: VideoUploadData): Promise<PresignedUploadResponse> {
    throw new Error('Cloudinary does not support presigned URLs. Use direct upload via uploadVideo method instead, or switch to S3 storage for presigned URL uploads.');
  }

  /**
   * Gets video metadata from Cloudinary.
   */
  async getVideoMetadata(publicUrl: string): Promise<VideoMetadata> {
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = publicUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = publicIdWithExt.split('.')[0];

      // Get resource info from Cloudinary
      const result = await cloudinary.v2.api.resource(publicId, { resource_type: 'video' });

      return {
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
      };
    } catch (error) {
      console.error('Error getting video metadata from Cloudinary:', error);
      // Return defaults if metadata extraction fails
      return {
        width: 720,
        height: 480,
        format: 'mp4',
        duration: undefined,
      };
    }
  }
}