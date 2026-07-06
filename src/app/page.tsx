'use client';

/**
 * AniStream — App-style main page.
 *
 * 5 tabs (bottom nav, app feel):
 *   - Home: hero carousel, genre rail, popular this season, grid + sidebar
 *   - Browse: full grid with sort tabs (POPULAR / TOP RATED / NEWEST) + genre filter
 *   - Schedule: weekly airing schedule
 *   - My List: user's saved anime (empty state for now)
 *   - Settings: app settings
 *
 * Search overlay opens from the top search icon.
 * Anime detail sheet opens on card tap.
 * Watch view opens on episode tap.
 */

import { useEffect, useState, useCallback } from 'react';
import { Flame, TrendingUp, Trophy, Clock3, Film, Bookmark, History as HistoryIcon, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AnimeDetailSheet } from '@/components/anime/AnimeDetailSheet';
import { WatchView } from '@/components/player/WatchView';
import { HeroCarousel } from '@/components/anime/HeroCarousel';
import { GenreRail } from '@/components/anime/GenreRail';
import { SideListCard } from '@/components/anime/SideListCard';
import { AppShell, type AppTab } from '@/components/app/AppShell';
import { SearchOverlay } from '@/components/app/SearchOverlay';
import { SettingsView } from '@/components/app/SettingsView';
import { useSettings } from '@/lib/settings';
import { toast } from 'sonner';
import type { Anime, AnimeEpisode } from '@/lib/streaming/types';

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
  const [browseGenre, setBrowseGenre] = useState<string | null>(null);
  const [browseAnime, setBrowseAnime] = useState<Anime[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [watchingEpisode, setWatchingEpisode] = useState<{ anime: Anime; episode: AnimeEpisode } | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  const { addRecentAnime, defaultAudio } = useSettings();

  // ─── Load home data ─────────────────────────────────────────
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
        if (!cancelled) toast.error('Failed to load catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Load grid tab data ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setGridLoading(true);
    (async () => {
      try {
        const sectionMap = { 'popular': 'popular', 'top-rated': 'top-rated', 'newest': 'newest' };
        const res = await fetch(`/api/anime?section=${sectionMap[gridTab]}&perPage=30`, { cache: 'no-store' });
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setGridAnime(d.anime ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setGridLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gridTab]);

  // ─── Load browse (genre-filtered) data ─────────────────────
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
        setBrowseAnime(d.anime ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBrowseLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [browseGenre]);

  // ─── Open anime detail ─────────────────────────────────────
  const openAnime = useCallback(async (a: Anime) => {
    setSelectedAnime(a);
    setDetailOpen(true);
    setSearchOpen(false);
    addRecentAnime(a.id);
    try {
      const res = await fetch(`/api/anime/${a.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      setSelectedAnime(d.anime);
    } catch {
      // keep partial data
    }
  }, [addRecentAnime]);

  const handlePlayEpisode = useCallback((episode: AnimeEpisode) => {
    if (!selectedAnime) return;
    setDetailOpen(false);
    setWatchingEpisode({ anime: selectedAnime, episode });
  }, [selectedAnime]);

  const handleWatchDirect = useCallback(async (a: Anime) => {
    try {
      const res = await fetch(`/api/anime/${a.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      const anime: Anime = d.anime;
      const firstEp = anime.episodeEntries?.[0];
      if (firstEp) {
        addRecentAnime(anime.id);
        setWatchingEpisode({ anime, episode: firstEp });
      } else {
        toast.error('No episodes available');
      }
    } catch {
      toast.error('Failed to load anime details');
    }
  }, [addRecentAnime]);

  // All genres from data
  const allGenres = Array.from(new Set(
    (data?.trending ?? [])
      .concat(data?.popularSeason ?? [])
      .concat(gridAnime)
      .concat(browseAnime)
      .flatMap((a) => a.genres)
  )).sort();

  // Tab metadata
  const tabMeta: Record<AppTab, { title: string; subtitle?: string }> = {
    home: { title: 'AniStream', subtitle: 'Watch anime, anywhere' },
    browse: { title: 'Browse', subtitle: `${gridAnime.length || '…'} anime` },
    schedule: { title: 'Schedule', subtitle: 'Weekly airing' },
    list: { title: 'My List', subtitle: 'Your saved anime' },
    settings: { title: 'Settings', subtitle: 'Customize your experience' },
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenSearch={() => setSearchOpen(true)}
      title={tabMeta[activeTab].title}
      subtitle={tabMeta[activeTab].subtitle}
    >
      {/* ───── HOME TAB ───── */}
      {activeTab === 'home' && (
        <HomeTab
          data={data}
          loading={loading}
          allGenres={allGenres}
          browseGenre={browseGenre}
          setBrowseGenre={setBrowseGenre}
          browseAnime={browseAnime}
          browseLoading={browseLoading}
          gridAnime={gridAnime}
          gridTab={gridTab}
          setGridTab={setGridTab}
          gridLoading={gridLoading}
          onSelectAnime={openAnime}
          onWatchDirect={handleWatchDirect}
        />
      )}

      {/* ───── BROWSE TAB ───── */}
      {activeTab === 'browse' && (
        <BrowseTab
          loading={gridLoading}
          anime={gridAnime}
          gridTab={gridTab}
          setGridTab={setGridTab}
          onSelectAnime={openAnime}
        />
      )}

      {/* ───── SCHEDULE TAB ───── */}
      {activeTab === 'schedule' && data && (
        <ScheduleView
          anime={data.topAiring.concat(data.trending).concat(data.popularSeason)}
          onSelect={openAnime}
        />
      )}

      {/* ───── MY LIST TAB ───── */}
      {activeTab === 'list' && (
        <MyListView />
      )}

      {/* ───── SETTINGS TAB ───── */}
      {activeTab === 'settings' && <SettingsView />}

      {/* ─── Search overlay ─── */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectAnime={openAnime}
      />

      {/* ─── Anime detail sheet ─── */}
      <AnimeDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        anime={selectedAnime}
        onPlayEpisode={handlePlayEpisode}
      />

      {/* ─── Fullscreen watch view ─── */}
      <AnimatePresence>
        {watchingEpisode && (
          <WatchView
            anime={watchingEpisode.anime}
            episode={watchingEpisode.episode}
            onExit={() => setWatchingEpisode(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

// ───────────────────────────────────────────────────────────────
//  Home tab
// ───────────────────────────────────────────────────────────────

function HomeTab({
  data,
  loading,
  allGenres,
  browseGenre,
  setBrowseGenre,
  browseAnime,
  browseLoading,
  gridAnime,
  gridTab,
  setGridTab,
  gridLoading,
  onSelectAnime,
  onWatchDirect,
}: {
  data: HomeData | null;
  loading: boolean;
  allGenres: string[];
  browseGenre: string | null;
  setBrowseGenre: (g: string | null) => void;
  browseAnime: Anime[];
  browseLoading: boolean;
  gridAnime: Anime[];
  gridTab: 'popular' | 'top-rated' | 'newest';
  setGridTab: (t: 'popular' | 'top-rated' | 'newest') => void;
  gridLoading: boolean;
  onSelectAnime: (a: Anime) => void;
  onWatchDirect: (a: Anime) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[22rem] animate-pulse rounded-2xl bg-[var(--secondary)] sm:h-[26rem]" />
        <div className="h-10 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* Hero carousel */}
      <HeroCarousel
        items={data.trending}
        onSelect={onSelectAnime}
        onWatch={onWatchDirect}
      />

      {/* Genre rail */}
      <GenreRail
        genres={allGenres}
        activeGenre={browseGenre}
        onGenreChange={setBrowseGenre}
      />

      {/* Browse by genre (if selected) */}
      {browseGenre ? (
        <Section title={`${browseGenre} Anime`} icon={<Film className="h-4 w-4" />}>
          {browseLoading ? (
            <GridSkeleton />
          ) : browseAnime.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              No anime found in this genre.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {browseAnime.map((a) => (
                <AnimeCard key={a.id} anime={a} onClick={() => onSelectAnime(a)} />
              ))}
            </div>
          )}
        </Section>
      ) : (
        <>
          {/* Popular this season */}
          {data.popularSeason.length > 0 && (
            <Section title="Popular This Season" icon={<TrendingUp className="h-4 w-4" />}>
              <Rail>
                {data.popularSeason.map((a) => (
                  <div key={a.id} className="w-[120px] flex-shrink-0 sm:w-[150px] md:w-[160px]">
                    <AnimeCard anime={a} onClick={() => onSelectAnime(a)} />
                  </div>
                ))}
              </Rail>
            </Section>
          )}

          {/* Two-column: grid + sidebar */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Browse
                </h3>
                <div className="tab-container">
                  <button onClick={() => setGridTab('popular')} className={`tab-btn ${gridTab === 'popular' ? 'active' : ''}`}>
                    POPULAR
                  </button>
                  <button onClick={() => setGridTab('top-rated')} className={`tab-btn ${gridTab === 'top-rated' ? 'active' : ''}`}>
                    TOP RATED
                  </button>
                  <button onClick={() => setGridTab('newest')} className={`tab-btn ${gridTab === 'newest' ? 'active' : ''}`}>
                    NEWEST
                  </button>
                </div>
              </div>

              {gridLoading ? (
                <GridSkeleton />
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {gridAnime.map((a) => (
                    <AnimeCard key={a.id} anime={a} onClick={() => onSelectAnime(a)} />
                  ))}
                </div>
              )}
            </div>

            <aside className="flex w-full flex-col gap-4 lg:w-96 lg:flex-shrink-0">
              <SidebarList
                title="Top Airing"
                icon={<Flame className="h-4 w-4 text-amber-400" />}
                anime={data.topAiring}
                onSelect={onSelectAnime}
              />
              <SidebarList
                title="Just Finished"
                icon={<Clock3 className="h-4 w-4 text-cyan-400" />}
                anime={data.justFinished}
                onSelect={onSelectAnime}
              />
              <SidebarList
                title="Top Movies"
                icon={<Trophy className="h-4 w-4 text-amber-400" />}
                anime={data.topMovies}
                onSelect={onSelectAnime}
              />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  Browse tab — full grid
// ───────────────────────────────────────────────────────────────

function BrowseTab({
  loading,
  anime,
  gridTab,
  setGridTab,
  onSelectAnime,
}: {
  loading: boolean;
  anime: Anime[];
  gridTab: 'popular' | 'top-rated' | 'newest';
  setGridTab: (t: 'popular' | 'top-rated' | 'newest') => void;
  onSelectAnime: (a: Anime) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="tab-container">
        <button onClick={() => setGridTab('popular')} className={`tab-btn ${gridTab === 'popular' ? 'active' : ''}`}>
          POPULAR
        </button>
        <button onClick={() => setGridTab('top-rated')} className={`tab-btn ${gridTab === 'top-rated' ? 'active' : ''}`}>
          TOP RATED
        </button>
        <button onClick={() => setGridTab('newest')} className={`tab-btn ${gridTab === 'newest' ? 'active' : ''}`}>
          NEWEST
        </button>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {anime.map((a) => (
            <AnimeCard key={a.id} anime={a} onClick={() => onSelectAnime(a)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  Schedule tab
// ───────────────────────────────────────────────────────────────

function ScheduleView({
  anime,
  onSelect,
}: {
  anime: Anime[];
  onSelect: (a: Anime) => void;
}) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byDay: Record<string, Anime[]> = {};
  days.forEach((d) => (byDay[d] = []));
  anime.forEach((a, i) => {
    byDay[days[i % 7]].push(a);
  });

  return (
    <section>
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
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-[var(--card)] p-2 text-left transition-colors hover:border-[var(--border)]"
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

// ───────────────────────────────────────────────────────────────
//  My List tab
// ───────────────────────────────────────────────────────────────

function MyListView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(181, 168, 255, 0.1)' }}
      >
        <Bookmark className="h-7 w-7" style={{ color: 'var(--primary)' }} />
      </div>
      <h2 className="mb-1 text-lg font-bold text-[var(--foreground)]">Your list is empty</h2>
      <p className="mb-4 max-w-xs text-sm text-[var(--muted-foreground)]">
        Bookmark anime to find them here. Your list syncs across devices once you log in.
      </p>
      <button
        className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition-transform active:scale-95"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Browse anime
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────────

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
    <section>
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

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--secondary)]" />
      ))}
    </div>
  );
}
