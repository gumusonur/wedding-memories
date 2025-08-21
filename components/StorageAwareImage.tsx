/**
 * Storage-aware image component that handles both Cloudinary and S3/Wasabi storage.
 * 
 * - For Cloudinary: Uses Next.js Image with optimization
 * - For S3/Wasabi: Uses direct img tag to avoid optimization issues
 */

import Image from 'next/image';
import { appConfig, StorageProvider } from '../config';

interface StorageAwareImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onLoad?: () => void;
  draggable?: boolean;
}

export function StorageAwareImage({
  src,
  alt,
  width = 720,
  height = 480,
  className,
  sizes,
  priority = false,
  loading = 'lazy',
  placeholder = 'empty',
  blurDataURL,
  quality = 80,
  style,
  onClick,
  onMouseEnter,
  tabIndex,
  onKeyDown,
  onLoad,
  draggable = true,
}: StorageAwareImageProps) {
  // For Cloudinary, use Next.js Image with optimization
  if (appConfig.storage === StorageProvider.Cloudinary) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        sizes={sizes}
        priority={priority}
        loading={loading}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={quality}
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onLoad={onLoad}
        draggable={draggable}
      />
    );
  }

  // For S3/Wasabi, use direct img tag to avoid optimization
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        objectFit: 'cover',
        objectPosition: 'center',
        ...style,
      }}
      loading={loading}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onLoad={onLoad}
      draggable={draggable}
      // Add crossOrigin for better compatibility
      crossOrigin="anonymous"
    />
  );
}