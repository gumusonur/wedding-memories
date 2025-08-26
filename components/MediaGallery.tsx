'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { MediaProps } from '../utils/types';
import { appConfig } from '../config';
import { getOptimizedMediaProps, prefetchMediaOnInteraction } from '../utils/mediaOptimization';
import { StorageAwareMedia } from './StorageAwareMedia';
import MediaModal from './MediaModal';
import {
  useMedia,
  useSetMedia,
  useMediaModalOpen,
  useSelectedMediaIndex,
  useOpenMediaModal,
  useCloseMediaModal,
  useIsLoadingMedia,
  useLastRefreshTime,
  useSetIsLoadingMedia,
  useRefreshMedia,
  useGuestName,
} from '../store/useAppStore';
import { useI18n } from './I18nProvider';

interface MediaGalleryProps {
  initialMedia: MediaProps[];
}

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
    console.warn('Invalid date format:', dateString);
    return 'Date unavailable';
  }
}

function generateMediaAltText(guestName?: string, mediaIndex?: number): string {
  const coupleNames = `${appConfig.brideName} & ${appConfig.groomName}`;

  if (guestName && guestName !== 'Unknown Guest') {
    return `Wedding media shared by ${guestName} - ${coupleNames} wedding memories`;
  }

  return `Wedding media ${mediaIndex ? `#${mediaIndex + 1}` : ''} - ${coupleNames} wedding memories`;
}

function handleMediaKeyNavigation(
  event: React.KeyboardEvent,
  mediaIndex: number,
  onOpenModal: (index: number) => void
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpenModal(mediaIndex);
  }
}

export function MediaGallery({ initialMedia }: MediaGalleryProps) {
  const media = useMedia();
  const setMedia = useSetMedia();
  const isModalOpen = useMediaModalOpen();
  const selectedMediaIndex = useSelectedMediaIndex();
  const openModal = useOpenMediaModal();
  const closeModal = useCloseMediaModal();
  const isLoading = useIsLoadingMedia();
  const lastRefreshTime = useLastRefreshTime();
  const setIsLoading = useSetIsLoadingMedia();
  const refresh = useRefreshMedia();
  const guestName = useGuestName();
  const previousGuestName = useRef<string | null>(null);
  const { t, language } = useI18n();

  useEffect(() => {
    if (initialMedia.length > 0 && media.length === 0) {
      setMedia(initialMedia);
    }
  }, [initialMedia, media.length, setMedia]);

  const refetchWeddingMediaInternal = useCallback(
    async (showLoading: boolean = true, currentGuestName?: string): Promise<number> => {
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        let url = '/api/photos';
        const guestToUse = currentGuestName || guestName;
        if (appConfig.guestIsolation && guestToUse) {
          url += `?guest=${encodeURIComponent(guestToUse)}`;
        }

        const response = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const refreshedMedia = await response.json();
          setMedia(refreshedMedia);
          refresh();
          return refreshedMedia.length;
        } else {
          console.error('Failed to refetch media:', response.statusText);
        }
      } catch (error) {
        console.error('Network error while refetching media:', error);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
      return 0;
    },
    [setMedia, setIsLoading, refresh, guestName]
  );

  // Single fetch effect for guest isolation - only refetch if guest changes and we need isolation
  useEffect(() => {
    if (appConfig.guestIsolation && guestName) {
      const isNewGuest = previousGuestName.current !== guestName;

      if (isNewGuest) {
        refetchWeddingMediaInternal(previousGuestName.current !== null, guestName);
        previousGuestName.current = guestName;
      }
    }
  }, [guestName, refetchWeddingMediaInternal]);

  const openMediaModal = useCallback(
    (mediaIndex: number) => {
      openModal(mediaIndex);
    },
    [openModal]
  );

  if (media.length === 0 && !isLoading) {
    return (
      <div className="text-center py-24 text-muted-foreground" role="status" aria-live="polite">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{t('gallery.noPhotos')}</h2>
          <p className="text-lg">
            {t('gallery.noPhotosDescription', { 
              brideName: appConfig.brideName, 
              groomName: appConfig.groomName 
            })}
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
          aria-label={t('accessibility.loadingNewMedia')}
        >
          <div className="flex items-center justify-center gap-3">
            <div
              className="animate-[spin_1.5s_ease-in-out_infinite] rounded-full h-5 w-5 border-2 border-current border-r-transparent"
              aria-hidden="true"
            />
            <span className="text-sm font-medium">{t('gallery.loadingPhotos')}</span>
          </div>
        </div>
      )}

      <div
        className="columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4"
        role="grid"
        aria-label={`${t('gallery.title')} ${t('gallery.photoCount', { count: media.length })}`}
      >
        {media.map((mediaItem, index) => (
          <div
            key={mediaItem.id}
            role="gridcell"
            className="after:content group relative mb-5 block w-full cursor-pointer after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            onClick={() => openMediaModal(index)}
            onKeyDown={(e) => handleMediaKeyNavigation(e, index, openMediaModal)}
            onMouseEnter={() => prefetchMediaOnInteraction(mediaItem, 'full')}
            tabIndex={0}
            aria-label={mediaItem.guestName && mediaItem.guestName !== 'Unknown Guest' 
              ? t('gallery.openPhotoWithGuest', { 
                  index: index + 1, 
                  guestName: mediaItem.guestName 
                })
              : t('gallery.openPhoto', { index: index + 1 })}
          >
            <StorageAwareMedia
              {...getOptimizedMediaProps(mediaItem, 'gallery', { priority: index < 6 })}
              className="overflow-hidden transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110 group-focus:brightness-110"
              style={{ transform: 'translate3d(0, 0, 0)' }}
            />
            {(mediaItem.guestName || mediaItem.uploadDate) && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg"
                aria-hidden="true"
              >
                <div className="text-white text-xs font-medium p-2 text-center">
                  {mediaItem.guestName && mediaItem.guestName !== 'Unknown Guest' && (
                    <p>{t('gallery.sharedBy', { name: mediaItem.guestName })}</p>
                  )}
                  {mediaItem.uploadDate && (
                    <p className="text-white/80">{formatUploadDate(mediaItem.uploadDate, language)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {t('accessibility.galleryUpdated', { time: lastRefreshTime.toLocaleTimeString(language) })}
      </div>

      <MediaModal
        items={media}
        isOpen={isModalOpen}
        initialIndex={selectedMediaIndex}
        onClose={closeModal}
      />
    </div>
  );
}
