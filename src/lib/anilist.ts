/**
 * AniList GraphQL client — real catalog data, no DB seed needed.
 *
 * Endpoints used:
 *   - Trending now
 *   - Popular this season
 *   - Top rated
 *   - Search by title
 *   - Anime detail by ID (with episodes list)
 *   - Top airing / just finished / top movies (for sidebar)
 *
 * All requests go through a small in-memory cache (5min TTL) to avoid
 * hammering AniList on every page reload.
 */

import type { Anime, AnimeEpisode, Provider } from '@/lib/streaming/types';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: { romaji: string; english: string | null; native: string | null; userPreferred: string };
  description?: string | null;
  coverImage?: { extraLarge?: string; large?: string; medium?: string; color?: string | null };
  bannerImage?: string | null;
  format?: string;
  episodes?: number | null;
  status?: string;
  season?: string;
  seasonYear?: number;
  averageScore?: number | null;
  genres?: string[];
  studios?: { nodes: { name: string; isAnimationStudio: boolean }[] };
  startDate?: { year: number | null; month: number | null; day: number | null };
  nextAiringEpisode?: { episode: number; timeUntilAiring: number; airingAt: number } | null;
  trailer?: { id: string; site: string } | null;
}

// ─────────────────────────────────────────────────────────────
//  In-memory cache (5min TTL)
// ─────────────────────────────────────────────────────────────

interface CacheEntry<T> { value: T; expires: number }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): T {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL });
  return value;
}

// ─────────────────────────────────────────────────────────────
//  GraphQL fetch
// ─────────────────────────────────────────────────────────────

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`AniList HTTP ${res.status}`);
  }
  const json: GraphQLResponse<T> = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`AniList: ${json.errors[0].message}`);
  }
  if (!json.data) {
    throw new Error('AniList: empty response');
  }
  return json.data;
}

// ─────────────────────────────────────────────────────────────
//  Media → Anime (our local type) mapper
// ─────────────────────────────────────────────────────────────

const FRAGMENT_MEDIA = `
  id
  idMal
  title { romaji english native userPreferred }
  description(asHtml: false)
  coverImage { extraLarge large medium color }
  bannerImage
  format
  episodes
  status
  season
  seasonYear
  averageScore
  genres
  studios(isMain: true) { nodes { name isAnimationStudio } }
  startDate { year month day }
  nextAiringEpisode { episode timeUntilAiring airingAt }
`;

function mapMediaToAnime(m: AniListMedia): Anime {
  // AniList stores description as markdown-ish HTML; strip tags
  const synopsis = m.description
    ? m.description.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim()
    : null;

  return {
    id: `al-${m.id}`,                          // local stable ID
    anilistId: m.id,
    malId: m.idMal ?? null,
    titleRomaji: m.title.romaji,
    titleEnglish: m.title.english,
    titleNative: m.title.native,
    synopsis,
    posterUrl: m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || null,
    bannerUrl: m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large || null,
    format: m.format ?? null,
    episodes: m.episodes ?? null,
    status: m.status ?? null,
    season: m.season ?? null,
    seasonYear: m.seasonYear ?? null,
    averageScore: m.averageScore ?? null,
    genres: m.genres ?? [],
    ageRating: null,
    studios: (m.studios?.nodes ?? []).map((s) => s.name),
    // extra fields we tack on for Miruro-style per-anime accent
    ...({ color: m.coverImage?.color ?? null } as Record<string, unknown>),
  } as Anime & { color: string | null };
}

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────

const ANIME_PAGE_SIZE = 30;

