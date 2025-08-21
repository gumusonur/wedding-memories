/**
 * Internationalization utilities and constants for the wedding gallery application.
 *
 * This file provides a foundation for future internationalization support,
 * following the project standards for inclusive development.
 */

/**
 * Supported locales for the application.
 * Currently supports English with structure for future expansion.
 */
export const SUPPORTED_LOCALES = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  // Future locales can be added here:
  // 'es-ES': 'Español',
  // 'fr-FR': 'Français',
  // 'de-DE': 'Deutsch',
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

/**
 * Default locale for the application.
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

/**
 * Text content for different UI elements with internationalization structure.
 * This follows the project principle of being "welcoming to developers worldwide".
 */
export const UI_TEXT = {
  'en-US': {
    // Photo Gallery
    gallery: {
      title: 'Wedding Memories',
      noPhotos: 'No photos yet',
      noPhotosDescription: (brideName: string, groomName: string) =>
        `Be the first to share a memory from ${brideName} & ${groomName}'s special day!`,
      loadingPhotos: 'Loading new photos...',
      photoCount: (count: number) => `${count} photo${count !== 1 ? 's' : ''}`,
      sharedBy: (name: string) => `Shared by ${name}`,
      openPhoto: (index: number, guestName?: string) =>
        `Open photo ${index + 1}${guestName ? ` shared by ${guestName}` : ''}`,
      photoAltText: (brideName: string, groomName: string, guestName?: string, index?: number) => {
        if (guestName && guestName !== 'Unknown Guest') {
          return `Wedding photo shared by ${guestName} - ${brideName} & ${groomName} wedding memories`;
        }
        return `Wedding photo${index ? ` #${index + 1}` : ''} - ${brideName} & ${groomName} wedding memories`;
      },
    },

    // Upload Component
    upload: {
      title: 'Share Wedding Memories',
      description: (brideName: string, groomName: string) =>
        `Select photos to add to ${brideName} & ${groomName}'s wedding gallery`,
      addPhotos: 'Add Photos',
      addingAs: 'Adding as:',
      notSet: 'Not set',
      chooseOrDrag: 'Choose photos or drag & drop',
      supportedFormats: 'JPG, PNG, GIF, WebP • Multiple files supported',
      dropMoreFiles: 'Drop more files here',
      selectMultiple: 'Select Multiple',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      removeSelected: (count: number) => `Remove ${count}`,
      photosSelected: (count: number) => `${count} photo${count !== 1 ? 's' : ''} selected`,
      clearCompleted: 'Clear Completed',
      addCount: (count: number) => `Add ${count} Photo${count !== 1 ? 's' : ''}`,
      adding: (count: number) => `Adding... (${count})`,
      close: 'Close',
      done: 'Done',
    },

    // Error Messages
    errors: {
      invalidFileType: (fileName: string) =>
        `${fileName} is not a supported image format. Please select JPG, PNG, GIF, or WebP files.`,
      duplicatePhotos: (count: number, fileNames: string[]) =>
        `${count} photo${count > 1 ? 's' : ''} already selected: ${fileNames.slice(0, 2).join(', ')}${fileNames.length > 2 ? ` and ${fileNames.length - 2} more` : ''}`,
      nameRequired: 'Please enter your name before adding photos.',
      uploadFailed: (fileName: string) => `Failed to add ${fileName}`,
      validationFailed: 'Please enter a valid name.',
      networkError: 'Network error. Please check your connection and try again.',
      serverError: 'Server error. Please try again later.',
      dateUnavailable: 'Date unavailable',
    },

    // Success Messages
    success: {
      photosAdded: (count: number) => `${count} photo${count !== 1 ? 's' : ''} ready to add`,
      photoUploaded: (fileName: string) => `${fileName} has been added to the gallery.`,
      photosUploading: 'Loading new photos...',
      nameUpdated: (name: string) => `Your name has been changed to ${name}`,
      photosRemoved: (count: number) =>
        `${count} photo${count !== 1 ? 's' : ''} removed from the list.`,
    },

    // Accessibility
    accessibility: {
      loading: 'Loading',
      galleryUpdated: (time: string) => `Gallery last updated: ${time}`,
      managingFiles: (count: number) => `Managing ${count} Files`,
      selectedFiles: (count: number) => `Selected Files (${count})`,
    },
  },

  'en-GB': {
    // British English variants can be added here when needed
    // For now, use the same as en-US but structure is ready for differences
  },
} as const;

/**
 * Gets localized text for a given key path and locale.
 *
 * @param locale - The locale to use for text retrieval
 * @param keyPath - Path to the text content (e.g., 'gallery.title')
 * @param params - Parameters for dynamic text generation
 * @returns Localized text string
 */
export function getLocalizedText(
  locale: SupportedLocale = DEFAULT_LOCALE,
  keyPath: string,
  ...params: any[]
): string {
  const texts = UI_TEXT[locale] || UI_TEXT[DEFAULT_LOCALE];

  try {
    const keys = keyPath.split('.');
    let current: any = texts;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Localization key not found: ${keyPath} for locale: ${locale}`);
        return keyPath; // Fallback to key path
      }
    }

    if (typeof current === 'function') {
      return current(...params);
    }

    return current || keyPath;
  } catch (error) {
    console.warn(`Error getting localized text for key: ${keyPath}`, error);
    return keyPath;
  }
}

/**
 * Formats a date according to the user's locale preferences.
 *
 * @param date - Date to format
 * @param locale - Locale for formatting
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatLocalizedDate(
  date: Date | string,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObject);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return getLocalizedText(locale, 'errors.dateUnavailable');
  }
}

/**
 * Detects the user's preferred locale from browser settings.
 *
 * @returns Best matching supported locale
 */
export function detectUserLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const browserLocales = [navigator.language, ...navigator.languages];

  for (const browserLocale of browserLocales) {
    // Check for exact match
    if (browserLocale in SUPPORTED_LOCALES) {
      return browserLocale as SupportedLocale;
    }

    // Check for language match (e.g., 'en' matches 'en-US')
    const languageCode = browserLocale.split('-')[0];
    const matchingLocale = Object.keys(SUPPORTED_LOCALES).find((locale) =>
      locale.startsWith(languageCode)
    );

    if (matchingLocale) {
      return matchingLocale as SupportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}
