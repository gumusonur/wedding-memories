'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { appConfig } from '../config';
import { Upload } from './Upload';
import { ModeToggle } from './ModeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useGuestName, useMediaModalOpen } from '../store/useAppStore';
import { useI18n } from './I18nProvider';
import { WelcomeDialog } from './WelcomeDialog';

interface ClientGalleryWrapperProps {
  children: React.ReactNode;
}

export function ClientGalleryWrapper({ children }: ClientGalleryWrapperProps) {
  // Zustand store hooks
  const guestName = useGuestName();
  const isMediaModalOpen = useMediaModalOpen();
  const { t } = useI18n();

  const searchParams = useSearchParams();
  const photoId = searchParams.get('photoId');
  const isModalOpen = !!photoId || isMediaModalOpen;

  return (
    <>
      <main className="mx-auto max-w-[1960px] px-4 py-4">
        <header className="flex justify-between items-center gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif font-light text-foreground leading-tight truncate">
              <span className="text-primary font-medium">{appConfig.brideName}</span>
              <span className="text-muted-foreground mx-1 sm:mx-2 font-light">&</span>
              <span className="text-primary font-medium">{appConfig.groomName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-light">{t('gallery.title')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher variant="minimal" />
            <ModeToggle />
          </div>
        </header>

        {children}
      </main>

      {/* Floating Upload Button - Hidden when modal is open */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-opacity duration-200 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Upload currentGuestName={guestName} />
      </div>
    </>
  );
}
