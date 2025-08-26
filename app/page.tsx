import generateBlurPlaceholder from '../utils/generateBlurPlaceholder';
import { appConfig } from '../config';
import type { MediaProps } from '../utils/types';
import { ClientGalleryWrapper } from '@/components/ClientGalleryWrapper';
import { MediaGallery } from '@/components/MediaGallery';
import { storage } from '../storage';

export const revalidate = 0;

/**
 * Fetches wedding media from the configured storage provider with metadata and blur placeholders for images.
 *
 * This function retrieves media from the configured storage provider (Cloudinary or S3),
 * transforms them into the application's MediaProps format, and generates
 * blur placeholders for smooth loading experiences for images.
 * 
 * Note: Server-side fetching always shows all media. Guest isolation 
 * filtering only applies to client-side API calls.
 *
 * @returns Promise that resolves to an array of processed media data
 * @throws {Error} If storage service fails or environment variables are missing
 */
async function fetchWeddingMedia(): Promise<MediaProps[]> {
  try {
    // Get all media without guest filtering for server-side rendering
    const mediaItems = await storage.list();
    
    // Debug: Log first few items to see URL structure
    console.log('[DEBUG] First 3 media items from storage:');
    mediaItems.slice(0, 3).forEach((item, index) => {
      console.log(`[${index}] public_id: ${item.public_id}`);
      console.log(`[${index}] resource_type: ${item.resource_type}`);
    });

    // Generate blur placeholders for images
    const imageItems = mediaItems.filter((item: MediaProps) => item.resource_type === 'image');
    const blurPlaceholderPromises = imageItems.map((image: MediaProps) => {
      return generateBlurPlaceholder(image);
    });

    const blurPlaceholders = await Promise.all(blurPlaceholderPromises);

    imageItems.forEach((image: MediaProps, index: number) => {
      image.blurDataUrl = blurPlaceholders[index];
    });

    return mediaItems;
  } catch (error) {
    console.error('Failed to fetch wedding media:', error);
    throw new Error('Unable to load wedding media. Please try again later.');
  }
}

/**
 * Home page component that displays the wedding media gallery.
 *
 * This page serves as the main entry point for the wedding memories application.
 * When guest isolation is disabled, it fetches all media at build time for optimal performance.
 * When guest isolation is enabled, it shows an empty gallery initially and lets the client
 * fetch media based on the guest name.
 *
 * @returns JSX element containing the media gallery with integrated modal
 */
export default async function WeddingMediaHomePage() {
  // If guest isolation is enabled, start with empty array to let client-side filtering handle it
  const weddingMedia = appConfig.guestIsolation ? [] : await fetchWeddingMedia();

  return (
    <ClientGalleryWrapper>
      <MediaGallery initialMedia={weddingMedia} />
    </ClientGalleryWrapper>
  );
}
