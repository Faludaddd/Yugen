'use client';

/**
 * WatchView
 *
 * Fullscreen watch view shown when the user picks an anime + episode.
 * Hosts the VideoPlayer + ProviderSheet, handles stream resolution and
 * graceful error display when no streaming source is available.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ProviderSheet } from './ProviderSheet';
import { ChevronDown, Server, AlertTriangle, RotateCw, Link2, Play, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Provider, Anime, AnimeEpisode, AudioMode, StreamResponse } from '@/lib/streaming/types';

interface WatchViewProps {
  anime: Anime;
  episode: AnimeEpisode;
  onExit: () => void;
}

export function WatchView({ anime, episode, onExit }: WatchViewProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [audioMode, setAudioMode] = useState<AudioMode>('sub');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [stream, setStream] = useState<StreamResponse['stream'] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [fallbacksTried, setFallbacksTried] = useState<string[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  // Custom URL mode — when no source works, user can paste their own stream URL
  const [customUrlMode, setCustomUrlMode] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlPlaying, setCustomUrlPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Load preset providers on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/providers', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProviders(data.providers);
        // Pick first provider that supports current audio mode
        const visible = data.providers.filter((p: Provider) => p.supports.includes('sub'));
        if (visible.length > 0) {
          setSelectedProvider(visible[0]);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Pick a sensible default provider when audio mode changes
  const pickDefaultProvider = useCallback(
    (list: Provider[], mode: AudioMode) => {
      const filtered = list.filter((p) => p.supports.includes(mode));
      const sorted = [...filtered].sort((a, b) => a.priority - b.priority);
      return sorted[0] ?? null;
    },
    []
  );

  // When audio mode changes, reset selected provider to one that supports it
  useEffect(() => {
    if (providers.length === 0) return;
    const stillValid = selectedProvider?.supports.includes(audioMode)
      ? selectedProvider
      : null;
    if (!stillValid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProvider(pickDefaultProvider(providers, audioMode));
    }
  }, [audioMode, providers]);  

  // Resolve stream — tries the Consumet API
  const resolveStream = useCallback(
    async (mode: AudioMode, providerCode: string | null) => {
      setResolving(true);
      setFatalError(null);
      setStream(null);

      try {
        const url =
          `/api/stream/${anime.id}/${episode.number}` +
          `?audio=${mode}&quality=auto` +
          (providerCode ? `&provider=${encodeURIComponent(providerCode)}` : '');
        const res = await fetch(url);
        const data: StreamResponse | { ok: false; error: string; fallbacksTried: string[] } = await res.json();

        if (data.ok && 'stream' in data && data.stream) {
          setStream(data.stream);
          setFallbacksTried(data.fallbacksTried ?? []);
          setResolving(false);
        } else {
          // Show clean error — no placeholder content
          const errorMsg = 'error' in data ? data.error : 'Unknown streaming error';
          setFatalError(errorMsg);
          setFallbacksTried('fallbacksTried' in data ? data.fallbacksTried : []);
          setResolving(false);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Network error';
        setFatalError(msg);
        setResolving(false);
      }
    },
    [anime.id, episode.number]
  );

  // Initial resolve when audio mode or provider changes
  useEffect(() => {
    if (!selectedProvider) return;
    retryCountRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void resolveStream(audioMode, selectedProvider.codename);
  }, [selectedProvider?.id, audioMode, episode.id, resolveStream]);

  // Handle playback error from VideoPlayer — try retrying once, then show error
  const handlePlaybackError = useCallback(
    async (_reason: string) => {
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        // Re-resolve the stream (Consumet may have transient issues)
        await resolveStream(audioMode, selectedProvider?.codename ?? null);
      } else {
        setFatalError('Playback failed. The streaming source may be down or incompatible.');
      }
    },
    [audioMode, selectedProvider, resolveStream]
  );

  const handleSelectProvider = useCallback((p: Provider) => {
    setSelectedProvider(p);
    retryCountRef.current = 0;
    setSheetOpen(false);
  }, []);

  const handleRetry = useCallback(() => {
    setFatalError(null);
    setCustomUrlMode(false);
    setCustomUrlPlaying(false);
    retryCountRef.current = 0;
    void resolveStream(audioMode, selectedProvider?.codename ?? null);
  }, [audioMode, selectedProvider, resolveStream]);

  // Play a custom URL provided by the user
  const handlePlayCustomUrl = useCallback(() => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      toast.error('Please paste a stream URL');
      return;
    }
    // Basic validation
    let urlHost = '';
    try {
      const u = new URL(trimmed);
      if (!/^https?:$/.test(u.protocol)) {
        toast.error('URL must start with http:// or https://');
        return;
      }
      urlHost = u.host;
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    // Determine type from URL
    const isHls = trimmed.endsWith('.m3u8') || trimmed.includes('.m3u8?');
    const isMp4 = trimmed.endsWith('.mp4') || trimmed.includes('.mp4?');
    const type: 'hls' | 'mp4' | 'embed' = isHls ? 'hls' : isMp4 ? 'mp4' : 'embed';

    // Set up a synthetic stream object
    setStream({
      url: trimmed,
      type,
      quality: 'auto',
      audio: audioMode,
      provider: {
        id: 'custom',
        codename: 'CUSTOM',
        displayName: 'Custom URL',
        description: 'Your own stream URL',
        badges: [],
        sourceAttribution: urlHost,
        qualityOptions: ['auto'],
      },
      episode: {
        animeId: anime.id,
        animeTitle: anime.titleEnglish || anime.titleRomaji || '',
        number: episode.number,
        title: episode.title,
        duration: episode.duration,
      },
    });
    setCustomUrlPlaying(true);
    setFatalError(null);
    setCustomUrlMode(false);
    toast.success('Playing your custom URL');
  }, [customUrl, audioMode, anime, episode]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Player area */}
      <div className="flex flex-1 items-center justify-center bg-black">
        <div className="w-full max-w-5xl">
          {stream ? (
            <VideoPlayer
              key={`${stream.url}-${selectedProvider?.id}`}
              streamUrl={stream.url}
              streamType={stream.type}
              title={anime.titleEnglish || anime.titleRomaji || anime.titleNative || 'Unknown'}
              sourceAttribution={stream.provider.sourceAttribution}
              audioMode={audioMode}
              providerCodename={stream.provider.codename}
              qualityLabel="AUTO"
              onOpenProviders={() => setSheetOpen(true)}
              onPlaybackError={handlePlaybackError}
              onClose={onExit}
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center p-6 text-center">
              {fatalError ? (
                <div className="max-w-md">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'rgba(255, 165, 0, 0.15)' }}
                  >
                    <AlertTriangle className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="mb-2 text-lg font-bold text-[var(--foreground)]">
                    Streaming source unavailable
                  </div>
                  <div className="mb-3 text-sm text-[var(--muted-foreground)]">
                    We couldn&apos;t find a working stream for this specific anime.
                    This usually means it&apos;s not in the Anikoto catalog, or
                    the episode hasn&apos;t been uploaded yet. Try a different
                    anime, or paste your own stream URL below.
                  </div>
                  <div className="mb-4 text-xs text-[var(--muted-foreground)] opacity-70">
                    {fatalError}
                  </div>
                  {fallbacksTried.length > 0 && (
                    <div className="mb-4 text-xs text-[var(--muted-foreground)]">
                      Tried: {fallbacksTried.join(', ')}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition-transform hover:scale-105"
                    >
                      <RotateCw className="h-4 w-4" />
                      Retry sources
                    </button>
                    <button
                      onClick={() => setCustomUrlMode(true)}
                      className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      <Link2 className="h-4 w-4" />
                      Play my own URL
                    </button>
                    <button
                      onClick={() => setSheetOpen(true)}
                      className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      <Server className="h-4 w-4" />
                      Switch provider
                    </button>
                  </div>

                  <button
                    onClick={() => setShowInfo(true)}
                    className="text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
                  >
                    Why can&apos;t I stream?
                  </button>

                  {/* Custom URL input */}
                  {customUrlMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                          Play custom stream URL
                        </div>
                        <button
                          onClick={() => setCustomUrlMode(false)}
                          className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                        Paste a direct stream URL (.m3u8, .mp4, or embeddable URL)
                        from your own source. It will play in the player below.
                      </p>
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePlayCustomUrl(); }}
                        placeholder="https://example.com/anime/ep1.m3u8"
                        className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handlePlayCustomUrl}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-transform hover:scale-[1.02]"
                      >
                        <Play className="h-4 w-4" fill="currentColor" />
                        Play URL
                      </button>
                    </motion.div>
                  )}

                  {/* Info modal */}
                  {showInfo && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur"
                      onClick={() => setShowInfo(false)}
                    >
                      <motion.div
                        className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-left"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="flex items-center gap-2 text-base font-bold">
                            <Info className="h-4 w-4 text-[var(--primary)]" />
                            About streaming
                          </h3>
                          <button
                            onClick={() => setShowInfo(false)}
                            className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                          <p>
                            <strong className="text-[var(--foreground)]">How does streaming work?</strong>{' '}
                            We scrape Anikoto (anikototv.to) to find stream URLs
                            for each anime episode. Not every anime is in their
                            catalog — newer or less popular titles may be missing.
                          </p>
                          <p>
                            <strong className="text-[var(--foreground)]">What can I do?</strong>
                          </p>
                          <ul className="ml-4 list-disc space-y-1">
                            <li>Try a more popular anime (Demon Slayer, One Piece, JJK all work)</li>
                            <li>Try a different episode number</li>
                            <li>Paste your own stream URL using &quot;Play my own URL&quot; below</li>
                          </ul>
                          <p>
                            <strong className="text-[var(--foreground)]">Catalog, search, schedule all work?</strong>{' '}
                            Yes — those use AniList (a legitimate anime database).
                            Only the video stream for this specific anime failed.
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    className="mb-3 h-10 w-10 animate-spin rounded-full border-2"
                    style={{
                      borderColor: 'var(--primary)',
                      borderTopColor: 'transparent',
                    }}
                  />
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Resolving best provider…
                  </div>
                  {fallbacksTried.length > 0 && (
                    <div className="mt-2 text-xs text-[var(--muted-foreground)] opacity-70">
                      Tried: {fallbacksTried.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Below-player info */}
      <div className="max-h-[35vh] overflow-y-auto scrollbar-none border-t border-[var(--border)] bg-[#0e0e0e] px-4 py-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-xs text-[var(--muted-foreground)]">
              Episode {episode.number}
              {episode.title ? ` · ${episode.title}` : ''}
            </div>
            <h2
              className="gradient-text truncate text-base font-bold"
              style={{ ['--anime-accent' as string]: anime.color || '#b5a8ff' }}
            >
              {anime.titleEnglish || anime.titleRomaji}
            </h2>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="glass flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-105"
          >
            <Server className="h-3.5 w-3.5" />
            {selectedProvider ? selectedProvider.codename : 'Sources'}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        {anime.synopsis && (
          <p className="line-clamp-3 text-xs text-[var(--muted-foreground)]">
            {anime.synopsis}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {anime.genres.slice(0, 4).map((g) => (
            <span
              key={g}
              className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-[var(--muted-foreground)]"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <ProviderSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        providers={providers}
        audioMode={audioMode}
        onAudioModeChange={(m) => {
          setAudioMode(m);
          retryCountRef.current = 0;
        }}
        selectedProviderId={selectedProvider?.id ?? null}
        onSelectProvider={handleSelectProvider}
        title={anime.titleEnglish || anime.titleRomaji || anime.titleNative || ''}
        episodeLabel={`Episode ${episode.number}`}
      />
    </motion.div>
  );
}
