/**
 * Validation utilities for the wedding gallery application.
 *
 * This module provides reusable validation functions following project principles:
 * - Input validation with clear error messages
 * - Security-focused validation to prevent malicious inputs
 * - Consistent validation patterns across the application
 */

import { ValidationError } from './errors';

/**
 * Supported image MIME types for file validation.
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Supported image file extensions (fallback for Safari compatibility).
 */
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;

/**
 * Supported video MIME types for file validation (S3/Wasabi only).
 */
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/quicktime',
  'video/avi',
  'video/webm',
] as const;

/**
 * Supported video file extensions (S3/Wasabi only).
 */
export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'] as const;

/**
 * Maximum file size for uploads (10MB).
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos

/**
 * Maximum guest name length.
 */
export const MAX_GUEST_NAME_LENGTH = 50;

/**
 * Minimum guest name length.
 */
export const MIN_GUEST_NAME_LENGTH = 2;

/**
 * Maximum number of files that can be uploaded at once.
 */
export const MAX_FILES_PER_UPLOAD = 20;

/**
 * Validates if a file is a supported media format (image or video for S3).
 *
 * @param file - File to validate
 * @param allowVideos - Whether to allow video files (true for S3/Wasabi)
 * @param enforceFileSize - Whether to enforce file size limits (false for S3/Wasabi)
 * @returns True if file is valid
 * @throws {ValidationError} If file is not valid
 */
