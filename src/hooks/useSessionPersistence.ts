import { useEffect, useRef } from 'react';

/**
 * Auto-save a serializable session blob to localStorage on every change so a
 * tab/browser crash or accidental reload restores the user's last state.
 *
 * Only JSON-serializable data is stored. Files (Excel uploads) cannot be
 * persisted — they are dropped automatically. The parsed data extracted from
 * those files IS persisted, so the user keeps their work.
 */
export function useSessionAutoSave<T>(key: string, value: T, debounceMs = 250) {
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      try {
        const serializable = JSON.stringify(value, (_k, v) => {
          if (typeof File !== 'undefined' && v instanceof File) return null;
          return v;
        });
        localStorage.setItem(key, serializable);
      } catch {
        // quota exceeded or circular — ignore silently
      }
    }, debounceMs);
    return () => {
      if (t.current) window.clearTimeout(t.current);
    };
  }, [key, value, debounceMs]);
}

export function loadSession<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
