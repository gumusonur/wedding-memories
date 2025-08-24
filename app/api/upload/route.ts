import { NextRequest, NextResponse } from 'next/server';
import { appConfig, StorageProvider } from '../../../config';
import { storage } from '../../../storage';
import { checkUploadRateLimit, createRateLimitHeaders } from '../../../utils/rateLimit';
import type { ApiErrorResponse } from '../../../utils/types';
import { HLSVideoProcessor } from '../../../services/HLSVideoProcessor';

/**
 * Validation error class for input validation failures.
 */
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates the upload request payload.
 *
 * @param formData - Form data containing file and guest name
 * @throws {ValidationError} If validation fails
 */
function validateUploadRequest(formData: FormData): { file: File; guestName: string } {
  const file = formData.get('file') as File;
  const guestName = formData.get('guestName') as string;

  if (!file || !(file instanceof File)) {
    throw new ValidationError('Valid file is required', 'file');
  }

  const isS3 = appConfig.storage === StorageProvider.S3;
  const isValidImage = file.type.startsWith('image/');
  const isValidVideo = file.type.startsWith('video/');

  if (isS3) {
    if (!isValidImage && !isValidVideo) {
      throw new ValidationError('File must be a valid image or video format', 'file');
    }
  } else {
    if (!isValidImage) {
      throw new ValidationError('File must be a valid image format', 'file');
    }
  }

  const trimmedGuestName = guestName?.trim() || '';
  if (!trimmedGuestName) {
    throw new ValidationError('Guest name is required', 'guestName');
  }

  if (trimmedGuestName.length > 100) {
    throw new ValidationError('Guest name must be less than 100 characters', 'guestName');
  }

  return { file, guestName: trimmedGuestName };
}


/**
 * Handles media upload requests using the configured storage provider.
 *
 * @param request - The incoming request containing file and guest name
 * @returns JSON response with upload URL or error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ url: string } | ApiErrorResponse>> {
  try {
    // Check rate limits first (fail fast)
    const rateLimitResult = checkUploadRateLimit(request);
    if (!rateLimitResult.success) {
      const errorResponse: ApiErrorResponse = {
        error: 'Too many uploads',
        details: rateLimitResult.message || 'Please wait before uploading more files.',
      };
      
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    const formData = await request.formData().catch(() => {
      throw new ValidationError('Invalid form data');
    });

    const { file, guestName } = validateUploadRequest(formData);

    // Check if this is a video file for S3 storage
    const isVideo = file.type.startsWith('video/');
    const isS3 = appConfig.storage === StorageProvider.S3;
    
    if (isVideo && isS3) {
      // Process video with HLS for Instagram-style playback
      const hlsProcessor = new HLSVideoProcessor();
      const videoBuffer = Buffer.from(await file.arrayBuffer());
      
      const processingResult = await hlsProcessor.processVideoToHLS(
        videoBuffer,
        file.name,
        {
          guestName,
          quality: 'medium',
          segmentDuration: 6
        }
      );

      // Return video metadata with HLS information
      const mediaData = {
        id: Date.now(),
        height: '480',
        width: '720',
        public_id: processingResult.originalPath,
        format: 'mp4',
        resource_type: 'video' as const,
        guestName,
        uploadDate: new Date().toISOString(),
        url: processingResult.playlistUrl,
        hlsPlaylistUrl: processingResult.playlistUrl,
        hlsPath: processingResult.hlsPath,
        videoId: processingResult.videoId,
        duration: processingResult.duration,
      };

      return NextResponse.json(mediaData, { 
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    // Handle regular image uploads or Cloudinary video uploads
    const uploadResult = await storage.upload(file, guestName);

    // Return media metadata for immediate UI update
    const mediaData = {
      ...uploadResult,
      guestName,
      uploadDate: uploadResult.created_at,
    };

    return NextResponse.json(mediaData, { 
      status: 201,
      headers: createRateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('Upload error:', error);

    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        error: error.message,
        details: error.field ? `Validation failed for field: ${error.field}` : undefined,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to upload file',
      details: 'Please try again or contact support if the problem persists',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
