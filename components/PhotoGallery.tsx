"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ImageProps } from "../utils/types";
import { getOptimizedImageProps, prefetchOnInteraction } from "../utils/imageOptimization";
import CachedModal from "./CachedModal";

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
 * @param photoIndex - Index of the photo to open
 * @param onOpenModal - Function to open modal with specific photo
 */
function handlePhotoKeyNavigation(
  event: React.KeyboardEvent,
  photoIndex: number,
  onOpenModal: (index: number) => void
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpenModal(photoIndex);
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
  
  // Modal state - no router needed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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
   * Opens modal with specific photo - instant client-side action.
   */
  const openPhotoModal = useCallback((photoIndex: number) => {
    setSelectedPhotoIndex(photoIndex);
    setIsModalOpen(true);
  }, []);

  /**
   * Closes the modal.
   */
  const closePhotoModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Listen for new photo uploads and add them to the gallery
  useEffect(() => {
    const handleNewPhoto = (event: Event) => {
      const newPhoto = (event as CustomEvent<ImageProps>).detail;
      setImages(prevImages => [newPhoto, ...prevImages]);
    };

    document.addEventListener("add-new-photo", handleNewPhoto);

    return () => {
      document.removeEventListener("add-new-photo", handleNewPhoto);
    };
  }, []);

  

  // Let Next.js Image handle lazy loading automatically - no manual prefetching needed
  // Next.js Image component already handles:
  // - Intersection Observer for lazy loading
  // - Automatic prefetching based on viewport
  // - Responsive image loading
  // This eliminates the need for manual scroll-based prefetching

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
            onClick={() => openPhotoModal(index)}
            onKeyDown={(e) => handlePhotoKeyNavigation(e, index, openPhotoModal)}
            onMouseEnter={() => prefetchOnInteraction({ id, public_id, format, blurDataUrl, guestName, uploadDate, height: "480", width: "720" }, 'full')}
            tabIndex={0}
            aria-label={`Open photo ${index + 1} ${guestName ? `shared by ${guestName}` : ''}`}
          >
            <Image
              {...getOptimizedImageProps(
                { id, public_id, format, blurDataUrl, guestName, uploadDate, height: "480", width: "720" },
                'gallery',
                { priority: index < 6, quality: 'medium' }
              )}
              className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110 group-focus:brightness-110"
              style={{ transform: "translate3d(0, 0, 0)" }}
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

      {/* Cached modal - uses exact same images as gallery for zero network requests */}
      <CachedModal
        images={images}
        isOpen={isModalOpen}
        initialIndex={selectedPhotoIndex}
        onClose={closePhotoModal}
      />
    </div>
  );
}