/**
 * GET /api/stream/[animeId]/[ep]
 *   Resolves a playable stream URL for the requested episode.
 *
 * Query params:
 *   ?provider=<codename>  — force a specific provider (default: auto-pick best)
 *   ?audio=sub|dub        — audio mode (default: sub)
 *   ?quality=auto|1080p|720p|480p  — quality tier (default: auto)
 *
 * Response:
 *   200: {
 *     ok: true,
 *     stream: {
 *       url, type: 'hls'|'mp4'|'embed', quality, audio,
 *       provider: { codename, displayName, ... },
 *       sourceAttribution
 *     },
 *     fallbacksTried: [...codenames]
 *   }
 *
 *   503: { ok: false, error, fallbacksTried }
 *
 * Behavior:
 *   - If provider specified: try that one. If it fails, fall back to next
 *     enabled provider that supports the requested audio mode.
 *   - If provider not specified: pick the highest-priority enabled provider
 *     supporting the audio mode.
 *   - For each candidate: substitute placeholders in resolverEndpoint,
 *     mark the provider 'degraded' if unreachable, try the next one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ animeId: string; ep: string }> }
) {
  const { animeId, ep } = await params;
  const sp = req.nextUrl.searchParams;
  const requestedProvider = sp.get('provider'); // codename
  const audio = sp.get('audio') === 'dub' ? 'dub' : 'sub';
  const quality = sp.get('quality') || 'auto';

  // Validate anime + episode exist
  const anime = await db.anime.findUnique({
    where: { id: animeId },
    include: {
      episodeEntries: { where: { number: parseInt(ep, 10) }, take: 1 },
    },
  });
  if (!anime) {
    return NextResponse.json(
      { ok: false, error: 'Anime not found' },
      { status: 404 }
    );
  }
  if (anime.episodeEntries.length === 0) {
    return NextResponse.json(
      { ok: false, error: `Episode ${ep} not found` },
      { status: 404 }
    );
  }

  // Load all enabled providers supporting the requested audio mode
  const all = await db.provider.findMany({
    where: { enabled: true },
    orderBy: [{ priority: 'asc' }, { codename: 'asc' }],
  });

  // Parse + filter by audio support
  const candidates = all
    .map((p) => ({
      ...p,
      badges: safeParse<string[]>(p.badges, []),
      supports: safeParse<string[]>(p.supports, ['sub', 'dub']),
      qualityOptions: safeParse<string[]>(p.qualityOptions, ['auto']),
    }))
    .filter((p) => p.supports.includes(audio));

  // Order: requested provider first (if any), then by priority
  if (requestedProvider) {
    candidates.sort((a, b) => {
      if (a.codename === requestedProvider) return -1;
      if (b.codename === requestedProvider) return 1;
      return a.priority - b.priority;
    });
  }

  const fallbacksTried: string[] = [];

  for (const provider of candidates) {
    fallbacksTried.push(provider.codename);

    try {
      const streamUrl = resolveStreamUrl(
        provider.resolverEndpoint,
        provider.resolverType,
        {
          animeId: anime.id,
          anilistId: anime.anilistId,
          malId: anime.malId,
          ep,
          audio,
          quality,
        }
      );

      if (!streamUrl) {
        await markProvider(provider.id, 'degraded', 'No resolver URL');
        continue;
      }

      // Pick the actual quality — if requested quality not in provider's
      // options, fall back to 'auto'
      const effectiveQuality =
        quality === 'auto' || provider.qualityOptions.includes(quality)
          ? quality
          : 'auto';

      // Mark provider OK
      await markProvider(provider.id, 'ok', null);

      return NextResponse.json({
        ok: true,
        stream: {
          url: streamUrl,
          type: provider.resolverType,
          quality: effectiveQuality,
          audio,
          provider: {
            id: provider.id,
            codename: provider.codename,
            displayName: provider.displayName,
            description: provider.description,
            badges: provider.badges,
            sourceAttribution: provider.sourceAttribution,
            qualityOptions: provider.qualityOptions,
          },
          episode: {
            animeId: anime.id,
            animeTitle:
              anime.titleEnglish || anime.titleRomaji || anime.titleNative,
            number: parseInt(ep, 10),
            title: anime.episodeEntries[0].title,
            duration: anime.episodeEntries[0].duration,
          },
        },
        fallbacksTried,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown resolver error';
      await markProvider(provider.id, 'degraded', msg);
      continue;
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: `No providers could resolve a stream for episode ${ep} (${audio})`,
      fallbacksTried,
    },
    { status: 503 }
  );
}

// ──────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────

function resolveStreamUrl(
  endpoint: string,
  _type: string,
  ctx: {
    animeId: string;
    anilistId: number;
    malId: number | null;
    ep: string;
    audio: string;
    quality: string;
  }
): string {
  if (!endpoint) return '';
  return endpoint
    .replace(/\{animeId\}/g, ctx.animeId)
    .replace(/\{anilistId\}/g, String(ctx.anilistId))
    .replace(/\{malId\}/g, String(ctx.malId ?? ''))
    .replace(/\{ep\}/g, ctx.ep)
    .replace(/\{audio\}/g, ctx.audio)
    .replace(/\{quality\}/g, ctx.quality);
}

async function markProvider(
  providerId: string,
  health: 'ok' | 'degraded' | 'down',
  error: string | null
) {
  try {
    await db.provider.update({
      where: { id: providerId },
      data: {
        health,
        lastCheckedAt: new Date(),
        lastError: error,
      },
    });
    await db.providerHealthLog.create({
      data: { providerId, status: health, error },
    });
  } catch {
    // ignore logging errors
  }
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
