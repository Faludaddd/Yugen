/**
 * GET /api/providers
 *   Returns the 6 preset streaming providers (Miruro-style).
 *
 * Query params:
 *   ?audio=sub|dub  — filter by supported audio mode
 *
 * Note: custom/user-supplied mirror management has been removed per user request.
 * The preset list is hardcoded in src/lib/anilist.ts → getPresetProviders().
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPresetProviders } from '@/lib/anilist';

export async function GET(req: NextRequest) {
  const audio = req.nextUrl.searchParams.get('audio'); // 'sub' | 'dub'
  let providers = getPresetProviders();
  if (audio && ['sub', 'dub'].includes(audio)) {
    providers = providers.filter((p) => p.supports.includes(audio as 'sub' | 'dub'));
  }
  return NextResponse.json({ providers });
}
