/**
 * Testing utilities and helpers for the wedding gallery application.
 *
 * This module provides testing utilities following CLAUDE.md standards:
 * - Cross-platform testing support
 * - Mock data factories for consistent testing
 * - Accessibility testing helpers
 * - Performance testing utilities
 */

import type { ImageProps, UploadFile, UploadResponse } from './types';

/**
 * Mock image data factory for testing.
 * Creates realistic test data that matches the production data structure.
 */
export class MockImageFactory {
  /**
   * Creates a mock ImageProps object for testing.
   *
   * @param overrides - Properties to override in the mock
   * @returns Mock ImageProps object
   */
  static createMockImage(overrides: Partial<ImageProps> = {}): ImageProps {
    const defaultImage: ImageProps = {
      id: Math.floor(Math.random() * 1000),
      height: '480',
      width: '720',
      public_id: `test_image_${Date.now()}`,
      format: 'jpg',
      blurDataUrl:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyatcEfCP8Aeeh6w7ZLGqw0FUnlBzFXfnq5nI/v/9k=',
      guestName: 'Test Guest',
      uploadDate: new Date().toISOString(),
    };

    return { ...defaultImage, ...overrides };
  }

  /**
   * Creates an array of mock images for testing gallery functionality.
   *
   * @param count - Number of images to create
   * @param baseOverrides - Base properties to apply to all images
   * @returns Array of mock ImageProps objects
   */
  static createMockImageArray(
    count: number,
    baseOverrides: Partial<ImageProps> = {}
  ): ImageProps[] {
    return Array.from({ length: count }, (_, index) =>
      this.createMockImage({
        id: index,
        public_id: `test_image_${index}`,
        guestName: `Guest ${index + 1}`,
        ...baseOverrides,
      })
    );
  }

