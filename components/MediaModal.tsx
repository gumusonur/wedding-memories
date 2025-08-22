/**
 * Modal that uses the exact same cached media from the gallery - zero network requests!
 * This component reuses the already-loaded media for instant display.
 */

'use client';

import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { StorageAwareMedia } from './StorageAwareMedia';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useKeypress } from '../hooks/useKeypress';
import { useSwipeable } from 'react-swipeable';
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import type { MediaProps } from '../utils/types';
import { variants } from '../utils/animationVariants';
import downloadPhoto from '../utils/downloadPhoto';
import { getOptimizedMediaProps } from '../utils/mediaOptimization';
import { useMemo } from 'react';
import { getDownloadUrl, getExternalUrl } from '../utils/imageUrl';

interface MediaModalProps {
  items: MediaProps[];
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
}

export function MediaModal({ items, isOpen, initialIndex, onClose }: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Touch tracking for distinguishing taps from swipes
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [hasTouchMoved, setHasTouchMoved] = useState(false);

  // Pinch-to-zoom state
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [isPinching, setIsPinching] = useState(false);

  // Update current index when initial index changes or modal opens
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setLoaded(false);
    // Always reset zoom and pan to ensure proper centering
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [initialIndex, isOpen]);

  // Reset zoom and pan when media changes
  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Detect touch device and browser on mount
  const [isSafariMobile, setIsSafariMobile] = useState(false);

  useEffect(() => {
    const detectTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const detectSafariMobile = () => {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /Safari/.test(ua) && !/Chrome|Edge|Firefox/.test(ua);
      return isIOS && isSafari;
    };

    setIsTouchDevice(detectTouch());
    setIsSafariMobile(detectSafariMobile());
  }, []);

  // Ensure controls are always visible when zoomed in (safety net)
  useEffect(() => {
    if (zoom > 1 && !controlsVisible) {
      setControlsVisible(true);
    }
  }, [zoom, controlsVisible]);

  // Prevent browser zoom on the document when modal is open
  useEffect(() => {
    if (isOpen) {
      const preventDefault = (e: Event) => {
        if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 1) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', preventDefault, { passive: false });
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('touchstart', preventDefault);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Zoom functions
  const zoomIn = useCallback(() => setZoom((prev) => Math.min(prev * 1.5, 5)), []);
  const zoomOut = useCallback(() => setZoom((prev) => Math.max(prev / 1.5, 0.5)), []);
  const resetZoom = useCallback(() => resetView(), [resetView]);

  // Calculate distance between two touch points
  const getDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // Get center point between two touches
  const getCenter = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  const changeMediaIndex = useCallback(
    (newIndex: number) => {
      // Pause any currently playing video before switching
      const currentVideoElements = document.querySelectorAll('video');
      currentVideoElements.forEach(video => {
        if (!video.paused) {
          video.pause();
        }
      });

      setDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentIndex(newIndex);
      resetView();
    },
    [currentIndex, resetView]
  );

  // Preload adjacent videos for faster switching
  useEffect(() => {
    if (!isOpen) return;

    const preloadVideo = (index: number) => {
      const item = items[index];
      if (item?.resource_type === 'video') {
        // Create hidden video element to preload
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.style.display = 'none';
        video.src = getOptimizedMediaProps(item, 'modal', { quality: 'medium' }).src;
        document.body.appendChild(video);

        // Clean up after 10 seconds
        setTimeout(() => {
          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
        }, 10000);
      }
    };

    // Preload previous and next videos
    if (currentIndex > 0) {
      preloadVideo(currentIndex - 1);
    }
    if (currentIndex < items.length - 1) {
      preloadVideo(currentIndex + 1);
    }
  }, [currentIndex, items, isOpen]);

  // Keyboard navigation
  useKeypress('ArrowRight', () => {
    if (currentIndex + 1 < items.length) changeMediaIndex(currentIndex + 1);
  });

  useKeypress('ArrowLeft', () => {
    if (currentIndex > 0) changeMediaIndex(currentIndex - 1);
  });

  useKeypress('Escape', onClose);

  const currentItem = items[currentIndex];
  const isVideo = currentItem?.resource_type === 'video';

  // Memoize media props to prevent unnecessary re-fetches
  const currentMediaProps = useMemo(() => {
    if (!currentItem) return null;
    return getOptimizedMediaProps(currentItem, 'modal', { 
      priority: true, 
      quality: isVideo ? 'medium' : 'full'
    });
  }, [currentItem, isVideo]);

  // Zoom keyboard shortcuts (for images only)
  useKeypress('+', () => !isVideo && zoomIn());
  useKeypress('=', () => !isVideo && zoomIn());
  useKeypress('-', () => !isVideo && zoomOut());
  useKeypress('0', () => !isVideo && resetZoom());

  // Touch event handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isVideo) return; // Only allow zoom on images
    
    if (e.touches.length === 1) {
      // Record touch start position for double-tap detection
      setTouchStartPos({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
      setHasTouchMoved(false);
      
      if (zoom > 1) {
        // Start pan gesture when zoomed
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - panX,
          y: e.touches[0].clientY - panY,
        });
      }
    } else if (e.touches.length === 2) {
      // Start pinch gesture
      setIsPinching(true);
      setInitialDistance(getDistance(e.touches));
      setInitialZoom(zoom);
      e.preventDefault();
    }
  }, [isVideo, zoom, getDistance, panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isVideo) return;
    
    // Track movement for double-tap detection
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      );
      if (moveDistance > 10) {
        setHasTouchMoved(true);
      }
    }
    
    if (isPinching && e.touches.length === 2) {
      // Handle pinch zoom
      const currentDistance = getDistance(e.touches);
      if (initialDistance > 0) {
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(0.5, Math.min(5, initialZoom * scale));
        setZoom(newZoom);
      }
      e.preventDefault();
    } else if (isDragging && e.touches.length === 1 && zoom > 1) {
      // Handle pan when zoomed
      const newPanX = e.touches[0].clientX - dragStart.x;
      const newPanY = e.touches[0].clientY - dragStart.y;
      setPanX(newPanX);
      setPanY(newPanY);
      e.preventDefault();
    }
  }, [isVideo, isPinching, isDragging, getDistance, initialDistance, initialZoom, zoom, dragStart, touchStartPos]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isVideo) return;
    
    if (e.touches.length < 2) {
      setIsPinching(false);
      setInitialDistance(0);
    }
    
    if (e.touches.length === 0) {
      setIsDragging(false);
      
      // Handle double-tap to zoom
      if (e.changedTouches.length === 1 && !hasTouchMoved) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          // Double tap detected - zoom from center
          if (zoom === 1) {
            setPanX(0);
            setPanY(0);
            setZoom(2);
          } else {
            resetView();
          }
        }
        setLastTapTime(now);
      }
    }
    
    setHasTouchMoved(false);
  }, [isVideo, hasTouchMoved, lastTapTime, zoom, resetView]);

  // Mouse event handlers for desktop dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isVideo || zoom <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    },
    [isVideo, zoom, panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isVideo || !isDragging || zoom <= 1) return;
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    },
    [isVideo, isDragging, zoom, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel handler for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isVideo) return;
      e.preventDefault();
      
      if (e.deltaY < 0) {
        // Zoom in
        zoomIn();
      } else {
        // Zoom out
        zoomOut();
      }
    },
    [isVideo, zoomIn, zoomOut]
  );

  // Swipe handlers (only when not zoomed to avoid conflicts)
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (zoom === 1 && !isPinching && currentIndex < items.length - 1) {
        changeMediaIndex(currentIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (zoom === 1 && !isPinching && currentIndex > 0) {
        changeMediaIndex(currentIndex - 1);
      }
    },
    trackMouse: true,
  });

  if (!isOpen || !currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center w-screen h-screen-dynamic p-0 border-0 bg-transparent shadow-none"
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
        >
          <DialogTitle className="sr-only">
            Wedding media {currentIndex + 1} of {items.length}
            {currentItem.guestName && ` shared by ${currentItem.guestName}`}
          </DialogTitle>

          <MotionConfig transition={{ x: { type: 'tween', duration: 0.2, ease: 'easeOut' }, opacity: { duration: 0.15 } }}>
            <div className="relative z-50 flex w-full max-w-7xl items-center justify-center p-4" {...(zoom === 1 && !isPinching ? handlers : {})}>
              <div className="w-full h-full flex items-center justify-center">
                <div 
                  ref={mediaContainerRef} 
                  className="relative w-full max-w-full h-[90vh] overflow-hidden flex items-center justify-center"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{ 
                    touchAction: zoom > 1 || isPinching ? 'none' : 'auto',
                    cursor: zoom > 1 && !isVideo ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    userSelect: 'none'
                  }}
                >
                  {controlsVisible && (
                    <div className="absolute top-4 right-0 z-20 rounded-full bg-black/50 backdrop-blur-lg p-1">
                      <button onClick={onClose} className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white" title="Close modal (Esc)">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {controlsVisible && (
                    <>
                      <div className="absolute top-4 left-0 z-20 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-lg p-1">
                        <a href={getExternalUrl(currentItem.public_id, currentItem.resource_type, currentItem.format)} className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white" target="_blank" title="Open fullsize version" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button onClick={() => downloadPhoto(getDownloadUrl(currentItem.public_id, currentItem.resource_type, currentItem.format), `${currentIndex + 1}.${currentItem.format}`)} className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white" title="Download fullsize version">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>

                      {!isVideo && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-20 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-lg p-1 pointer-events-auto zoom-controls">
                          <button onClick={zoomOut} disabled={zoom <= 0.5} className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white disabled:opacity-50" title="Zoom out (-)">
                            <ZoomOut className="h-4 w-4" />
                          </button>
                          <span className="px-2 text-sm text-white/90 min-w-[3rem] text-center font-medium">{Math.round(zoom * 100)}%</span>
                          <button onClick={zoomIn} disabled={zoom >= 5} className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white disabled:opacity-50" title="Zoom in (+)">
                            <ZoomIn className="h-4 w-4" />
                          </button>
                          {zoom !== 1 && (
                            <button onClick={resetZoom} className="rounded-full p-2 text-white/75 transition hover:bg-black/50 hover:text-white ml-0.5" title="Reset zoom (0)">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!isTouchDevice && currentIndex > 0 && zoom === 1 && controlsVisible && (
                    <button onClick={() => changeMediaIndex(currentIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white" title="Previous media">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}

                  {!isTouchDevice && currentIndex + 1 < items.length && zoom === 1 && controlsVisible && (
                    <button onClick={() => changeMediaIndex(currentIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white" title="Next media">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}

                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div key={`${currentIndex}-${currentItem.id}`} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="flex items-center justify-center w-full h-full" 
                        style={{ 
                          transform: !isVideo 
                            ? `translate(${panX}px, ${panY}px) scale(${zoom})` 
                            : 'scale(1)', 
                          transition: isDragging || isPinching ? 'none' : 'transform 0.1s ease-out',
                          transformOrigin: 'center center'
                        }}
                      >
                        {currentMediaProps && (
                          <StorageAwareMedia
                            {...currentMediaProps}
                            onLoad={() => setLoaded(true)}
                            className={`max-w-full max-h-full w-auto h-auto object-contain select-none mx-auto my-auto ${
                              isVideo ? 'rounded-lg' : ''
                            }`}
                            draggable={false}
                          />
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {zoom === 1 && controlsVisible && (
                <div className={`fixed inset-x-0 z-60 overflow-hidden bottom-0 ${isSafariMobile ? 'ios-safari-bottom' : ''}`}>
                  <motion.div
                    initial={false}
                    animate={{
                      x: `${Math.max(currentIndex * -100, 15 * -100)}%`,
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="mx-auto mt-6 flex aspect-[3/2] h-14"
                  >
                    <AnimatePresence initial={false}>
                      {items.map((item, index) => (
                        <motion.button
                          animate={{ scale: index === currentIndex ? 1.15 : 1 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => changeMediaIndex(index)}
                          key={index}
                          className={`${index === currentIndex ? 'z-20 rounded-md shadow shadow-black/50' : 'z-10'} ${index === 0 ? 'rounded-l-md' : ''} ${index === items.length - 1 ? 'rounded-r-md' : ''} relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus:outline-none`}
                        >
                          <StorageAwareMedia
                            {...getOptimizedMediaProps(item, 'thumb', { priority: Math.abs(index - currentIndex) <= 2, quality: 'thumb' })}
                            className={`${index === currentIndex ? 'brightness-110 hover:brightness-110' : 'brightness-50 contrast-125 hover:brightness-75'} h-full transform object-cover transition`}
                          />
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </div>
          </MotionConfig>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default MediaModal;