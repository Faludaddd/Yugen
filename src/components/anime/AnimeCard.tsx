'use client';

/**
 * AnimeCard — Miruro-style poster card.
 *
 *  - 2:3 portrait ratio (138.346% padding-top, exactly like AniList posters)
 *  - Hover: image darkens + zoom, center play icon fades in
 *  - Title row: status indicator dot (color by status) + truncated title
 *  - Detail pills: format · year · episode count
 *  - Per-anime accent color applied via inline `--anime-accent` for hover tint
 */

import { Play, Calendar, Tv } from 'lucide-react';
import type { Anime } from '@/lib/streaming/types';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
}

export function AnimeCard({ anime, onClick }: AnimeCardProps) {
  const title = anime.titleEnglish || anime.titleRomaji || anime.titleNative || 'Unknown';
  const accent = anime.color || '#b5a8ff';
  const status = anime.status ?? '';
  const indicatorClass =
    status === 'RELEASING' ? 'dot-ongoing' :
    status === 'FINISHED' ? 'dot-completed' :
    status === 'CANCELLED' ? 'dot-cancelled' :
    status === 'NOT_YET_RELEASED' ? 'dot-not-aired' : '';

  return (
    <button
      onClick={onClick}
      className="group block w-full text-left anim-slide-up"
      style={{ ['--anime-accent' as string]: accent }}
    >
      {/* Image area — 2:3 portrait */}
      <div
        className="relative overflow-hidden bg-[#181818] transition-transform duration-200 group-hover:-translate-y-1"
        style={{
          paddingTop: '138.346%',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        {anime.posterUrl && (
           
          <img
            src={anime.posterUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:brightness-50"
          />
        )}

        {/* Hover play button */}
        <div
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100"
          style={{
            color: accent,
            border: `2px solid ${accent}`,
            boxShadow: `0 4px 14px ${accent}66`,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Play className="h-5 w-5" fill="currentColor" />
        </div>

        {/* Score badge */}
        {anime.averageScore && (
          <div
            className="absolute right-1 top-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#ffb648',
              backdropFilter: 'blur(4px)',
            }}
          >
            ★ {Math.round(anime.averageScore)}
          </div>
        )}
      </div>

      {/* Title row */}
      <div
        className="flex items-center gap-1.5 px-1 pt-1.5 pb-0.5"
        title={`Title: ${title}`}
      >
        {indicatorClass && (
          <span
            className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${indicatorClass}`}
          />
        )}
        <span
          className="truncate text-[0.83rem] font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--anime-accent)]"
        >
          {title}
        </span>
      </div>

      {/* Detail pills */}
      <div className="flex gap-1 px-1 pb-1 text-[0.7rem] font-bold text-[var(--muted-foreground)]">
        {anime.format && (
          <span className="rounded bg-[var(--secondary)] px-1 py-0.5">{anime.format}</span>
        )}
        {anime.seasonYear && (
          <span className="flex items-center gap-0.5 rounded bg-[var(--secondary)] px-1 py-0.5">
            <Calendar className="h-2.5 w-2.5" />
            {anime.seasonYear}
          </span>
        )}
        {anime.episodes && (
          <span className="flex items-center gap-0.5 rounded bg-[var(--secondary)] px-1 py-0.5">
            <Tv className="h-2.5 w-2.5" />
            {anime.episodes}
          </span>
        )}
      </div>
    </button>
  );
}