/** Trending now — for hero carousel + top rail */
export async function getTrending(perPage = 12): Promise<Anime[]> {
  const cacheKey = `trending:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Popular this season */
export async function getPopularSeason(perPage = 30): Promise<Anime[]> {
  const cacheKey = `popular-season:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const month = now.getMonth();
  const season = month <= 2 ? 'WINTER' : month <= 5 ? 'SPRING' : month <= 8 ? 'SUMMER' : 'FALL';
  const year = now.getFullYear();

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int, $season: MediaSeason, $year: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $year, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage, season, year }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** All-time popular */
export async function getPopular(perPage = 30): Promise<Anime[]> {
  const cacheKey = `popular:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Top rated */
export async function getTopRated(perPage = 30): Promise<Anime[]> {
  const cacheKey = `top-rated:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Newest releases */
export async function getNewest(perPage = 30): Promise<Anime[]> {
  const cacheKey = `newest:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: START_DATE_DESC, type: ANIME, isAdult: false, countryOfOrigin: JP) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Top airing (sidebar) */
export async function getTopAiring(perPage = 10): Promise<Anime[]> {
  const cacheKey = `top-airing:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Just finished (sidebar) */
export async function getJustFinished(perPage = 10): Promise<Anime[]> {
  const cacheKey = `just-finished:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: END_DATE_DESC, type: ANIME, status: FINISHED, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Top movies (sidebar) */
export async function getTopMovies(perPage = 10): Promise<Anime[]> {
  const cacheKey = `top-movies:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(sort: POPULARITY_DESC, type: ANIME, format: MOVIE, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { perPage }
  );
  return setCached(cacheKey, data.Page.media.map(mapMediaToAnime));
}

/** Search by title.
 *
 *  AniList's `SEARCH_MATCH` sort is fuzzy and returns a lot of weak matches
 *  (e.g. searching "demon slayer" returns "Onigirl" because of shared tags).
 *  To get accurate results we:
 *    1. Request a larger pool (perPage=40) using TITLE_MATCH sort (stricter)
 *    2. Client-side filter: require the query to appear in english/romaji/native title
 *    3. Sort: exact match first, then starts-with, then contains, then by score
 */
export async function searchAnime(query: string, perPage = 30): Promise<Anime[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const cacheKey = `search:${trimmed}:${perPage}`;
  const cached = getCached<Anime[]>(cacheKey);
  if (cached) return cached;

  // Use SEARCH_MATCH (AniList's relevance sort) but request a big pool so we
  // can filter strictly on our side.
  const data = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($search: String, $perPage: Int) {
      Page(perPage: $perPage, page: 1) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    { search: trimmed, perPage: 40 }
  );

  const all = data.Page.media.map(mapMediaToAnime);

  // Strict client-side filter — title must contain the query (any language)
  const filtered = all.filter((a) => {
    const titles = [a.titleEnglish, a.titleRomaji, a.titleNative]
      .filter(Boolean)
      .map((t) => t!.toLowerCase());
    return titles.some((t) => t.includes(trimmed));
  });

  // Sort: exact match → starts-with → contains → by score
  const sorted = filtered.sort((a, b) => {
    const aTitles = [a.titleEnglish, a.titleRomaji, a.titleNative]
      .filter(Boolean)
      .map((t) => t!.toLowerCase());
    const bTitles = [b.titleEnglish, b.titleRomaji, b.titleNative]
      .filter(Boolean)
      .map((t) => t!.toLowerCase());

    const aExact = aTitles.some((t) => t === trimmed);
    const bExact = bTitles.some((t) => t === trimmed);
    if (aExact !== bExact) return aExact ? -1 : 1;

    const aStarts = aTitles.some((t) => t.startsWith(trimmed));
    const bStarts = bTitles.some((t) => t.startsWith(trimmed));
    if (aStarts !== bStarts) return aStarts ? -1 : 1;

    // Prefer ones where query appears in English title (most likely what user typed)
    const aEnglish = (a.titleEnglish ?? '').toLowerCase().includes(trimmed);
    const bEnglish = (b.titleEnglish ?? '').toLowerCase().includes(trimmed);
    if (aEnglish !== bEnglish) return aEnglish ? -1 : 1;

    // Then by popularity (averageScore as proxy)
    return (b.averageScore ?? 0) - (a.averageScore ?? 0);
  });

  return setCached(cacheKey, sorted.slice(0, perPage));
}

/** Browse with pagination + optional genre/sort filters */
export async function browseAnime(opts: {
  page?: number;
  perPage?: number;
  genre?: string;
  sort?: 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC' | 'TRENDING_DESC' | 'TITLE_ROMAJI_DESC';
}): Promise<{ anime: Anime[]; currentPage: number; hasNextPage: boolean; totalPages: number }> {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? ANIME_PAGE_SIZE;
  const cacheKey = `browse:${page}:${perPage}:${opts.genre ?? 'any'}:${opts.sort ?? 'default'}`;
  const cached = getCached<{ anime: Anime[]; currentPage: number; hasNextPage: boolean; totalPages: number }>(cacheKey);
  if (cached) return cached;

  const sort = opts.sort ?? 'POPULARITY_DESC';
  const variables: Record<string, unknown> = { page, perPage, sort };
  if (opts.genre) variables.genre = opts.genre;

  const genreFilter = opts.genre ? `genre: $genre,` : '';

  const data = await gql<{ Page: { media: AniListMedia[]; currentPage: number; pageInfo: { hasNextPage: boolean; lastPage: number } } }>(
    `query ($page: Int, $perPage: Int, $sort: [MediaSort], $genre: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage lastPage }
        currentPage
        media(type: ANIME, sort: $sort, ${genreFilter} isAdult: false) {
          ${FRAGMENT_MEDIA}
        }
      }
    }`,
    variables
  );
  return setCached(cacheKey, {
    anime: data.Page.media.map(mapMediaToAnime),
    currentPage: data.Page.currentPage,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    totalPages: data.Page.pageInfo.lastPage,
  });
}

/** Single anime with full episode list. AniList doesn't give us per-episode data,
 *  so we synthesize an episode list from `episodes` count (or 1 for movies). */
export async function getAnimeById(id: string): Promise<Anime | null> {
  // Accept either "al-21" or "21"
  const alId = id.startsWith('al-') ? parseInt(id.slice(3), 10) : parseInt(id, 10);
  if (!Number.isFinite(alId)) return null;

  const cacheKey = `anime:${alId}`;
  const cached = getCached<Anime>(cacheKey);
  if (cached) return cached;

  const data = await gql<{ Media: AniListMedia | null }>(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${FRAGMENT_MEDIA}
      }
    }`,
    { id: alId }
  );
  if (!data.Media) return null;
  const anime = mapMediaToAnime(data.Media);

  // Synthesize episode list
  const total = anime.episodes ?? 1;
  const episodes: AnimeEpisode[] = [];
  for (let i = 1; i <= total; i++) {
    episodes.push({
      id: `${anime.id}-ep-${i}`,
      number: i,
      title: `Episode ${i}`,
      description: null,
      thumbnailUrl: null,
      duration: 24 * 60,
      airDate: null,
      isFiller: false,
    });
  }
  (anime as Anime & { episodeEntries: AnimeEpisode[] }).episodeEntries = episodes;
  return setCached(cacheKey, anime);
}

/** Get a curated preset provider list (Miruro-style streaming sources).
 *  These are the same 6 Th3-Anime presets but adapted to Miruro's UI conventions. */
export function getPresetProviders(): Provider[] {
  return [
    {
      id: 'preset-koto',
      codename: 'Koto',
      displayName: 'Koto',
      description: 'Hard sub · Multi quality',
      badges: ['star'],
      supports: ['sub', 'dub'],
      qualityOptions: ['auto', '1080p', '720p', '480p'],
      resolverType: 'hls',
      resolverEndpoint: '',
      sourceAttribution: 'gogoanime',
      isPreset: true,
      health: 'ok',
      priority: 90,
      enabled: true,
    },
    {
      id: 'preset-neko',
      codename: 'Neko',
      displayName: 'Neko',
      description: 'Soft sub · CC',
      badges: ['cc'],
      supports: ['sub', 'dub'],
      qualityOptions: ['auto', '1080p', '720p'],
      resolverType: 'hls',
      resolverEndpoint: '',
      sourceAttribution: 'gogoanime',
      isPreset: true,
      health: 'ok',
      priority: 95,
      enabled: true,
    },
    {
      id: 'preset-gg',
      codename: 'GG',
      displayName: 'GG',
      description: 'Fast servers',
      badges: ['fast'],
      supports: ['sub', 'dub'],
      qualityOptions: ['auto', '720p', '480p'],
      resolverType: 'hls',
      resolverEndpoint: '',
      sourceAttribution: 'zoro',
      isPreset: true,
      health: 'ok',
      priority: 100,
      enabled: true,
    },
    {
      id: 'preset-beep',
      codename: 'BEEP',
      displayName: 'BEEP',
      description: 'Soft sub · CC · HD',
      badges: ['star', 'cc'],
      supports: ['sub', 'dub'],
      qualityOptions: ['auto', '1080p', '720p', '480p'],
      resolverType: 'hls',
      resolverEndpoint: '',
      sourceAttribution: 'gogoanime',
      isPreset: true,
      health: 'ok',
      priority: 70,
      enabled: true,
    },
    {
      id: 'preset-vee',
      codename: 'VEE',
      displayName: 'VEE',
      description: 'Soft sub · Fast',
      badges: ['fast'],
      supports: ['sub'],
      qualityOptions: ['auto', '1080p', '720p'],
      resolverType: 'hls',
      resolverEndpoint: '',
      sourceAttribution: 'zoro',
      isPreset: true,
      health: 'ok',
      priority: 80,
      enabled: true,
    },
    {
      id: 'preset-yuki',
      codename: 'YUKI',
      displayName: 'YUKI',
      description: 'Soft sub · Good · Multi quality',
      badges: [],
      supports: ['sub'],
      qualityOptions: ['auto', '1080p', '720p', '480p', '360p'],
      resolverType: 'hls',
      resolverEndpoint: '',
      sourceAttribution: 'gogoanime',
      isPreset: true,
      health: 'ok',
      priority: 85,
      enabled: true,
    },
  ];
}
