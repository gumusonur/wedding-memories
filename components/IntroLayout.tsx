'use client';

import React from 'react';
import { Footer } from './Footer';
import { SettingsPanel } from './SettingsPanel';

interface IntroLayoutProps {
  children: React.ReactNode;
}

export function IntroLayout({ children }: IntroLayoutProps) {
  return (
    <div className="flex flex-col justify-between h-dvh">
      <div className="fixed top-4 right-4">
        <SettingsPanel />
      </div>

      <main className="flex items-center mx-auto h-full px-4 pb-4">{children}</main>

      <Footer />
    </div>
  );
}
