'use client';

/**
 * AnimeCard — poster card used in horizontal rails and grids.
 */

import { Star, Play } from 'lucide-react';
import type { Anime } from '@/lib/streaming/types';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
  variant?: 'portrait' | 'landscape';
  showProgress?: number; // 0-100
}

export function AnimeCard({
  anime,
  onClick,
  variant = 'portrait',
  showProgress,
}: AnimeCardProps) {
  const isPortrait = variant === 'portrait';
  const img = isPortrait ? anime.posterUrl : anime.bannerUrl || anime.posterUrl;
  const title = anime.titleEnglish || anime.titleRomaji || anime.titleNative;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary ${
        isPortrait ? 'w-[140px] sm:w-[160px]' : 'w-[240px] sm:w-[280px]'
      }`}
    >
      <div className={`${isPortrait ? 'aspect-[2/3]' : 'aspect-video'} relative bg-muted`}>
        {img ? (
           
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="rounded-full bg-primary/90 p-2.5">
            <Play className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
        </div>

        {/* Score badge */}
        {anime.averageScore && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
            <Star className="h-2.5 w-2.5 fill-amber-400" />
            {Math.round(anime.averageScore)}
          </div>
        )}

        {/* Progress bar */}
        {typeof showProgress === 'number' && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary"
              style={{ width: `${showProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-2">
        <div className="truncate text-xs font-medium text-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {anime.format ?? 'TV'} · {anime.seasonYear ?? ''}
        </div>
      </div>
    </button>
  );
}
