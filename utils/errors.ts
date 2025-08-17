/**
 * Error handling utilities and custom error classes for the wedding gallery application.
 * 
 * This module follows CLAUDE.md principles for proper error handling:
 * - Fail fast with clear validation
 * - Specific error types with context
 * - User-friendly messages that don't expose technical details
 * - Graceful degradation for non-critical failures
 */

/**
 * Base error class for application-specific errors.
 * Extends Error with additional context and user-friendly messaging.
 */
export abstract class BaseApplicationError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a sanitized error object safe for client consumption.
   */
  toClientError(): { code: string; message: string; details?: string } {
    return {
      code: this.code,
      message: this.userMessage,
      details: this.context?.details,
    };
  }
}

/**
 * Validation error for input validation failures.
 * Used when user input doesn't meet requirements.
 */
export class ValidationError extends BaseApplicationError {
  readonly code = 'VALIDATION_ERROR';
  
  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, any>
  ) {
    super(message, { ...context, field });
  }

  get userMessage(): string {
    if (this.field) {
      return `Please check the ${this.field} field: ${this.message}`;
    }
    return this.message;
  }
}

/**
 * Upload error for file upload failures.
 * Handles various upload-related issues with appropriate user messaging.
 */
export class UploadError extends BaseApplicationError {
  readonly code = 'UPLOAD_ERROR';
  
  constructor(
    message: string,
    public readonly fileName?: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, { ...context, fileName }, originalError);
  }

  get userMessage(): string {
    const fileContext = this.fileName ? ` for file "${this.fileName}"` : '';
    return `Upload failed${fileContext}. Please try again or contact support if the problem persists.`;
  }
}

/**
 * Configuration error for missing or invalid environment variables.
 * Used during application startup or API calls requiring configuration.
 */
export class ConfigurationError extends BaseApplicationError {
  readonly code = 'CONFIGURATION_ERROR';
  
  constructor(
    message: string,
    public readonly missingVariables?: string[],
    context?: Record<string, any>
  ) {
    super(message, { ...context, missingVariables });
  }

  get userMessage(): string {
    return 'Service temporarily unavailable. Please contact support if this persists.';
  }
}

/**
 * External service error for Cloudinary or other third-party service failures.
 * Provides appropriate user messaging without exposing service details.
 */
export class ExternalServiceError extends BaseApplicationError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  
  constructor(
    message: string,
    public readonly service: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, { ...context, service }, originalError);
  }

  get userMessage(): string {
    return 'Service temporarily unavailable. Please try again in a few moments.';
  }
}

/**
 * Network error for connectivity issues.
 * Helps users understand when the problem is likely on their end.
 */
export class NetworkError extends BaseApplicationError {
  readonly code = 'NETWORK_ERROR';
  
  constructor(
    message: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, context, originalError);
  }

  get userMessage(): string {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
}

/**
 * File processing error for issues with file validation, thumbnails, or hashing.
 * Provides specific guidance for file-related problems.
 */
export class FileProcessingError extends BaseApplicationError {
  readonly code = 'FILE_PROCESSING_ERROR';
  
  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly operation?: 'validation' | 'thumbnail' | 'hash' | 'duplicate_check',
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, { ...context, fileName, operation }, originalError);
  }

  get userMessage(): string {
    const fileContext = this.fileName ? ` "${this.fileName}"` : '';
    
    switch (this.operation) {
      case 'validation':
        return `File${fileContext} is not a supported image format. Please select JPG, PNG, GIF, or WebP files.`;
      case 'thumbnail':
        return `Unable to create preview for file${fileContext}. The file may be corrupted or in an unsupported format.`;
      case 'duplicate_check':
        return `Unable to check for duplicates. File${fileContext} will be uploaded anyway.`;
      default:
        return `Error processing file${fileContext}. Please try again or choose a different file.`;
    }
  }
}

/**
 * Rate limiting error for when users exceed upload limits.
 * Provides clear guidance on how to proceed.
 */
export class RateLimitError extends BaseApplicationError {
  readonly code = 'RATE_LIMIT_ERROR';
  
  constructor(
    message: string,
    public readonly retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(message, { ...context, retryAfter });
  }

  get userMessage(): string {
    if (this.retryAfter) {
      const minutes = Math.ceil(this.retryAfter / 60);
      return `Upload limit reached. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
    }
    return 'Upload limit reached. Please wait a moment before trying again.';
  }
}

/**
 * Error handler utility for consistent error processing.
 * Provides logging, user message extraction, and error categorization.
 */
export class ErrorHandler {
  /**
   * Processes an error and returns appropriate response data.
   * 
   * @param error - The error to process
   * @param context - Additional context for logging
   * @returns Object with status code, user message, and logging data
   */
  static handleError(error: unknown, context?: Record<string, any>) {
    const logContext = { ...context, timestamp: new Date().toISOString() };
    
    if (error instanceof BaseApplicationError) {
      console.error(`Application Error [${error.code}]:`, error.message, {
        ...logContext,
        context: error.context,
        stack: error.stack,
      });
      
      return {
        statusCode: this.getStatusCodeForError(error),
        clientError: error.toClientError(),
        shouldRetry: this.shouldRetryError(error),
      };
    }
    
    if (error instanceof Error) {
      console.error('Unexpected Error:', error.message, {
        ...logContext,
        stack: error.stack,
      });
      
      return {
        statusCode: 500,
        clientError: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again or contact support.',
        },
        shouldRetry: true,
      };
    }
    
    console.error('Unknown Error:', error, logContext);
    
    return {
      statusCode: 500,
      clientError: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again or contact support.',
      },
      shouldRetry: true,
    };
  }
  
  /**
   * Determines appropriate HTTP status code for application errors.
   */
  private static getStatusCodeForError(error: BaseApplicationError): number {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'UPLOAD_ERROR':
        return 400;
      case 'FILE_PROCESSING_ERROR':
        return 400;
      case 'RATE_LIMIT_ERROR':
        return 429;
      case 'CONFIGURATION_ERROR':
        return 500;
      case 'EXTERNAL_SERVICE_ERROR':
        return 502;
      case 'NETWORK_ERROR':
        return 503;
      default:
        return 500;
    }
  }
  
  /**
   * Determines if an error is retryable.
   */
  private static shouldRetryError(error: BaseApplicationError): boolean {
    const retryableErrors = [
      'EXTERNAL_SERVICE_ERROR',
      'NETWORK_ERROR',
    ];
    
    return retryableErrors.includes(error.code);
  }
}

/**
 * Utility function to safely extract error message from unknown error types.
 * 
 * @param error - Unknown error object
 * @returns Safe error message string
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof BaseApplicationError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Type guard to check if an error is a specific application error type.
 * 
 * @param error - Error to check
 * @param errorClass - Error class to check against
 * @returns Type predicate for the error class
 */
export function isErrorOfType<T extends BaseApplicationError>(
  error: unknown,
  errorClass: new (...args: any[]) => T
): error is T {
  return error instanceof errorClass;
}

/**
 * Wraps async functions with standardized error handling.
 * 
 * @param fn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const { clientError } = ErrorHandler.handleError(error, context);
      throw new Error(clientError.message);
    }
  };
}