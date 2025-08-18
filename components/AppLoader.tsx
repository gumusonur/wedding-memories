'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Spinner } from './ui/spinner';
import { cn } from '@/lib/utils';

interface AppLoaderProps {
  children: React.ReactNode;
  minLoadTime?: number;
}

export function AppLoader({ children, minLoadTime = 1500 }: AppLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade animation to complete before hiding loader
      setTimeout(() => setIsLoading(false), 300);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  // Don't render loader until themes are mounted to prevent flash
  if (!mounted || !isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300',
          fadeOut ? 'opacity-0' : 'opacity-100'
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" className="text-foreground" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {process.env.NEXT_PUBLIC_GROOM_NAME || 'Groom'} &{' '}
              {process.env.NEXT_PUBLIC_BRIDE_NAME || 'Bride'} Wedding Memories
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Loading beautiful memories...</p>
          </div>
        </div>
      </div>
      {/* Render children behind loader with reduced opacity */}
      <div className="opacity-50">{children}</div>
    </>
  );
}
