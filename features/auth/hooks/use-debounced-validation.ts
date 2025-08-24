import { useEffect, useState } from "react";
import { z } from "zod/v4";
import { useDebounce } from "@/hooks/use-debounce";

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

  const debouncedValue = useDebounce<string>(value, debounceMs);

  // Mark validating on input changes; clear when empty
  useEffect(() => {
    if (!value.trim()) {
      setError(undefined);
      setIsValidating(false);
      return;
    }
    setIsValidating(true);
  }, [value]);

  // Validate when the debounced value settles
  useEffect(() => {
    if (!debouncedValue.trim()) {
      setError(undefined);
      setIsValidating(false);
      return;
    }

    try {
      const result = schema.safeParse(debouncedValue);
      if (result.success) {
        setError(undefined);
      } else {
        setError(result.error.issues[0]?.message || "Validation error");
      }
    } catch {
      setError("Validation error occurred");
    } finally {
      setIsValidating(false);
    }
  }, [debouncedValue, schema]);

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
        setError(result.error.issues[0]?.message || "Validation error");
      }
    } catch (err) {
      setError("Validation error occurred");
    }
  }, [value, schema]);

  return { error, isValid: !error && !!value.trim() };
}
