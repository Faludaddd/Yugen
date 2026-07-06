/**
 * Stream resolver — tries multiple Consumet instances with fallback.
 *
 * The streaming landscape is unfortunately fragile: public Consumet instances
 * go up and down regularly. We hardcode a list of known instances and try
 * them in order, with a 6-second timeout per attempt. The first one that
 * returns a usable stream URL wins.
 *
 * If all fail, we return a structured error so the UI can show a clear,
 * professional "Streaming source unavailable" message (instead of playing
 * placeholder content).
 */

interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'embed';
  headers?: Record<string, string>;
}

interface ResolverResult {
  ok: true;
  sources: StreamSource[];
  providerCodename: string;
  sourceAttribution: string;
}

interface ResolverError {
  ok: false;
  error: string;
  triedInstances: string[];
}

// Known Consumet instances — first one to respond wins.
// These change over time; we'll try them all in parallel for speed.
const CONSUMET_INSTANCES = [
  'https://consumet-api-eta.vercel.app',
  'https://consumet-api-rose.vercel.app',
  'https://api.consumet.org',
  'https://consumet-api.vercel.app',
];

// Per-attempt timeout — keep short so we can try the next instance quickly.
const FETCH_TIMEOUT_MS = 6500;

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────

/**
 * Resolve a stream for the given AniList anime + episode.
 *
 * Strategy:
 *   1. Try Consumet `/meta/anilist/watch?id=<anilistId>&episode=<ep>&dub=<0|1>`
 *   2. The endpoint returns a list of `sources` with quality tiers.
 *   3. We return all sources so the player can offer quality switching.
 *
 * If `providerCodename` is supplied, we tag the result with it for UI display.
 */
export async function resolveStream(
  anilistId: number,
  episode: number,
  audioMode: 'sub' | 'dub',
  providerCodename?: string
): Promise<ResolverResult | ResolverError> {
  const triedInstances: string[] = [];
  const isDub = audioMode === 'dub' ? 'true' : 'false';

  // Race all instances in parallel; first usable response wins.
  const result = await Promise.any(
    CONSUMET_INSTANCES.map(async (baseUrl) => {
      const label = baseUrl.replace(/^https?:\/\//, '');
      triedInstances.push(label);

      const url = `${baseUrl}/meta/anilist/watch?episode=${encodeURIComponent(
        episode
      )}&id=${encodeURIComponent(anilistId)}&dub=${isDub}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'AniStream/1.0 (+https://github.com/anistream)',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} from ${label}`);
        }
        const data = (await res.json()) as {
          sources?: { url: string; quality: string; isM3U8?: boolean }[];
          headers?: Record<string, string>;
        };

        if (!data.sources || data.sources.length === 0) {
          throw new Error(`No sources returned from ${label}`);
        }

        // Prefer the m3u8 source; fall back to first source
        const m3u8 = data.sources.find((s) => s.isM3U8 || s.url.endsWith('.m3u8'));
        const mp4 = data.sources.find((s) => s.url.endsWith('.mp4'));
        const chosen = m3u8 ?? mp4 ?? data.sources[0];

        const streamSources: StreamSource[] = data.sources.map((s) => ({
          url: s.url,
          quality: s.quality,
          type: (s.isM3U8 || s.url.endsWith('.m3u8') ? 'hls' : s.url.endsWith('.mp4') ? 'mp4' : 'embed') as 'hls' | 'mp4' | 'embed',
          headers: data.headers,
        }));

        return {
          ok: true as const,
          sources: streamSources,
          providerCodename: providerCodename ?? 'AUTO',
          sourceAttribution: label,
          chosen,
        };
      } catch (e) {
        clearTimeout(timeout);
        if (e instanceof Error && e.name === 'AbortError') {
          throw new Error(`Timeout from ${label}`);
        }
        throw e;
      }
    })
  ).catch((aggError: AggregateError) => {
    return {
      ok: false as const,
      error: `All Consumet instances failed: ${aggError.errors
        .map((e: Error) => e.message)
        .slice(0, 3)
        .join('; ')}`,
      triedInstances,
    };
  });

  if (!result.ok) {
    return result as ResolverError;
  }

  return {
    ok: true,
    sources: result.sources,
    providerCodename: result.providerCodename,
    sourceAttribution: result.sourceAttribution,
  };
}
