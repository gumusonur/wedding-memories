/**
 * Validation utilities for the wedding gallery application.
 *
 * This module provides reusable validation functions following CLAUDE.md principles:
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
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Supported image file extensions (fallback for Safari compatibility).
 */
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;

/**
 * Maximum file size for uploads (10MB).
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Maximum guest name length.
 */
export const MAX_GUEST_NAME_LENGTH = 100;

/**
 * Minimum guest name length.
 */
export const MIN_GUEST_NAME_LENGTH = 1;

/**
 * Maximum number of files that can be uploaded at once.
 */
export const MAX_FILES_PER_UPLOAD = 20;

/**
 * Validates if a file is a supported image format.
 *
 * @param file - File to validate
 * @returns True if file is a valid image
 * @throws {ValidationError} If file is not a valid image
 */
export function validateImageFile(file: File): boolean {
  if (!file) {
    throw new ValidationError('File is required', 'file');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(file.size / (1024 * 1024));
    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    throw new ValidationError(
      `File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
      'file'
    );
  }

  // Check MIME type first
  if (file.type && SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
    return true;
  }

  // Fallback: check file extension for Safari compatibility
  const fileName = file.name?.toLowerCase() || '';
  const hasValidExtension = SUPPORTED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    throw new ValidationError('File must be a valid image format (JPG, PNG, GIF, or WebP)', 'file');
  }

  return true;
}

/**
 * Validates guest name input.
 *
 * @param guestName - Guest name to validate
 * @returns Trimmed and validated guest name
 * @throws {ValidationError} If guest name is invalid
 */
export function validateGuestName(guestName: unknown): string {
  if (typeof guestName !== 'string') {
    throw new ValidationError('Guest name must be a text value', 'guestName');
  }

  const trimmedName = guestName.trim();

  if (trimmedName.length < MIN_GUEST_NAME_LENGTH) {
    throw new ValidationError('Guest name is required', 'guestName');
  }

  if (trimmedName.length > MAX_GUEST_NAME_LENGTH) {
    throw new ValidationError(
      `Guest name must be less than ${MAX_GUEST_NAME_LENGTH} characters`,
      'guestName'
    );
  }

  // Check for potentially malicious content
  if (containsMaliciousContent(trimmedName)) {
    throw new ValidationError('Guest name contains invalid characters', 'guestName');
  }

  return trimmedName;
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
    'NEXT_PUBLIC_BRIDE_NAME',
    'NEXT_PUBLIC_GROOM_NAME',
  ];

  const missingVars = requiredVars.filter((varName) => !env[varName]);

  if (missingVars.length > 0) {
    throw new ValidationError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      'environment'
    );
  }

  // Validate that names are not empty
  if (!env.NEXT_PUBLIC_BRIDE_NAME?.trim()) {
    throw new ValidationError('Bride name cannot be empty', 'NEXT_PUBLIC_BRIDE_NAME');
  }

  if (!env.NEXT_PUBLIC_GROOM_NAME?.trim()) {
    throw new ValidationError('Groom name cannot be empty', 'NEXT_PUBLIC_GROOM_NAME');
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
