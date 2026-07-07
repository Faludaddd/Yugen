/**
 * Client-side data layer — calls AniList GraphQL directly.
 *
 * Used when the app runs as a static export (PWA/iOS IPA) where
 * there's no Next.js server to handle API routes.
 *
 * AniList's GraphQL endpoint has CORS: * so it works from the browser.
 */

import type { Anime, AnimeEpisode } from './streaming/types';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

// ─── In-memory cache (5min TTL) ─────────────────────────────

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

// ─── GraphQL fetch ──────────────────────────────────────────

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length > 0) throw new Error(`AniList: ${json.errors[0].message}`);
  return json.data;
}

// ─── Media fragment + mapper ───────────────────────────────

const FRAGMENT = `
  id idMal
  title { romaji english native userPreferred }
  description(asHtml: false)
  coverImage { extraLarge large medium color }
  bannerImage format episodes status season seasonYear
  averageScore genres
  studios(isMain: true) { nodes { name isAnimationStudio } }
  startDate { year month day }
  nextAiringEpisode { episode timeUntilAiring airingAt }
`;

interface AniListMedia {
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
  nextAiringEpisode?: { episode: number; timeUntilAiring: number; airingAt: number } | null;
}

function mapMedia(m: AniListMedia): Anime {
  const synopsis = m.description
    ? m.description.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim()
    : null;
  return {
    id: `al-${m.id}`,
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
    color: m.coverImage?.color ?? null,
  } as Anime;
}

// ─── Public API (mirrors src/lib/anilist.ts) ────────────────

export async function getTrending(perPage = 12): Promise<Anime[]> {
  const ck = `trending:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: TRENDING_DESC, type: ANIME, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getPopularSeason(perPage = 18): Promise<Anime[]> {
  const ck = `popular-season:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const now = new Date();
  const month = now.getMonth();
  const season = month <= 2 ? 'WINTER' : month <= 5 ? 'SPRING' : month <= 8 ? 'SUMMER' : 'FALL';
  const year = now.getFullYear();
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int, $season: MediaSeason, $year: Int) { Page(perPage: $perPage, page: 1) { media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $year, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage, season, year }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getPopular(perPage = 30): Promise<Anime[]> {
  const ck = `popular:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getTopRated(perPage = 30): Promise<Anime[]> {
  const ck = `top-rated:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: SCORE_DESC, type: ANIME, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getNewest(perPage = 30): Promise<Anime[]> {
  const ck = `newest:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: START_DATE_DESC, type: ANIME, isAdult: false, countryOfOrigin: JP) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getTopAiring(perPage = 10): Promise<Anime[]> {
  const ck = `top-airing:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getJustFinished(perPage = 10): Promise<Anime[]> {
  const ck = `just-finished:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: END_DATE_DESC, type: ANIME, status: FINISHED, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function getTopMovies(perPage = 10): Promise<Anime[]> {
  const ck = `top-movies:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: POPULARITY_DESC, type: ANIME, format: MOVIE, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );
  return setCached(ck, d.Page.media.map(mapMedia));
}

export async function searchAnimeClient(query: string, perPage = 30): Promise<Anime[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const ck = `search:${trimmed}:${perPage}`;
  const cached = getCached<Anime[]>(ck);
  if (cached) return cached;
  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($search: String, $perPage: Int) { Page(perPage: $perPage, page: 1) { media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) { ${FRAGMENT} } } }`,
    { search: trimmed, perPage: 40 }
  );
  const all = d.Page.media.map(mapMedia);
  // Client-side filter for accuracy
  const filtered = all.filter((a) => {
    const titles = [a.titleEnglish, a.titleRomaji, a.titleNative].filter(Boolean).map((t) => t!.toLowerCase());
    return titles.some((t) => t.includes(trimmed));
  });
  const sorted = filtered.sort((a, b) => {
    const aTitles = [a.titleEnglish, a.titleRomaji, a.titleNative].filter(Boolean).map((t) => t!.toLowerCase());
    const bTitles = [b.titleEnglish, b.titleRomaji, b.titleNative].filter(Boolean).map((t) => t!.toLowerCase());
    if (aTitles.some((t) => t === trimmed) !== bTitles.some((t) => t === trimmed))
      return aTitles.some((t) => t === trimmed) ? -1 : 1;
    if (aTitles.some((t) => t.startsWith(trimmed)) !== bTitles.some((t) => t.startsWith(trimmed)))
      return aTitles.some((t) => t.startsWith(trimmed)) ? -1 : 1;
    return (b.averageScore ?? 0) - (a.averageScore ?? 0);
  });
  return setCached(ck, sorted.slice(0, perPage));
}

export async function getAnimeByIdClient(id: string): Promise<Anime | null> {
  const alId = id.startsWith('al-') ? parseInt(id.slice(3), 10) : parseInt(id, 10);
  if (!Number.isFinite(alId)) return null;
  const ck = `anime:${alId}`;
  const cached = getCached<Anime>(ck);
  if (cached) return cached;
  const d = await gql<{ Media: AniListMedia | null }>(
    `query ($id: Int) { Media(id: $id, type: ANIME) { ${FRAGMENT} } }`,
    { id: alId }
  );
  if (!d.Media) return null;
  const anime = mapMedia(d.Media);
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
  return setCached(ck, anime);
}

export async function getScheduleClient(daysAhead = 7, perPage = 50) {
  const ck = `schedule:${daysAhead}:${perPage}`;
  const cached = getCached<ReturnType<typeof getScheduleClient>>(ck);
  if (cached) return cached;

  const d = await gql<{ Page: { media: AniListMedia[] } }>(
    `query ($perPage: Int) { Page(perPage: $perPage, page: 1) { media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false) { ${FRAGMENT} } } }`,
    { perPage }
  );

  const now = Date.now();
  const cutoff = now + daysAhead * 24 * 60 * 60 * 1000;
  const entries: { anime: Anime; episode: number; airingAt: string; timeUntilAiring: number; hasAired: boolean }[] = [];

  for (const m of d.Page.media) {
    const nae = m.nextAiringEpisode;
    if (!nae) continue;
    const airingAtMs = nae.airingAt * 1000;
    if (airingAtMs > cutoff) continue;
    entries.push({
      anime: mapMedia(m),
      episode: nae.episode,
      airingAt: new Date(airingAtMs).toISOString(),
      timeUntilAiring: nae.timeUntilAiring,
      hasAired: nae.timeUntilAiring <= 0,
    });
  }

  entries.sort((a, b) => new Date(a.airingAt).getTime() - new Date(b.airingAt).getTime());

  const dayMap = new Map<string, typeof entries>();
  for (const entry of entries) {
    const dayKey = new Date(entry.airingAt).toDateString();
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push(entry);
  }

  const days = Array.from(dayMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(key => ({
    date: new Date(key).toISOString(),
    dayName: new Date(key).toLocaleDateString('en-US', { weekday: 'short' }),
    entries: dayMap.get(key)!,
  }));

  return setCached(ck, days);
}

// ─── Home data (combined fetch) ─────────────────────────────

export async function getHomeData() {
  const [trending, popularSeason, topAiring, justFinished, topMovies] = await Promise.all([
    getTrending(12),
    getPopularSeason(18),
    getTopAiring(10),
    getJustFinished(10),
    getTopMovies(10),
  ]);
  return { trending, popularSeason, topAiring, justFinished, topMovies };
}
