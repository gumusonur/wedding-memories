/**
 * Core media data structure for the wedding gallery application.
 * Represents a photo or video with metadata from the storage provider and guest information.
 */
export interface MediaProps {
  /** Unique identifier for the media in the gallery */
  id: number;
  /** Media height in pixels */
  height: string;
  /** Media width in pixels */
  width: string;
  /** Cloudinary public ID for the media */
  public_id: string;
  /** Media file format (jpg, mp4, etc.) */
  format: string;
  /** Type of media resource */
  resource_type: 'image' | 'video';
  /** Base64 blur placeholder for loading states (images only) */
  blurDataUrl?: string;
  /** Name of the guest who uploaded the media */
  guestName?: string;
  /** ISO date string when the media was uploaded */
  uploadDate?: string;
  /** Unique video ID (videos only) */
  videoId?: string;
  /** Video duration in seconds (videos only) */
  duration?: number;
}

/**
 * Props for the shared modal component used for media viewing.
 * Handles navigation between media items and modal state management.
 */
export interface SharedModalProps {
  /** Current media index in the items array */
  index: number;
  /** Array of all available media items */
  items?: MediaProps[];
  /** Currently displayed media data */
  currentItem?: MediaProps;
  /** Function to change the displayed media by ID */
  changeItemId: (newItemId: number) => void;
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


/**
 * Props for the guest name input component.
 */
export interface GuestNameInputProps {
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Callback when guest name is submitted */
  onNameSubmit: (name: string) => void;
}

/**
 * Props for the welcome dialog component.
 */
export interface WelcomeDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** Callback when guest name is submitted */
  onNameSubmit: (name: string) => void;
}
