import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../storage';
import { checkUploadRateLimit, createRateLimitHeaders } from '../../../utils/rateLimit';
import type { ApiErrorResponse } from '../../../utils/types';

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

  if (!file.type.startsWith('image/')) {
    throw new ValidationError('File must be a valid image format', 'file');
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
 * Handles photo upload requests using the configured storage provider.
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
        details: rateLimitResult.message || 'Please wait before uploading more photos.',
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

    // Upload using the configured storage provider
    const uploadResult = await storage.upload(file, guestName);

    // Return photo metadata for immediate UI update
    const photoData = {
      ...uploadResult,
      guestName,
      uploadDate: uploadResult.created_at,
    };

    return NextResponse.json(photoData, { 
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
      error: 'Failed to upload photo',
      details: 'Please try again or contact support if the problem persists',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
