/**
 * Storage-aware media component that handles both Cloudinary and S3/Wasabi storage.
 *
 * - For Cloudinary: Uses Next.js Image for optimization or a video tag.
 * - For S3/Wasabi: Uses direct img/video tags to avoid optimization issues.
 */

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { appConfig, StorageProvider } from '../config';
import { useI18n } from './I18nProvider';
import type { MediaProps } from '../utils/types';
import { Play, Video } from 'lucide-react';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isDesktopDevice = () => {
  if (typeof window === 'undefined') return true;
  return !isMobileDevice();
};

interface StorageAwareMediaProps extends Omit<MediaProps, 'id' | 'public_id'> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onLoad?: () => void;
  draggable?: boolean;
  poster?: string;
  controls?: boolean;
  context?: 'gallery' | 'modal' | 'thumb';
  videoId?: string;
  duration?: number;
  guestName?: string;
}

export function StorageAwareMedia({
  src,
  alt,
  width = '720',
  height = '480',
  resource_type,
  className,
  sizes,
  priority = false,
  blurDataUrl,
  style,
  onClick,
  onMouseEnter,
  tabIndex,
  onKeyDown,
  onLoad,
  draggable = true,
  poster,
  controls,
  context = 'gallery',
  videoId: _videoId,
  duration: _duration,
  guestName: _guestName,
}: StorageAwareMediaProps) {
  const isCloudinary = appConfig.storage === StorageProvider.Cloudinary;
  const widthNum = parseInt(width, 10);
  const heightNum = parseInt(height, 10);
  const { t } = useI18n();

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    // For modal context, don't show loading state initially
    if (context === 'modal') return false;
    return true;
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const isGalleryView = context === 'gallery' ? !controls : false;

  useEffect(() => {
    const mobile = isMobileDevice();
    const desktop = isDesktopDevice();
    setIsMobile(mobile);
    setIsDesktop(desktop);
  }, []);

  useEffect(() => {
    if (resource_type !== 'video') return;

    const video = videoRef.current;
    if (!video) return;

    // Set initial loading state only if video isn't already loaded
    setLoadError(false);

    // Check if video is already loaded before setting loading state
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    const handleLoadedMetadata = () => {
      // For thumbnails, metadata is enough
      if (context === 'thumb') {
        setIsLoading(false);
      }
    };

    const handleCanPlay = () => {
      // Video is ready to play
      setIsLoading(false);
    };

    const handleError = () => {
      setLoadError(true);
      setIsLoading(false);
    };

    // Check if video is already ready
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      if (context === 'thumb') {
        setIsLoading(false);
        return;
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsLoading(false);
      return;
    }

    const handleLoadStart = () => {
      // Video has started loading
      setIsLoading(true);
      setLoadError(false);
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [resource_type, isGalleryView, context, src]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      // Ensure video is ready for playback
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        // Video needs more data - upgrade preload
        video.preload = 'auto';
        video.load(); // Force reload with auto preload
      }
      // Clear any loading states since user initiated play
      setIsLoading(false);
    }
  };

  const handleVideoInteraction = () => {
    const video = videoRef.current;
    if (video && video.preload === 'none') {
      video.preload = 'metadata';
      video.load();
    }
  };

  if (resource_type === 'video') {
    // Use regular video element
    return (
      <div
        className="relative group w-full h-full"
        onClick={onClick}
        onMouseEnter={() => {
          handleVideoInteraction();
          onMouseEnter?.();
          // Desktop hover play for gallery context
          if (isDesktop && context === 'gallery' && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onMouseLeave={() => {
          // Desktop hover pause for gallery context
          if (isDesktop && context === 'gallery' && videoRef.current) {
            videoRef.current.pause();
          }
        }}
        onFocus={handleVideoInteraction}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
      >
        {isLoading && !loadError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
        )}

        {loadError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-600 dark:text-gray-300">
              {context === 'thumb' ? (
                <div className="text-xs font-medium">{t('common.error')}</div>
              ) : (
                <>
                  <div className="text-sm font-medium mb-1">{t('common.videoUnavailable')}</div>
                  <div className="text-xs opacity-75">{t('common.failedToLoad')}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Play overlay for gallery view */}
        {context === 'gallery' && !controls && !isLoading && !loadError && (
          <div
            className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 rounded-lg flex items-center justify-center overflow-hidden"
            onClick={(e) => {
              // For gallery videos, ensure video is ready before playing
              const video = videoRef.current;
              if (video && !controls) {
                e.stopPropagation();
                if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                  // Prepare video for play
                  video.preload = 'auto';
                  video.load();
                  setIsLoading(true);
                  video.addEventListener(
                    'canplay',
                    () => {
                      setIsLoading(false);
                      video.play().catch(() => {
                        // Fallback if autoplay fails
                        setIsLoading(false);
                      });
                    },
                    { once: true }
                  );
                } else {
                  video.play().catch(() => {
                    // Video play failed, user will need to try again
                  });
                }
              }
            }}
          >
            <div className="bg-black/70 rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm shadow-lg p-4">
              <Play className="text-white w-4 h-4" fill="white" />
            </div>
          </div>
        )}

        {/* Video indicator icon - always visible for videos */}
        <Video
          className={`absolute ${context === 'thumb' ? 'top-1 right-1 w-3 h-3' : 'top-2 right-2 w-4 h-4'} text-white drop-shadow-lg z-10`}
        />

        <video
          ref={videoRef}
          src={src}
          className={`${className} opacity-100 w-full h-full object-contain`}
          style={{
            ...style,
          }}
          controls={controls}
          poster={poster}
          onPlay={handlePlay}
          draggable={draggable}
          playsInline
          muted={isGalleryView}
          preload={context === 'thumb' ? 'metadata' : 'auto'}
          disablePictureInPicture={isMobile}
          onLoadedMetadata={() => {
            // Force show first frame on mobile for thumbnails
            if (isMobile && context === 'thumb' && videoRef.current) {
              videoRef.current.currentTime = 0.1;
            }
          }}
        />
      </div>
    );
  }

  // For Cloudinary Images, use Next.js Image with optimization
  if (isCloudinary) {
    // For modal context, render image directly without wrapper
    if (context === 'modal') {
      return (
        <Image
          src={src}
          alt={alt}
          width={widthNum}
          height={heightNum}
          className={`${className} transition-opacity duration-300`}
          sizes={sizes}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          placeholder={blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={blurDataUrl}
          style={style}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          tabIndex={tabIndex}
          onKeyDown={onKeyDown}
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onLoadStart={() => setIsLoading(true)}
          draggable={draggable}
        />
      );
    }
    
    // For gallery/thumb contexts, use wrapper with aspect ratio
    return (
      <div className="relative" style={context === 'thumb' ? { width: '80px', height: '80px' } : { aspectRatio: `${widthNum}/${heightNum}` }}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
        )}

        <Image
          src={src}
          alt={alt}
          width={widthNum}
          height={heightNum}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          sizes={sizes}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          placeholder={blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={blurDataUrl}
          style={style}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          tabIndex={tabIndex}
          onKeyDown={onKeyDown}
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onLoadStart={() => setIsLoading(true)}
          draggable={draggable}
        />
      </div>
    );
  }

  // For S3/Wasabi Images, use direct img tag
  // For modal context, render image directly without wrapper
  if (context === 'modal') {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt}
        width={widthNum}
        height={heightNum}
        className={`${className} transition-opacity duration-300`}
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
          ...style,
        }}
        loading={priority ? 'eager' : 'lazy'}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onLoadStart={() => setIsLoading(true)}
        draggable={draggable}
        crossOrigin="anonymous"
      />
    );
  }
  
  // For gallery/thumb contexts, use wrapper with aspect ratio
  return (
    <div className="relative" style={context === 'thumb' ? { width: '80px', height: '80px' } : { aspectRatio: `${widthNum}/${heightNum}` }}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={widthNum}
        height={heightNum}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
          ...style,
        }}
        loading={priority ? 'eager' : 'lazy'}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onLoadStart={() => setIsLoading(true)}
        draggable={draggable}
        crossOrigin="anonymous"
      />
    </div>
  );
}
