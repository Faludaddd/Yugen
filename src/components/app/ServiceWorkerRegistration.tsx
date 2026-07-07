'use client';

/**
 * ServiceWorkerRegistration — registers the Yugen service worker
 * for offline support and caching. Only runs in production to
 * avoid caching issues during development.
 */

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Only register in production
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        console.log('[Yugen] Service worker registered');
      } catch (e) {
        console.warn('[Yugen] SW registration failed:', e);
      }
    };

    // Register after page load
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
