"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ImageProps } from "../utils/types";

interface PhotoGalleryProps {
  initialImages: ImageProps[];
}

export function PhotoGallery({ initialImages }: PhotoGalleryProps) {
  const [images, setImages] = useState<ImageProps[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const refetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/photos");
      if (response.ok) {
        const newImages = await response.json();
        setImages(newImages);
        return newImages.length;
      }
    } catch (error) {
      console.error("Failed to refetch photos:", error);
    } finally {
      setIsLoading(false);
    }
    return 0;
  }, []);

  // Expose refetch function globally so Upload component can call it
  useEffect(() => {
    (window as any).refetchPhotos = refetchPhotos;
    return () => {
      delete (window as any).refetchPhotos;
    };
  }, [refetchPhotos]);

  return (
    <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4">
      {isLoading && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            <span className="text-sm font-medium">Loading new photos...</span>
          </div>
        </div>
      )}
      {images.map(({ id, public_id, format, blurDataUrl, guestName, uploadDate }) => (
        <div
          key={id}
          onClick={() => router.push(`/?photoId=${id}`, { scroll: false })}
          className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
        >
          <Image
            alt="Saygin & Dilan photo"
            className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
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
          />
          {(guestName || uploadDate) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
              <div className="text-white text-xs font-medium p-2 text-center">
                {guestName && <p>Shared by {guestName}</p>}
                {uploadDate && (
                  <p className="text-white/80">
                    {new Date(uploadDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}