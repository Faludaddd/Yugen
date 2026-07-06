'use client';

/**
 * WatchView
 *
 * Fullscreen watch view shown when the user picks an anime + episode to play.
 * Hosts the VideoPlayer + ProviderSheet, handles stream resolution and
 * auto-fallback when a provider fails.
 *
 * State machine:
 *   idle → resolving → playing → (error → fallback → resolving → playing) → done
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ProviderSheet } from './ProviderSheet';
import { ChevronDown, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const fallbackIdxRef = useRef(0);

  // Load providers on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/providers', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProviders(data.providers);
      } catch {
        // ignore — providers will be empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pick a sensible default provider when providers first load or audio mode changes
  const pickDefaultProvider = useCallback(
    (list: Provider[], mode: AudioMode) => {
      const filtered = list.filter((p) => p.supports.includes(mode));
      // Prefer presets with priority < 100, then any preset, then user-added
      const sorted = [...filtered].sort((a, b) => {
        if (a.isPreset !== b.isPreset) return a.isPreset ? -1 : 1;
        return a.priority - b.priority;
      });
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

  // Resolve stream: try the requested provider, then walk the visible list
  // for fallbacks. Implemented as a loop (not recursion) to avoid the
  // self-reference lint warning and to keep the fallback chain readable.
  const resolveStream = useCallback(
    async (initialProvider: Provider | null, mode: AudioMode) => {
      setResolving(true);
      setFatalError(null);

      const visible = providers.filter((p) => p.supports.includes(mode));
      const startIndex = initialProvider
        ? Math.max(0, visible.findIndex((p) => p.id === initialProvider.id))
        : 0;

      const tried: string[] = [];

      for (let i = startIndex; i < visible.length; i++) {
        const candidate = visible[i];
        fallbackIdxRef.current = i;
        tried.push(candidate.codename);
        setSelectedProvider(candidate);

        try {
          const url =
            `/api/stream/${anime.id}/${episode.number}` +
            `?audio=${mode}&quality=auto` +
            `&provider=${encodeURIComponent(candidate.codename)}`;
          const res = await fetch(url);
          const data: StreamResponse = await res.json();
          if (data.ok && data.stream) {
            setStream(data.stream);
            setFallbacksTried(data.fallbacksTried ?? tried);
            setResolving(false);
            return;
          }
          // else: try next
        } catch {
          // network error: try next
        }
      }

      // All exhausted
      setFatalError(`No providers could resolve a stream for episode ${episode.number} (${mode})`);
      setFallbacksTried(tried);
      setResolving(false);
    },
    [anime.id, episode.number, providers]
  );

  // Initial resolve when provider is set or changes
  useEffect(() => {
    if (!selectedProvider) return;
    fallbackIdxRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void resolveStream(selectedProvider, audioMode);
  }, [selectedProvider?.id, audioMode, episode.id, resolveStream]);

  // Handle playback error from VideoPlayer — trigger fallback
  const handlePlaybackError = useCallback(
    async (_reason: string) => {
      const visible = providers.filter((p) => p.supports.includes(audioMode));
      const nextIdx = fallbackIdxRef.current + 1;
      fallbackIdxRef.current = nextIdx;
      if (nextIdx < visible.length) {
        const next = visible[nextIdx];
        setSelectedProvider(next);
        // resolveStream will be called by the effect
      } else {
        setFatalError('All available providers failed to play this episode.');
      }
    },
    [providers, audioMode]
  );

  const handleSelectProvider = useCallback((p: Provider) => {
    setSelectedProvider(p);
    fallbackIdxRef.current = 0;
    setSheetOpen(false);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Player area */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-full max-w-5xl">
          {stream ? (
            <VideoPlayer
              key={`${stream.url}-${selectedProvider?.id}`}
              streamUrl={stream.url}
              streamType={stream.type}
              title={
                anime.titleEnglish || anime.titleRomaji || anime.titleNative || 'Unknown'
              }
              sourceAttribution={stream.provider.sourceAttribution}
              audioMode={audioMode}
              providerCodename={stream.provider.codename}
              qualityLabel="AUTO"
              onOpenProviders={() => setSheetOpen(true)}
              onPlaybackError={handlePlaybackError}
              onClose={onExit}
            />
          ) : (
            <div className="aspect-video w-full flex flex-col items-center justify-center text-center p-6">
              {fatalError ? (
                <>
                  <div className="text-red-500 text-4xl mb-3">⚠</div>
                  <div className="text-base font-semibold text-foreground mb-1">
                    Failed to load stream
                  </div>
                  <div className="text-sm text-muted-foreground mb-4 max-w-md">
                    {fatalError}
                  </div>
                  <button
                    onClick={() => {
                      setFatalError(null);
                      fallbackIdxRef.current = 0;
                      resolveStream(selectedProvider, audioMode);
                    }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
                  <div className="text-sm text-muted-foreground">
                    Resolving best provider…
                  </div>
                  {fallbacksTried.length > 0 && (
                    <div className="text-xs text-muted-foreground/70 mt-2">
                      Tried: {fallbacksTried.join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Below-player info (visible when not in fullscreen) */}
      <div className="bg-card/95 border-t border-border px-4 py-3 max-h-[35vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground mb-0.5">
              Episode {episode.number}
              {episode.title ? ` · ${episode.title}` : ''}
            </div>
            <h2 className="text-base font-semibold text-foreground truncate">
              {anime.titleEnglish || anime.titleRomaji}
            </h2>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/25 transition-colors flex-shrink-0"
          >
            <Server className="h-3.5 w-3.5" />
            {selectedProvider ? selectedProvider.codename : 'Sources'}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        {anime.synopsis && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {anime.synopsis}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {anime.genres.slice(0, 4).map((g) => (
            <span
              key={g}
              className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
            >
              {g}
            </span>
          ))}
          {anime.ageRating && (
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-red-500/15 px-2 py-0.5 text-red-400">
              {anime.ageRating}
            </span>
          )}
        </div>
      </div>

      {/* Provider bottom-sheet */}
      <ProviderSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        providers={providers}
        audioMode={audioMode}
        onAudioModeChange={(m) => {
          setAudioMode(m);
          fallbackIdxRef.current = 0;
        }}
        selectedProviderId={selectedProvider?.id ?? null}
        onSelectProvider={handleSelectProvider}
        title={anime.titleEnglish || anime.titleRomaji || anime.titleNative || ''}
        episodeLabel={`Episode ${episode.number}`}
      />
    </motion.div>
  );
}
