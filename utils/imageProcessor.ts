import sharp from 'sharp';

/**
 * Configuration for image processing
 */
interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp' | 'png';
  maxFileSizeBytes: number;
}

/**
 * Default configuration optimized for wedding photos
 * - Maintains high quality while reducing file size
 * - Uses JPEG for best compression while preserving photo quality
 * - Max dimensions prevent unnecessarily large images
 */
const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85, // High quality but compressed
  format: 'jpeg',
  maxFileSizeBytes: 8 * 1024 * 1024, // 8MB target (under 10MB Cloudinary limit)
};

/**
 * Processes base64 image data to reduce file size while maintaining quality.
 * Uses Sharp to resize, compress, and optimize images for web delivery.
 *
 * @param base64Data - Base64 encoded image data (with data URI prefix)
 * @param options - Processing options (optional, uses defaults optimized for wedding photos)
 * @returns Promise resolving to processed base64 image data
 */
export async function processImageForUpload(
  base64Data: string,
  options: Partial<ImageProcessingOptions> = {}
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Extract the base64 data without the data URI prefix
    const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const inputBuffer = Buffer.from(base64WithoutPrefix, 'base64');
    
    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();
    
    // Calculate new dimensions maintaining aspect ratio
    let { width = 0, height = 0 } = metadata;
    const aspectRatio = width / height;
    
    if (width > config.maxWidth || height > config.maxHeight) {
      if (aspectRatio > 1) {
        // Landscape: limit by width
        width = config.maxWidth;
        height = Math.round(width / aspectRatio);
      } else {
        // Portrait: limit by height
        height = config.maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }
    
    // Process the image with Sharp
    let processedBuffer = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: config.quality,
        progressive: true,
        mozjpeg: true, // Use mozjpeg for better compression
      })
      .toBuffer();
    
    // If still too large, reduce quality iteratively
    let currentQuality = config.quality;
    while (processedBuffer.length > config.maxFileSizeBytes && currentQuality > 60) {
      currentQuality -= 10;
      processedBuffer = await sharp(inputBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: currentQuality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();
    }
    
    // Convert back to base64 with data URI prefix
    const processedBase64 = processedBuffer.toString('base64');
    return `data:image/jpeg;base64,${processedBase64}`;
    
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image. Please try with a different image.');
  }
}

/**
 * Estimates the final file size after processing without actually processing.
 * Useful for showing users expected compression before upload.
 *
 * @param base64Data - Base64 encoded image data
 * @returns Promise resolving to estimated file size information
 */
export async function getImageInfo(base64Data: string): Promise<{
  originalSize: number;
  estimatedProcessedSize: number;
  dimensions: { width: number; height: number };
  format: string;
}> {
  try {
    const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const inputBuffer = Buffer.from(base64WithoutPrefix, 'base64');
    const metadata = await sharp(inputBuffer).metadata();
    
    const originalSize = inputBuffer.length;
    // Rough estimation: JPEG compression typically reduces by 70-80%
    const estimatedProcessedSize = Math.round(originalSize * 0.3);
    
    return {
      originalSize,
      estimatedProcessedSize,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
      format: metadata.format || 'unknown',
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    throw new Error('Failed to analyze image');
  }
}

/**
 * Formats file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}