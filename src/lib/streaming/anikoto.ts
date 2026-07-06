/**
 * Anikoto scraper — resolves a real stream URL for an anime episode.
 *
 * Flow (reverse-engineered from anikototv.to by capturing network requests):
 *
 *   1. Search Anikoto by the anime's title → get the Anikoto slug + animeId
 *      e.g. /watch/demon-slayer-kimetsu-no-yaiba-rzepv (animeId = 1551)
 *   2. Fetch /ajax/episode/list/{animeId}?vrf= → returns HTML with <a> tags
 *      containing data-ids (base64-encoded servers param) for each episode
 *   3. Pick the requested episode (by index, 1-based) and grab its data-ids
 *   4. Fetch /ajax/server/list?servers={data-ids} → returns HTML with <li> tags
 *      containing data-link-id values for each server (VidPlay-1, HD-1, etc.)
 *   5. Fetch /ajax/server?get={link-id} → returns {url: "https://vidtube.site/..."}
 *      (this is the iframe URL the player loads)
 *   6. Fetch the iframe URL → returns HTML with data-id (the vidtube media ID)
 *   7. Fetch /stream/getSourcesNew?id={data-id}&type=sub|dub → returns JSON with
 *      {sources: {file: "https://mt.nekostream.site/.../master.m3u8"}, ...}
 *
 * We cache the slug lookup by AniList ID for 1 hour to avoid repeated scrapes.
 */

import type { Anime } from '@/lib/streaming/types';

const ANIKOTO_BASE = 'https://anikototv.to';
const VIDTUBE_BASE = 'https://vidtube.site';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ResolvedStream {
  url: string;          // direct m3u8 / mp4 URL
  type: 'hls' | 'mp4';
  quality: string;
  sourceAttribution: string;
  subtitles?: { file: string; label: string }[];
  introSkip?: { start: number; end: number };
  outroSkip?: { start: number; end: number };
}

interface AnikotoSlug {
  slug: string;        // e.g. "demon-slayer-kimetsu-no-yaiba-rzepv"
  animeId: string;     // e.g. "1551"
}

// ─────────────────────────────────────────────────────────────
//  In-memory cache (1 hour TTL)
// ─────────────────────────────────────────────────────────────

interface CacheEntry<T> { value: T; expires: number }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
//  Helpers
// ─────────────────────────────────────────────────────────────

async function fetchHtml(url: string, referer = ANIKOTO_BASE + '/'): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: referer,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

async function fetchJson<T>(url: string, referer = ANIKOTO_BASE + '/'): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: referer,
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return (await res.json()) as T;
}

// ─────────────────────────────────────────────────────────────
//  Step 1: Search Anikoto to find the slug for an anime
// ─────────────────────────────────────────────────────────────

async function findAnikotoSlug(anime: Anime): Promise<AnikotoSlug | null> {
  const cacheKey = `slug:${anime.anilistId}`;
  const cached = getCached<AnikotoSlug>(cacheKey);
  if (cached) return cached;

  // Try English title first, then romaji, then native
  const titles = [anime.titleEnglish, anime.titleRomaji, anime.titleNative].filter(
    (t): t is string => Boolean(t)
  );

  for (const title of titles) {
    const searchUrl = `${ANIKOTO_BASE}/search?keyword=${encodeURIComponent(title)}`;
    const html = await fetchHtml(searchUrl);

    // Find /watch/{slug} URLs in the search results
    const slugMatches = Array.from(
      html.matchAll(/\/watch\/([a-z0-9-]+-[a-z0-9]{5})(?:\/|$)/g)
    ).map((m) => m[1]);

    if (slugMatches.length === 0) continue;

    // Use the first result — verify by fetching the show page and extracting animeId
    const slug = slugMatches[0];
    const showHtml = await fetchHtml(`${ANIKOTO_BASE}/watch/${slug}`);

    // Extract the animeId from data-id="..." in the show page
    const idMatch = showHtml.match(/data-id="(\d+)"/);
    if (!idMatch) continue;

    const result = { slug, animeId: idMatch[1] };
    return setCached(cacheKey, result);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
//  Step 2: Fetch the episode list and find the data-ids for an episode
// ─────────────────────────────────────────────────────────────

interface EpisodeInfo {
  dataIds: string;       // the encoded servers param
  dataMal: string;       // MAL ID
  dataTimestamp: string; // timestamp
  number: number;
}

async function getEpisodeList(animeId: string): Promise<EpisodeInfo[]> {
  const cacheKey = `eps:${animeId}`;
  const cached = getCached<EpisodeInfo[]>(cacheKey);
  if (cached) return cached;

  const url = `${ANIKOTO_BASE}/ajax/episode/list/${animeId}?vrf=`;
  const data = await fetchJson<{ status: number; result: string }>(url);

  if (data.status !== 200 || !data.result) {
    return [];
  }

  // Parse the HTML result to extract episode data
  const episodes: EpisodeInfo[] = [];
  const epRegex =
    /data-id="\d+"\s+data-num="(\d+)"\s+data-slug="[^"]*"\s+data-mal="([^"]*)"\s+data-timestamp="([^"]*)"[^>]*data-ids="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = epRegex.exec(data.result)) !== null) {
    episodes.push({
      number: parseInt(match[1], 10),
      dataMal: match[2],
      dataTimestamp: match[3],
      dataIds: match[4],
    });
  }

  return setCached(cacheKey, episodes);
}

