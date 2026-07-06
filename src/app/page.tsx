'use client';

/**
 * AniStream — Miruro-style home page.
 *
 * Single-page app navigated via tabs (HOME / TRENDING / SCHEDULE / HISTORY).
 *
 * Home tab:
 *   - Hero carousel (Trending, top 12)
 *   - Genre rail (masked edges, per-genre hover colors)
 *   - Popular This Season rail
 *   - Two-column layout:
 *     - Left: poster grid with tabs (POPULAR / TOP RATED / NEWEST)
 *     - Right: sidebar with TOP AIRING / JUST FINISHED / TOP MOVIES lists
 *
 * Search overlay opens from navbar.
 * Anime detail sheet opens on card tap.
 * Watch view opens on episode tap.
 */

import { useEffect, useState, useCallback } from 'react';
import { Search, X, Flame, TrendingUp, Calendar, History as HistoryIcon, Home as HomeIcon, Star, Trophy, Clock3, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AnimeDetailSheet } from '@/components/anime/AnimeDetailSheet';
import { WatchView } from '@/components/player/WatchView';
import { HeroCarousel } from '@/components/anime/HeroCarousel';
import { GenreRail } from '@/components/anime/GenreRail';
import { SideListCard } from '@/components/anime/SideListCard';
import { Navbar } from '@/components/anime/Navbar';
import { Drawer } from '@/components/anime/Drawer';
import { toast } from 'sonner';
import type { Anime, AnimeEpisode } from '@/lib/streaming/types';

type Tab = 'home' | 'trending' | 'schedule' | 'history';

