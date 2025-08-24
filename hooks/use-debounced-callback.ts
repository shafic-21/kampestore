import { useCallback, useRef } from "react";

/**
 * Hook that returns a debounced version of the provided callback function.
 * The debounced function delays invoking the callback until after the specified
 * delay has passed since the last time it was invoked.
 * 
 * @param callback - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback;
}