import cloudinary from "../utils/cloudinary";
import generateBlurPlaceholder from "../utils/generateBlurPlaceholder";
import type { ImageProps } from "../utils/types";
import { ClientGalleryWrapper } from "@/components/ClientGalleryWrapper";
import { PhotoGallery } from "@/components/PhotoGallery";

export const revalidate = 0;

/**
 * Fetches all wedding photos from Cloudinary with metadata and blur placeholders.
 * 
 * This function retrieves photos from the configured Cloudinary folder,
 * transforms them into the application's ImageProps format, and generates
 * blur placeholders for smooth loading experiences.
 * 
 * @returns Promise that resolves to an array of processed image data
 * @throws {Error} If Cloudinary API fails or environment variables are missing
 */
async function fetchWeddingPhotos(): Promise<ImageProps[]> {
  if (!process.env.CLOUDINARY_FOLDER) {
    throw new Error("CLOUDINARY_FOLDER environment variable is required");
  }

  try {
    const searchResults = await cloudinary.v2.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
      .sort_by("created_at", "desc")
      .max_results(400)
      .with_field("context")
      .execute();

    const transformedImages: ImageProps[] = searchResults.resources.map((cloudinaryResource, index) => ({
      id: index,
      height: cloudinaryResource.height?.toString() || "480",
      width: cloudinaryResource.width?.toString() || "720", 
      public_id: cloudinaryResource.public_id,
      format: cloudinaryResource.format,
      guestName: cloudinaryResource.context?.guest || "Unknown Guest",
      uploadDate: cloudinaryResource.created_at,
    }));

    const blurPlaceholderPromises = transformedImages.map((image) => {
      return generateBlurPlaceholder(image);
    });
    
    const blurPlaceholders = await Promise.all(blurPlaceholderPromises);

    transformedImages.forEach((image, index) => {
      image.blurDataUrl = blurPlaceholders[index];
    });

    return transformedImages;

  } catch (error) {
    console.error("Failed to fetch wedding photos:", error);
    throw new Error("Unable to load wedding photos. Please try again later.");
  }
}

/**
 * Home page component that displays the wedding photo gallery.
 * 
 * This page serves as the main entry point for the wedding memories application.
 * It fetches all photos at build time for optimal performance and provides
 * a client-side modal experience using cached photos for instant display.
 * 
 * @returns JSX element containing the photo gallery with integrated modal
 */
export default async function WeddingGalleryHomePage() {
  const weddingPhotos = await fetchWeddingPhotos();

  return (
    <ClientGalleryWrapper>
      <PhotoGallery initialImages={weddingPhotos} />
    </ClientGalleryWrapper>
  );
}

