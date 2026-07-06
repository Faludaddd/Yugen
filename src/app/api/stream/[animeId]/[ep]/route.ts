/**
 * GET /api/stream/[animeId]/[ep]
 *   Resolve a playable stream URL.
 *
 * Strategy:
 *   1. Fetch anime metadata from AniList (cached)
 *   2. Try the Anikoto scraper (real streams from anikototv.to)
 *   3. If that fails, return a 503 with a clear error
 *
 * Query params:
 *   ?audio=sub|dub        (default: sub)
 *   ?provider=<codename>  (cosmetic only — affects the display chip)
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveAnikotoStream } from '@/lib/streaming/anikoto';
import { getAnimeById, getPresetProviders } from '@/lib/anilist';
import type { AudioMode } from '@/lib/streaming/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ animeId: string; ep: string }> }
) {
  const { animeId, ep } = await params;
  const sp = req.nextUrl.searchParams;
  const audioMode = (sp.get('audio') === 'dub' ? 'dub' : 'sub') as AudioMode;
  const providerCodename = sp.get('provider') ?? 'BEEP';

  // Parse AniList ID
  const anilistId = parseInt(animeId.startsWith('al-') ? animeId.slice(3) : animeId, 10);
  if (!Number.isFinite(anilistId)) {
    return NextResponse.json(
      { ok: false, error: `Invalid anime id: ${animeId}` },
      { status: 400 }
    );
  }

  const episodeNum = parseInt(ep, 10);
  if (!Number.isFinite(episodeNum) || episodeNum < 1) {
    return NextResponse.json(
      { ok: false, error: `Invalid episode number: ${ep}` },
      { status: 400 }
    );
  }

  // Fetch anime metadata (cached)
  const anime = await getAnimeById(`al-${anilistId}`);
  if (!anime) {
    return NextResponse.json(
      { ok: false, error: `Anime ${anilistId} not found` },
      { status: 404 }
    );
  }

  // Try the Anikoto scraper
  const stream = await resolveAnikotoStream(anime, episodeNum, audioMode);

  if (!stream) {
    return NextResponse.json(
      {
        ok: false,
        error: `Could not find a working stream for "${anime.titleEnglish || anime.titleRomaji}" episode ${episodeNum} (${audioMode}). The anime may not be available on Anikoto.`,
        fallbacksTried: ['anikoto'],
      },
      { status: 503 }
    );
  }

  // Find the matching preset provider for display metadata
  const preset = getPresetProviders().find((p) => p.codename === providerCodename) ??
    getPresetProviders()[0];

  return NextResponse.json({
    ok: true,
    stream: {
      // Route HLS streams through our proxy to bypass Cloudflare Referer checks
      url: stream.type === 'hls'
        ? `/api/proxy?url=${encodeURIComponent(stream.url)}`
        : stream.url,
      type: stream.type,
      quality: stream.quality,
      audio: audioMode,
      provider: {
        id: preset.id,
        codename: preset.codename,
        displayName: preset.displayName,
        description: preset.description,
        badges: preset.badges,
        sourceAttribution: stream.sourceAttribution,
        qualityOptions: preset.qualityOptions,
      },
      episode: {
        animeId,
        animeTitle: anime.titleEnglish || anime.titleRomaji || '',
        number: episodeNum,
        title: `Episode ${episodeNum}`,
        duration: null,
      },
      subtitles: stream.subtitles?.map((s) => ({
        ...s,
        file: `/api/proxy?url=${encodeURIComponent(s.file)}`,
      })),
      // Skip timestamps from Anikoto (intro/outro)
      introSkip: stream.introSkip,
      outroSkip: stream.outroSkip,
    },
    fallbacksTried: [stream.sourceAttribution],
  });
}
