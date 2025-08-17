"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ImageProps } from "../utils/types";

interface PhotoGalleryProps {
  initialImages: ImageProps[];
}

/**
 * Formats a date string for display with internationalization support.
 * 
 * @param dateString - ISO date string from Cloudinary
 * @param locale - Locale for date formatting (defaults to user's locale)
 * @returns Formatted date string
 */
function formatUploadDate(dateString: string, locale: string = 'en-US'): string {
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn("Invalid date format:", dateString);
    return "Date unavailable";
  }
}

/**
 * Generates accessible alt text for wedding photos.
 * 
 * @param guestName - Name of the guest who uploaded the photo
 * @param photoIndex - Index of the photo in the gallery
 * @returns Descriptive alt text for screen readers
 */
function generatePhotoAltText(guestName?: string, photoIndex?: number): string {
  const coupleNames = `${process.env.NEXT_PUBLIC_GROOM_NAME || "Groom"} & ${process.env.NEXT_PUBLIC_BRIDE_NAME || "Bride"}`;
  
  if (guestName && guestName !== "Unknown Guest") {
    return `Wedding photo shared by ${guestName} - ${coupleNames} wedding memories`;
  }
  
  return `Wedding photo ${photoIndex ? `#${photoIndex + 1}` : ''} - ${coupleNames} wedding memories`;
}

/**
 * Handles keyboard navigation for photo gallery accessibility.
 * 
 * @param event - Keyboard event
 * @param photoId - ID of the photo to navigate to
 * @param router - Next.js router instance
 */
function handlePhotoKeyNavigation(
  event: React.KeyboardEvent,
  photoId: number,
  router: ReturnType<typeof useRouter>
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    router.push(`/?photoId=${photoId}`, { scroll: false });
  }
}

/**
 * Wedding photo gallery component with masonry layout.
 * 
 * Displays wedding photos in a responsive masonry grid with accessibility
 * features including keyboard navigation, screen reader support, and
 * proper focus management.
 */
export function PhotoGallery({ initialImages }: PhotoGalleryProps) {
  const [images, setImages] = useState<ImageProps[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefetchTime, setLastRefetchTime] = useState<Date>(new Date());
  const router = useRouter();

  /**
   * Refetches photos from the server to update the gallery.
   * Used after new photos are uploaded to refresh the display.
   */
  const refetchWeddingPhotos = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/photos", {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const refreshedImages = await response.json();
        setImages(refreshedImages);
        setLastRefetchTime(new Date());
        return refreshedImages.length;
      } else {
        console.error("Failed to refetch photos:", response.statusText);
      }
    } catch (error) {
      console.error("Network error while refetching photos:", error);
    } finally {
      setIsLoading(false);
    }
    return 0;
  }, []);

  /**
   * Navigates to a specific photo with accessibility considerations.
   */
  const navigateToPhoto = useCallback((photoId: number) => {
    router.push(`/?photoId=${photoId}`, { scroll: false });
  }, [router]);

  // Expose refetch function globally for Upload component integration
  useEffect(() => {
    (window as any).refetchPhotos = refetchWeddingPhotos;
    return () => {
      delete (window as any).refetchPhotos;
    };
  }, [refetchWeddingPhotos]);

  if (images.length === 0 && !isLoading) {
    return (
      <div 
        className="text-center py-24 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">No photos yet</h2>
          <p className="text-lg">
            Be the first to share a memory from {process.env.NEXT_PUBLIC_GROOM_NAME || "Groom"} & {process.env.NEXT_PUBLIC_BRIDE_NAME || "Bride"}&apos;s special day!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div 
          className="text-center py-8 text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-label="Loading new photos"
        >
          <div className="flex items-center justify-center gap-3">
            <div 
              className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"
              aria-hidden="true"
            />
            <span className="text-sm font-medium">Loading new photos...</span>
          </div>
        </div>
      )}

      <div 
        className="columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4"
        role="grid"
        aria-label={`Wedding photo gallery with ${images.length} photos`}
      >
        {images.map(({ id, public_id, format, blurDataUrl, guestName, uploadDate }, index) => (
          <div
            key={id}
            role="gridcell"
            className="after:content group relative mb-5 block w-full cursor-pointer after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            onClick={() => navigateToPhoto(id)}
            onKeyDown={(e) => handlePhotoKeyNavigation(e, id, router)}
            tabIndex={0}
            aria-label={`Open photo ${index + 1} ${guestName ? `shared by ${guestName}` : ''}`}
          >
            <Image
              alt={generatePhotoAltText(guestName, index)}
              className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110 group-focus:brightness-110"
              style={{ transform: "translate3d(0, 0, 0)" }}
              placeholder="blur"
              blurDataURL={blurDataUrl}
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_720/${public_id}.${format}`}
              width={720}
              height={480}
              sizes="(max-width: 640px) 100vw,
                (max-width: 1280px) 50vw,
                (max-width: 1536px) 33vw,
                25vw"
              loading={index < 6 ? "eager" : "lazy"}
            />
            {(guestName || uploadDate) && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg"
                aria-hidden="true"
              >
                <div className="text-white text-xs font-medium p-2 text-center">
                  {guestName && guestName !== "Unknown Guest" && (
                    <p>Shared by {guestName}</p>
                  )}
                  {uploadDate && (
                    <p className="text-white/80">
                      {formatUploadDate(uploadDate)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Screen reader announcement for gallery updates */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        Gallery last updated: {lastRefetchTime.toLocaleTimeString()}
      </div>
    </div>
  );
}