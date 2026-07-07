'use client';

/**
 * ContinueWatchingRail — horizontal scroll of in-progress episodes.
 *
 * Reads from the watchProgress store, fetches anime metadata for each entry,
 * and displays 16:9 cards with progress bars like Miruro's watchlist rail.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, X, ChevronRight } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import type { Anime } from '@/lib/streaming/types';

interface ContinueWatchingRailProps {
  onSelectAnime: (a: Anime) => void;
  onResume?: (anime: Anime, episodeId: string, episodeNum: number) => void;
}

interface ResolvedEntry {
  anime: Anime;
  episodeId: string;
  episodeNum: number;
  position: number;
  duration: number;
  progress: number;
  lastWatchedAt: number;
}

export function ContinueWatchingRail({ onSelectAnime, onResume }: ContinueWatchingRailProps) {
  const { watchProgress, clearProgress } = useSettings();
  const [entries, setEntries] = useState<ResolvedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (watchProgress.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const resolved: ResolvedEntry[] = [];
      for (const p of watchProgress.slice(0, 12)) {
        try {
          const res = await fetch(`/api/anime/${p.animeId}`, { cache: 'no-store' });
          if (!res.ok) continue;
          const d = await res.json();
          if (cancelled) return;
          resolved.push({
            anime: d.anime as Anime,
            episodeId: p.episodeId,
            episodeNum: p.episodeNum,
            position: p.position,
            duration: p.duration,
            progress: Math.min(100, Math.max(5, (p.position / p.duration) * 100)),
            lastWatchedAt: p.lastWatchedAt,
          });
        } catch {
          // skip
        }
      }
      // Sort by most recently watched
      resolved.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
      if (!cancelled) {
        setEntries(resolved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [watchProgress]);

  if (loading || entries.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
          Continue Watching
        </h3>
        <button
          onClick={() => {
            if (confirm('Clear all watch progress?')) {
              entries.forEach((e) => clearProgress(e.anime.id));
            }
          }}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
        >
          Clear all
        </button>
      </div>
      <div className="scrollbar-none rail-mask flex gap-3 overflow-x-auto pb-2">
        {entries.map((entry) => (
          <ContinueCard
            key={`${entry.anime.id}-${entry.episodeId}`}
            entry={entry}
            onSelect={() => onSelectAnime(entry.anime)}
            onResume={() => onResume?.(entry.anime, entry.episodeId, entry.episodeNum)}
          />
        ))}
      </div>
    </section>
  );
}

function ContinueCard({
  entry,
  onSelect,
  onResume,
}: {
  entry: ResolvedEntry;
  onSelect: () => void;
  onResume: () => void;
}) {
  const accent = entry.anime.color || '#b5a8ff';
  return (
    <motion.div
      className="w-[200px] flex-shrink-0 sm:w-[260px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="group relative aspect-video overflow-hidden rounded-xl bg-[var(--secondary)]"
        style={{ border: `1px solid ${accent}22` }}
      >
        {entry.anime.bannerUrl ? (
          <img
            src={entry.anime.bannerUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : entry.anime.posterUrl ? (
          <img
            src={entry.anime.posterUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : null}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Episode label */}
        <div className="glass absolute left-2 top-2 rounded-md px-2 py-0.5 text-[0.65rem] font-bold text-white">
          EP {entry.episodeNum}
        </div>

        {/* Resume button on hover */}
        <button
          onClick={onResume}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 scale-90 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100"
          style={{
            background: accent,
            color: '#080808',
            boxShadow: `0 4px 14px ${accent}66`,
          }}
        >
          <Play className="h-5 w-5" fill="currentColor" />
        </button>

        {/* Title + position info */}
        <div className="absolute inset-x-0 bottom-0 p-2">
          <div className="truncate text-xs font-semibold text-white">
            {entry.anime.titleEnglish || entry.anime.titleRomaji}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[0.6rem] text-white/70">
            <span>{Math.floor(entry.position / 60)}:{Math.floor(entry.position % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(entry.duration / 60)}:{Math.floor(entry.duration % 60).toString().padStart(2, '0')}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${entry.progress}%`, background: accent }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
