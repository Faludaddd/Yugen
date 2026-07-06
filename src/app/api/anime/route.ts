/**
 * GET /api/anime
 *   List all anime in the local catalog (cached AniList/Jikan data).
 *
 * GET /api/anime?q=...  — search by title
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  const anime = await db.anime.findMany({
    where: q
      ? {
          OR: [
            { titleRomaji: { contains: q } },
            { titleEnglish: { contains: q } },
            { titleNative: { contains: q } },
          ],
        }
      : undefined,
    orderBy: [{ seasonYear: 'desc' }, { averageScore: 'desc' }],
    take: 50,
  });

  return NextResponse.json({
    anime: anime.map((a) => ({
      ...a,
      genres: safeParse<string[]>(a.genres, []),
      studios: safeParse<string[]>(a.studios, []),
    })),
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
