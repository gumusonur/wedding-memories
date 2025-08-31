'use client';

import { useGuestName, useHasHydrated } from '../store/useAppStore';
import { GuestNameForm } from './GuestNameForm';
import { IntroLayout } from './IntroLayout';
import { GalleryLayout } from './GalleryLayout';
import { MediaGallery } from './MediaGallery';
import { MediaProps } from '../utils/types';

interface WeddingGalleryProps {
  initialMedia: MediaProps[];
}

export function WeddingGallery({ initialMedia }: WeddingGalleryProps) {
  const guestName = useGuestName();
  const hasHydrated = useHasHydrated();
  
  // Show intro layout when guest name isn't set
  const shouldShowIntro = hasHydrated && !guestName;
  
  if (shouldShowIntro) {
    return (
      <IntroLayout>
        <GuestNameForm />
      </IntroLayout>
    );
  }
  
  // Show gallery layout when guest name is set
  return (
    <GalleryLayout>
      <MediaGallery initialMedia={initialMedia} />
    </GalleryLayout>
  );
}