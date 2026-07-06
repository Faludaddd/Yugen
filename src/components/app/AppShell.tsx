'use client';

/**
 * AppShell — mobile-app-style layout wrapper.
 *
 *  - Fixed top header (compact, context-aware)
 *  - Scrollable content area with bottom padding for nav
 *  - Fixed bottom tab bar with 5 tabs and safe-area inset
 *  - Header hides on scroll down, reappears on scroll up
 */

import { useEffect, useState, useRef } from 'react';
import { Home, Compass, Calendar, Bookmark, Settings as SettingsIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AppTab = 'home' | 'browse' | 'schedule' | 'list' | 'settings';

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (t: AppTab) => void;
  onOpenSearch: () => void;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  children: React.ReactNode;
}

const TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'browse', label: 'Browse', icon: Compass },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'list', label: 'My List', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function AppShell({
  activeTab,
  onTabChange,
  onOpenSearch,
  title,
  subtitle,
  showSearch = true,
  children,
}: AppShellProps) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Always show header at the top of the page
      if (y < 20) {
        setHeaderVisible(true);
        lastScrollY.current = y;
        return;
      }
      // Hide on scroll down, show on scroll up
      if (y > lastScrollY.current + 8) {
        setHeaderVisible(false);
      } else if (y < lastScrollY.current - 8) {
        setHeaderVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: 'var(--background)',
      }}
    >
      {/* ─── Top header (compact, app-style) ─── */}
      <AnimatePresence>
        {headerVisible && (
          <motion.header
            className="fixed left-0 right-0 top-0 z-50"
            style={{
              background: 'rgba(8, 8, 8, 0.85)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              borderBottom: '1px solid var(--border)',
              paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          >
            <div className="mx-auto flex h-12 max-w-[109rem] items-center gap-2 px-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {/* Yugen logo mark */}
                <img
                  src="/logo.svg"
                  alt="Yugen"
                  className="h-8 w-8 flex-shrink-0"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(181, 168, 255, 0.5))' }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[1.05rem] font-bold leading-tight tracking-tight text-[var(--foreground)]">
                      {title}
                    </span>
                    <span
                      className="flex-shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.15em]"
                      style={{ color: 'var(--primary)' }}
                    >
                      幽玄
                    </span>
                  </div>
                  {subtitle && (
                    <div className="truncate text-[0.65rem] leading-tight text-[var(--muted-foreground)]">
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>

              {showSearch && (
                <button
                  onClick={onOpenSearch}
                  aria-label="Search"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition-transform active:scale-90"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ─── Content area ─── */}
      <main
        className="mx-auto w-full max-w-[109rem] px-3 pt-14 sm:px-4"
        style={{
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>

      {/* ─── Bottom tab bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(8, 8, 8, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="mx-auto flex max-w-[109rem] items-stretch justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
                style={{
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                {/* Active indicator pill at top */}
                {active && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute top-0 h-0.5 w-8 rounded-full"
                    style={{ background: 'var(--primary)' }}
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                  />
                )}
                <Icon
                  className="h-5 w-5 transition-transform"
                  style={{
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                  }}
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className="text-[0.65rem] font-medium"
                  style={{
                    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
