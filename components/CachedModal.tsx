/**
 * Modal that uses the exact same cached images from the gallery - zero network requests!
 * This component reuses the already-loaded images for instant display.
 */

"use client";

import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import useKeypress from "react-use-keypress";
import { useSwipeable } from "react-swipeable";
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { ImageProps } from "../utils/types";
import { variants } from "../utils/animationVariants";
import downloadPhoto from "../utils/downloadPhoto";
import { range } from "../utils/range";
import { getOptimizedImageProps } from "../utils/imageOptimization";

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

  // Update current index when initial index changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setLoaded(false);
  }, [initialIndex]);

  const changePhotoIndex = useCallback((newIndex: number) => {
    if (newIndex > currentIndex) {
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setCurrentIndex(newIndex);
  }, [currentIndex]);

  // Keyboard navigation
  useKeypress("ArrowRight", () => {
    if (currentIndex + 1 < images.length) {
      changePhotoIndex(currentIndex + 1);
    }
  });

  useKeypress("ArrowLeft", () => {
    if (currentIndex > 0) {
      changePhotoIndex(currentIndex - 1);
    }
  });

  useKeypress("Escape", () => {
    onClose();
  });

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < images.length - 1) {
        changePhotoIndex(currentIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
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
        >
          <DialogTitle className="sr-only">
            Wedding photo {currentIndex + 1} of {images.length}
            {currentImage.guestName && ` shared by ${currentImage.guestName}`}
          </DialogTitle>
      
      <MotionConfig
        transition={{
          x: { type: "tween", duration: 0.2, ease: "easeOut" },
          opacity: { duration: 0.15 },
        }}
      >
        <div
          className="relative z-50 flex w-full max-w-7xl items-center justify-center p-4"
          {...handlers}
        >
          {/* Main image */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full max-w-full h-[90vh] overflow-hidden flex items-center justify-center">
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
                  <Image
                    {...getOptimizedImageProps(currentImage, 'modal', { priority: true, quality: 'full' })}
                    onLoad={() => setLoaded(true)}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Buttons + bottom nav bar */}
          <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center pointer-events-none">
            {/* Navigation buttons */}
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                {/* Previous button */}
                {currentIndex > 0 && (
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none pointer-events-auto"
                    style={{ transform: "translate3d(0, -50%, 0)" }}
                    onClick={() => changePhotoIndex(currentIndex - 1)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                
                {/* Next button */}
                {currentIndex + 1 < images.length && (
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none pointer-events-auto"
                    style={{ transform: "translate3d(0, -50%, 0)" }}
                    onClick={() => changePhotoIndex(currentIndex + 1)}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
                
                {/* Top right buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-2 text-white pointer-events-auto">
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
                        `${currentIndex}.jpg`,
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
            
            {/* Bottom thumbnail navigation */}
            <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-gradient-to-b from-black/0 to-black/60">
              <motion.div
                initial={false}
                animate={{
                  x: `${Math.max(currentIndex * -100, 15 * -100)}%`,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto mt-6 mb-6 flex aspect-[3/2] h-14"
              >
                <AnimatePresence initial={false}>
                  {filteredImages.map((image, index) => {
                    const actualIndex = images.findIndex(img => img.public_id === image.public_id);
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
                            ? "z-20 rounded-md shadow shadow-black/50"
                            : "z-10"
                        } ${actualIndex === 0 ? "rounded-l-md" : ""} ${
                          actualIndex === images.length - 1 ? "rounded-r-md" : ""
                        } relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus:outline-none`}
                      >
                        <Image
                          {...getOptimizedImageProps(image, 'thumb', { priority: Math.abs(actualIndex - currentIndex) <= 2, quality: 'thumb' })}
                          className={`${
                            actualIndex === currentIndex
                              ? "brightness-110 hover:brightness-110"
                              : "brightness-50 contrast-125 hover:brightness-75"
                          } h-full transform object-cover transition`}
                        />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </MotionConfig>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default CachedModal;