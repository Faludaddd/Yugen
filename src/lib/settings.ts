/**
 * Settings store — persisted to localStorage.
 *
 * Used by:
 *   - Settings page (read/write)
 *   - WatchView (default audio mode, default quality)
 *   - VideoPlayer (default playback speed, autoplay, skip intro)
 *   - Search overlay (recent searches, recent anime)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioMode = 'sub' | 'dub';
export type Quality = 'auto' | '1080p' | '720p' | '480p' | '360p';

export interface SettingsState {
  // Playback
  defaultAudio: AudioMode;
  defaultQuality: Quality;
  defaultPlaybackSpeed: number; // 0.5 – 2
  autoplayNext: boolean;
  skipIntro: boolean;
  skipOutro: boolean;
  hwAccel: boolean; // browser-native HLS on Safari

  // Display
  posterSize: 'compact' | 'comfortable' | 'large';
  showFillerEpisodes: boolean;
  hideSpoilersInSynopsis: boolean;

  // Data
  useLowDataMode: boolean; // smaller images, no autoplay

  // History
  recentSearches: string[];
  recentAnimeIds: string[]; // last viewed

  // Actions
  setDefaultAudio: (a: AudioMode) => void;
  setDefaultQuality: (q: Quality) => void;
  setDefaultPlaybackSpeed: (s: number) => void;
  setAutoplayNext: (b: boolean) => void;
  setSkipIntro: (b: boolean) => void;
  setSkipOutro: (b: boolean) => void;
  setHwAccel: (b: boolean) => void;
  setPosterSize: (s: 'compact' | 'comfortable' | 'large') => void;
  setShowFillerEpisodes: (b: boolean) => void;
  setHideSpoilersInSynopsis: (b: boolean) => void;
  setUseLowDataMode: (b: boolean) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  addRecentAnime: (id: string) => void;
  clearRecentAnime: () => void;
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
      skipIntro: false,
      skipOutro: false,
      hwAccel: true,
      posterSize: 'comfortable',
      showFillerEpisodes: true,
      hideSpoilersInSynopsis: false,
      useLowDataMode: false,
      recentSearches: [],
      recentAnimeIds: [],

      // Setters
      setDefaultAudio: (a) => set({ defaultAudio: a }),
      setDefaultQuality: (q) => set({ defaultQuality: q }),
      setDefaultPlaybackSpeed: (s) => set({ defaultPlaybackSpeed: s }),
      setAutoplayNext: (b) => set({ autoplayNext: b }),
      setSkipIntro: (b) => set({ skipIntro: b }),
      setSkipOutro: (b) => set({ skipOutro: b }),
      setHwAccel: (b) => set({ hwAccel: b }),
      setPosterSize: (s) => set({ posterSize: s }),
      setShowFillerEpisodes: (b) => set({ showFillerEpisodes: b }),
      setHideSpoilersInSynopsis: (b) => set({ hideSpoilersInSynopsis: b }),
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

      resetAll: () =>
        set({
          defaultAudio: 'sub',
          defaultQuality: 'auto',
          defaultPlaybackSpeed: 1,
          autoplayNext: true,
          skipIntro: false,
          skipOutro: false,
          hwAccel: true,
          posterSize: 'comfortable',
          showFillerEpisodes: true,
          hideSpoilersInSynopsis: false,
          useLowDataMode: false,
          recentSearches: [],
          recentAnimeIds: [],
        }),
    }),
    {
      name: 'anistream-settings',
      version: 1,
    }
  )
);
