'use client';

/**
 * Drawer — left side navigation drawer.
 *
 * Contents (top to bottom):
 *   - Header with close button
 *   - Nav list: Home, Trending, Schedule, History
 *   - Info row: Status, Domains, version
 *   - Theme row: dark (single theme for now)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Flame, Calendar, Clock, Info, Globe, Heart } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  activeRoute: string;
  onNavigate: (route: 'home' | 'trending' | 'schedule' | 'history') => void;
}

const NAV_ITEMS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'trending' as const, label: 'Trending', icon: Flame },
  { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
  { id: 'history' as const, label: 'History', icon: Clock },
];

export function Drawer({ open, onClose, activeRoute, onNavigate }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[900]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="absolute left-0 top-0 z-10 flex h-full w-full flex-col bg-[#0e0e0e] shadow-2xl sm:w-[300px]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{ borderRight: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-3">
              <span className="text-[1.1rem] font-bold">Menu</span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex flex-col gap-1 p-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-left text-[1rem] font-medium transition-colors ${
                      active
                        ? 'bg-[rgba(128,128,207,0.18)] text-[var(--primary)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--secondary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Info row */}
            <div className="mt-auto flex flex-col gap-2 border-t border-[var(--border)] p-2 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3" style={{ color: 'var(--status-favourite)' }} />
                <span>Made with AniList API</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                <span>anistream.app v1.0.0</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3" />
                <span>For educational use only</span>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
