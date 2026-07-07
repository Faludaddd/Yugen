'use client';

/**
 * HeroCarousel — Miruro-style featured banner carousel.
 *
 *  - Full-bleed banner image with 3-way dark gradient overlay (signature Miruro look)
 *  - Per-anime accent color drives the gradient title text
 *  - Glass chips for format / episode count / score / duration
 *  - "DETAILS" + "WATCH NOW" glass action buttons (bottom-right)
 *  - Auto-advances every 8s, with manual nav arrows (desktop only)
 *  - Pagination fraction "1 / 10" top-right
 *  - Next-airing badge top-left (when available)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Clock, Star, Tv, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Anime } from '@/lib/streaming/types';

interface HeroCarouselProps {
  items: Anime[];
  onSelect: (a: Anime) => void;
  onWatch: (a: Anime) => void;
}

export function HeroCarousel({ items, onSelect, onWatch }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(items.length, 1));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1));
  }, [items.length]);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    timerRef.current = setInterval(advance, 8000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, advance, items.length]);

  if (items.length === 0) return null;
  const current = items[index];
  if (!current) return null;

  const title = current.titleEnglish || current.titleRomaji || current.titleNative || 'Unknown';
  const accent = current.color || '#b5a8ff';

  // Format next-airing time
  const nextAir = (current as Anime & { nextAiringEpisode?: { episode: number; timeUntilAiring: number } | null }).nextAiringEpisode;
  let nextAirLabel = '';
  if (nextAir) {
    const totalSecs = nextAir.timeUntilAiring;
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    nextAirLabel = `EP ${nextAir.episode} ${days}D ${hours}H`;
  }

  return (
    <div
      className="relative h-[22rem] w-full overflow-hidden sm:h-[26rem] md:h-[30rem]"
      style={{ borderRadius: 'var(--radius)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image — AnimatePresence for crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {current.bannerUrl && (
             
            <img
              src={current.bannerUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 3-way gradient overlay */}
      <div className="hero-overlay" />

      {/* Top-left next-airing badge */}
      {nextAirLabel && (
        <div className="glass absolute left-3 top-3 z-10 px-2.5 py-1 text-xs font-semibold">
          {nextAirLabel}
        </div>
      )}

      {/* Top-right pagination */}
      <div className="glass absolute right-3 top-3 z-10 flex min-w-[3.25rem] items-baseline justify-center gap-1 px-2 py-1">
        <span className="text-sm font-semibold">{index + 1}</span>
        <span className="text-[0.65rem] opacity-60">/ {items.length}</span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        {/* Left: info */}
        <div className="max-w-full md:max-w-[60%]">
          {/* Info chips */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {current.format && (
              <GlassChip><Tv className="h-3 w-3" />{current.format}</GlassChip>
            )}
            {current.episodes && (
              <GlassChip><Play className="h-3 w-3" />{current.episodes} eps</GlassChip>
            )}
            {current.averageScore && (
              <GlassChip><Star className="h-3 w-3" />{Math.round(current.averageScore)}</GlassChip>
            )}
            {current.seasonYear && (
              <GlassChip><Calendar className="h-3 w-3" />{current.seasonYear}</GlassChip>
            )}
            <GlassChip><Clock className="h-3 w-3" />24 min</GlassChip>
          </div>

          {/* Title — gradient text with per-anime accent */}
          <h2
            className="gradient-text mb-2 text-xl font-bold leading-tight sm:text-2xl md:text-[clamp(1.4rem,3vw,2.5rem)]"
            style={{ ['--anime-accent' as string]: accent }}
          >
            {title}
          </h2>

          {/* Genre line + studio */}
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span>{current.genres.slice(0, 4).join(' · ')}</span>
            {current.studios.length > 0 && (
              <span className="opacity-70">· {current.studios[0]}</span>
            )}
          </div>

          {/* Synopsis */}
          {current.synopsis && (
            <p className="hidden line-clamp-2 max-w-2xl text-sm text-[var(--muted-foreground)] md:line-clamp-3">
              {current.synopsis}
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(current)}
            className="glass flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-transform hover:scale-105"
          >
            <Info className="h-4 w-4" />
            DETAILS
          </button>
          <button
            onClick={() => onWatch(current)}
            className="glass flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-transform hover:scale-105"
            style={{ color: accent, borderColor: `${accent}66` }}
          >
            <Play className="h-4 w-4" fill="currentColor" />
            WATCH NOW
          </button>
        </div>
      </div>

      {/* Nav arrows — desktop only */}
      {items.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous"
            className="glass absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 transition-transform hover:scale-105 md:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={advance}
            aria-label="Next"
            className="glass absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 transition-transform hover:scale-105 md:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

function GlassChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
      {children}
    </span>
  );
}
