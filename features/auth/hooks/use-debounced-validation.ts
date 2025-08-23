import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod/v4';

// Utility debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface DebouncedValidationResult {
  error: string | undefined;
  isValidating: boolean;
}

/**
 * Hook for debounced form validation with Zod schemas
 * 
 * @param value - The value to validate
 * @param schema - Zod schema to validate against
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with error message and validation state
 */
export function useDebouncedValidation<T>(
  value: string,
  schema: z.ZodSchema<T>,
  debounceMs: number = 300
): DebouncedValidationResult {
  const [error, setError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce((val: string) => {
      // Skip validation for empty values
      if (!val.trim()) {
        setError(undefined);
        setIsValidating(false);
        return;
      }

      try {
        const result = schema.safeParse(val);
        if (result.success) {
          setError(undefined);
        } else {
          // In Zod v4, error.issues contains the validation errors
          setError(result.error.issues[0]?.message || 'Validation error');
        }
      } catch (err) {
        // Handle any unexpected validation errors
        setError('Validation error occurred');
      } finally {
        setIsValidating(false);
      }
    }, debounceMs),
    [schema, debounceMs]
  );

  // Trigger validation when value changes
  useEffect(() => {
    if (value.trim()) {
      setIsValidating(true);
    }
    debouncedValidate(value);
    
    // Cleanup debounced function on unmount
    return () => {
      // Note: debounced function cleanup is handled by the debounce utility
    };
  }, [value, debouncedValidate]);

  // Reset error immediately when value becomes empty
  useEffect(() => {
    if (!value.trim()) {
      setError(undefined);
      setIsValidating(false);
    }
  }, [value]);

  return { error, isValidating };
}

/**
 * Hook for immediate validation without debouncing
 * Useful for validation on blur or form submission
 * 
 * @param value - The value to validate
 * @param schema - Zod schema to validate against
 * @returns Object with error message and validation state
 */
export function useImmediateValidation<T>(
  value: string,
  schema: z.ZodSchema<T>
): { error: string | undefined; isValid: boolean } {
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!value.trim()) {
      setError(undefined);
      return;
    }

    try {
      const result = schema.safeParse(value);
      if (result.success) {
        setError(undefined);
      } else {
        // In Zod v4, error.issues contains the validation errors
        setError(result.error.issues[0]?.message || 'Validation error');
      }
    } catch (err) {
      setError('Validation error occurred');
    }
  }, [value, schema]);

  return { error, isValid: !error && !!value.trim() };
}