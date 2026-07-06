'use client';

/**
 * AniStream — Main page
 *
 * Mobile-first anime streaming app inspired by Th3-Anime.
 *
 * Sections (single-page app, navigated via state):
 *   - Top bar with logo + search + settings
 *   - Featured banner (rotating hero)
 *   - Trending Now rail
 *   - Recently Added rail
 *   - Continue Watching rail
 *   - Bottom mobile nav (Home, Browse, Schedule, My List, Settings)
 *
 * When user taps an anime → opens AnimeDetailSheet
 * When user taps an episode → opens WatchView (fullscreen)
 * When user taps settings cog → opens SettingsDrawer (mirror management)
 */

import { useEffect, useState, useCallback } from 'react';
import { Search, Settings, Home as HomeIcon, Calendar, Bookmark, Compass, Sparkles, X, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AnimeDetailSheet } from '@/components/anime/AnimeDetailSheet';
import { WatchView } from '@/components/player/WatchView';
import { SettingsDrawer } from '@/components/player/SettingsDrawer';
import { toast } from 'sonner';
import type { Anime, AnimeEpisode } from '@/lib/streaming/types';

export default function Home() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [watchingEpisode, setWatchingEpisode] = useState<{ anime: Anime; episode: AnimeEpisode } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'browse' | 'schedule' | 'list'>('home');

  // Load anime catalog
  const loadAnime = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/anime', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setAnime(data.anime);
    } catch (e) {
      toast.error('Failed to load anime catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnime();
  }, [loadAnime]);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/anime?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.anime);
        }
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load full anime with episodes when selected
  const openAnime = useCallback(async (a: Anime) => {
    try {
      const res = await fetch(`/api/anime/${a.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedAnime(data.anime);
      setDetailOpen(true);
      setSearchOpen(false);
    } catch {
      toast.error('Failed to load anime details');
    }
  }, []);

  const handlePlayEpisode = useCallback((episode: AnimeEpisode) => {
    if (!selectedAnime) return;
    setDetailOpen(false);
    setWatchingEpisode({ anime: selectedAnime, episode });
  }, [selectedAnime]);

  // Featured = highest scored anime
  const featured = anime.filter((a) => a.bannerUrl).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-base tracking-tight">AniStream</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Mirror sources"
              className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Server className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 pb-20">
        {activeTab === 'home' && (
          <>
            {/* Featured hero */}
            {!loading && featured.length > 0 && (
              <FeaturedHero anime={featured[0]} onPlay={() => openAnime(featured[0])} />
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="mt-6 space-y-4">
                <div className="h-48 rounded-2xl bg-muted animate-pulse" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Now rail */}
            {!loading && anime.length > 0 && (
              <AnimeRail
                title="Trending Now"
                anime={anime}
                onSelect={openAnime}
              />
            )}

            {/* Recently Added (reverse order) */}
            {!loading && anime.length > 0 && (
              <AnimeRail
                title="Recently Added"
                anime={[...anime].reverse()}
                onSelect={openAnime}
              />
            )}

            {/* Empty state */}
            {!loading && anime.length === 0 && (
              <div className="text-center py-16">
                <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <h2 className="text-base font-semibold text-foreground mb-1">
                  No anime in catalog yet
                </h2>
                <p className="text-sm text-muted-foreground">
                  Try adding some via the AniList import (coming soon).
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'browse' && (
          <BrowseView anime={anime} loading={loading} onSelect={openAnime} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView anime={anime} loading={loading} onSelect={openAnime} />
        )}

        {activeTab === 'list' && (
          <MyListView anime={anime} onSelect={openAnime} />
        )}
      </main>

      {/* ── Bottom mobile nav ─────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="mx-auto max-w-6xl px-2 h-14 grid grid-cols-4">
          <NavButton
            icon={<HomeIcon className="h-5 w-5" />}
            label="Home"
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <NavButton
            icon={<Compass className="h-5 w-5" />}
            label="Browse"
            active={activeTab === 'browse'}
            onClick={() => setActiveTab('browse')}
          />
          <NavButton
            icon={<Calendar className="h-5 w-5" />}
            label="Schedule"
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          />
          <NavButton
            icon={<Bookmark className="h-5 w-5" />}
            label="My List"
            active={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
          />
        </div>
      </nav>

      {/* ── Search overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-2xl px-4 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime by title…"
                  className="flex-1 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  aria-label="Close search"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Recent searches placeholder */}
              {!searchQuery.trim() && (
                <div className="text-sm text-muted-foreground mt-8">
                  <div className="text-xs uppercase tracking-wider mb-3">Trending Searches</div>
                  <div className="flex flex-wrap gap-2">
                    {['Mushoku', 'Chainsaw', 'Demon Slayer'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSearchQuery(q)}
                        className="rounded-full bg-muted px-3 py-1.5 text-sm hover:bg-muted/70"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results */}
              {searchQuery.trim() && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {searchResults.map((a) => (
                    <AnimeCard key={a.id} anime={a} onClick={() => openAnime(a)} />
                  ))}
                  {searchResults.length === 0 && (
                    <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                      No results for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Anime detail sheet ────────────────────────────────── */}
      <AnimeDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        anime={selectedAnime}
        onPlayEpisode={handlePlayEpisode}
      />

      {/* ── Settings drawer ───────────────────────────────────── */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onProvidersChanged={() => {/* providers will be re-fetched next time WatchView mounts */}}
      />

      {/* ── Fullscreen watch view ─────────────────────────────── */}
      <AnimatePresence>
        {watchingEpisode && (
          <WatchView
            anime={watchingEpisode.anime}
            episode={watchingEpisode.episode}
            onExit={() => setWatchingEpisode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  Sub-components
// ───────────────────────────────────────────────────────────────

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function FeaturedHero({ anime, onPlay }: { anime: Anime; onPlay: () => void }) {
  const title = anime.titleEnglish || anime.titleRomaji || anime.titleNative;
  return (
    <div className="mt-4 relative h-52 sm:h-64 rounded-2xl overflow-hidden border border-border">
      {anime.bannerUrl && (
         
        <img src={anime.bannerUrl} alt={title} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6">
        <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
          Featured
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight mb-1 line-clamp-2">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-[11px] text-white/70 mb-3">
          <span>{anime.format ?? 'TV'}</span>
          <span>·</span>
          <span>{anime.seasonYear}</span>
          {anime.averageScore && (
            <>
              <span>·</span>
              <span className="text-amber-400 font-semibold">
                ★ {Math.round(anime.averageScore)}%
              </span>
            </>
          )}
        </div>
        <button
          onClick={onPlay}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          ▶ Play Now
        </button>
      </div>
    </div>
  );
}

function AnimeRail({
  title,
  anime,
  onSelect,
}: {
  title: string;
  anime: Anime[];
  onSelect: (a: Anime) => void;
}) {
  if (anime.length === 0) return null;
  return (
    <section className="mt-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4">
        {anime.map((a) => (
          <div key={a.id} className="flex-shrink-0">
            <AnimeCard anime={a} onClick={() => onSelect(a)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BrowseView({
  anime,
  loading,
  onSelect,
}: {
  anime: Anime[];
  loading: boolean;
  onSelect: (a: Anime) => void;
}) {
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const genres = Array.from(new Set(anime.flatMap((a) => a.genres))).sort();

  const filtered = genreFilter ? anime.filter((a) => a.genres.includes(genreFilter)) : anime;

  return (
    <section className="mt-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
        Browse All
      </h3>

      {/* Genre filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 mb-4">
        <button
          onClick={() => setGenreFilter(null)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !genreFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenreFilter(g)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              genreFilter === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {filtered.map((a) => (
            <AnimeCard key={a.id} anime={a} onClick={() => onSelect(a)} />
          ))}
        </div>
      )}
    </section>
  );
}

function ScheduleView({
  anime,
  loading,
  onSelect,
}: {
  anime: Anime[];
  loading: boolean;
  onSelect: (a: Anime) => void;
}) {
  if (loading) {
    return (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Group by day of week (using airing schedule — for demo, just spread across days)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byDay: Record<string, Anime[]> = {};
  days.forEach((d) => (byDay[d] = []));
  anime.forEach((a, i) => {
    const day = days[i % 7];
    byDay[day].push(a);
  });

  return (
    <section className="mt-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
        Weekly Schedule
      </h3>
      <div className="space-y-4">
        {days.map((d) => (
          <div key={d}>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {d}
            </div>
            {byDay[d].length === 0 ? (
              <div className="text-xs text-muted-foreground/50 italic pl-3">
                No episodes airing
              </div>
            ) : (
              <div className="space-y-2">
                {byDay[d].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted border border-transparent hover:border-border transition-colors text-left"
                  >
                    {a.posterUrl && (
                       
                      <img
                        src={a.posterUrl}
                        alt={a.titleEnglish || a.titleRomaji}
                        className="w-10 h-14 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {a.titleEnglish || a.titleRomaji}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Episode {Math.floor(Math.random() * 12) + 1} · 24 min
                      </div>
                    </div>
                    <div className="text-[11px] text-primary font-bold">
                      {Math.floor(Math.random() * 12) + 10}:00
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MyListView({ anime, onSelect }: { anime: Anime[]; onSelect: (a: Anime) => void }) {
  // Demo: show all anime as "Watching" — in the real app this is from the DB
  return (
    <section className="mt-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
        My List
      </h3>
      {anime.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">
            Your list is empty. Add anime from the browse page.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {anime.map((a) => (
            <AnimeCard key={a.id} anime={a} onClick={() => onSelect(a)} showProgress={Math.random() * 100} />
          ))}
        </div>
      )}
    </section>
  );
}
