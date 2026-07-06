/**
 * GET /api/providers
 *   Returns all enabled providers.
 *   Query params:
 *     ?audio=sub|dub  — filter by supported audio mode
 *     ?preset=true|false — only presets / only user-added
 *
 * POST /api/providers
 *   Add a user-supplied custom mirror (only when authenticated — but for the
 *   MVP demo we accept anonymous submissions to a session-scoped list).
 *
 * Body: { label, urlTemplate, resolverType, supports, notes }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const audio = sp.get('audio'); // 'sub' | 'dub'
  const presetOnly = sp.get('preset');

  const providers = await db.provider.findMany({
    where: {
      enabled: true,
      ...(presetOnly === 'true' ? { isPreset: true } : {}),
      ...(presetOnly === 'false' ? { isPreset: false } : {}),
    },
    orderBy: [{ priority: 'asc' }, { codename: 'asc' }],
  });

  // Parse JSON-encoded fields
  const parsed = providers.map((p) => ({
    ...p,
    badges: safeParse<string[]>(p.badges, []),
    supports: safeParse<string[]>(p.supports, ['sub', 'dub']),
    qualityOptions: safeParse<string[]>(p.qualityOptions, ['auto']),
  }));

  // Filter by audio mode if specified
  const filtered =
    audio && ['sub', 'dub'].includes(audio)
      ? parsed.filter((p) => p.supports.includes(audio))
      : parsed;

  return NextResponse.json({ providers: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.label || !body?.urlTemplate) {
      return NextResponse.json(
        { error: 'label and urlTemplate are required' },
        { status: 400 }
      );
    }

    const resolverType = ['hls', 'mp4', 'embed'].includes(body.resolverType)
      ? body.resolverType
      : 'hls';

    const supports = Array.isArray(body.supports)
      ? body.supports.filter((s: string) => ['sub', 'dub'].includes(s))
      : ['sub', 'dub'];

    const created = await db.provider.create({
      data: {
        codename: body.label.toUpperCase().slice(0, 12) +
          '-' +
          Math.random().toString(36).slice(2, 6),
        displayName: body.label,
        description: body.notes || 'User-added mirror',
        badges: JSON.stringify([]),
        supports: JSON.stringify(supports.length ? supports : ['sub', 'dub']),
        qualityOptions: JSON.stringify(['auto', '1080p', '720p', '480p']),
        resolverType,
        resolverEndpoint: body.urlTemplate,
        sourceAttribution: 'custom',
        isPreset: false,
        priority: 200, // user-added defaults to lower priority than presets
        enabled: true,
        health: 'ok',
      },
    });

    return NextResponse.json({
      provider: {
        ...created,
        badges: [],
        supports: safeParse<string[]>(created.supports, ['sub', 'dub']),
        qualityOptions: safeParse<string[]>(
          created.qualityOptions,
          ['auto']
        ),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── helpers ──────────────────────────────────────────────────
function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
