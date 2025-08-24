import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService, UploadResult } from './StorageService';
import type { MediaProps } from '../utils/types';

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
        public_id: key, // Use S3 key as public_id, not full URL
        width: 720, // Default width for S3 images
        height: 480, // Default height for S3 images
        format: fileExtension,
        resource_type: file.type.startsWith('video/') ? 'video' : 'image',
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to upload to S3:', error);
      throw new Error('Failed to upload photo to S3 storage');
    }
  }

  /**
   * Sanitize guest name for S3 path consistency (matches HLS processor logic)
   */
  private sanitizeGuestName(guestName: string): string {
    return guestName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Lists all photos from S3/Wasabi with metadata.
   * 
   * @param guestName - Optional guest name to filter photos
   * @returns Promise that resolves to an array of photo data with metadata
   */
  async list(guestName?: string): Promise<MediaProps[]> {
    try {
      // Sanitize guest name to match storage structure
      const sanitizedGuestName = guestName ? this.sanitizeGuestName(guestName) : undefined;
      
      // Determine prefix for listing
      const prefix = sanitizedGuestName 
        ? `${this.baseFolder}/${sanitizedGuestName}/`
        : `${this.baseFolder}/`;

      // List objects from S3
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);
      console.log(`[S3] Searching with sanitized guest name "${guestName}" -> "${sanitizedGuestName}"`);
      console.log(`[S3] Found ${response.Contents?.length || 0} objects with prefix: ${prefix}`);

      // Transform S3 objects to MediaProps format
      const mediaItems: MediaProps[] = [];
      if (response.Contents) {
        response.Contents.forEach((object, index) => {
          if (object.Key) {
            // Skip HLS segment files (.ts) - but keep .m3u8 playlists for processing
            if (object.Key.includes('/hls/') && object.Key.endsWith('.ts')) {
              return;
            }
            
            // Extract guest name from path
            const pathParts = object.Key.split('/');
            const extractedGuestName = pathParts.length > 2 ? pathParts[1] : 'Unknown Guest';
            
            // Extract filename and format
            const filename = pathParts[pathParts.length - 1];
            const format = filename.includes('.') ? filename.split('.').pop() || '' : 'jpg';
            const resourceType = (format: string): 'image' | 'video' => {
              const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
              const videoFormats = ['mp4', 'mov', 'avi', 'webm'];
              if (imageFormats.includes(format.toLowerCase())) return 'image';
              if (videoFormats.includes(format.toLowerCase())) return 'video';
              return 'image';
            };

            const isVideo = resourceType(format) === 'video';
            const isInOriginalsFolder = object.Key.includes('/originals/');
            
            // Skip original videos - they are only for external management
            // Only show HLS playlists in the gallery
            if (isVideo && isInOriginalsFolder) {
              console.log(`[S3] Skipping original video (for external management): ${object.Key}`);
              return;
            }
            
            // For HLS playlists, create a proper media item
            if (object.Key.endsWith('index.m3u8') && object.Key.includes('/hls/')) {
              // Extract video ID and guest name from HLS path
              // Path format: wedding/guest/hls/videoId/index.m3u8
              const hlsPathParts = object.Key.split('/');
              const videoId = hlsPathParts[hlsPathParts.length - 2]; // videoId is the parent folder
              const guestNameFromPath = hlsPathParts[1];
              
              console.log(`[S3] Found HLS playlist: ${object.Key} (videoId: ${videoId})`);
              
              mediaItems.push({
                id: index,
                height: '480',
                width: '720',
                public_id: `wedding/${guestNameFromPath}/originals/${videoId}.mp4`, // Reference original for metadata
                format: 'mp4',
                resource_type: 'video',
                guestName: guestName || guestNameFromPath,
                uploadDate: object.LastModified?.toISOString(),
                // HLS properties for video playback
                hlsPlaylistUrl: `/api/s3-proxy/${object.Key}`,
                hlsPath: `wedding/${guestNameFromPath}/hls/${videoId}`,
                videoId,
                duration: undefined // Could be extracted from metadata if needed
              });
              return;
            }
            
            // For non-video files (images), process normally
            if (!isVideo) {
              mediaItems.push({
                id: index,
                height: '480',
                width: '720',
                public_id: object.Key,
                format: format,
                resource_type: resourceType(format),
                guestName: guestName || extractedGuestName,
                uploadDate: object.LastModified?.toISOString(),
              });
            }
          }
        });
      }

      // Sort by upload date in descending order
      mediaItems.sort((a, b) => {
        const dateA = new Date(a.uploadDate || 0).getTime();
        const dateB = new Date(b.uploadDate || 0).getTime();
        return dateB - dateA;
      });

      return mediaItems;
    } catch (error) {
      console.error('Failed to list media from S3:', error);
      throw new Error('Failed to retrieve media from S3 storage');
    }
  }


  /**
   * Uploads a buffer directly to S3 with specified key and content type.
   * Used for HLS video processing.
   * 
   * @param buffer - Buffer to upload
   * @param key - S3 key (path)
   * @param contentType - MIME type of the content
   */
  async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generates a signed URL for private S3 objects.
   * Used for HLS playlist and segment access.
   * 
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Gets metadata for an S3 object.
   * Used to check if HLS files exist.
   * 
   * @param key - S3 object key
   * @returns Object metadata
   */
  async getFileMetadata(key: string): Promise<any> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await this.s3Client.send(command);
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