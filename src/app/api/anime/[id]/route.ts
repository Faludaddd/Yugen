/**
 * GET /api/anime/[id]
 *   Get a single anime with its episodes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const anime = await db.anime.findUnique({
    where: { id },
    include: {
      episodeEntries: {
        orderBy: { number: 'asc' },
      },
    },
  });

  if (!anime) {
    return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
  }

  return NextResponse.json({
    anime: {
      ...anime,
      genres: safeParse<string[]>(anime.genres, []),
      studios: safeParse<string[]>(anime.studios, []),
      episodeEntries: anime.episodeEntries,
    },
  });
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
