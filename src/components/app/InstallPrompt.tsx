'use client';

/**
 * InstallPrompt — shows an "Add to Home Screen" banner when the PWA
 * install criteria are met (Chrome/Edge) or always on iOS Safari
 * (since iOS doesn't support the beforeinstallprompt event).
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Don't show if already installed/standalone
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('yugen-install-dismissed');
    if (dismissed === 'true') return;

    // Listen for beforeinstallprompt (Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // On iOS, show after a delay (no beforeinstallprompt event)
    if (isIOSDevice) {
      const t = setTimeout(() => setShowBanner(true), 8000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS can't be programmatically installed — just dismiss
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('yugen-install-dismissed', 'true');
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          className="fixed bottom-20 left-3 right-3 z-[60]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur"
            style={{
              background: 'rgba(14, 14, 14, 0.95)',
              borderColor: 'var(--border)',
            }}
          >
            <img
              src="/icon-192.png"
              alt="Yugen"
              className="h-12 w-12 rounded-xl flex-shrink-0"
              style={{ filter: 'drop-shadow(0 0 6px rgba(181, 168, 255, 0.4))' }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[var(--foreground)]">
                Install Yugen
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {isIOS
                  ? 'Tap Share → Add to Home Screen for the full app experience'
                  : 'Add to your home screen for offline access'}
              </div>
            </div>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-[var(--primary-foreground)] transition-transform active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </button>
            )}
            {isIOS && (
              <div className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-[var(--primary)]">
                <Plus className="h-4 w-4" />
              </div>
            )}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="flex-shrink-0 rounded-full p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
