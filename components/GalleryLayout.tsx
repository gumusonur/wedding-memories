'use client';

import React from 'react';
import { Upload } from './Upload';
import { Header } from './Header';
import { Footer } from './Footer';

interface GalleryLayoutProps {
  children: React.ReactNode;
}

export function GalleryLayout({ children }: GalleryLayoutProps) {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1960px] px-4 pb-4 mt-16">{children}</main>

      <Footer />

      <Upload />
    </>
  );
}