// ─────────────────────────────────────────────────────────────
//  Step 3-5: Get the iframe URL for a specific episode
// ─────────────────────────────────────────────────────────────

interface ServerLink {
  linkId: string;
  serverType: 'sub' | 'dub' | 'hsub';
  serverName: string;
}

async function getServerLinks(
  dataIds: string,
  audioMode: 'sub' | 'dub'
): Promise<ServerLink[]> {
  const url = `${ANIKOTO_BASE}/ajax/server/list?servers=${encodeURIComponent(dataIds)}`;
  const data = await fetchJson<{ status: number; result: string }>(url);

  if (data.status !== 200 || !data.result) {
    return [];
  }

  // Parse the HTML to extract server links
  // Each <li> has: data-ep-id, data-cmid, data-sv-id, data-link-id, and a name
  const links: ServerLink[] = [];

  // Find all <div class="type" data-type="sub|dub|hsub"> blocks
  const typeRegex = /<div class="type" data-type="(sub|dub|hsub)">[\s\S]*?<\/div>\s*<\/div>/g;
  let typeMatch: RegExpExecArray | null;
  while ((typeMatch = typeRegex.exec(data.result)) !== null) {
    const blockType = typeMatch[1] as 'sub' | 'dub' | 'hsub';
    const block = typeMatch[0];

    // For 'dub' audio mode, only include dub blocks; for 'sub', include sub + hsub
    if (audioMode === 'dub' && blockType !== 'dub') continue;
    if (audioMode === 'sub' && blockType === 'dub') continue;

    // Extract <li> items in this block
    const liRegex =
      /<li[^>]*data-link-id="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/li>/g;
    let liMatch: RegExpExecArray | null;
    while ((liMatch = liRegex.exec(block)) !== null) {
      links.push({
        linkId: liMatch[1],
        serverType: blockType,
        serverName: liMatch[2].trim(),
      });
    }
  }

  return links;
}

async function getIframeUrl(
  linkId: string
): Promise<{ url: string; skipData?: { intro: number[]; outro: number[] } } | null> {
  const url = `${ANIKOTO_BASE}/ajax/server?get=${encodeURIComponent(linkId)}`;
  const data = await fetchJson<{
    status: number;
    result: { url: string; skip_data?: { intro: number[]; outro: number[] } };
  }>(url);

  if (data.status !== 200 || !data.result?.url) {
    return null;
  }
  return { url: data.result.url, skipData: data.result.skip_data };
}

// ─────────────────────────────────────────────────────────────
//  Step 6-7: Get the actual m3u8 URL from the iframe page
// ─────────────────────────────────────────────────────────────

