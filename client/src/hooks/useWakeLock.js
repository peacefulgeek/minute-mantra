import { useRef, useCallback } from 'react';

/**
 * useWakeLock — Prevents screen from sleeping during active timer sessions.
 * Uses the Screen Wake Lock API (supported on Chrome/Edge/Safari 16.4+).
 * Gracefully degrades on unsupported browsers.
 */
export function useWakeLock() {
  const wakeLockRef = useRef(null);

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch (err) {
      // WakeLock denied (e.g., battery saver mode) — silently continue
      console.warn('Wake lock denied:', err.message);
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        // Already released
      }
      wakeLockRef.current = null;
    }
  }, []);

  return { acquire, release };
}
