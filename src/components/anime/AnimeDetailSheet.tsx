'use client';

/**
 * AnimeDetailSheet — bottom sheet showing anime details + episode picker
 *
 * Opens when the user taps an anime card. Shows banner, title, metadata,
 * synopsis, and an episode list. Tapping an episode opens the WatchView.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, Tv, Clock, Play } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { Anime, AnimeEpisode } from '@/lib/streaming/types';

interface AnimeDetailSheetProps {
  open: boolean;
  onClose: () => void;
  anime: Anime | null;
  onPlayEpisode: (episode: AnimeEpisode) => void;
}

export function AnimeDetailSheet({
  open,
  onClose,
  anime,
  onPlayEpisode,
}: AnimeDetailSheetProps) {
  const episodes = useMemo<AnimeEpisode[]>(
    () => anime?.episodeEntries ?? [],
    [anime]
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!anime) return null;
  const title = anime.titleEnglish || anime.titleRomaji || anime.titleNative || '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full sm:max-w-2xl bg-card sm:rounded-2xl rounded-t-2xl border-t border-border sm:border shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-thin"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Banner */}
            <div className="relative h-44 sm:h-56 bg-muted">
              {anime.bannerUrl && (
                 
                <img
                  src={anime.bannerUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur p-2 text-white hover:bg-black/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Title + metadata */}
            <div className="px-5 -mt-8 relative">
              <div className="flex items-end gap-4">
                {/* Poster */}
                <div className="w-24 sm:w-28 flex-shrink-0">
                  {anime.posterUrl && (
                     
                    <img
                      src={anime.posterUrl}
                      alt={title}
                      className="w-full aspect-[2/3] object-cover rounded-lg border border-border shadow-lg"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                    {title}
                  </h2>
                  {anime.titleNative && anime.titleNative !== title && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {anime.titleNative}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {anime.averageScore && (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {Math.round(anime.averageScore)}%
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Tv className="h-3 w-3" />
                      {anime.format ?? 'TV'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {anime.season ? `${anime.season} ` : ''}
                      {anime.seasonYear ?? ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {anime.episodes ?? '?'} eps
                    </span>
                    {anime.ageRating && (
                      <span className="rounded bg-red-500/15 text-red-400 px-1 py-0.5 font-bold">
                        {anime.ageRating}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Genres */}
              {anime.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {anime.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-1 text-muted-foreground"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {anime.synopsis && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {anime.synopsis}
                </p>
              )}

              {/* Studios */}
              {anime.studios.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Studio:</span>{' '}
                  {anime.studios.join(', ')}
                </div>
              )}
            </div>

            {/* Episodes section */}
            <div className="px-5 mt-5 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Episodes
                </h3>
                <div className="text-xs text-muted-foreground">
                  {episodes.length} total
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onPlayEpisode(ep)}
                    className="group flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted border border-transparent hover:border-border transition-colors text-left"
                  >
                    <div className="rounded-md bg-primary/15 group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center w-10 h-10 text-xs font-bold text-primary flex-shrink-0">
                      {ep.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {ep.title || `Episode ${ep.number}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {ep.duration ? `${Math.round(ep.duration / 60)} min` : ''}
                        {ep.isFiller ? ' · Filler' : ''}
                      </div>
                    </div>
                    <Play className="h-4 w-4 text-muted-foreground group-hover:text-primary" fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