interface HomeData {
  trending: Anime[];
  popularSeason: Anime[];
  topAiring: Anime[];
  justFinished: Anime[];
  topMovies: Anime[];
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [gridAnime, setGridAnime] = useState<Anime[]>([]);
  const [gridTab, setGridTab] = useState<'popular' | 'top-rated' | 'newest'>('popular');
  const [gridLoading, setGridLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [watchingEpisode, setWatchingEpisode] = useState<{ anime: Anime; episode: AnimeEpisode } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [browseGenre, setBrowseGenre] = useState<string | null>(null);
  const [browseAnime, setBrowseAnime] = useState<Anime[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Load home data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/anime', { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const d: HomeData = await res.json();
        if (cancelled) return;
        setData(d);
      } catch {
        if (!cancelled) toast.error('Failed to load anime catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load grid tab data
  useEffect(() => {
    let cancelled = false;
    setGridLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/anime?section=${gridTab === 'top-rated' ? 'top-rated' : gridTab === 'newest' ? 'newest' : 'popular'}&perPage=30`, { cache: 'no-store' });
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setGridAnime(d.anime);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setGridLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gridTab]);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/anime?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setSearchResults(d.anime);
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load browse (genre-filtered) data when genre changes
  useEffect(() => {
    if (!browseGenre) {
      setBrowseAnime([]);
      return;
    }
    let cancelled = false;
    setBrowseLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/anime?browse=true&genre=${encodeURIComponent(browseGenre)}&sort=POPULARITY_DESC`, { cache: 'no-store' });
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setBrowseAnime(d.anime);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBrowseLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [browseGenre]);

  // Open anime detail
  const openAnime = useCallback(async (a: Anime) => {
    setSelectedAnime(a);
    setDetailOpen(true);
    setSearchOpen(false);
    try {
      const res = await fetch(`/api/anime/${a.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      setSelectedAnime(d.anime);
    } catch {
      // keep partial data
    }
  }, []);

  const handlePlayEpisode = useCallback((episode: AnimeEpisode) => {
    if (!selectedAnime) return;
    setDetailOpen(false);
    setWatchingEpisode({ anime: selectedAnime, episode });
  }, [selectedAnime]);

  // Watch the first episode directly from hero "Watch Now" button
  const handleWatchDirect = useCallback(async (a: Anime) => {
    try {
      const res = await fetch(`/api/anime/${a.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      const anime: Anime = d.anime;
      const firstEp = anime.episodeEntries?.[0];
      if (firstEp) {
        setWatchingEpisode({ anime, episode: firstEp });
      } else {
        toast.error('No episodes available');
      }
    } catch {
      toast.error('Failed to load anime details');
    }
  }, []);

  // All genres from data (for genre rail)
  const allGenres = Array.from(new Set(
    (data?.trending ?? [])
      .concat(data?.popularSeason ?? [])
      .concat(gridAnime)
      .flatMap((a) => a.genres)
  )).sort();

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[22rem] w-full animate-pulse rounded-2xl bg-[var(--secondary)] sm:h-[26rem] md:h-[30rem]" />
        <div className="h-10 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded bg-[var(--secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeRoute={activeTab}
        onNavigate={setActiveTab}
      />

      {/* Tab navigation (below navbar, mobile-friendly) */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <TabButton
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          icon={<HomeIcon className="h-4 w-4" />}
          label="Home"
        />
        <TabButton
          active={activeTab === 'trending'}
          onClick={() => setActiveTab('trending')}
          icon={<Flame className="h-4 w-4" />}
          label="Trending"
        />
        <TabButton
          active={activeTab === 'schedule'}
          onClick={() => setActiveTab('schedule')}
          icon={<Calendar className="h-4 w-4" />}
          label="Schedule"
        />
        <TabButton
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={<HistoryIcon className="h-4 w-4" />}
          label="History"
        />
      </div>

      {/* ───── HOME TAB ───── */}
      {activeTab === 'home' && data && (
        <>
          {/* Hero carousel */}
          <HeroCarousel
            items={data.trending}
            onSelect={openAnime}
            onWatch={handleWatchDirect}
          />

          {/* Genre rail */}
          <GenreRail
            genres={allGenres}
            activeGenre={browseGenre}
            onGenreChange={setBrowseGenre}
          />

          {/* If a genre is selected, show browse grid */}
          {browseGenre ? (
            <Section title={`${browseGenre} Anime`} icon={<Film className="h-4 w-4" />}>
              {browseLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse rounded bg-[var(--secondary)]" />
                  ))}
                </div>
              ) : browseAnime.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                  No anime found in this genre.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {browseAnime.map((a) => (
                    <AnimeCard key={a.id} anime={a} onClick={() => openAnime(a)} />
                  ))}
                </div>
              )}
            </Section>
          ) : (
            <>
              {/* Popular this season rail */}
              {data.popularSeason.length > 0 && (
                <Section title="Popular This Season" icon={<TrendingUp className="h-4 w-4" />}>
                  <Rail>
                    {data.popularSeason.map((a) => (
                      <div key={a.id} className="w-[120px] flex-shrink-0 sm:w-[150px] md:w-[160px]">
                        <AnimeCard anime={a} onClick={() => openAnime(a)} />
                      </div>
                    ))}
                  </Rail>
                </Section>
              )}

              {/* Two-column layout: grid + sidebar */}
              <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                {/* Left: tabs + grid */}
                <div className="flex-1">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                      Browse
                    </h3>
                    <div className="tab-container">
                      <button
                        onClick={() => setGridTab('popular')}
                        className={`tab-btn ${gridTab === 'popular' ? 'active' : ''}`}
                      >
                        POPULAR
                      </button>
                      <button
                        onClick={() => setGridTab('top-rated')}
                        className={`tab-btn ${gridTab === 'top-rated' ? 'active' : ''}`}
                      >
                        TOP RATED
                      </button>
                      <button
                        onClick={() => setGridTab('newest')}
                        className={`tab-btn ${gridTab === 'newest' ? 'active' : ''}`}
                      >
                        NEWEST
                      </button>
                    </div>
                  </div>

                  {gridLoading ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] animate-pulse rounded bg-[var(--secondary)]" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                      {gridAnime.map((a) => (
                        <AnimeCard key={a.id} anime={a} onClick={() => openAnime(a)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: sidebar */}
                <aside className="flex w-full flex-col gap-4 lg:w-96 lg:flex-shrink-0">
                  <SidebarList
                    title="Top Airing"
                    icon={<Flame className="h-4 w-4 text-amber-400" />}
                    anime={data.topAiring}
                    onSelect={openAnime}
                  />
                  <SidebarList
                    title="Just Finished"
                    icon={<Clock3 className="h-4 w-4 text-cyan-400" />}
                    anime={data.justFinished}
                    onSelect={openAnime}
                  />
                  <SidebarList
                    title="Top Movies"
                    icon={<Trophy className="h-4 w-4 text-amber-400" />}
                    anime={data.topMovies}
                    onSelect={openAnime}
                  />
                </aside>
              </div>
            </>
          )}
        </>
      )}

      {/* ───── TRENDING TAB ───── */}
      {activeTab === 'trending' && data && (
        <Section title="Trending Now" icon={<Flame className="h-4 w-4 text-amber-400" />}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {data.trending.concat(data.popularSeason).map((a, i) => (
              <AnimeCard key={`${a.id}-${i}`} anime={a} onClick={() => openAnime(a)} />
            ))}
          </div>
        </Section>
      )}

      {/* ───── SCHEDULE TAB ───── */}
      {activeTab === 'schedule' && data && (
        <ScheduleView anime={data.topAiring.concat(data.trending)} onSelect={openAnime} />
      )}

      {/* ───── HISTORY TAB ───── */}
      {activeTab === 'history' && (
        <div className="py-16 text-center">
          <HistoryIcon className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-40" />
          <h2 className="mb-1 text-base font-semibold">No watch history yet</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Episodes you watch will appear here.
          </p>
        </div>
      )}

      {/* ───── Search overlay ───── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[700] bg-[rgba(8,8,8,0.97)] backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-2xl px-4 pt-4">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime…"
                  className="flex-1 border-0 bg-transparent text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                />
                {searchLoading && (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                  />
                )}
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  aria-label="Close search"
                  className="rounded-full p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!searchQuery.trim() ? (
                <div className="mt-8 text-sm text-[var(--muted-foreground)]">
                  <div className="mb-3 text-xs uppercase tracking-wider">Trending searches</div>
                  <div className="flex flex-wrap gap-2">
                    {['One Piece', 'Jujutsu', 'Demon Slayer', 'Frieren', 'Chainsaw'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSearchQuery(q)}
                        className="rounded-full bg-[var(--secondary)] px-3 py-1.5 text-sm hover:text-[var(--primary)]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {searchResults.map((a) => (
                    <AnimeCard key={a.id} anime={a} onClick={() => openAnime(a)} />
                  ))}
                  {searchResults.length === 0 && !searchLoading && (
                    <div className="col-span-full py-12 text-center text-sm text-[var(--muted-foreground)]">
                      No results for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── Anime detail sheet ───── */}
      <AnimeDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        anime={selectedAnime}
        onPlayEpisode={handlePlayEpisode}
      />

      {/* ───── Fullscreen watch view ───── */}
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? 'bg-[rgba(128,128,207,0.18)] text-[var(--primary)]'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="scrollbar-none rail-mask flex gap-3 overflow-x-auto pb-2">
      {children}
    </div>
  );
}

