"use client";

import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import useKeypress from "react-use-keypress";
import type { ImageProps } from "../utils/types";
import SharedModal from "./SharedModal";

export default function Modal({
  images,
  onClose,
}: {
  images: ImageProps[];
  onClose?: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const photoId = searchParams.get("photoId");
  const index = Number(photoId);

  const [direction, setDirection] = useState(0);
  const [curIndex, setCurIndex] = useState(index);

  // Sync curIndex with URL parameter
  useEffect(() => {
    setCurIndex(index);
  }, [index]);

  function handleClose() {
    router.push("/");
    onClose?.();
  }

  function changePhotoId(newVal: number) {
    if (newVal > curIndex) {
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setCurIndex(newVal);
    router.push(`/?photoId=${newVal}`);
  }

  useKeypress("ArrowRight", () => {
    if (curIndex + 1 < images.length) {
      changePhotoId(curIndex + 1);
    }
  });

  useKeypress("ArrowLeft", () => {
    if (curIndex > 0) {
      changePhotoId(curIndex - 1);
    }
  });

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      initialFocus={overlayRef}
      className="fixed inset-0 z-10 flex items-center justify-center"
    >
      <Dialog.Overlay
        ref={overlayRef}
        as={motion.div}
        key="backdrop"
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <SharedModal
        index={curIndex}
        direction={direction}
        images={images}
        changePhotoId={changePhotoId}
        closeModal={handleClose}
        navigation={true}
      />
    </Dialog>
  );
}
