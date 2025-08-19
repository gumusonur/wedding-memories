import { useEffect, useCallback } from 'react';

/**
 * Custom hook to handle keypress events
 * @param targetKey - The key to listen for (e.g., 'Escape', 'ArrowLeft', '+', etc.)
 * @param handler - Function to call when the key is pressed
 * @param options - Optional configuration
 */
export function useKeypress(
  targetKey: string,
  handler: (event: KeyboardEvent) => void,
  options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    disabled?: boolean;
    target?: EventTarget;
  }
) {
  const memoizedHandler = useCallback(handler, [handler]);

  useEffect(() => {
    if (options?.disabled) return;

    const target = options?.target || document;

    const handleKeydown = (event: KeyboardEvent) => {
      // Handle different key representations
      const key = event.key;
      
      // Check for exact match or common aliases
      const isTargetKey = 
        key === targetKey ||
        // Handle + key (which can be = or +)
        (targetKey === '+' && (key === '+' || key === '=')) ||
        // Handle - key
        (targetKey === '-' && key === '-') ||
        // Handle 0 key
        (targetKey === '0' && key === '0') ||
        // Handle escape key variations
        (targetKey === 'Escape' && key === 'Escape') ||
        // Handle arrow keys
        (targetKey === 'ArrowLeft' && key === 'ArrowLeft') ||
        (targetKey === 'ArrowRight' && key === 'ArrowRight') ||
        (targetKey === 'ArrowUp' && key === 'ArrowUp') ||
        (targetKey === 'ArrowDown' && key === 'ArrowDown');

      if (isTargetKey) {
        if (options?.preventDefault !== false) {
          event.preventDefault();
        }
        if (options?.stopPropagation) {
          event.stopPropagation();
        }
        
        memoizedHandler(event);
      }
    };

    // Add event listener
    target.addEventListener('keydown', handleKeydown as EventListener);

    // Cleanup
    return () => {
      target.removeEventListener('keydown', handleKeydown as EventListener);
    };
  }, [targetKey, memoizedHandler, options]);
}

export default useKeypress;