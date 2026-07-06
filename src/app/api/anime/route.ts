/**
 * GET /api/anime
 *   Catalog endpoint powered by AniList GraphQL.
 *
 * Query params:
 *   ?section=trending|popular-season|popular|top-rated|newest|top-airing|just-finished|top-movies
 *   ?q=search-query            (overrides section)
 *   ?browse=true&page=N&genre=X&sort=POPULARITY_DESC
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTrending,
  getPopularSeason,
  getPopular,
  getTopRated,
  getNewest,
  getTopAiring,
  getJustFinished,
  getTopMovies,
  searchAnime,
  browseAnime,
} from '@/lib/anilist';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim();
  const section = sp.get('section');
  const browse = sp.get('browse') === 'true';

  try {
    if (q) {
      const anime = await searchAnime(q, 30);
      return NextResponse.json({ anime });
    }

    if (browse) {
      const result = await browseAnime({
        page: parseInt(sp.get('page') ?? '1', 10) || 1,
        perPage: 30,
        genre: sp.get('genre') ?? undefined,
        sort: (sp.get('sort') as 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC' | 'TRENDING_DESC') || undefined,
      });
      return NextResponse.json(result);
    }

    switch (section) {
      case 'trending':
        return NextResponse.json({ anime: await getTrending(12) });
      case 'popular-season':
        return NextResponse.json({ anime: await getPopularSeason(30) });
      case 'popular':
        return NextResponse.json({ anime: await getPopular(30) });
      case 'top-rated':
        return NextResponse.json({ anime: await getTopRated(30) });
      case 'newest':
        return NextResponse.json({ anime: await getNewest(30) });
      case 'top-airing':
        return NextResponse.json({ anime: await getTopAiring(10) });
      case 'just-finished':
        return NextResponse.json({ anime: await getJustFinished(10) });
      case 'top-movies':
        return NextResponse.json({ anime: await getTopMovies(10) });
      default:
        // Default home response — return all sections
        const [trending, popularSeason, topAiring, justFinished, topMovies] = await Promise.all([
          getTrending(12),
          getPopularSeason(18),
          getTopAiring(10),
          getJustFinished(10),
          getTopMovies(10),
        ]);
        return NextResponse.json({
          trending,
          popularSeason,
          topAiring,
          justFinished,
          topMovies,
        });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
