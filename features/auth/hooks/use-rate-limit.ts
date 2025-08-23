import { useState, useCallback, useRef } from "react";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function useRateLimit(config: RateLimitConfig) {
  const [isBlocked, setIsBlocked] = useState(false);
  const requestTimestamps = useRef<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const { maxRequests, windowMs } = config;

    requestTimestamps.current = requestTimestamps.current.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (requestTimestamps.current.length >= maxRequests) {
      setIsBlocked(true);
      
      const oldestRequest = requestTimestamps.current[0];
      const resetTime = oldestRequest + windowMs - now;
      
      setTimeout(() => {
        setIsBlocked(false);
      }, resetTime);

      return false;
    }

    requestTimestamps.current.push(now);
    return true;
  }, [config]);

  const reset = useCallback(() => {
    requestTimestamps.current = [];
    setIsBlocked(false);
  }, []);

  return { isBlocked, checkRateLimit, reset };
}