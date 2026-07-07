/**
 * GET /api/proxy
 *
 *   Streams a remote HLS playlist or segment through our server to bypass
 *   Cloudflare's Referer / CORS restrictions.
 *
 *   The remote CDN (mt.nekostream.site) returns 403 unless the request has
 *   the correct Referer header (https://vidtube.site/ or similar). Browsers
 *   can't set the Referer header on video requests, so we proxy through our
 *   own server which can.
 *
 *   Query params:
 *     ?url=<full remote URL>   — the URL to proxy
 *
 *   Behavior:
 *     - Fetches the remote URL with the correct Referer + User-Agent
 *     - For .m3u8 responses: rewrites relative segment URLs to point back
 *       through this proxy
 *     - For .ts / .vtt / .mp4 responses: streams the bytes through with
 *       the correct content-type
 */

import { NextRequest } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const ALLOWED_HOSTS = [
  'mt.nekostream.site',
  'vidtube.site',
  'megaplay.buzz',
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new Response('Missing url param', { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  // Security: only allow known streaming hosts
  if (!ALLOWED_HOSTS.includes(parsedUrl.host)) {
    return new Response(`Host not allowed: ${parsedUrl.host}`, { status: 403 });
  }

  // Determine the correct Referer based on the host
  const referer = parsedUrl.host === 'mt.nekostream.site'
    ? 'https://vidtube.site/'
    : `${parsedUrl.origin}/`;

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        Referer: referer,
        Origin: referer,
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isM3u8 =
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8') ||
      url.endsWith('.m3u8') ||
      url.includes('.m3u8');

    // For HLS playlists, rewrite relative URLs to go through our proxy
    if (isM3u8) {
      const text = await upstream.text();
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const rewritten = rewriteM3u8(text, baseUrl);
      return new Response(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // For binary content (segments, subtitles, mp4), stream through
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(`Proxy error: ${msg}`, { status: 502 });
  }
}

// ─────────────────────────────────────────────────────────────
//  Rewrite m3u8 to route segment URLs through our proxy
// ─────────────────────────────────────────────────────────────

function rewriteM3u8(text: string, baseUrl: string): string {
  const lines = text.split('\n');
  const proxyPrefix = '/api/proxy?url=';

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        // Rewrite #EXT-X-KEY / #EXT-X-MAP URI attributes too
        if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
          return rewriteUriInTag(trimmed, baseUrl, proxyPrefix);
        }
        return line;
      }

      // This is a segment/playlist URL — make it absolute, then proxy it
      const absoluteUrl = trimmed.startsWith('http')
        ? trimmed
        : new URL(trimmed, baseUrl).href;
      return `${proxyPrefix}${encodeURIComponent(absoluteUrl)}`;
    })
    .join('\n');
}

function rewriteUriInTag(tag: string, baseUrl: string, proxyPrefix: string): string {
  return tag.replace(/URI="([^"]+)"/g, (_match, uri) => {
    const absolute = uri.startsWith('http')
      ? uri
      : new URL(uri, baseUrl).href;
    return `URI="${proxyPrefix}${encodeURIComponent(absolute)}"`;
  });
}
