/**
 * AniStream — Database seed
 *
 * Seeds 6 preset providers matching Th3-Anime's UI:
 *   Koto, Neko, GG, BEEP, VEE, YUKI
 *
 * Each provider has badges, descriptions, sub/dub support, quality options,
 * and a resolver type. For the demo, all preset providers point at a public
 * sample HLS stream so the player actually works out-of-the-box. The user
 * can swap in real mirror URLs via the Settings UI later.
 *
 * Also seeds 3 demo anime entries with episodes.
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Public sample HLS streams (Mux test assets — reliable, CORS-enabled, free)
const SAMPLE_HLS =
  'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8';
const SAMPLE_HLS_ALT =
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const SAMPLE_HLS_Tears =
  'https://test-streams.mux.dev/test_001/stream.m3u8';

// Public sample MP4 (Big Buck Bunny)
const SAMPLE_MP4 =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

async function main() {
  console.log('🌱 Seeding AniStream database...');

  // ── Providers ──────────────────────────────────────────────────
  const providers = [
    {
      codename: 'Koto',
      displayName: 'Koto',
      description: 'Hard sub',
      badges: JSON.stringify(['star']),
      supports: JSON.stringify(['sub', 'dub']),
      qualityOptions: JSON.stringify(['auto', '1080p', '720p', '480p']),
      resolverType: 'hls',
      resolverEndpoint: SAMPLE_HLS,
      sourceAttribution: 'anibd.app',
      priority: 90,
    },
    {
      codename: 'Neko',
      displayName: 'Neko',
      description: 'Soft sub · CC',
      badges: JSON.stringify(['cc']),
      supports: JSON.stringify(['sub', 'dub']),
      qualityOptions: JSON.stringify(['auto', '1080p', '720p']),
      resolverType: 'hls',
      resolverEndpoint: SAMPLE_HLS_ALT,
      sourceAttribution: 'anibd.app',
      priority: 95,
    },
    {
      codename: 'GG',
      displayName: 'GG',
      description: 'GG',
      badges: JSON.stringify([]),
      supports: JSON.stringify(['sub', 'dub']),
      qualityOptions: JSON.stringify(['auto', '720p', '480p']),
      resolverType: 'mp4',
      resolverEndpoint: SAMPLE_MP4,
      sourceAttribution: 'anibd.app',
      priority: 100,
    },
    {
      codename: 'BEEP',
      displayName: 'BEEP',
      description: 'Soft sub · CC',
      badges: JSON.stringify(['star', 'cc']),
      supports: JSON.stringify(['sub', 'dub']),
      qualityOptions: JSON.stringify(['auto', '1080p', '720p', '480p']),
      resolverType: 'hls',
      resolverEndpoint: SAMPLE_HLS,
      sourceAttribution: 'anibd.app',
      priority: 70, // most preferred (matches Th3-Anime default selection)
    },
    {
      codename: 'VEE',
      displayName: 'VEE',
      description: 'Soft sub, Fast',
      badges: JSON.stringify([]),
      supports: JSON.stringify(['sub']),
      qualityOptions: JSON.stringify(['auto', '1080p', '720p']),
      resolverType: 'hls',
      resolverEndpoint: SAMPLE_HLS_Tears,
      sourceAttribution: 'anibd.app',
      priority: 80,
    },
    {
      codename: 'YUKI',
      displayName: 'YUKI',
      description: 'Soft sub, Good, Multi quality',
      badges: JSON.stringify([]),
      supports: JSON.stringify(['sub']),
      qualityOptions: JSON.stringify(['auto', '1080p', '720p', '480p', '360p']),
      resolverType: 'hls',
      resolverEndpoint: SAMPLE_HLS_ALT,
      sourceAttribution: 'anibd.app',
      priority: 85,
    },
  ];

  for (const p of providers) {
    await db.provider.upsert({
      where: { codename: p.codename },
      update: { ...p, isPreset: true, enabled: true, health: 'ok' },
      create: { ...p, isPreset: true, enabled: true, health: 'ok' },
    });
    console.log(`  ✓ Provider: ${p.codename}`);
  }

  // ── Demo anime catalog ─────────────────────────────────────────
  const animeData = [
    {
      anilistId: 101510,
      malId: 39535,
      titleRomaji: 'Mushoku Tensei: Isekai Ittara Honki Dasu',
      titleEnglish: 'Mushoku Tensei: Jobless Reincarnation',
      titleNative: '無職転生 ～異世界行ったら本気だす～',
      synopsis:
        "A 34-year-old Japanese NEET is kicked out of his home following his parents' death. After a self-reflective, uneventful life cut short by a traffic accident, he awakens as a baby in a world of swords and magic.",
      posterUrl:
        'https://cdn.myanimelist.net/images/anime/7/108005l.jpg',
      bannerUrl:
        'https://cdn.myanimelist.net/images/anime/7/108005l.jpg',
      format: 'TV',
      episodes: 11,
      status: 'FINISHED',
      season: 'WINTER',
      seasonYear: 2021,
      averageScore: 84,
      genres: JSON.stringify(['Adventure', 'Drama', 'Fantasy']),
      ageRating: 'R-17',
      studios: JSON.stringify(['Studio Bind']),
    },
    {
      anilistId: 113415,
      malId: 44511,
      titleRomaji: 'Chainsaw Man',
      titleEnglish: 'Chainsaw Man',
      titleNative: 'チェンソーマン',
      synopsis:
        'Denji is a young man trapped in poverty, working as a Devil Hunter to pay off his deceased father\'s debt to the yakuza. He lives with a small devil dog named Pochita, who also serves as his weapon.',
      posterUrl:
        'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
      bannerUrl:
        'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
      format: 'TV',
      episodes: 12,
      status: 'FINISHED',
      season: 'FALL',
      seasonYear: 2022,
      averageScore: 85,
      genres: JSON.stringify(['Action', 'Horror', 'Supernatural']),
      ageRating: 'R-17',
      studios: JSON.stringify(['MAPPA']),
    },
    {
      anilistId: 101922,
      malId: 38000,
      titleRomaji: 'Kimetsu no Yaiba',
      titleEnglish: 'Demon Slayer: Kimetsu no Yaiba',
      titleNative: '鬼滅の刃',
      synopsis:
        'Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. His younger sister Nezuko, the sole survivor, has been turned into a demon herself.',
      posterUrl:
        'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
      bannerUrl:
        'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
      format: 'TV',
      episodes: 26,
      status: 'FINISHED',
      season: 'SPRING',
      seasonYear: 2019,
      averageScore: 80,
      genres: JSON.stringify(['Action', 'Supernatural', 'Historical']),
      ageRating: 'R-17',
      studios: JSON.stringify(['ufotable']),
    },
  ];

  for (const a of animeData) {
    const anime = await db.anime.upsert({
      where: { anilistId: a.anilistId },
      update: {},
      create: a,
    });
    console.log(`  ✓ Anime: ${anime.titleEnglish}`);

    // Seed episodes for each anime
    const existingEps = await db.episode.count({
      where: { animeId: anime.id },
    });
    if (existingEps === 0) {
      for (let i = 1; i <= (anime.episodes ?? 1); i++) {
        await db.episode.create({
          data: {
            animeId: anime.id,
            number: i,
            title: `Episode ${i}`,
            description: `Episode ${i} of ${anime.titleEnglish}.`,
            duration: 1440, // 24 min
            airDate: new Date(
              (anime.seasonYear ?? 2020) + (i > 12 ? 1 : 0),
              (i % 12) + 1,
              i
            ),
          },
        });
      }
      console.log(`    └─ seeded ${anime.episodes} episodes`);
    }
  }

  console.log('\n✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
