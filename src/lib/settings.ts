/**
 * Settings + library store — persisted to localStorage.
 *
 * Used by:
 *   - Settings page (read/write)
 *   - WatchView (default audio mode, default quality)
 *   - VideoPlayer (default playback speed, autoplay, skip intro, subtitle style,
 *                  PiP, hold-for-2x, swipe gestures)
 *   - Search overlay (recent searches, recent anime)
 *   - My List tab (anime library with status categories)
 *   - Continue Watching (progress tracking)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioMode = 'sub' | 'dub';
export type Quality = 'auto' | '1080p' | '720p' | '480p' | '360p';
export type ListStatus = 'WATCHING' | 'WATCHED' | 'PLAN_TO_WATCH' | 'DROPPED' | 'ON_HOLD';

export interface SubtitleStyle {
  fontSize: number;       // 12-32px
  fontFamily: 'sans' | 'serif' | 'mono';
  color: string;          // hex
  background: 'none' | 'solid' | 'outline' | 'shadow';
  bgOpacity: number;      // 0-1
}

export interface MyListEntry {
  animeId: string;
  status: ListStatus;
  score?: number;
  episodesWatched: number;
  notes?: string;
  addedAt: number;
  updatedAt: number;
}

export interface WatchProgressEntry {
  animeId: string;
  episodeId: string;
  episodeNum: number;
  position: number;       // seconds
  duration: number;       // seconds
  completed: boolean;
  lastWatchedAt: number;
}

export interface SettingsState {
  // Playback
  defaultAudio: AudioMode;
  defaultQuality: Quality;
  defaultPlaybackSpeed: number;
  autoplayNext: boolean;
  skipIntro: boolean;
  skipOutro: boolean;
  hwAccel: boolean;
  holdFor2x: boolean;
  swipeGestures: boolean;
  pipMode: boolean;

  // Display
  posterSize: 'compact' | 'comfortable' | 'large';
  showFillerEpisodes: boolean;
  hideSpoilersInSynopsis: boolean;
  marqueeTitles: boolean;

  // Subtitles
  subtitleStyle: SubtitleStyle;

  // Data
  useLowDataMode: boolean;

  // History
  recentSearches: string[];
  recentAnimeIds: string[];

  // My List (anime library)
  myList: MyListEntry[];

  // Continue Watching (progress tracking)
  watchProgress: WatchProgressEntry[];

  // Actions
  setDefaultAudio: (a: AudioMode) => void;
  setDefaultQuality: (q: Quality) => void;
  setDefaultPlaybackSpeed: (s: number) => void;
  setAutoplayNext: (b: boolean) => void;
  setSkipIntro: (b: boolean) => void;
  setSkipOutro: (b: boolean) => void;
  setHwAccel: (b: boolean) => void;
  setHoldFor2x: (b: boolean) => void;
  setSwipeGestures: (b: boolean) => void;
  setPipMode: (b: boolean) => void;
  setPosterSize: (s: 'compact' | 'comfortable' | 'large') => void;
  setShowFillerEpisodes: (b: boolean) => void;
  setHideSpoilersInSynopsis: (b: boolean) => void;
  setMarqueeTitles: (b: boolean) => void;
  setSubtitleStyle: (s: Partial<SubtitleStyle>) => void;
  setUseLowDataMode: (b: boolean) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  addRecentAnime: (id: string) => void;
  clearRecentAnime: () => void;

  // My List actions
  addToList: (animeId: string, status: ListStatus) => void;
  updateListStatus: (animeId: string, status: ListStatus) => void;
  removeFromList: (animeId: string) => void;
  isInList: (animeId: string) => boolean;
  getListByStatus: (status: ListStatus) => MyListEntry[];

  // Watch progress actions
  saveProgress: (entry: Omit<WatchProgressEntry, 'lastWatchedAt'>) => void;
  getProgress: (animeId: string, episodeId: string) => WatchProgressEntry | undefined;
  getAnimeProgress: (animeId: string) => WatchProgressEntry | undefined;
  clearProgress: (animeId: string) => void;
  clearAllProgress: () => void;

  resetAll: () => void;
}

const MAX_RECENT = 12;

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Defaults
      defaultAudio: 'sub',
      defaultQuality: 'auto',
      defaultPlaybackSpeed: 1,
      autoplayNext: true,
      skipIntro: true,
      skipOutro: false,
      hwAccel: true,
      holdFor2x: true,
      swipeGestures: true,
      pipMode: true,

      posterSize: 'comfortable',
      showFillerEpisodes: true,
      hideSpoilersInSynopsis: false,
      marqueeTitles: true,

      subtitleStyle: {
        fontSize: 18,
        fontFamily: 'sans',
        color: '#ffffff',
        background: 'shadow',
        bgOpacity: 0.6,
      },

      useLowDataMode: false,
      recentSearches: [],
      recentAnimeIds: [],
      myList: [],
      watchProgress: [],

      // Setters
      setDefaultAudio: (a) => set({ defaultAudio: a }),
      setDefaultQuality: (q) => set({ defaultQuality: q }),
      setDefaultPlaybackSpeed: (s) => set({ defaultPlaybackSpeed: s }),
      setAutoplayNext: (b) => set({ autoplayNext: b }),
      setSkipIntro: (b) => set({ skipIntro: b }),
      setSkipOutro: (b) => set({ skipOutro: b }),
      setHwAccel: (b) => set({ hwAccel: b }),
      setHoldFor2x: (b) => set({ holdFor2x: b }),
      setSwipeGestures: (b) => set({ swipeGestures: b }),
      setPipMode: (b) => set({ pipMode: b }),
      setPosterSize: (s) => set({ posterSize: s }),
      setShowFillerEpisodes: (b) => set({ showFillerEpisodes: b }),
      setHideSpoilersInSynopsis: (b) => set({ hideSpoilersInSynopsis: b }),
      setMarqueeTitles: (b) => set({ marqueeTitles: b }),
      setSubtitleStyle: (s) =>
        set((state) => ({ subtitleStyle: { ...state.subtitleStyle, ...s } })),
      setUseLowDataMode: (b) => set({ useLowDataMode: b }),

      addRecentSearch: (q) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        const existing = get().recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        set({ recentSearches: [trimmed, ...existing].slice(0, MAX_RECENT) });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      addRecentAnime: (id) => {
        const existing = get().recentAnimeIds.filter((x) => x !== id);
        set({ recentAnimeIds: [id, ...existing].slice(0, MAX_RECENT) });
      },
      clearRecentAnime: () => set({ recentAnimeIds: [] }),

      // My List actions
      addToList: (animeId, status) =>
        set((state) => {
          const existing = state.myList.find((e) => e.animeId === animeId);
          if (existing) {
            return {
              myList: state.myList.map((e) =>
                e.animeId === animeId
                  ? { ...e, status, updatedAt: Date.now() }
                  : e
              ),
            };
          }
          return {
            myList: [
              ...state.myList,
              {
                animeId,
                status,
                episodesWatched: 0,
                addedAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          };
        }),
      updateListStatus: (animeId, status) =>
        set((state) => ({
          myList: state.myList.map((e) =>
            e.animeId === animeId ? { ...e, status, updatedAt: Date.now() } : e
          ),
        })),
      removeFromList: (animeId) =>
        set((state) => ({
          myList: state.myList.filter((e) => e.animeId !== animeId),
        })),
      isInList: (animeId) => get().myList.some((e) => e.animeId === animeId),
      getListByStatus: (status) => get().myList.filter((e) => e.status === status),

      // Watch progress actions
      saveProgress: (entry) =>
        set((state) => {
          const filtered = state.watchProgress.filter(
            (p) => !(p.animeId === entry.animeId)
          );
          // Keep only most recent 50 entries
          const newProgress = [
            { ...entry, lastWatchedAt: Date.now() },
            ...filtered,
          ].slice(0, 50);
          return { watchProgress: newProgress };
        }),
      getProgress: (animeId, episodeId) =>
        get().watchProgress.find(
          (p) => p.animeId === animeId && p.episodeId === episodeId
        ),
      getAnimeProgress: (animeId) =>
        get().watchProgress.find((p) => p.animeId === animeId),
      clearProgress: (animeId) =>
        set((state) => ({
          watchProgress: state.watchProgress.filter((p) => p.animeId !== animeId),
        })),
      clearAllProgress: () => set({ watchProgress: [] }),

      resetAll: () =>
        set({
          defaultAudio: 'sub',
          defaultQuality: 'auto',
          defaultPlaybackSpeed: 1,
          autoplayNext: true,
          skipIntro: true,
          skipOutro: false,
          hwAccel: true,
          holdFor2x: true,
          swipeGestures: true,
          pipMode: true,
          posterSize: 'comfortable',
          showFillerEpisodes: true,
          hideSpoilersInSynopsis: false,
          marqueeTitles: true,
          subtitleStyle: {
            fontSize: 18,
            fontFamily: 'sans',
            color: '#ffffff',
            background: 'shadow',
            bgOpacity: 0.6,
          },
          useLowDataMode: false,
          recentSearches: [],
          recentAnimeIds: [],
          myList: [],
          watchProgress: [],
        }),
    }),
    {
      name: 'yugen-settings',
      version: 2,
    }
  )
);
