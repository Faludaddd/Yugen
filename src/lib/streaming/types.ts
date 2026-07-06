/**
 * Shared types for the streaming system.
 */

export type AudioMode = 'sub' | 'dub';
export type Quality = 'auto' | '1080p' | '720p' | '480p' | '360p';
export type ResolverType = 'hls' | 'mp4' | 'embed' | 'custom';
export type ProviderHealth = 'ok' | 'degraded' | 'down';

export interface ProviderBadge {
  type: 'star' | 'cc' | 'fast' | 'hd' | 'multi';
  label: string;
}

export interface Provider {
  id: string;
  codename: string;
  displayName: string;
  description: string;
  badges: string[];
  supports: AudioMode[];
  qualityOptions: string[];
  resolverType: ResolverType;
  resolverEndpoint: string;
  sourceAttribution: string;
  isPreset: boolean;
  health: ProviderHealth;
  priority: number;
  enabled: boolean;
}

export interface StreamResponse {
  ok: boolean;
  stream?: {
    url: string;
    type: ResolverType;
    quality: string;
    audio: AudioMode;
    provider: {
      id: string;
      codename: string;
      displayName: string;
      description: string;
      badges: string[];
      sourceAttribution: string;
      qualityOptions: string[];
    };
    episode: {
      animeId: string;
      animeTitle: string;
      number: number;
      title: string | null;
      duration: number | null;
    };
  };
  fallbacksTried?: string[];
  error?: string;
}

export interface AnimeEpisode {
  id: string;
  number: number;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  airDate: Date | string | null;
  isFiller: boolean;
}

export interface Anime {
  id: string;
  anilistId: number;
  malId: number | null;
  titleRomaji: string;
  titleEnglish: string | null;
  titleNative: string | null;
  synopsis: string | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  genres: string[];
  ageRating: string | null;
  studios: string[];
  episodeEntries?: AnimeEpisode[];
}
