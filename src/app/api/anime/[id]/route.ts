/**
 * GET /api/anime/[id]
 *   Single anime with full episode list. Powered by AniList GraphQL.
 *
 * Accepts either "al-21" or "21" as id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnimeById } from '@/lib/anilist';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const anime = await getAnimeById(id);
    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }
    return NextResponse.json({ anime });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
