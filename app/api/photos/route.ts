import { NextResponse } from 'next/server';
import cloudinary from '../../../utils/cloudinary';
import generateBlurPlaceholder from '../../../utils/generateBlurPlaceholder';
import type { ImageProps, ApiResponse, ApiErrorResponse } from '../../../utils/types';

/**
 * Validates environment configuration for photo fetching.
 *
 * @throws {Error} If required environment variables are missing
 */
function validatePhotoFetchEnvironment(): void {
  if (!process.env.CLOUDINARY_FOLDER) {
    throw new Error('CLOUDINARY_FOLDER environment variable is required');
  }
}

/**
 * Transforms Cloudinary search results into application ImageProps format.
 *
 * @param cloudinaryResources - Raw resources from Cloudinary search
 * @returns Array of transformed image data
 */
function transformCloudinaryResults(cloudinaryResources: any[]): ImageProps[] {
  return cloudinaryResources.map((resource, index) => ({
    id: index,
    height: resource.height?.toString() || '480',
    width: resource.width?.toString() || '720',
    public_id: resource.public_id,
    format: resource.format,
    guestName: resource.context?.guest || 'Unknown Guest',
    uploadDate: resource.created_at,
  }));
}

/**
 * Creates a timeout promise that rejects after the specified duration.
 *
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Promise that rejects with timeout error
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Handles GET requests to fetch all wedding photos.
 *
 * This endpoint provides a refreshed list of all photos from Cloudinary,
 * primarily used for updating the gallery after new uploads.
 *
 * @returns JSON response with photo array or error message
 */
export async function GET(): Promise<NextResponse<ApiResponse<ImageProps[]>>> {
  try {
    validatePhotoFetchEnvironment();

    // Wrap Cloudinary request in Promise.race with 10-second timeout
    const cloudinaryRequest = cloudinary.v2.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
      .sort_by('created_at', 'desc')
      .max_results(400)
      .with_field('context')
      .execute();

    const timeoutPromise = createTimeoutPromise(10000); // 10 seconds

    const searchResults = await Promise.race([cloudinaryRequest, timeoutPromise]);

    const transformedPhotos = transformCloudinaryResults(searchResults.resources);

    const blurPlaceholderPromises = searchResults.resources.map((resource: any) => {
      return generateBlurPlaceholder(resource);
    });

    const blurPlaceholders = await Promise.all(blurPlaceholderPromises);

    transformedPhotos.forEach((photo, index) => {
      photo.blurDataUrl = blurPlaceholders[index];
    });

    return NextResponse.json(transformedPhotos, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch wedding photos:', error);

    // Check if error is timeout-related
    if (error instanceof Error && error.message.includes('Request timeout')) {
      const timeoutResponse: ApiErrorResponse = {
        error: 'Request timeout',
        details: 'The photo service is taking too long to respond. Please try again in a moment.',
      };
      return NextResponse.json(timeoutResponse, { status: 504 });
    }

    if (error instanceof Error && error.message.includes('environment')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Server configuration error',
        details: 'Please contact support if this persists',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to fetch photos',
      details: 'Unable to load wedding photos. Please try again later.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
