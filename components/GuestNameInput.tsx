'use client';

import { useState, useEffect, forwardRef } from 'react';
import { Input } from './ui/input';
import { validateGuestNameForUI } from '../utils/validation';

interface GuestNameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, error: string | null) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Reusable guest name input component with file system safe validation.
 * 
 * Features:
 * - Real-time validation with user-friendly error messages
 * - File system safe character checking (names used as folder names)
 * - International character support
 * - Inappropriate content filtering
 * - Visual error states
 */
export const GuestNameInput = forwardRef<HTMLInputElement, GuestNameInputProps>(({
  value,
  onChange,
  onValidationChange,
  placeholder = "Your name",
  className = "",
  autoFocus = false,
  disabled = false,
  onKeyDown,
}, ref) => {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Validate name whenever value changes
  useEffect(() => {
    const trimmedValue = value.trim();
    
    if (trimmedValue === '') {
      // Empty is not an error, but not valid either
      setError(null);
      setIsValid(false);
      onValidationChange?.(false, null);
      return;
    }

    const validationError = validateGuestNameForUI(trimmedValue);
    setError(validationError);
    setIsValid(!validationError);
    onValidationChange?.(!validationError, validationError);
  }, [value, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`${className} ${error ? 'border-destructive focus:border-destructive' : ''}`}
      />
      <div className="h-6 flex items-center">
        {error && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <span className="w-4 h-4">⚠️</span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

GuestNameInput.displayName = 'GuestNameInput';