export function validateMediaFile(file: File, allowVideos = false, enforceFileSize = true): boolean {
  if (!file) {
    throw new ValidationError('File is required', 'file');
  }

  // Check file size only if enforced (Cloudinary has limits, S3/Wasabi doesn't)
  if (enforceFileSize) {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    
    if (file.size > maxSize) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new ValidationError(
        `File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
        'file'
      );
    }
  }

  // Check MIME type first
  if (file.type) {
    const lowerType = file.type.toLowerCase();
    
    // Check image types
    if (SUPPORTED_IMAGE_TYPES.includes(lowerType as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      return true;
    }
    
    // Check video types if allowed
    if (allowVideos && SUPPORTED_VIDEO_TYPES.includes(lowerType as (typeof SUPPORTED_VIDEO_TYPES)[number])) {
      return true;
    }
    
  }

  // Fallback: check file extension for Safari compatibility
  const fileName = file.name?.toLowerCase() || '';
  
  // Check image extensions
  const hasValidImageExtension = SUPPORTED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (hasValidImageExtension) {
    return true;
  }
  
  // Check video extensions if allowed
  if (allowVideos) {
    const hasValidVideoExtension = SUPPORTED_VIDEO_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (hasValidVideoExtension) {
      return true;
    }
  }

  const supportedFormats = allowVideos 
    ? 'JPG, JPEG, PNG, GIF, WebP, MP4, MOV, AVI, WebM'
    : 'JPG, JPEG, PNG, GIF, WebP';
    
  throw new ValidationError(`File must be a valid format (${supportedFormats})`, 'file');
}

/**
 * Validates if a file is a supported image format (legacy function for backward compatibility).
 *
 * @param file - File to validate
 * @returns True if file is a valid image
 * @throws {ValidationError} If file is not a valid image
 */
export function validateImageFile(file: File): boolean {
  return validateMediaFile(file, false, true);
}

/**
 * Validates if a file is a supported video format.
 *
 * @param file - File to validate
 * @returns Validation result with isValid flag and error message
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  try {
    // Allow larger file sizes for videos (up to 100MB)
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    
    if (!file) {
      return { isValid: false, error: 'No video file provided' };
    }

    if (file.size > maxVideoSize) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      const maxSizeMB = Math.round(maxVideoSize / (1024 * 1024));
      return { 
        isValid: false, 
        error: `Video size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB` 
      };
    }

    // Check MIME type first
    if (file.type) {
      const lowerType = file.type.toLowerCase();
      if (SUPPORTED_VIDEO_TYPES.includes(lowerType as (typeof SUPPORTED_VIDEO_TYPES)[number])) {
        return { isValid: true };
      }
    }

    // Fallback: check file extension
    const fileName = file.name?.toLowerCase() || '';
    const hasValidVideoExtension = SUPPORTED_VIDEO_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (hasValidVideoExtension) {
      return { isValid: true };
    }

    return { 
      isValid: false, 
      error: 'Video must be in MP4, MOV, AVI, or WebM format' 
    };

  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Video validation failed' 
    };
  }
}

/**
 * Sanitizes a string by converting international characters to ASCII equivalents.
 *
 * @param text - Text to sanitize
 * @returns Sanitized text with ASCII characters
 */
export function sanitizeToAscii(text: string): string {
  // Map of international characters to ASCII equivalents
  const charMap: Record<string, string> = {
    // Latin characters with diacritics
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
    'ç': 'c', 'Ç': 'C',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'ñ': 'n', 'Ñ': 'N',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'ý': 'y', 'ÿ': 'y', 'Ý': 'Y',
    'ð': 'd', 'Ð': 'D',
    'þ': 'th', 'Þ': 'TH',
    'ß': 'ss',
    // Turkish specific characters (ç, ö, ü already covered above)
    'ğ': 'g', 'Ğ': 'G',           // Turkish soft g
    'ı': 'i', 'İ': 'I',           // Turkish dotless i and capital I with dot
    'ş': 's', 'Ş': 'S',           // Turkish s with cedilla
    // Common punctuation sanitization for folder safety
    "'": '-',   // O'Connor -> O-Connor
    '"': '',    // Remove quotes
    '.': '',    // Dr. Smith -> Dr Smith
    '_': '-',   // Underscore to hyphen
    // Remove or replace other problematic characters
    '/': '-', '\\': '-', '|': '-', ':': '-', '*': '', '?': '', '<': '', '>': '', '&': 'and'
  };

  return text.split('').map(char => charMap[char] || char).join('');
}

/**
 * Validates guest name input with file system safety and auto-sanitization.
 *
 * @param guestName - Guest name to validate
 * @param t - Optional translation function for i18n support
 * @returns Trimmed and sanitized guest name
 * @throws {ValidationError} If guest name is invalid
 */
export function validateGuestName(guestName: unknown, t?: (key: string, options?: Record<string, string | number>) => string): string {
  if (typeof guestName !== 'string') {
    throw new ValidationError(
      t ? t('errors.nameRequiredDescription') : 'Please enter your name as text',
      'guestName'
    );
  }

  const trimmedName = guestName.trim();

  if (trimmedName.length === 0) {
    throw new ValidationError(
      t ? t('errors.nameRequiredDescription') : 'Please enter your name',
      'guestName'
    );
  }

  // Auto-sanitize the name for file system safety
  const sanitizedName = sanitizeToAscii(trimmedName)
    .replace(/\s+/g, ' ')  // Normalize multiple spaces
    .replace(/--+/g, '-')  // Normalize multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();

  if (sanitizedName.length === 0) {
    throw new ValidationError(
      t ? t('errors.nameNoLetters') : 'Please enter a valid name with letters',
      'guestName'
    );
  }

  if (sanitizedName.length < MIN_GUEST_NAME_LENGTH) {
    throw new ValidationError(
      t 
        ? t('errors.nameTooShort', { minLength: MIN_GUEST_NAME_LENGTH }) 
        : `Name needs at least ${MIN_GUEST_NAME_LENGTH} characters (e.g., "Jo")`,
      'guestName'
    );
  }

  if (sanitizedName.length > MAX_GUEST_NAME_LENGTH) {
    throw new ValidationError(
      t 
        ? t('errors.nameTooLong', { maxLength: MAX_GUEST_NAME_LENGTH }) 
        : `Name is too long (max ${MAX_GUEST_NAME_LENGTH} characters). Please use a shorter version`,
      'guestName'
    );
  }

  // Check for potentially malicious content
  if (containsMaliciousContent(sanitizedName)) {
    throw new ValidationError(
      t ? t('errors.nameInvalidChars') : 'Name contains invalid characters',
      'guestName'
    );
  }

  // After sanitization, ensure it only contains safe characters
  if (containsFileSystemUnsafeCharacters(sanitizedName)) {
    throw new ValidationError(
      t ? t('errors.nameInvalidChars') : 'Name contains unsupported characters',
      'guestName'
    );
  }

  // Ensure name contains at least one letter
  if (!/[a-zA-Z]/.test(sanitizedName)) {
    throw new ValidationError(
      t ? t('errors.nameNoLetters') : 'Name must include at least one letter',
      'guestName'
    );
  }

  // Check for inappropriate content
  if (containsInappropriateContent(sanitizedName)) {
    throw new ValidationError(
      t ? t('errors.nameInappropriate') : 'Please enter your actual name for the photo credits',
      'guestName'
    );
  }

  return sanitizedName;
}

/**
 * Validates base64 file data.
 *
 * @param fileData - Base64 encoded file data
 * @returns True if file data is valid
 * @throws {ValidationError} If file data is invalid
 */
export function validateBase64FileData(fileData: unknown): boolean {
  if (!fileData || typeof fileData !== 'string') {
    throw new ValidationError('Valid file data is required', 'file');
  }

  if (!fileData.startsWith('data:image/')) {
    throw new ValidationError('File must be a valid image format', 'file');
  }

  // Check for reasonable file size (base64 is ~33% larger than binary)
  const estimatedSize = (fileData.length * 3) / 4;
  if (estimatedSize > MAX_FILE_SIZE * 1.5) {
    // Allow some overhead
    throw new ValidationError('File size is too large', 'file');
  }

  return true;
}

/**
 * Validates an array of files for batch upload.
 *
 * @param files - Array of files to validate
 * @returns Array of validated files
 * @throws {ValidationError} If any file is invalid or limits are exceeded
 */
export function validateFileArray(files: File[]): File[] {
  if (!Array.isArray(files)) {
    throw new ValidationError('Files must be provided as an array', 'files');
  }

  if (files.length === 0) {
    throw new ValidationError('At least one file is required', 'files');
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new ValidationError(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`, 'files');
  }

  // Validate each file
  files.forEach((file, index) => {
    try {
      validateImageFile(file);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`File ${index + 1}: ${error.message}`, 'files');
      }
      throw error;
    }
  });

  return files;
}

