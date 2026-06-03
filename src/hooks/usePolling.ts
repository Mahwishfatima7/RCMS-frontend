import { useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for polling data at regular intervals
 * @param fetchFunction - Async function to fetch data
 * @param interval - Interval in milliseconds (default: 30000 = 30 seconds)
 * @param enabled - Whether polling is enabled (default: true)
 */
export function usePolling(
  fetchFunction: () => Promise<any>,
  interval: number = 30000,
  enabled: boolean = true
) {
  const memoizedFetch = useCallback(fetchFunction, []);

  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately on mount
    memoizedFetch().catch((err) => {
      console.error("Polling error:", err);
    });

    // Set up interval for subsequent fetches
    const intervalId = setInterval(() => {
      memoizedFetch().catch((err) => {
        console.error("Polling error:", err);
      });
    }, interval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [memoizedFetch, interval, enabled]);
}

/**
 * Custom hook for polling with loading state management
 * Prevents showing loading state on subsequent polls
 */
export function usePollingWithSmoothLoading(
  fetchFunction: () => Promise<any>,
  interval: number = 30000,
  enabled: boolean = true,
  onFirstLoad?: () => void,
  onDataUpdate?: () => void
) {
  const isFirstLoadRef = useRef(true);

  const wrappedFetch = useCallback(async () => {
    try {
      await fetchFunction();
      
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        onFirstLoad?.();
      } else {
        onDataUpdate?.();
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [fetchFunction, onFirstLoad, onDataUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately on mount
    wrappedFetch();

    // Set up interval for subsequent fetches
    const intervalId = setInterval(wrappedFetch, interval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [wrappedFetch, interval, enabled]);
}
