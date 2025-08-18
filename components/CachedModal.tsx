/**
 * Modal that uses the exact same cached images from the gallery - zero network requests!
 * This component reuses the already-loaded images for instant display.
 */

'use client';

import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import useKeypress from 'react-use-keypress';
import { useSwipeable } from 'react-swipeable';
import { Download, ExternalLink, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { ImageProps } from '../utils/types';
import { variants } from '../utils/animationVariants';
import downloadPhoto from '../utils/downloadPhoto';
import { range } from '../utils/range';
import { getOptimizedImageProps } from '../utils/imageOptimization';

interface CachedModalProps {
  images: ImageProps[];
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
}

export function CachedModal({ images, isOpen, initialIndex, onClose }: CachedModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [loaded, setLoaded] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Update current index when initial index changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setLoaded(false);
    // Reset zoom and pan when image changes
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [initialIndex]);

  // Reset zoom and pan when image changes
  const resetImageView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Prevent browser zoom on the document when modal is open
  useEffect(() => {
    if (isOpen) {
      const preventDefault = (e: Event) => {
        if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 1) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchstart', preventDefault, { passive: false });
      document.addEventListener('touchmove', preventDefault, { passive: false });
      document.addEventListener('gesturestart', preventDefault, { passive: false });
      document.addEventListener('gesturechange', preventDefault, { passive: false });
      document.addEventListener('gestureend', preventDefault, { passive: false });
      
      // Add CSS to body to prevent zoom
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      return () => {
        document.removeEventListener('touchstart', preventDefault);
        document.removeEventListener('touchmove', preventDefault);
        document.removeEventListener('gesturestart', preventDefault);
        document.removeEventListener('gesturechange', preventDefault);
        document.removeEventListener('gestureend', preventDefault);
        
        // Restore body styles
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isOpen]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    resetImageView();
  }, [resetImageView]);

  const changePhotoIndex = useCallback(
    (newIndex: number) => {
      if (newIndex > currentIndex) {
        setDirection(1);
      } else {
        setDirection(-1);
      }
      setCurrentIndex(newIndex);
      // Reset zoom and pan when changing images
      resetImageView();
    },
    [currentIndex, resetImageView]
  );

  // Keyboard navigation
  useKeypress('ArrowRight', () => {
    if (currentIndex + 1 < images.length) {
      changePhotoIndex(currentIndex + 1);
    }
  });

  useKeypress('ArrowLeft', () => {
    if (currentIndex > 0) {
      changePhotoIndex(currentIndex - 1);
    }
  });

  useKeypress('Escape', () => {
    onClose();
  });

  // Zoom keyboard shortcuts
  useKeypress('+', zoomIn);
  useKeypress('=', zoomIn); // Handle both + and = key
  useKeypress('-', zoomOut);
  useKeypress('0', resetZoom);

  // Mouse and touch event handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl/cmd + wheel
      const delta = -e.deltaY;
      if (delta > 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    } else if (zoom > 1) {
      // Pan when zoomed
      setPanX(prev => prev - e.deltaX);
      setPanY(prev => prev - e.deltaY);
    }
  }, [zoom, zoomIn, zoomOut]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [zoom, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Always prevent default to stop browser zoom
    if (e.touches.length >= 2) {
      e.preventDefault();
    }
    
    if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setDragStart({ x: distance, y: zoom });
      setIsDragging(false); // Not dragging during pinch
    } else if (e.touches.length === 1 && zoom > 1) {
      // Single touch for panning when zoomed
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY });
      setIsDragging(true);
    }
  }, [zoom, panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Always prevent default browser behavior
    if (e.touches.length >= 2) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scale = distance / dragStart.x;
      const newZoom = Math.min(Math.max(dragStart.y * scale, 0.5), 5);
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Pan with single touch
      e.preventDefault();
      const touch = e.touches[0];
      setPanX(touch.clientX - dragStart.x);
      setPanY(touch.clientY - dragStart.y);
    }
  }, [isDragging, zoom, dragStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Prevent default if we were handling multi-touch
    if (e.changedTouches.length > 0) {
      e.preventDefault();
    }
    setIsDragging(false);
  }, []);

  // Swipe handlers (only when not zoomed to avoid conflicts)
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (zoom === 1 && currentIndex < images.length - 1) {
        changePhotoIndex(currentIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (zoom === 1 && currentIndex > 0) {
        changePhotoIndex(currentIndex - 1);
      }
    },
    trackMouse: true,
  });

  if (!isOpen || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];

  // Filter images for bottom navigation (show 15 images around current)
  const filteredImages = images.filter((img, index) =>
    range(currentIndex - 15, currentIndex + 15).includes(index)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center max-w-none w-screen h-screen p-0 border-0 bg-transparent shadow-none translate-x-0 translate-y-0 left-0 top-0"
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
          style={{ touchAction: 'none' }}
        >
          <DialogTitle className="sr-only">
            Wedding photo {currentIndex + 1} of {images.length}
            {currentImage.guestName && ` shared by ${currentImage.guestName}`}
          </DialogTitle>

          <MotionConfig
            transition={{
              x: { type: 'tween', duration: 0.2, ease: 'easeOut' },
              opacity: { duration: 0.15 },
            }}
          >
            <div
              className="relative z-50 flex w-full max-w-7xl items-center justify-center p-4"
              {...(zoom === 1 ? handlers : {})}
            >
              {/* Main image */}
              <div 
                className="w-full h-full flex items-center justify-center"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  cursor: zoom > 1 ? 'grab' : 'default',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              >
                <div 
                  ref={imageContainerRef}
                  className="relative w-full max-w-full h-[90vh] overflow-hidden flex items-center justify-center"
                >
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div
                        className="flex items-center justify-center w-full h-full"
                        style={{
                          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                          transformOrigin: 'center center',
                          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        }}
                      >
                        <Image
                          {...getOptimizedImageProps(currentImage, 'modal', {
                            priority: true,
                            quality: 'full',
                          })}
                          onLoad={() => setLoaded(true)}
                          className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                          draggable={false}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Buttons + bottom nav bar */}
              <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center pointer-events-none">
                {/* Navigation buttons */}
                <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                  {/* Previous button (hidden when zoomed) */}
                  {currentIndex > 0 && zoom === 1 && (
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none pointer-events-auto"
                      style={{ transform: 'translate3d(0, -50%, 0)' }}
                      onClick={() => changePhotoIndex(currentIndex - 1)}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}

                  {/* Next button (hidden when zoomed) */}
                  {currentIndex + 1 < images.length && zoom === 1 && (
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none pointer-events-auto"
                      style={{ transform: 'translate3d(0, -50%, 0)' }}
                      onClick={() => changePhotoIndex(currentIndex + 1)}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}

                  {/* Top right buttons */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-white pointer-events-auto">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-lg p-1">
                      <button
                        onClick={zoomOut}
                        disabled={zoom <= 0.5}
                        className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Zoom out (-)"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-sm text-white/90 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={zoomIn}
                        disabled={zoom >= 5}
                        className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Zoom in (+)"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      {zoom !== 1 && (
                        <button
                          onClick={resetZoom}
                          className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white"
                          title="Reset zoom (0)"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <a
                      href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${currentImage.public_id}.${currentImage.format}`}
                      className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
                      target="_blank"
                      title="Open fullsize version"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() =>
                        downloadPhoto(
                          `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${currentImage.public_id}.${currentImage.format}`,
                          `${currentIndex}.jpg`
                        )
                      }
                      className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
                      title="Download fullsize version"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Close button */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-white pointer-events-auto">
                    <button
                      onClick={onClose}
                      className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Bottom thumbnail navigation (hidden when zoomed) */}
                {zoom === 1 && (
                  <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-gradient-to-b from-black/0 to-black/60">
                  <motion.div
                    initial={false}
                    animate={{
                      x: `${Math.max(currentIndex * -100, 15 * -100)}%`,
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="mx-auto mt-6 mb-6 flex aspect-[3/2] h-14"
                  >
                    <AnimatePresence initial={false}>
                      {filteredImages.map((image, index) => {
                        const actualIndex = images.findIndex(
                          (img) => img.public_id === image.public_id
                        );
                        return (
                          <motion.button
                            animate={{
                              scale: actualIndex === currentIndex ? 1.15 : 1,
                            }}
                            transition={{ duration: 0.15 }}
                            onClick={() => changePhotoIndex(actualIndex)}
                            key={actualIndex}
                            className={`${
                              actualIndex === currentIndex
                                ? 'z-20 rounded-md shadow shadow-black/50'
                                : 'z-10'
                            } ${actualIndex === 0 ? 'rounded-l-md' : ''} ${
                              actualIndex === images.length - 1 ? 'rounded-r-md' : ''
                            } relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus:outline-none`}
                          >
                            <Image
                              {...getOptimizedImageProps(image, 'thumb', {
                                priority: Math.abs(actualIndex - currentIndex) <= 2,
                                quality: 'thumb',
                              })}
                              className={`${
                                actualIndex === currentIndex
                                  ? 'brightness-110 hover:brightness-110'
                                  : 'brightness-50 contrast-125 hover:brightness-75'
                              } h-full transform object-cover transition`}
                            />
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                </div>
                )}
              </div>
            </div>
          </MotionConfig>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default CachedModal;