async function getStreamFromIframe(
  iframeUrl: string,
  audioMode: 'sub' | 'dub',
  skipData?: { intro: number[]; outro: number[] }
): Promise<ResolvedStream | null> {
  // Fetch the iframe HTML
  const html = await fetchHtml(iframeUrl, ANIKOTO_BASE + '/');

  // Extract data-id from the page
  const idMatch = html.match(/data-id="(\d+)"/);
  if (!idMatch) return null;
  const vidId = idMatch[1];

  // Determine the iframe host (could be vidtube.site or similar)
  const iframeHost = new URL(iframeUrl).origin;

  // Fetch the actual stream sources
  const sourcesUrl = `${iframeHost}/stream/getSourcesNew?id=${vidId}&type=${audioMode}`;
  const sourcesData = await fetchJson<{
    sources: { file: string };
    tracks?: { file: string; label: string; kind: string }[];
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
  }>(sourcesUrl, iframeHost + '/');

  if (!sourcesData.sources?.file) return null;

  const fileUrl = sourcesData.sources.file;
  const type: 'hls' | 'mp4' = fileUrl.endsWith('.m3u8') || fileUrl.includes('.m3u8') ? 'hls' : 'mp4';

  // Use skip data from sourcesData first, fall back to skipData from server list
  const introSkip =
    (sourcesData.intro?.start !== undefined && sourcesData.intro?.end !== undefined && sourcesData.intro.end > 0)
      ? { start: sourcesData.intro.start, end: sourcesData.intro.end }
      : (skipData?.intro && skipData.intro.length === 2 && skipData.intro[1] > 0)
        ? { start: skipData.intro[0], end: skipData.intro[1] }
        : undefined;
  const outroSkip =
    (sourcesData.outro?.start !== undefined && sourcesData.outro?.end !== undefined && sourcesData.outro.end > 0)
      ? { start: sourcesData.outro.start, end: sourcesData.outro.end }
      : (skipData?.outro && skipData.outro.length === 2 && skipData.outro[1] > 0)
        ? { start: skipData.outro[0], end: skipData.outro[1] }
        : undefined;

  return {
    url: fileUrl,
    type,
    quality: 'auto',
    sourceAttribution: 'anikototv.to',
    subtitles: sourcesData.tracks?.map((t) => ({ file: t.file, label: t.label })),
    introSkip,
    outroSkip,
  };
}

// ─────────────────────────────────────────────────────────────
//  Public API — resolve a stream for an anime + episode
// ─────────────────────────────────────────────────────────────

export async function resolveAnikotoStream(
  anime: Anime,
  episodeNumber: number,
  audioMode: 'sub' | 'dub'
): Promise<ResolvedStream | null> {
  try {
    // Step 1: Find the Anikoto slug for this anime
    const slugInfo = await findAnikotoSlug(anime);
    if (!slugInfo) {
      console.warn(`[anikoto] No slug found for anime ${anime.anilistId} (${anime.titleEnglish})`);
      return null;
    }

    // Step 2: Get the episode list
    const episodes = await getEpisodeList(slugInfo.animeId);
    if (episodes.length === 0) {
      console.warn(`[anikoto] No episodes found for animeId ${slugInfo.animeId}`);
      return null;
    }

    // Step 3: Find the requested episode (1-based)
    const episode = episodes.find((e) => e.number === episodeNumber);
    if (!episode) {
      console.warn(`[anikoto] Episode ${episodeNumber} not found (have ${episodes.length} eps)`);
      return null;
    }

    // Step 4: Get server links for this episode
    const serverLinks = await getServerLinks(episode.dataIds, audioMode);
    if (serverLinks.length === 0) {
      console.warn(`[anikoto] No server links for ep ${episodeNumber} (${audioMode})`);
      return null;
    }

    // Step 5: Try each server link until one works
    // Prefer ones with "VidPlay" or "HD" in the name, fallback to first
    const sortedLinks = [...serverLinks].sort((a, b) => {
      const score = (name: string) => {
        if (/vidplay/i.test(name)) return 0;
        if (/hd/i.test(name)) return 1;
        if (/vidcloud/i.test(name)) return 2;
        if (/vidstream/i.test(name)) return 3;
        return 4;
      };
      return score(a.serverName) - score(b.serverName);
    });

    for (const link of sortedLinks) {
      try {
        // Step 6: Get the iframe URL + skip data
        const iframeResult = await getIframeUrl(link.linkId);
        if (!iframeResult) continue;

        // Step 7: Get the actual stream from the iframe (passing skip data)
        const stream = await getStreamFromIframe(iframeResult.url, audioMode, iframeResult.skipData);
        if (stream) {
          return stream;
        }
      } catch (e) {
        // Try next server
        console.warn(`[anikoto] Server ${link.serverName} failed:`, e);
        continue;
      }
    }

    return null;
  } catch (e) {
    console.error('[anikoto] Resolution failed:', e);
    return null;
  }
}