/**
 * Validates environment variables required for the application.
 *
 * @param env - Environment variables object
 * @throws {ValidationError} If required variables are missing
 */
export function validateEnvironmentVariables(env: Record<string, string | undefined>): void {
  const requiredVars = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_FOLDER',
  ];

  const missingVars = requiredVars.filter((varName) => !env[varName]);

  if (missingVars.length > 0) {
    throw new ValidationError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      'environment'
    );
  }

}

/**
 * Checks if text contains potentially malicious content.
 *
 * @param text - Text to check
 * @returns True if text contains malicious content
 */
function containsMaliciousContent(text: string): boolean {
  // Check for common injection patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(text));
}

/**
 * Checks if text contains file system unsafe characters.
 * Since guest names are used as folder names, we need to ensure they're safe.
 *
 * @param text - Text to check
 * @returns True if text contains unsafe characters for file systems
 */
function containsFileSystemUnsafeCharacters(text: string): boolean {
  // Only allow English letters, spaces, and hyphens (safest for folder names)
  const safeNameRegex = /^[a-zA-Z\s\-]+$/;
  return !safeNameRegex.test(text);
}

/**
 * Checks if text contains inappropriate content for guest names.
 *
 * @param text - Text to check
 * @returns True if text contains inappropriate content
 */
function containsInappropriateContent(text: string): boolean {
  // Basic inappropriate content check
  const inappropriateWords = ['admin', 'test', 'null', 'undefined', 'anonymous', 'system', 'root'];
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
}

/**
 * Sanitizes text input by removing potentially dangerous characters.
 *
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeTextInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .trim();
}

/**
 * Validates a photo ID parameter.
 *
 * @param photoId - Photo ID to validate
 * @returns Validated numeric photo ID
 * @throws {ValidationError} If photo ID is invalid
 */
export function validatePhotoId(photoId: unknown): number {
  if (photoId === null || photoId === undefined) {
    throw new ValidationError('Photo ID is required', 'photoId');
  }

  const numericId = typeof photoId === 'string' ? parseInt(photoId, 10) : Number(photoId);

  if (isNaN(numericId) || numericId < 0 || !Number.isInteger(numericId)) {
    throw new ValidationError('Photo ID must be a valid positive integer', 'photoId');
  }

  return numericId;
}

/**
 * Type guard to check if a value is a non-empty string.
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid File object.
 *
 * @param value - Value to check
 * @returns True if value is a File
 */
export function isValidFile(value: unknown): value is File {
  return value instanceof File && value.size > 0;
}

/**
 * Validates guest name and returns user-friendly error message or null if valid.
 * This is a non-throwing version for UI validation.
 *
 * @param guestName - Guest name to validate
 * @param t - Optional translation function for i18n support
 * @returns Error message if invalid, null if valid
 */
export function validateGuestNameForUI(guestName: string, t?: (key: string, options?: Record<string, string | number>) => string): string | null {
  try {
    validateGuestName(guestName, t);
    return null;
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.message;
    }
    return 'Invalid name';
  }
}

/**
 * Shows how a name will be sanitized without validation.
 * Useful for showing users what their input will become.
 *
 * @param guestName - Guest name to preview sanitization
 * @returns Object with original and sanitized name, or null if no change
 */
export function previewNameSanitization(guestName: string): { original: string; sanitized: string } | null {
  const trimmed = guestName.trim();
  if (!trimmed) return null;
  
  const sanitized = sanitizeToAscii(trimmed)
    .replace(/\s+/g, ' ')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
  
  // Apply the same file system safety check as in validateGuestName
  const finalSanitized = sanitized
    .replace(/\s+/g, ' ')  // Normalize multiple spaces
    .replace(/--+/g, '-')  // Normalize multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
  
  if (finalSanitized === trimmed) {
    return null; // No change needed
  }
  
  return {
    original: trimmed,
    sanitized: finalSanitized
  };
}
