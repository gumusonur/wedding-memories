import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { StorageService, UploadResult } from './StorageService';
import type { ImageProps } from '../utils/types';

/**
 * S3/Wasabi implementation of the StorageService interface.
 * 
 * Stores wedding photos in S3-compatible storage with organized folder structure:
 * - wedding/{guestName}/filename (guest-specific organization)
 */
export class S3Service implements StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly baseFolder = 'wedding';

  constructor() {
    // Validate required environment variables
    const region = process.env.AWS_REGION;
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
    
    if (!region || !bucket) {
      throw new Error('AWS_REGION and NEXT_PUBLIC_S3_BUCKET environment variables are required for S3 storage');
    }

    this.bucket = bucket;

    // Configure S3 client with optional custom endpoint for Wasabi
    const clientConfig: any = {
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    };

    // Add custom endpoint for Wasabi or other S3-compatible services
    if (process.env.NEXT_PUBLIC_S3_ENDPOINT) {
      clientConfig.endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
      clientConfig.forcePathStyle = true; // Required for some S3-compatible services
    }

    this.s3Client = new S3Client(clientConfig);
  }

  /**
   * Uploads a file to S3/Wasabi.
   * 
   * @param file - The file to upload
   * @param guestName - Optional guest name for folder organization
   * @returns Promise that resolves to upload result with metadata
   */
  async upload(file: File, guestName?: string): Promise<UploadResult> {
    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}-${randomSuffix}.${fileExtension}`;

      // Determine S3 key (path)
      const key = guestName 
        ? `${this.baseFolder}/${guestName}/${filename}`
        : `${this.baseFolder}/${filename}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          guestName: guestName || 'unknown',
          uploadDate: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Return upload result with metadata
      const fullUrl = this.getPublicUrl(key);
      return {
        url: fullUrl,
        public_id: fullUrl, // Use full URL as public_id for S3
        width: 720, // Default width for S3 images
        height: 480, // Default height for S3 images
        format: fileExtension,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to upload to S3:', error);
      throw new Error('Failed to upload photo to S3 storage');
    }
  }

  /**
   * Lists all photos from S3/Wasabi with metadata.
   * 
   * @param guestName - Optional guest name to filter photos
   * @returns Promise that resolves to an array of photo data with metadata
   */
  async list(guestName?: string): Promise<ImageProps[]> {
    try {
      // Determine prefix for listing
      const prefix = guestName 
        ? `${this.baseFolder}/${guestName}/`
        : `${this.baseFolder}/`;

      // List objects from S3
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);

      // Transform S3 objects to ImageProps format
      const images: ImageProps[] = [];
      if (response.Contents) {
        response.Contents.forEach((object, index) => {
          if (object.Key) {
            // Extract guest name from path
            const pathParts = object.Key.split('/');
            const extractedGuestName = pathParts.length > 2 ? pathParts[1] : 'Unknown Guest';
            
            // Extract filename without extension for public_id
            const filename = pathParts[pathParts.length - 1];

            images.push({
              id: index,
              height: '480', // Default height for S3 images
              width: '720',  // Default width for S3 images
              public_id: this.getPublicUrl(object.Key), // Use full URL as public_id for S3
              format: filename.split('.').pop() || 'jpg',
              guestName: guestName || extractedGuestName,
              uploadDate: object.LastModified?.toISOString(),
              // Note: S3 doesn't generate blur placeholders automatically
              // This could be enhanced with a separate blur generation service
            });
          }
        });
      }

      // Sort by upload date in descending order
      images.sort((a, b) => {
        const dateA = new Date(a.uploadDate || 0).getTime();
        const dateB = new Date(b.uploadDate || 0).getTime();
        return dateB - dateA;
      });

      return images;
    } catch (error) {
      console.error('Failed to list photos from S3:', error);
      throw new Error('Failed to retrieve photos from S3 storage');
    }
  }


  /**
   * Generates the public URL for an S3 object.
   * 
   * @param key - The S3 object key
   * @returns The public URL
   */
  private getPublicUrl(key: string): string {
    const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
    
    if (endpoint) {
      // Custom endpoint (Wasabi or other S3-compatible service)
      const baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
      return `${baseUrl}/${this.bucket}/${key}`;
    } else {
      // Standard AWS S3 URL
      const region = process.env.AWS_REGION;
      return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
    }
  }
}