  /**
   * Creates a mock UploadFile object for testing upload functionality.
   *
   * @param overrides - Properties to override in the mock
   * @returns Mock UploadFile object
   */
  static createMockUploadFile(overrides: Partial<UploadFile> = {}): UploadFile {
    const mockFile = new File(['test content'], 'test-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    const defaultUploadFile: UploadFile = {
      file: mockFile,
      id: `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      progress: 0,
      status: 'pending',
      thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR...',
      hash: 'mock_hash_' + Math.random().toString(36).substring(7),
    };

    return { ...defaultUploadFile, ...overrides };
  }

  /**
   * Creates a mock Cloudinary upload response for testing.
   *
   * @param overrides - Properties to override in the mock
   * @returns Mock UploadResponse object
   */
  static createMockUploadResponse(overrides: Partial<UploadResponse> = {}): UploadResponse {
    const defaultResponse: UploadResponse = {
      public_id: `test_upload_${Date.now()}`,
      version: 1234567890,
      signature: 'mock_signature',
      width: 1920,
      height: 1080,
      format: 'jpg',
      resource_type: 'image',
      created_at: new Date().toISOString(),
      tags: [],
      bytes: 1024000,
      type: 'upload',
      etag: 'mock_etag',
      placeholder: false,
      url: 'http://res.cloudinary.com/demo/image/upload/test_upload',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/test_upload',
      context: { guest: 'Test Guest' },
    };

    return { ...defaultResponse, ...overrides };
  }
}

/**
 * Test environment utilities for setting up consistent test conditions.
 */
export class TestEnvironment {
  /**
   * Creates a mock environment variables object for testing.
   *
   * @param overrides - Environment variables to override
   * @returns Mock environment object
   */
  static createMockEnvironment(overrides: Record<string, string> = {}): Record<string, string> {
    const defaultEnv = {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret',
      CLOUDINARY_FOLDER: 'test-wedding-photos',
      NEXT_PUBLIC_BRIDE_NAME: 'Test Bride',
      NEXT_PUBLIC_GROOM_NAME: 'Test Groom',
    };

    return { ...defaultEnv, ...overrides };
  }

  /**
   * Mocks the global fetch function for API testing.
   * Note: This is designed for Jest testing environments.
   *
   * @param responses - Map of URLs to response objects
   */
  static mockFetch(responses: Record<string, any>): void {
    // Check if we're in a Jest testing environment
    const isJestEnvironment = typeof (globalThis as any).jest !== 'undefined';

    if (isJestEnvironment) {
      // Jest environment - use jest.fn()
      (global as any).fetch = ((globalThis as any).jest as any).fn((url: string) => {
        const responseData = responses[url] || { error: 'Not found' };
        const status = responses[url] ? 200 : 404;

        return Promise.resolve({
          ok: status < 400,
          status,
          json: () => Promise.resolve(responseData),
          text: () => Promise.resolve(JSON.stringify(responseData)),
        } as Response);
      });
    } else {
      // Non-Jest environment - use regular function
      (global as any).fetch = (url: string) => {
        const responseData = responses[url] || { error: 'Not found' };
        const status = responses[url] ? 200 : 404;

        return Promise.resolve({
          ok: status < 400,
          status,
          json: () => Promise.resolve(responseData),
          text: () => Promise.resolve(JSON.stringify(responseData)),
        } as Response);
      };
    }
  }

  /**
   * Restores the original fetch function after mocking.
   */
  static restoreFetch(): void {
    if (global.fetch && 'mockRestore' in global.fetch) {
      ((global.fetch as any).mockRestore as Function)?.();
    }
  }
}

/**
 * Accessibility testing utilities.
 */
export class AccessibilityTestUtils {
  /**
   * Checks if an element has proper ARIA attributes for images.
   *
   * @param element - DOM element to check
   * @returns Object with accessibility check results
   */
  static checkImageAccessibility(element: HTMLElement) {
    const img = element.querySelector('img');
    const hasAltText = img?.hasAttribute('alt') && img.alt.length > 0;
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasRole = element.hasAttribute('role');
    const isFocusable = element.tabIndex >= 0;

    return {
      hasAltText,
      hasAriaLabel,
      hasRole,
      isFocusable,
      isAccessible: hasAltText && (hasAriaLabel || hasRole) && isFocusable,
    };
  }

  /**
   * Checks if a form has proper accessibility attributes.
   *
   * @param form - Form element to check
   * @returns Object with form accessibility check results
   */
  static checkFormAccessibility(form: HTMLFormElement) {
    const inputs = form.querySelectorAll('input, textarea, select');
    const inputsWithLabels = Array.from(inputs).filter((input) => {
      const id = input.getAttribute('id');
      const hasLabel = id && form.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');

      return hasLabel || hasAriaLabel || hasAriaLabelledBy;
    });

    return {
      totalInputs: inputs.length,
      inputsWithLabels: inputsWithLabels.length,
      hasProperLabeling: inputs.length === inputsWithLabels.length,
      hasSubmitButton: form.querySelector('button[type="submit"], input[type="submit"]') !== null,
    };
  }
}

/**
 * Performance testing utilities.
 */
export class PerformanceTestUtils {
  /**
   * Measures the time it takes to execute a function.
   *
   * @param fn - Function to measure
   * @param iterations - Number of times to run the function
   * @returns Object with timing statistics
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T,
    iterations: number = 1
  ): Promise<{ average: number; min: number; max: number; total: number }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((sum, time) => sum + time, 0),
    };
  }

  /**
   * Creates a performance observer for measuring specific metrics.
   *
   * @param entryTypes - Array of entry types to observe
   * @returns Performance observer instance
   */
  static createPerformanceObserver(entryTypes: string[]): PerformanceObserver | null {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not supported in this environment');
      return null;
    }

    return new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
      });
    });
  }
}

/**
 * File testing utilities.
 */
export class FileTestUtils {
  /**
   * Creates a mock File object for testing.
   *
   * @param name - File name
   * @param content - File content
   * @param type - MIME type
   * @param size - File size in bytes
   * @returns Mock File object
   */
  static createMockFile(
    name: string = 'test-image.jpg',
    content: string = 'test content',
    type: string = 'image/jpeg',
    size?: number
  ): File {
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type, lastModified: Date.now() });

    // Override size if specified
    if (size !== undefined) {
      Object.defineProperty(file, 'size', { value: size, writable: false });
    }

    return file;
  }

  /**
   * Creates a mock FileList for testing multiple file uploads.
   *
   * @param files - Array of File objects
   * @returns Mock FileList object
   */
  static createMockFileList(files: File[]): FileList {
    const fileList = {
      item: (index: number) => files[index] || null,
      ...files,
      length: files.length,
    };

    return fileList as FileList;
  }

  /**
   * Simulates a file drop event for testing drag-and-drop functionality.
   *
   * @param files - Files to include in the drop event
   * @returns Mock drop event
   */
  static createMockDropEvent(files: File[]): DragEvent {
    const fileList = this.createMockFileList(files);

    const event = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperty(event, 'dataTransfer', {
      value: { files: fileList },
      writable: false,
    });

    return event;
  }
}

/**
 * Assertion helpers for common testing scenarios.
 * Note: These methods assume a Jest testing environment with global expect.
 */
export class TestAssertions {
  /**
   * Asserts that an element is properly focused for accessibility.
   *
   * @param element - Element to check
   */
  static assertElementIsFocused(element: HTMLElement): void {
    const expect = (globalThis as any).expect;
    if (expect) {
      expect(document.activeElement).toBe(element);
      expect(element.tabIndex).toBeGreaterThanOrEqual(0);
    } else {
      // Manual assertion when expect is not available
      if (document.activeElement !== element) {
        throw new Error('Element is not focused');
      }
      if (element.tabIndex < 0) {
        throw new Error('Element is not focusable');
      }
    }
  }

  /**
   * Asserts that an image has proper accessibility attributes.
   *
   * @param img - Image element to check
   */
  static assertImageIsAccessible(img: HTMLImageElement): void {
    const expect = (globalThis as any).expect;
    if (expect) {
      expect(img.alt).toBeTruthy();
      expect(img.alt.length).toBeGreaterThan(0);
      expect(img.alt).not.toBe('image'); // Should be descriptive
    } else {
      // Manual assertions
      if (!img.alt || img.alt.length === 0) {
        throw new Error('Image missing alt text');
      }
      if (img.alt === 'image') {
        throw new Error('Image alt text is not descriptive');
      }
    }
  }

  /**
   * Asserts that a form input has proper labeling.
   *
   * @param input - Input element to check
   */
  static assertInputIsLabeled(input: HTMLInputElement): void {
    const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label');
    const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');

    const expect = (globalThis as any).expect;
    if (expect) {
      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
    } else {
      if (!(hasLabel || hasAriaLabel || hasAriaLabelledBy)) {
        throw new Error('Input is not properly labeled');
      }
    }
  }

  /**
   * Asserts that an API response follows the expected structure.
   *
   * @param response - API response to check
   * @param expectedKeys - Array of expected keys in the response
   */
  static assertApiResponseStructure(response: any, expectedKeys: string[]): void {
    const expect = (globalThis as any).expect;
    if (expect) {
      expect(typeof response).toBe('object');
      expect(response).not.toBeNull();

      expectedKeys.forEach((key) => {
        expect(response).toHaveProperty(key);
      });
    } else {
      // Manual assertions
      if (typeof response !== 'object' || response === null) {
        throw new Error('Response is not a valid object');
      }

      const missingKeys = expectedKeys.filter((key) => !(key in response));
      if (missingKeys.length > 0) {
        throw new Error(`Response missing keys: ${missingKeys.join(', ')}`);
      }
    }
  }
}

// Export commonly used test data
export const TEST_IMAGES = MockImageFactory.createMockImageArray(5);
export const TEST_ENVIRONMENT = TestEnvironment.createMockEnvironment();
export const TEST_UPLOAD_FILE = MockImageFactory.createMockUploadFile();
