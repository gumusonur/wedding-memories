'use client';

import { appConfig } from '@/config';
import { SettingsPanel } from './SettingsPanel';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

export const Header = (props: {}) => {
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;
    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (!headerRef.current) return;

          headerRef.current.classList.toggle(
            '!-translate-y-full',
            currentScrollY > lastScrollY.current && currentScrollY > 57
          );

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 w-full z-10 py-[0.5rem] px-[1rem] transform transition-transform duration-300 ease-in-out bg-(--background) flex justify-between items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-serif font-light text-foreground leading-tight truncate">
            <span className="text-primary font-medium">{appConfig.brideName}</span>
            <span className="text-muted-foreground mx-1 sm:mx-2 font-light">&</span>
            <span className="text-primary font-medium">{appConfig.groomName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-light">
            {t('gallery.title')}
          </p>
        </div>
        <div className="flex items-center flex-shrink-0">
          <SettingsPanel />
        </div>
      </header>
    </>
  );
};
