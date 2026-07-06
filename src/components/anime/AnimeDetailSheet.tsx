'use client';

/**
 * AnimeDetailSheet — Miruro-style detail modal.
 *
 * Opens when a user taps an anime card or hero slide.
 * Shows banner, poster, metadata, synopsis, and an episode list.
 * Tapping an episode opens WatchView.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, Tv, Clock, Play, Plus, Check, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Anime, AnimeEpisode } from '@/lib/streaming/types';
import { useSettings, type ListStatus } from '@/lib/settings';
import { toast } from 'sonner';

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
  const [search, setSearch] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const { isInList, addToList, removeFromList, myList } = useSettings();

  // Check if this anime is in the list, and what status
  const listEntry = myList.find((e) => e.animeId === anime?.id);
  const inList = Boolean(listEntry);

  const handleToggleList = () => {
    if (!anime) return;
    if (inList) {
      removeFromList(anime.id);
      toast.success('Removed from your list');
    } else {
      addToList(anime.id, 'PLAN_TO_WATCH');
      toast.success('Added to Plan to Watch');
    }
  };

  const handleSetStatus = (status: ListStatus) => {
    if (!anime) return;
    addToList(anime.id, status);
    toast.success(`Moved to ${status.replace(/_/g, ' ')}`);
    setShowStatusMenu(false);
  };

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
  const accent = anime.color || '#b5a8ff';
  const status = anime.status ?? '';
  const indicatorClass =
    status === 'RELEASING' ? 'dot-ongoing' :
    status === 'FINISHED' ? 'dot-completed' :
    status === 'CANCELLED' ? 'dot-cancelled' :
    status === 'NOT_YET_RELEASED' ? 'dot-not-aired' : '';

  const filteredEps = search.trim()
    ? episodes.filter((e) => String(e.number).includes(search.trim()) || (e.title || '').toLowerCase().includes(search.trim().toLowerCase()))
    : episodes;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            className="relative max-h-[92vh] w-full overflow-y-auto scrollbar-none bg-[#0e0e0e] sm:max-w-2xl sm:rounded-2xl"
            style={{ borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Banner */}
            <div className="relative h-44 w-full bg-[var(--secondary)] sm:h-56">
              {anime.bannerUrl && (
                 
                <img
                  src={anime.bannerUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(0deg, #0e0e0e 1%, transparent 60%)',
                }}
              />
              <button
                onClick={onClose}
                aria-label="Close"
                className="glass absolute right-3 top-3 rounded-full p-2 text-white hover:scale-105"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Title + metadata */}
            <div className="relative -mt-12 px-5">
              <div className="flex items-end gap-4">
                {/* Poster */}
                <div
                  className="h-36 w-24 flex-shrink-0 overflow-hidden border-2 border-[#0e0e0e] shadow-xl sm:h-40 sm:w-28"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {anime.posterUrl && (
                     
                    <img
                      src={anime.posterUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 pb-2">
                  <h2
                    className="gradient-text text-lg font-bold leading-tight sm:text-2xl"
                    style={{ ['--anime-accent' as string]: accent }}
                  >
                    {title}
                  </h2>
                  {anime.titleNative && anime.titleNative !== title && (
                    <div className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                      {anime.titleNative}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-[var(--muted-foreground)]">
                    {indicatorClass && (
                      <span className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${indicatorClass}`} />
                        <span className="uppercase">{status.replace(/_/g, ' ')}</span>
                      </span>
                    )}
                    {anime.averageScore && (
                      <span className="flex items-center gap-1 font-semibold" style={{ color: '#ffb648' }}>
                        <Star className="h-3 w-3" fill="currentColor" />
                        {Math.round(anime.averageScore)}%
                      </span>
                    )}
                    {anime.format && (
                      <span className="flex items-center gap-1">
                        <Tv className="h-3 w-3" />
                        {anime.format}
                      </span>
                    )}
                    {anime.seasonYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {anime.season ? `${anime.season} ` : ''}{anime.seasonYear}
                      </span>
                    )}
                    {anime.episodes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {anime.episodes} eps
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
                      className="rounded-full bg-[var(--secondary)] px-2 py-1 text-[0.65rem] uppercase tracking-wider text-[var(--muted-foreground)]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Action row */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => filteredEps[0] && onPlayEpisode(filteredEps[0])}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]"
                  style={{
                    background: accent,
                    color: '#080808',
                  }}
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  Watch Now
                </button>
                <button
                  onClick={inList ? () => setShowStatusMenu((v) => !v) : handleToggleList}
                  className="glass relative flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold"
                  style={inList ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : undefined}
                >
                  {inList ? (
                    <>
                      <Check className="h-4 w-4" />
                      {listEntry?.status.replace(/_/g, ' ')}
                      <ChevronDown className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      My List
                    </>
                  )}
                </button>

                {/* Status dropdown */}
                <AnimatePresence>
                  {showStatusMenu && (
                    <motion.div
                      className="absolute bottom-16 right-4 z-50 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-2xl"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                    >
                      {(['WATCHING', 'WATCHED', 'PLAN_TO_WATCH', 'ON_HOLD', 'DROPPED'] as ListStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleSetStatus(status)}
                          className="block w-full whitespace-nowrap rounded px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
                        >
                          {status.replace(/_/g, ' ')}
                          {listEntry?.status === status && (
                            <Check className="ml-2 inline h-3 w-3 text-[var(--primary)]" />
                          )}
                        </button>
                      ))}
                      <div className="my-1 border-t border-[var(--border)]" />
                      <button
                        onClick={() => {
                          if (anime) {
                            removeFromList(anime.id);
                            toast.success('Removed from your list');
                          }
                          setShowStatusMenu(false);
                        }}
                        className="block w-full whitespace-nowrap rounded px-3 py-2 text-left text-xs font-medium text-[var(--destructive)] hover:bg-[var(--secondary)]"
                      >
                        Remove from list
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Synopsis */}
              {anime.synopsis && (
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {anime.synopsis}
                </p>
              )}

              {anime.studios.length > 0 && (
                <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                  <span className="font-semibold text-[var(--foreground)]">Studio:</span>{' '}
                  {anime.studios.join(', ')}
                </div>
              )}
            </div>

            {/* Episodes */}
            <div className="px-5 pb-6 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[0.95rem] font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Episodes
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Find episode…"
                    className="w-32 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] px-2 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] sm:w-40"
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {filteredEps.length} ep
                  </span>
                </div>
              </div>

              <div className="grid max-h-[40vh] grid-cols-1 gap-1.5 overflow-y-auto scrollbar-none pr-1 sm:grid-cols-2">
                {filteredEps.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onPlayEpisode(ep)}
                    className="group flex items-center gap-2.5 rounded-[var(--radius)] border border-transparent bg-[var(--secondary)] p-2 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--card)]"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius)] text-xs font-bold transition-colors"
                      style={{
                        background: `${accent}22`,
                        color: accent,
                      }}
                    >
                      {ep.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--foreground)]">
                        {ep.title || `Episode ${ep.number}`}
                      </div>
                      <div className="text-[0.65rem] text-[var(--muted-foreground)]">
                        {ep.duration ? `${Math.round(ep.duration / 60)} min` : ''}
                        {ep.isFiller ? ' · Filler' : ''}
                      </div>
                    </div>
                    <Play
                      className="h-4 w-4 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary)]"
                      fill="currentColor"
                    />
                  </button>
                ))}
                {filteredEps.length === 0 && (
                  <div className="col-span-full py-8 text-center text-sm text-[var(--muted-foreground)]">
                    No episodes match "{search}"
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
