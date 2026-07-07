'use client';

/**
 * SearchOverlay — full-screen app-style search.
 *
 * Features:
 *   - Full-screen modal with prominent search field at top
 *   - "Recent searches" when query is empty (from settings store)
 *   - "Trending searches" as quick chips
 *   - When results come in:
 *       • "Top result" — big featured card (highest-relevance match)
 *       • "More results" — vertical list of compact cards with bigger posters
 *   - Saves every search to recent on submit
 *   - Animated transitions
 *   - Loading skeletons
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, ChevronRight, Play, Star, Tv } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { searchAnimeClient } from '@/lib/client-data';
import type { Anime } from '@/lib/streaming/types';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelectAnime: (a: Anime) => void;
}

const TRENDING_SEARCHES = ['One Piece', 'Jujutsu Kaisen', 'Demon Slayer', 'Frieren', 'Chainsaw Man', 'Solo Leveling'];

export function SearchOverlay({ open, onClose, onSelectAnime }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { recentSearches, addRecentSearch, clearRecentSearches } = useSettings();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while search is open so home content underneath can't move
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const anime = await searchAnimeClient(trimmed, 30);
        setResults(anime);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleSubmit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      addRecentSearch(trimmed);
      setQuery(trimmed);
    },
    [addRecentSearch]
  );

  const handleSelect = useCallback(
    (a: Anime) => {
      const trimmed = query.trim();
      if (trimmed) addRecentSearch(trimmed);
      onSelectAnime(a);
    },
    [query, addRecentSearch, onSelectAnime]
  );

  // Top result = first match (already sorted by relevance on server)
  const topResult = results.length > 0 ? results[0] : null;
  const moreResults = results.length > 1 ? results.slice(1) : [];

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex flex-col"
          style={{
            // Solid opaque background on a NON-animated layer so home content
            // never bleeds through during the spring transition.
            background: '#080808',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
        <motion.div
          className="flex h-full w-full flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        >
          {/* Search header */}
          <div
            className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5"
            style={{
              background: 'rgba(8, 8, 8, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div
              className="flex flex-1 items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-2.5"
              style={{
                borderColor: query.trim() ? 'var(--primary)' : 'var(--border)',
              }}
            >
              <Search
                className="h-4 w-4 flex-shrink-0"
                style={{ color: query.trim() ? 'var(--primary)' : 'var(--muted-foreground)' }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit(query);
                }}
                placeholder="Search anime by title…"
                className="flex-1 border-0 bg-transparent text-[0.95rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              />
              {loading && (
                <div
                  className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                />
              )}
              {!loading && query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear"
                  className="flex-shrink-0 rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 px-2 text-[0.9rem] font-medium text-[var(--primary)]"
            >
              Cancel
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-4">
            {!query.trim() ? (
              <div className="space-y-6">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        <Clock className="h-3 w-3" />
                        Recent
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-[0.7rem] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSubmit(s)}
                          className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-[0.8rem] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Trending searches */}
                <section>
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    <TrendingUp className="h-3 w-3" />
                    Trending searches
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {TRENDING_SEARCHES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSubmit(s)}
                        className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-[0.8rem] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                <div className="h-32 animate-pulse rounded-2xl bg-[var(--secondary)]" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-20 w-14 flex-shrink-0 animate-pulse rounded bg-[var(--secondary)]" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--secondary)]" />
                      <div className="h-2 w-1/3 animate-pulse rounded bg-[var(--secondary)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-30" />
                <div className="mb-1 text-base font-semibold text-[var(--foreground)]">
                  No results for &quot;{query}&quot;
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  Try a different title or check the spelling.
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Top result — big featured card */}
                {topResult && (
                  <section>
                    <h3 className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Top result
                    </h3>
                    <button
                      onClick={() => handleSelect(topResult)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-left transition-all hover:border-[var(--primary)]"
                      style={{
                        ['--anime-accent' as string]: topResult.color || '#b5a8ff',
                      }}
                    >
                      <div
                        className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-20"
                        style={{ border: `2px solid ${topResult.color || '#b5a8ff'}` }}
                      >
                        {topResult.posterUrl && (
                          <img
                            src={topResult.posterUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="mb-1 line-clamp-2 text-base font-bold leading-tight"
                          style={{ color: topResult.color || 'var(--foreground)' }}
                        >
                          {topResult.titleEnglish || topResult.titleRomaji}
                        </div>
                        {topResult.titleNative && topResult.titleNative !== topResult.titleEnglish && (
                          <div className="mb-1 truncate text-xs text-[var(--muted-foreground)]">
                            {topResult.titleNative}
                          </div>
                        )}
                        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-[var(--muted-foreground)]">
                          {topResult.format && (
                            <span className="flex items-center gap-0.5">
                              <Tv className="h-2.5 w-2.5" /> {topResult.format}
                            </span>
                          )}
                          {topResult.seasonYear && <span>· {topResult.seasonYear}</span>}
                          {topResult.episodes && <span>· {topResult.episodes} eps</span>}
                          {topResult.averageScore && (
                            <span
                              className="flex items-center gap-0.5 font-semibold"
                              style={{ color: '#ffb648' }}
                            >
                              · <Star className="h-2.5 w-2.5" fill="currentColor" />
                              {Math.round(topResult.averageScore)}%
                            </span>
                          )}
                        </div>
                        {topResult.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {topResult.genres.slice(0, 3).map((g) => (
                              <span
                                key={g}
                                className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[0.65rem] text-[var(--muted-foreground)]"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary)]" />
                    </button>
                  </section>
                )}

                {/* More results — list */}
                {moreResults.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      More results ({moreResults.length})
                    </h3>
                    <div className="space-y-1.5">
                      {moreResults.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => handleSelect(a)}
                          className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[var(--card)]"
                        >
                          <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--secondary)]">
                            {a.posterUrl && (
                              <img
                                src={a.posterUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[0.9rem] font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">
                              {a.titleEnglish || a.titleRomaji}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-[var(--muted-foreground)]">
                              {a.format && <span>{a.format}</span>}
                              {a.seasonYear && <span>· {a.seasonYear}</span>}
                              {a.episodes && <span>· {a.episodes} eps</span>}
                              {a.averageScore && (
                                <span style={{ color: '#ffb648' }}>
                                  · ★ {Math.round(a.averageScore)}%
                                </span>
                              )}
                            </div>
                            {a.genres.length > 0 && (
                              <div className="mt-0.5 truncate text-[0.7rem] text-[var(--muted-foreground)]">
                                {a.genres.slice(0, 3).join(' · ')}
                              </div>
                            )}
                          </div>
                          <Play
                            className="h-4 w-4 flex-shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100"
                            fill="currentColor"
                            style={{ color: a.color || 'var(--primary)' }}
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
