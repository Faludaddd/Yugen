'use client';

/**
 * Navbar — Miruro-style fixed top navigation.
 *
 *  Left: hamburger + AniStream logo
 *  Center: search input (hidden on mobile, hamburger opens it)
 *  Right: notifications + profile
 *
 * Becomes solid when scrolled, has bottom border + shadow.
 */

import { useEffect, useState } from 'react';
import { Menu, Search, Bell, User, X } from 'lucide-react';

interface NavbarProps {
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
}

export function Navbar({ onOpenDrawer, onOpenSearch }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-[600] px-2.5 py-2.5"
      style={{
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'rgba(14,14,14,0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        boxShadow: scrolled ? '0 10px 20px rgba(0,0,0,0.6)' : 'none',
        transition: 'background 0.2s, box-shadow 0.2s, border-bottom 0.2s',
      }}
    >
      <div className="mx-auto flex max-w-[109rem] items-center gap-2">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition-transform hover:scale-90"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div
              className="h-5 w-5 rounded-md"
              style={{
                background: 'linear-gradient(135deg, #b5a8ff 0%, #595991 100%)',
              }}
            />
            <span className="text-[1.05rem] font-bold tracking-tight">
              AniStream
            </span>
          </div>
        </div>

        {/* Center: search (desktop) */}
        <div className="mx-auto hidden max-w-[35rem] flex-1 md:block">
          <button
            onClick={onOpenSearch}
            className="flex w-full items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-left text-[0.85rem] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <Search className="h-4 w-4" />
            <span>Search anime…</span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onOpenSearch}
            aria-label="Search"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition-transform hover:scale-90 md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Notifications"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition-transform hover:scale-90"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            aria-label="Profile"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] transition-transform hover:scale-90"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