function SidebarList({
  title,
  icon,
  anime,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  anime: Anime[];
  onSelect: (a: Anime) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-[1.1rem] font-bold uppercase tracking-wider text-[var(--foreground)]">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {anime.map((a, i) => (
          <SideListCard
            key={a.id}
            anime={a}
            rank={i + 1}
            onClick={() => onSelect(a)}
          />
        ))}
      </div>
    </div>
  );
}

function ScheduleView({
  anime,
  onSelect,
}: {
  anime: Anime[];
  onSelect: (a: Anime) => void;
}) {
  // Group by simulated airing day (deterministic per anime)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byDay: Record<string, Anime[]> = {};
  days.forEach((d) => (byDay[d] = []));
  anime.forEach((a, i) => {
    byDay[days[i % 7]].push(a);
  });

  return (
    <section className="mt-6">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
        Weekly Schedule
      </h3>
      <div className="space-y-4">
        {days.map((d) => (
          <div key={d}>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              {d}
            </div>
            {byDay[d].length === 0 ? (
              <div className="pl-3 text-xs italic text-[var(--muted-foreground)] opacity-50">
                No episodes airing
              </div>
            ) : (
              <div className="space-y-2">
                {byDay[d].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius)] border border-transparent bg-[var(--secondary)] p-2 text-left transition-colors hover:border-[var(--border)]"
                  >
                    {a.posterUrl && (
                       
                      <img
                        src={a.posterUrl}
                        alt={a.titleEnglish || a.titleRomaji}
                        className="h-14 w-10 flex-shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--foreground)]">
                        {a.titleEnglish || a.titleRomaji}
                      </div>
                      <div className="text-[0.7rem] text-[var(--muted-foreground)]">
                        EP {Math.floor(Math.random() * 12) + 1} · 24 min
                      </div>
                    </div>
                    <div
                      className="text-[0.7rem] font-bold"
                      style={{ color: a.color || 'var(--primary)' }}
                    >
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
