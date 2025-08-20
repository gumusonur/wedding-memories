/**
 * Core image data structure for the wedding gallery application.
 * Represents a photo with metadata from Cloudinary and guest information.
 */
export interface ImageProps {
  /** Unique identifier for the image in the gallery */
  id: number;
  /** Image height in pixels */
  height: string;
  /** Image width in pixels */
  width: string;
  /** Cloudinary public ID for the image */
  public_id: string;
  /** Image file format (jpg, png, etc.) */
  format: string;
  /** Base64 blur placeholder for loading states */
  blurDataUrl?: string;
  /** Name of the guest who uploaded the photo */
  guestName?: string;
  /** ISO date string when the photo was uploaded */
  uploadDate?: string;
}

/**
 * Props for the shared modal component used for photo viewing.
 * Handles navigation between photos and modal state management.
 */
export interface SharedModalProps {
  /** Current photo index in the images array */
  index: number;
  /** Array of all available images */
  images?: ImageProps[];
  /** Currently displayed photo data */
  currentPhoto?: ImageProps;
  /** Function to change the displayed photo by ID */
  changePhotoId: (newPhotoId: number) => void;
  /** Function to close the modal */
  closeModal: () => void;
  /** Whether navigation controls should be shown */
  navigation: boolean;
  /** Direction of navigation (-1 for previous, 1 for next) */
  direction?: number;
}

/**
 * Upload file status during the upload process.
 */
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

/**
 * File data structure during the upload process.
 */
export interface UploadFile {
  /** The actual file object */
  file: File;
  /** Unique identifier for this upload */
  id: string;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Current status of the upload */
  status: UploadStatus;
  /** Error message if upload failed */
  error?: string;
  /** Base64 thumbnail for preview */
  thumbnail?: string;
  /** File hash for duplicate detection */
  hash?: string;
}

/**
 * Environment variables interface for type safety.
 */
export interface EnvironmentConfig {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_FOLDER: string;
}

/**
 * API response for upload operations.
 */
export interface UploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  context?: {
    guest?: string;
  };
}

/**
 * Error response from API endpoints.
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * Standard API response wrapper.
 */
export type ApiResponse<T> = T | ApiErrorResponse;
