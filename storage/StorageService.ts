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
  duration?: number;
}

/**
 * Video upload data for presigned URL generation.
 */
export interface VideoUploadData {
  fileName: string;
  guestName: string;
  videoId: string;
  fileType: string;
  fileSize: number;
}

/**
 * Presigned URL response with upload details.
 */
export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  fields?: Record<string, string>;
}

/**
 * Video metadata extracted from storage.
 */
export interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
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

  /**
   * Uploads a video file to the storage provider.
   * 
   * @param buffer - Video file buffer
   * @param options - Video upload options
   * @returns Promise that resolves to upload result with metadata
   */
  uploadVideo(buffer: Buffer, options: VideoUploadData): Promise<UploadResult>;

  /**
   * Generates a presigned URL for direct video upload to storage provider.
   * 
   * @param options - Video upload options
   * @returns Promise that resolves to presigned upload response
   */
  generateVideoUploadUrl(options: VideoUploadData): Promise<PresignedUploadResponse>;

  /**
   * Gets video metadata from the storage provider.
   * 
   * @param publicUrl - Public URL of the video
   * @returns Promise that resolves to video metadata
   */
  getVideoMetadata(publicUrl: string): Promise<VideoMetadata>;
}