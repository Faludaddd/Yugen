'use client';

/**
 * SideListCard — Miruro-style horizontal list item for sidebar (TOP AIRING etc).
 *
 * Layout:
 *   [poster 4.25rem wide] [title + detail pills] [grayscale banner bg on right]
 *   On hover: card slides right, accent color lights up, banner becomes color
 */

import { Calendar, Tv, Star, Plus } from 'lucide-react';
import type { Anime } from '@/lib/streaming/types';

interface SideListCardProps {
  anime: Anime;
  rank?: number;
  onClick: () => void;
}

export function SideListCard({ anime, rank, onClick }: SideListCardProps) {
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
      className="group relative flex h-24 w-full items-center gap-2 overflow-hidden bg-[var(--secondary)] transition-all duration-200 hover:ml-1 hover:brightness-110"
      style={{
        borderRadius: 'var(--radius)',
        ['--side-list-accent' as string]: accent,
      }}
    >
      {/* Banner background (right 60%) — grayscale, color on hover */}
      {anime.bannerUrl && (
        <div className="absolute right-0 top-0 h-full w-[60%] overflow-hidden">
          { }
          <img
            src={anime.bannerUrl}
            alt=""
            className="h-full w-full object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(-70deg, transparent -200%, var(--secondary) 80%)',
            }}
          />
        </div>
      )}

      {/* Poster (left) */}
      {anime.posterUrl && (
         
        <img
          src={anime.posterUrl}
          alt={title}
          className="relative z-10 h-24 w-[4.25rem] flex-shrink-0 object-cover"
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-1 pr-2">
        {rank && (
          <div
            className="text-[0.7rem] font-bold"
            style={{ color: accent }}
          >
            #{rank}
          </div>
        )}
        <div className="flex items-center gap-1">
          {indicatorClass && (
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${indicatorClass}`} />
          )}
          <span className="line-clamp-2 text-[0.85rem] font-medium leading-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--side-list-accent)]">
            {title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[0.7rem] font-semibold text-[var(--muted-foreground)]">
          {anime.format && (
            <span className="rounded bg-black/40 px-1 py-0.5">{anime.format}</span>
          )}
          {anime.seasonYear && (
            <span className="flex items-center gap-0.5 rounded bg-black/40 px-1 py-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {anime.seasonYear}
            </span>
          )}
          {anime.averageScore && (
            <span className="flex items-center gap-0.5 rounded bg-black/40 px-1 py-0.5" style={{ color: '#ffb648' }}>
              <Star className="h-2.5 w-2.5" fill="currentColor" />
              {Math.round(anime.averageScore)}
            </span>
          )}
        </div>
      </div>

      {/* Plus button on hover */}
      <div
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: 'rgba(0,0,0,0.6)', color: accent, backdropFilter: 'blur(4px)' }}
      >
        <Plus className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
