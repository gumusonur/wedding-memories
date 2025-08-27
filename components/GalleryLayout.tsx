'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload } from './Upload';
import { useGuestName, useMediaModalOpen } from '../store/useAppStore';
import { Header } from './Header';
import { Footer } from './Footer';

interface GalleryLayoutProps {
  children: React.ReactNode;
}

export function GalleryLayout({ children }: GalleryLayoutProps) {
  const guestName = useGuestName();
  const isMediaModalOpen = useMediaModalOpen();

  const searchParams = useSearchParams();
  const photoId = searchParams.get('photoId');
  const isModalOpen = !!photoId || isMediaModalOpen;

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1960px] px-4 pb-4 mt-16">
        {children}
      </main>

      <Footer />

      <div
        className={`fixed bottom-6 right-6 z-50 transition-opacity duration-200 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Upload currentGuestName={guestName} />
      </div>
    </>
  );
}