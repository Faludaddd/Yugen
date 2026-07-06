'use client';

/**
 * MyListView — user's anime library with status categories.
 *
 * Categories: Watching / Watched / Plan to Watch / Dropped / On Hold
 * Each anime is fetched from AniList by ID and displayed as a card.
 * Long-press / context menu on a card lets you change status or remove.
 */

import { useEffect, useState, useCallback } from 'react';
import { Bookmark, Play, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, type ListStatus } from '@/lib/settings';
import { AnimeCard } from '@/components/anime/AnimeCard';
import type { Anime } from '@/lib/streaming/types';
import { toast } from 'sonner';

const CATEGORIES: { id: ListStatus; label: string; color: string }[] = [
  { id: 'WATCHING', label: 'Watching', color: 'var(--status-ongoing)' },
  { id: 'WATCHED', label: 'Completed', color: 'var(--status-completed)' },
  { id: 'PLAN_TO_WATCH', label: 'Plan to Watch', color: 'var(--primary)' },
  { id: 'ON_HOLD', label: 'On Hold', color: 'var(--status-not-aired)' },
  { id: 'DROPPED', label: 'Dropped', color: 'var(--status-cancelled)' },
];

interface MyListViewProps {
  onSelectAnime: (a: Anime) => void;
}

export function MyListView({ onSelectAnime }: MyListViewProps) {
  const { myList, updateListStatus, removeFromList } = useSettings();
  const [activeCategory, setActiveCategory] = useState<ListStatus>('WATCHING');
  const [animeCache, setAnimeCache] = useState<Record<string, Anime>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Fetch anime metadata for each list entry
  useEffect(() => {
    const idsToFetch = myList
      .map((e) => e.animeId)
      .filter((id) => !animeCache[id] && !loadingIds.has(id));

    if (idsToFetch.length === 0) return;

    setLoadingIds((prev) => new Set([...prev, ...idsToFetch]));

    idsToFetch.forEach(async (id) => {
      try {
        const res = await fetch(`/api/anime/${id}`, { cache: 'no-store' });
        if (!res.ok) return;
        const d = await res.json();
        setAnimeCache((prev) => ({ ...prev, [id]: d.anime as Anime }));
      } catch {
        // ignore
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  }, [myList, animeCache, loadingIds]);

  const handleRemove = useCallback(
    (animeId: string, title: string) => {
      removeFromList(animeId);
      toast.success(`Removed "${title}" from your list`);
    },
    [removeFromList]
  );

  const handleStatusChange = useCallback(
    (animeId: string, status: ListStatus, title: string) => {
      updateListStatus(animeId, status);
      toast.success(`Moved "${title}" to ${status.replace(/_/g, ' ')}`);
    },
    [updateListStatus]
  );

  const categoryEntries = myList.filter((e) => e.status === activeCategory);

  if (myList.length === 0) {
    return (
      <div className="space-y-5">
        {/* Category tabs (always visible so users see the structure) */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: active ? 'var(--primary)' : 'var(--secondary)',
                  borderColor: active ? 'var(--primary)' : 'var(--border)',
                  color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: cat.color }}
                />
                {cat.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
                  style={{
                    background: active ? 'rgba(0,0,0,0.2)' : 'var(--card)',
                  }}
                >
                  0
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(181, 168, 255, 0.1)' }}
          >
            <Bookmark className="h-7 w-7" style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="mb-1 text-lg font-bold text-[var(--foreground)]">Your list is empty</h2>
          <p className="mb-4 max-w-xs text-sm text-[var(--muted-foreground)]">
            Tap the bookmark icon on any anime to add it to your list. Your library is saved on this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => {
          const count = myList.filter((e) => e.status === cat.id).length;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? 'var(--primary)' : 'var(--secondary)',
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: cat.color }}
              />
              {cat.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
                style={{
                  background: active ? 'rgba(0,0,0,0.2)' : 'var(--card)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Anime in active category */}
      {categoryEntries.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] py-12 text-center">
          <Bookmark className="mx-auto mb-2 h-8 w-8 text-[var(--muted-foreground)] opacity-40" />
          <div className="text-sm text-[var(--muted-foreground)]">
            No anime in this category yet.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {categoryEntries.map((entry) => {
            const anime = animeCache[entry.animeId];
            if (!anime) {
              return (
                <div
                  key={entry.animeId}
                  className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--secondary)]"
                />
              );
            }
            return (
              <div key={entry.animeId} className="relative group">
                <AnimeCard
                  anime={anime}
                  onClick={() => onSelectAnime(anime)}
                />
                {/* Quick actions overlay (visible on hover) */}
                <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAnime(anime);
                    }}
                    className="flex-1 rounded bg-[var(--primary)] px-2 py-1 text-[0.6rem] font-bold text-[var(--primary-foreground)]"
                  >
                    <Play className="inline h-2.5 w-2.5" fill="currentColor" /> Play
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(entry.animeId, anime.titleEnglish || anime.titleRomaji || 'anime');
                    }}
                    className="rounded bg-[var(--destructive)] px-2 py-1 text-[0.6rem] font-bold text-white"
                  >
                    <Trash2 className="inline h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status changer for the active category */}
      {categoryEntries.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Quick move to:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.filter((c) => c.id !== activeCategory).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  categoryEntries.forEach((entry) => {
                    const anime = animeCache[entry.animeId];
                    if (anime) {
                      handleStatusChange(entry.animeId, cat.id, anime.titleEnglish || anime.titleRomaji || 'anime');
                    }
                  });
                }}
                className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
