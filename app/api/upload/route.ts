import { NextRequest, NextResponse } from 'next/server';
import { appConfig, StorageProvider } from '../../../config';
import { storage } from '../../../storage';
import { checkUploadRateLimit, createRateLimitHeaders } from '../../../utils/rateLimit';
import type { ApiErrorResponse } from '../../../utils/types';

// Increase body size limit for file uploads to accommodate videos
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '150mb',
    },
  },
};

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
 * Validates metadata-only upload requests.
 *
 * @param body - JSON body containing file metadata
 * @throws {ValidationError} If validation fails
 */
function validateMetadataRequest(body: any): { fileName: string; fileSize: number; fileType: string; guestName: string } {
  const { fileName, fileSize, fileType, guestName } = body;

  if (!fileName || typeof fileName !== 'string') {
    throw new ValidationError('Valid file name is required', 'fileName');
  }

  if (!fileSize || typeof fileSize !== 'number') {
    throw new ValidationError('Valid file size is required', 'fileSize');
  }

  if (!fileType || typeof fileType !== 'string') {
    throw new ValidationError('Valid file type is required', 'fileType');
  }

  if (!fileType.startsWith('video/')) {
    throw new ValidationError('Only video files are supported for this request type', 'fileType');
  }

  const trimmedGuestName = guestName?.trim() || '';
  if (!trimmedGuestName) {
    throw new ValidationError('Guest name is required', 'guestName');
  }

  if (trimmedGuestName.length > 100) {
    throw new ValidationError('Guest name must be less than 100 characters', 'guestName');
  }

  return { fileName, fileSize, fileType, guestName: trimmedGuestName };
}

/**
 * Handles media upload requests using the configured storage provider.
 *
 * @param request - The incoming request containing file and guest name
 * @returns JSON response with upload URL or error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ url: string; uploadMethod?: string; presignedUrl?: string; publicUrl?: string; guestName?: string; fileName?: string; } | ApiErrorResponse>> {
  try {
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

    // Check content type to determine request format
    const contentType = request.headers.get('content-type') || '';

    // Handle metadata-only requests for S3 videos (JSON)
    if (contentType.includes('application/json') && appConfig.storage === StorageProvider.S3) {
      const body = await request.json();
      const { fileName, fileSize, fileType, guestName } = validateMetadataRequest(body);

      // Return presigned URL for direct S3 upload
      const uploadData = await storage.generateVideoUploadUrl({
        fileName,
        fileSize,
        fileType,
        guestName,
        videoId: Date.now().toString() // Generate a unique ID
      });

      return NextResponse.json({
        url: uploadData.uploadUrl,
        uploadMethod: 'direct',
        presignedUrl: uploadData.uploadUrl,
        publicUrl: uploadData.publicUrl,
        guestName,
        fileName
      }, { 
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    // Handle Cloudinary uploads or S3 image uploads through Next.js server (FormData)
    const formData = await request.formData().catch(() => {
      throw new ValidationError('Invalid form data');
    });

    const { file, guestName } = validateUploadRequest(formData);

    // For S3 storage, we need to return presigned URLs for direct uploads to avoid 413 errors
    if (appConfig.storage === StorageProvider.S3) {
      // For S3, check if it's a video file that needs presigned URL
      if (file.type.startsWith('video/')) {
        // Return presigned URL for direct S3 upload
        const uploadData = await storage.generateVideoUploadUrl({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          guestName,
          videoId: Date.now().toString() // Generate a unique ID
        });

        return NextResponse.json({
          url: uploadData.uploadUrl,
          uploadMethod: 'direct',
          presignedUrl: uploadData.uploadUrl,
          publicUrl: uploadData.publicUrl,
          guestName,
          fileName: file.name
        }, { 
          status: 200,
          headers: createRateLimitHeaders(rateLimitResult),
        });
      }
      // For images or small videos, continue with direct upload through Next.js
    }

    const uploadResult = await storage.upload(file, guestName);

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