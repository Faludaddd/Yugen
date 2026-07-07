'use client';

/**
 * ProviderSheet
 *
 * Bottom-sheet modal that replicates Th3-Anime's provider selection UI:
 *   - "Audio Track" segmented control (Subtitled (Sub) | Dubbed (Dub))
 *   - "Provider" section header
 *   - Vertical list of providers, each row showing:
 *       [badges] NAME      description     [✓ if selected]
 *   - Green checkmark + green text highlight for the active row
 *   - Modal overlay over a dimmed video player
 *
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - providers: Provider[]
 *   - audioMode: AudioMode
 *   - onAudioModeChange: (m: AudioMode) => void
 *   - selectedProviderId: string | null
 *   - onSelectProvider: (p: Provider) => void
 *   - title: string (anime title shown at top)
 *   - episodeLabel: string (e.g. "Episode 1")
 */

import { useEffect, useMemo } from 'react';
import { Check, Star, Captions, Zap, Gauge, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Provider, AudioMode } from '@/lib/streaming/types';

interface ProviderSheetProps {
  open: boolean;
  onClose: () => void;
  providers: Provider[];
  audioMode: AudioMode;
  onAudioModeChange: (m: AudioMode) => void;
  selectedProviderId: string | null;
  onSelectProvider: (p: Provider) => void;
  title: string;
  episodeLabel: string;
}

export function ProviderSheet({
  open,
  onClose,
  providers,
  audioMode,
  onAudioModeChange,
  selectedProviderId,
  onSelectProvider,
  title,
  episodeLabel,
}: ProviderSheetProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Filter providers by selected audio mode (Th3-Anime behavior)
  const visibleProviders = useMemo(() => {
    return providers.filter((p) => p.supports.includes(audioMode));
  }, [providers, audioMode]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop — dimmed */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Streaming provider selection"
            className="relative w-full sm:max-w-md bg-card/95 sm:rounded-2xl rounded-t-2xl border-t border-border sm:border shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 sm:hidden">
              <div className="h-1 w-12 rounded-full bg-muted-foreground/40" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-3 pb-2">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Now Playing
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {episodeLabel}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close provider selection"
                className="ml-3 -mr-1 -mt-1 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audio Track segmented control */}
            <div className="px-5 pt-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Audio Track
              </div>
              <div className="flex p-1 bg-muted/60 rounded-lg">
                <button
                  onClick={() => onAudioModeChange('sub')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    audioMode === 'sub'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Subtitled (Sub)
                </button>
                <button
                  onClick={() => onAudioModeChange('dub')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    audioMode === 'dub'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dubbed (Dub)
                </button>
              </div>
            </div>

            {/* Provider section header */}
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Provider
              </div>
              <div className="text-[11px] text-muted-foreground">
                {visibleProviders.length} available
              </div>
            </div>

            {/* Provider list */}
            <div className="max-h-[50vh] overflow-y-auto px-2 pb-4 scrollbar-thin">
              {visibleProviders.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No providers available for {audioMode === 'sub' ? 'Sub' : 'Dub'}.
                  <br />
                  Try switching audio track.
                </div>
              )}
              {visibleProviders.map((p) => {
                const isSelected = p.id === selectedProviderId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProvider(p)}
                    className={`group w-full text-left px-3 py-3 rounded-xl mb-1 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'bg-primary/10 ring-1 ring-primary/40'
                        : 'hover:bg-muted/60'
                    }`}
                  >
                    {/* Badges */}
                    <div className="flex items-center gap-1 min-w-[40px] justify-center">
                      <ProviderBadges badges={p.badges} />
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {p.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.description}
                        {p.health === 'degraded' && (
                          <span className="ml-1.5 text-amber-500">• degraded</span>
                        )}
                        {p.health === 'down' && (
                          <span className="ml-1.5 text-red-500">• offline</span>
                        )}
                        {!p.isPreset && (
                          <span className="ml-1.5 text-primary/70">• custom</span>
                        )}
                      </div>
                    </div>

                    {/* Selected checkmark */}
                    <div className="w-6 flex-shrink-0 flex justify-end">
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
              Auto-fallback is ON — if your selected provider fails, the app
              will try the next one automatically.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Badge rendering ─────────────────────────────────────────────

function ProviderBadges({ badges }: { badges: string[] }) {
  if (badges.length === 0) {
    return <span className="text-muted-foreground/30 text-xs">—</span>;
  }
  return (
    <>
      {badges.map((b, i) => (
        <BadgeIcon key={`${b}-${i}`} type={b} />
      ))}
    </>
  );
}

function BadgeIcon({ type }: { type: string }) {
  switch (type) {
    case 'star':
      return <Star className="h-4 w-4 text-amber-400 fill-amber-400" />;
    case 'cc':
      return <Captions className="h-4 w-4 text-sky-400 fill-sky-400" />;
    case 'fast':
      return <Zap className="h-4 w-4 text-primary" />;
    case 'hd':
      return (
        <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-primary/20 text-primary leading-none">
          HD
        </span>
      );
    case 'multi':
      return <Gauge className="h-4 w-4 text-purple-400" />;
    default:
      return null;
  }
}
