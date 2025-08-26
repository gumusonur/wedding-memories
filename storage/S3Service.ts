import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService, UploadResult, VideoUploadData, PresignedUploadResponse, VideoMetadata } from './StorageService';
import type { MediaProps } from '../utils/types';

/**
 * S3/Wasabi implementation of the StorageService interface.
 * 
 * Stores wedding photos in S3-compatible storage with organized folder structure:
 * - {guestName}/filename (guest-specific organization)
 */
export class S3Service implements StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

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

      // Sanitize guest name for consistency
      const sanitizedGuestName = guestName ? this.sanitizeGuestName(guestName) : undefined;

      // Determine S3 key (path)
      const key = sanitizedGuestName 
        ? `${sanitizedGuestName}/${filename}`
        : filename;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          guestName: sanitizedGuestName || 'unknown',
          uploadDate: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Return upload result with metadata
      const fullUrl = await this.getPublicUrl(key);
      console.log(`[DEBUG S3Service] upload() - Generated presigned URL: ${fullUrl.substring(0, 100)}...`);
      return {
        url: fullUrl,
        public_id: fullUrl, // Use presigned URL as public_id for frontend
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
   * Sanitize guest name for S3 path consistency
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
        ? `${sanitizedGuestName}/`
        : '';

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
        const mediaPromises = response.Contents.map(async (object, index) => {
          if (!object.Key) return null;
          
          // Extract guest name from path
          const pathParts = object.Key.split('/');
          const extractedGuestName = pathParts.length > 1 ? pathParts[0] : 'Unknown Guest';
          
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
          
          // Generate presigned URL for this object
          const presignedUrl = await this.getPublicUrl(object.Key);
          console.log(`[DEBUG S3Service] list() - Generated presigned URL for ${object.Key}: ${presignedUrl.substring(0, 100)}...`);
          
          // Return media item with presigned URL
          return {
            id: index,
            height: '480',
            width: '720',
            public_id: presignedUrl, // Use presigned URL as public_id
            format: format,
            resource_type: resourceType(format),
            guestName: guestName || extractedGuestName,
            uploadDate: object.LastModified?.toISOString(),
          };
        });

        const resolvedMediaItems = await Promise.all(mediaPromises);
        mediaItems.push(...resolvedMediaItems.filter((item): item is MediaProps => item !== null));
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
   * Used for video processing.
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
   * Used for media file access.
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
   * Used to check if files exist.
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
  /**
   * Uploads a video file to S3 with metadata.
   */
  async uploadVideo(buffer: Buffer, options: VideoUploadData): Promise<UploadResult> {
    const { fileName, guestName, videoId } = options;
    const sanitizedGuestName = this.sanitizeGuestName(guestName);
    const key = `${sanitizedGuestName}/videos/${videoId}.mp4`;

    // Upload with basic metadata
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'video/mp4',
      Metadata: {
        originalFilename: fileName,
        guestName: sanitizedGuestName,
        videoId: videoId,
        uploadDate: new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);

    return {
      url: await this.getPublicUrl(key),
      public_id: key,
      width: 720, // Will be updated when metadata is available
      height: 480, // Will be updated when metadata is available
      format: 'mp4',
      resource_type: 'video',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Generates a presigned URL for direct video upload.
   */
  async generateVideoUploadUrl(options: VideoUploadData): Promise<PresignedUploadResponse> {
    const { guestName, videoId } = options;
    const sanitizedGuestName = this.sanitizeGuestName(guestName);
    const key = `${sanitizedGuestName}/videos/${videoId}.mp4`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: 'video/mp4',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
    const publicUrl = await this.getPublicUrl(key);

    return {
      uploadUrl,
      publicUrl,
    };
  }

  /**
   * Gets video metadata from S3 object.
   */
  async getVideoMetadata(publicUrl: string): Promise<VideoMetadata> {
    try {
      // Extract S3 key from public URL
      const urlParts = publicUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.bucket);
      const key = urlParts.slice(bucketIndex + 1).join('/');

      // Get object metadata from S3
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Parse metadata from S3 object metadata or use defaults
      const width = response.Metadata?.width ? parseInt(response.Metadata.width) : 720;
      const height = response.Metadata?.height ? parseInt(response.Metadata.height) : 480;
      const duration = response.Metadata?.duration ? parseFloat(response.Metadata.duration) : undefined;
      const format = key.split('.').pop() || 'mp4';

      return {
        width,
        height,
        duration,
        format,
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      // Return defaults if metadata extraction fails
      return {
        width: 720,
        height: 480,
        format: 'mp4',
        duration: undefined,
      };
    }
  }

  private async getPublicUrl(key: string): Promise<string> {
    // Generate presigned read URL for S3 objects (24 hour expiry)
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 86400 }); // 24 hours
      return presignedUrl;
    } catch (error) {
      console.error('Error generating presigned read URL:', error);
      // Fallback to direct URL if presigned URL generation fails
      const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
      
      if (endpoint) {
        const baseUrl = endpoint.replace(/\/$/, '');
        return `${baseUrl}/${this.bucket}/${key}`;
      } else {
        const region = process.env.AWS_REGION;
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
      }
    }
  }
}