import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '../../../utils/cloudinary';
import { processImageForUpload } from '../../../utils/imageProcessor';
import type { ApiResponse, UploadResponse, ApiErrorResponse } from '../../../utils/types';

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
 * @param file - Base64 encoded file data
 * @param guestName - Name of the guest uploading the photo
 * @throws {ValidationError} If validation fails
 */
function validateUploadRequest(
  file: unknown,
  guestName: unknown
): { file: string; guestName: string } {
  if (!file || typeof file !== 'string') {
    throw new ValidationError('Valid file data is required', 'file');
  }

  if (!file.startsWith('data:image/')) {
    throw new ValidationError('File must be a valid image format', 'file');
  }

  const trimmedGuestName = typeof guestName === 'string' ? guestName.trim() : '';
  if (!trimmedGuestName) {
    throw new ValidationError('Guest name is required', 'guestName');
  }

  if (trimmedGuestName.length > 100) {
    throw new ValidationError('Guest name must be less than 100 characters', 'guestName');
  }

  return { file, guestName: trimmedGuestName };
}

/**
 * Validates environment configuration for Cloudinary.
 *
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const requiredVars = [
    'CLOUDINARY_FOLDER',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * Handles photo upload requests to Cloudinary.
 *
 * @param request - The incoming request containing file data and guest name
 * @returns JSON response with upload result or error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  try {
    validateEnvironment();

    const requestBody = await request.json().catch(() => {
      throw new ValidationError('Invalid JSON payload');
    });

    const { file, guestName } = validateUploadRequest(requestBody.file, requestBody.guestName);

    // Process image to reduce file size while maintaining quality
    const processedFile = await processImageForUpload(file);

    const uploadResult = await cloudinary.v2.uploader.upload(processedFile, {
      folder: process.env.CLOUDINARY_FOLDER,
      context: { guest: guestName },
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      max_file_size: 10485760, // 10MB limit
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    const response: UploadResponse = {
      public_id: uploadResult.public_id,
      version: uploadResult.version,
      signature: uploadResult.signature,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      created_at: uploadResult.created_at,
      tags: uploadResult.tags || [],
      bytes: uploadResult.bytes,
      type: uploadResult.type,
      etag: uploadResult.etag,
      placeholder: uploadResult.placeholder || false,
      url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      context: uploadResult.context,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);

    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        error: error.message,
        details: error.field ? `Validation failed for field: ${error.field}` : undefined,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('environment')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Server configuration error',
        details: 'Please contact support if this persists',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to upload photo',
      details: 'Please try again or contact support if the problem persists',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
