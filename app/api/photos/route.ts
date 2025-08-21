import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../storage';
import { appConfig } from '../../../config';
import type { ImageProps, ApiErrorResponse } from '../../../utils/types';

/**
 * Validates the guest filter request.
 *
 * @param guestFilter - The guest name from query parameters
 * @throws {Error} If guest isolation is enabled but no guest name provided
 */
function validateGuestFilter(guestFilter: string | null): void {
  if (appConfig.guestIsolation && !guestFilter) {
    throw new Error('Guest name is required when guest isolation is enabled');
  }
}

/**
 * Handles GET requests to fetch wedding photos.
 *
 * This endpoint provides a list of photos with metadata from the configured storage provider,
 * with optional filtering based on guest isolation settings.
 * 
 * Query parameters:
 * - guest: Filter photos by guest name (required if guestIsolation is true)
 *
 * @param request - Next.js request object
 * @returns JSON response with photo array or error message
 */
export async function GET(request: NextRequest): Promise<NextResponse<ImageProps[] | ApiErrorResponse>> {
  try {
    // Extract guest filter from query parameters
    const { searchParams } = new URL(request.url);
    const guestFilter = searchParams.get('guest');

    // Validate guest filter requirements
    validateGuestFilter(guestFilter);

    // Fetch photos from storage provider
    const photos = await storage.list(guestFilter || undefined);

    return NextResponse.json(photos, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch wedding photos:', error);

    if (error instanceof Error && error.message.includes('Guest name is required')) {
      const errorResponse: ApiErrorResponse = {
        error: 'Guest name required',
        details: 'A guest name must be provided when guest isolation is enabled.',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to fetch photos',
      details: 'Unable to load wedding photos. Please try again later.',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
