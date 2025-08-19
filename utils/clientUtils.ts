/**
 * Client-side utility functions that don't require Node.js dependencies
 */

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

/**
 * Estimates compression ratio for images based on file size
 */
export function getCompressionInfo(fileSizeBytes: number): {
  willCompress: boolean;
  estimatedSizeReduction: string;
} {
  const eightMB = 8 * 1024 * 1024;
  
  if (fileSizeBytes <= eightMB) {
    return {
      willCompress: false,
      estimatedSizeReduction: '0%',
    };
  }
  
  // Rough estimation: JPEG compression typically reduces by 60-80%
  const estimatedReduction = Math.min(Math.round((fileSizeBytes - eightMB) / fileSizeBytes * 100), 80);
  
  return {
    willCompress: true,
    estimatedSizeReduction: `~${estimatedReduction}%`,
  };
}