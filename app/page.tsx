import cloudinary from '../utils/cloudinary';
import generateBlurPlaceholder from '../utils/generateBlurPlaceholder';
import { appConfig } from '../config';
import type { MediaProps } from '../utils/types';
import { ClientGalleryWrapper } from '@/components/ClientGalleryWrapper';
import { MediaGallery } from '@/components/MediaGallery';

export const revalidate = 0;

/**
 * Fetches wedding media from Cloudinary with metadata and blur placeholders for images.
 *
 * This function retrieves media from the configured Cloudinary folder,
 * transforms them into the application's MediaProps format, and generates
 * blur placeholders for smooth loading experiences for images.
 * 
 * Note: Server-side fetching always shows all media. Guest isolation 
 * filtering only applies to client-side API calls.
 *
 * @returns Promise that resolves to an array of processed media data
 * @throws {Error} If Cloudinary API fails or environment variables are missing
 */
async function fetchWeddingMedia(): Promise<MediaProps[]> {
  if (!process.env.CLOUDINARY_FOLDER) {
    throw new Error('CLOUDINARY_FOLDER environment variable is required');
  }

  try {
    const searchResults = await cloudinary.v2.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
      .sort_by('created_at', 'desc')
      .max_results(400)
      .with_field('context')
      .execute();

    const transformedMedia: MediaProps[] = searchResults.resources.map(
      (cloudinaryResource: any, index: number) => ({
        id: index,
        height: cloudinaryResource.height?.toString() || '480',
        width: cloudinaryResource.width?.toString() || '720',
        public_id: cloudinaryResource.public_id,
        format: cloudinaryResource.format || 'unknown',
        resource_type: cloudinaryResource.resource_type,
        guestName: cloudinaryResource.context?.guest || 'Unknown Guest',
        uploadDate: cloudinaryResource.created_at,
      })
    );

    const imageItems = transformedMedia.filter(item => item.resource_type === 'image');
    const blurPlaceholderPromises = imageItems.map((image) => {
      return generateBlurPlaceholder(image);
    });

    const blurPlaceholders = await Promise.all(blurPlaceholderPromises);

    imageItems.forEach((image, index) => {
      image.blurDataUrl = blurPlaceholders[index];
    });

    return transformedMedia;
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
