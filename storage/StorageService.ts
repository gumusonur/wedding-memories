import type { MediaProps } from '../utils/types';

/**
 * Upload result with metadata for immediate UI updates.
 */
export interface UploadResult {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: 'image' | 'video';
  created_at: string;
}

/**
 * Storage service interface for wedding photo management.
 * 
 * Provides a unified interface for different storage providers
 * (Cloudinary, S3/Wasabi) to handle photo uploads and listing.
 */
export interface StorageService {
  /**
   * Uploads a file to the storage provider.
   * 
   * @param file - The file to upload
   * @param guestName - Optional guest name for file organization
   * @returns Promise that resolves to upload result with metadata
   */
  upload(file: File, guestName?: string): Promise<UploadResult>;

  /**
   * Lists all photos from the storage provider with metadata.
   * 
   * @param guestName - Optional guest name to filter photos
   * @returns Promise that resolves to an array of photo data with metadata
   */
  list(guestName?: string): Promise<MediaProps[]>;
}