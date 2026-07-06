/**
 * GET /api/stream/[animeId]/[ep]
 *   Resolve a playable stream URL via Consumet (with multi-instance fallback).
 *
 * Query params:
 *   ?audio=sub|dub        (default: sub)
 *   ?provider=<codename>  (cosmetic only — affects the display chip)
 *
 * Response (success):
 *   {
 *     ok: true,
 *     stream: {
 *       url, type, quality, audio,
 *       provider: { codename, displayName, ... },
 *       sourceAttribution,
 *       availableQualities: [{ url, quality }]
 *     },
 *     fallbacksTried: [instance labels]
 *   }
 *
 * Response (failure — all Consumet instances down):
 *   { ok: false, error: '...', fallbacksTried: [...] }
 *
 * The player UI handles this gracefully and shows a clear "Source unavailable"
 * message instead of playing placeholder content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveStream } from '@/lib/streaming/resolver';
import { getPresetProviders } from '@/lib/anilist';
import type { AudioMode } from '@/lib/streaming/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ animeId: string; ep: string }> }
) {
  const { animeId, ep } = await params;
  const sp = req.nextUrl.searchParams;
  const audioMode = (sp.get('audio') === 'dub' ? 'dub' : 'sub') as AudioMode;
  const providerCodename = sp.get('provider') ?? 'BEEP';

  // Parse AniList ID from "al-21" or "21"
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

  // Try Consumet
  const result = await resolveStream(anilistId, episodeNum, audioMode, providerCodename);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        fallbacksTried: result.triedInstances,
      },
      { status: 503 }
    );
  }

  // Pick the best source — prefer HLS, then MP4, fallback to first
  const hlsSource = result.sources.find((s) => s.type === 'hls');
  const mp4Source = result.sources.find((s) => s.type === 'mp4');
  const chosen = hlsSource ?? mp4Source ?? result.sources[0];

  // Find the matching preset provider for display metadata
  const preset = getPresetProviders().find((p) => p.codename === providerCodename) ??
    getPresetProviders()[0];

  return NextResponse.json({
    ok: true,
    stream: {
      url: chosen.url,
      type: chosen.type,
      quality: chosen.quality === 'default' || chosen.quality === 'backup' ? 'auto' : chosen.quality,
      audio: audioMode,
      provider: {
        id: preset.id,
        codename: preset.codename,
        displayName: preset.displayName,
        description: preset.description,
        badges: preset.badges,
        sourceAttribution: result.sourceAttribution,
        qualityOptions: preset.qualityOptions,
      },
      episode: {
        animeId,
        animeTitle: '',
        number: episodeNum,
        title: `Episode ${episodeNum}`,
        duration: null,
      },
      availableQualities: result.sources.map((s) => ({
        url: s.url,
        quality: s.quality,
        type: s.type,
      })),
    },
    fallbacksTried: [result.sourceAttribution],
  });
}
