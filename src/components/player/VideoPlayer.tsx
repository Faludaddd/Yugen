'use client';

/**
 * VideoPlayer
 *
 * Full-featured video player that:
 *   - Plays HLS (.m3u8) streams via hls.js
 *   - Plays MP4 streams natively
 *   - Shows a Th3-Anime-style top bar:
 *       back · title + source attribution · share · overflow · cast · AUTO · speed · subtitles · active source chip (e.g. "SUB BEEP")
 *   - Shows a Th3-Anime-style bottom bar:
 *       lock · volume · -10s · play/pause · +10s · download · fit · fullscreen
 *   - Auto-hides controls after 3s of inactivity
 *   - Opens ProviderSheet via a "sources" button
 *   - Reports playback errors back to parent so they can trigger auto-fallback
 *
 * Props:
 *   - streamUrl, streamType, title, sourceAttribution
 *   - audioMode, providerCodename (for the active source chip)
 *   - onOpenProviders (callback to open the bottom sheet)
 *   - onPlaybackError (callback when stream fails — used for fallback)
 *   - onClose (back button)
 *   - initialPosition
 *   - onProgress(position, duration)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Cast,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Maximize,
  Minimize,
  Settings2,
  Gauge,
  Subtitles,
  Lock,
  Unlock,
  Loader2,
  Server,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AudioMode, ResolverType } from '@/lib/streaming/types';

interface VideoPlayerProps {
  streamUrl: string;
  streamType: ResolverType;
  title: string;
  sourceAttribution?: string;
  audioMode: AudioMode;
  providerCodename: string;
  qualityLabel?: string;
  onOpenProviders: () => void;
  onPlaybackError: (reason: string) => void;
  onClose: () => void;
  initialPosition?: number;
  onProgress?: (position: number, duration: number) => void;
}

export function VideoPlayer({
  streamUrl,
  streamType,
  title,
  sourceAttribution,
  audioMode,
  providerCodename,
  qualityLabel = 'AUTO',
  onOpenProviders,
  onPlaybackError,
  onClose,
  initialPosition = 0,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<unknown>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [quality, setQuality] = useState(qualityLabel);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [aspectMode, setAspectMode] = useState<'fit' | 'fill' | 'stretch'>('fit');
  const [error, setError] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState(initialPosition);

  // ── HLS setup ──────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsLoading(true);
    setError(null);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      const hls = hlsRef.current as { destroy: () => void };
      hls.destroy();
      hlsRef.current = null;
    }

    let cancelled = false;

    const setupHls = async () => {
      if (streamType === 'hls') {
        // Always prefer hls.js when supported (Chromium reports it can play
        // mpegurl natively but actually can't — using video.src directly fails
        // with MEDIA_ERR_SRC_NOT_SUPPORTED). Only fall back to native HLS on
        // Safari where it actually works.
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          return;
        }
        // Use hls.js for everyone else
        try {
          const Hls = (await import('hls.js')).default;
          if (cancelled) return;
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 60,
              fragLoadingMaxRetry: 6,
              manifestLoadingMaxRetry: 4,
              levelLoadingMaxRetry: 4,
            });
            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) {
                setError(`Stream error: ${data.details}`);
                onPlaybackError(`HLS fatal: ${data.details}`);
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Last resort: try native
            video.src = streamUrl;
          } else {
            setError('HLS not supported in this browser');
            onPlaybackError('HLS not supported');
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to load HLS.js';
          setError(msg);
          onPlaybackError(msg);
        }
      } else if (streamType === 'mp4') {
        video.src = streamUrl;
      } else {
        setError(`Unsupported stream type: ${streamType}`);
        onPlaybackError(`Unsupported: ${streamType}`);
      }
    };

    setupHls();

    // Restore playback position
    if (initialPosition > 0 && video) {
      const onLoadedMeta = () => {
        video.currentTime = initialPosition;
        video.removeEventListener('loadedmetadata', onLoadedMeta);
      };
      video.addEventListener('loadedmetadata', onLoadedMeta);
    }

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        const hls = hlsRef.current as { destroy: () => void };
        hls.destroy();
        hlsRef.current = null;
      }
    };
     
  }, [streamUrl, streamType]);

  // ── Auto-hide controls ─────────────────────────────────────────
  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying && !locked) {
        setControlsVisible(false);
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
      }
    }, 3500);
  }, [isPlaying, locked]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    scheduleHideControls();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [scheduleHideControls]);

  // ── Video event handlers ───────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      scheduleHideControls();
    };
    const onPause = () => {
      setIsPlaying(false);
      setControlsVisible(true);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onLoaded = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
    };
    const onTime = () => {
      setCurrentTime(video.currentTime);
      setPositionMs(video.currentTime * 1000);
      onProgress?.(video.currentTime, video.duration || 0);
    };
    const onError = () => {
      const vErr = video.error;
      const msg = vErr
        ? `Media error code ${vErr.code}`
        : 'Unknown playback error';
      setError(msg);
      // give the user a moment, then trigger fallback
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => {
        onPlaybackError(msg);
      }, 2500);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('error', onError);
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, [onPlaybackError, onProgress, scheduleHideControls]);

  // ── Fullscreen handling ────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  // ── Player actions ─────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = parseFloat(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = parseFloat(e.target.value);
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const setSpeedAndClose = (s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const cycleAspect = () => {
    setAspectMode((m) =>
      m === 'fit' ? 'fill' : m === 'fill' ? 'stretch' : 'fit'
    );
  };

  const videoClass =
    aspectMode === 'fit'
      ? 'object-contain'
      : aspectMode === 'fill'
        ? 'object-cover'
        : 'object-fill';

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black aspect-video select-none overflow-hidden"
      onMouseMove={showControls}
      onClick={(e) => {
        // Single click anywhere toggles controls (not play/pause — matches mobile UX)
        if (e.target === e.currentTarget || e.target === videoRef.current) {
          showControls();
        }
      }}
      onTouchStart={showControls}
    >
      <video
        ref={videoRef}
        className={`h-full w-full ${videoClass} bg-black`}
        playsInline
        autoPlay
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && !error && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
            <div className="text-base font-semibold text-foreground mb-1">
              Playback Error
            </div>
            <div className="text-sm text-muted-foreground mb-4 max-w-md">
              {error}
            </div>
            <div className="text-xs text-muted-foreground">
              Trying next provider automatically…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {controlsVisible && !locked && (
          <motion.div
            className="absolute top-0 inset-x-0 p-3 pb-12 bg-gradient-to-b from-black/80 to-transparent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {/* Row 1: back, title, actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                aria-label="Back"
                className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {title}
                </div>
                {sourceAttribution && (
                  <div className="truncate text-[11px] text-white/60">
                    {sourceAttribution}
                  </div>
                )}
              </div>

              <button
                aria-label="Share"
                className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                aria-label="More options"
                className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <button
                aria-label="Cast"
                className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
              >
                <Cast className="h-5 w-5" />
              </button>
            </div>

            {/* Row 2: source chip + AUTO + speed + subtitles + sources */}
            <div className="mt-2 flex items-center gap-1.5">
              <button
                onClick={onOpenProviders}
                className="flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/30 transition-colors"
              >
                <Server className="h-3 w-3" />
                {audioMode.toUpperCase()} {providerCodename}
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu((v) => !v);
                    setShowSpeedMenu(false);
                  }}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20"
                >
                  {quality}
                </button>
                <AnimatePresence>
                  {showQualityMenu && (
                    <motion.div
                      className="absolute top-full mt-1 right-0 bg-card/95 backdrop-blur rounded-lg border border-border shadow-2xl p-1 min-w-[100px]"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {['AUTO', '1080p', '720p', '480p'].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setQuality(q);
                            setShowQualityMenu(false);
                          }}
                          className={`block w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted ${
                            q === quality ? 'text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu((v) => !v);
                    setShowQualityMenu(false);
                  }}
                  aria-label="Playback speed"
                  className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
                >
                  <Gauge className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {showSpeedMenu && (
                    <motion.div
                      className="absolute top-full mt-1 right-0 bg-card/95 backdrop-blur rounded-lg border border-border shadow-2xl p-1 min-w-[100px]"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeedAndClose(s)}
                          className={`block w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted ${
                            s === speed ? 'text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {s}×
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                aria-label="Subtitle settings"
                className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
              >
                <Subtitles className="h-4 w-4" />
              </button>

              <button
                onClick={onOpenProviders}
                aria-label="Sources / providers"
                className="ml-auto rounded-full p-1.5 text-white/90 hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CENTER play/pause button (large) ────────────────────── */}
      <AnimatePresence>
        {controlsVisible && !locked && !isLoading && !error && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-8 pointer-events-auto">
              <button
                onClick={() => seekBy(-10)}
                aria-label="Rewind 10 seconds"
                className="rounded-full p-2 text-white/80 hover:text-white"
              >
                <div className="flex flex-col items-center">
                  <RotateCcw className="h-7 w-7" />
                  <span className="text-[10px] mt-0.5">10s</span>
                </div>
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="rounded-full p-4 bg-white/10 hover:bg-white/20 backdrop-blur"
              >
                {isPlaying ? (
                  <Pause className="h-9 w-9 text-white" fill="currentColor" />
                ) : (
                  <Play className="h-9 w-9 text-white" fill="currentColor" />
                )}
              </button>
              <button
                onClick={() => seekBy(10)}
                aria-label="Forward 10 seconds"
                className="rounded-full p-2 text-white/80 hover:text-white"
              >
                <div className="flex flex-col items-center">
                  <RotateCw className="h-7 w-7" />
                  <span className="text-[10px] mt-0.5">10s</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM BAR ──────────────────────────────────────────── */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            className="absolute bottom-0 inset-x-0 p-3 pt-12 bg-gradient-to-t from-black/80 to-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
          >
            {/* Seek bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] tabular-nums text-white/80 w-10 text-right">
                {fmtTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={onSeek}
                className="flex-1 h-1 accent-primary cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, rgba(255,255,255,0.2) ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%)`,
                  borderRadius: '9999px',
                }}
                aria-label="Seek"
              />
              <span className="text-[11px] tabular-nums text-white/80 w-10">
                {fmtTime(duration)}
              </span>
            </div>

            {/* Bottom action row */}
            <div className="flex items-center justify-between">
              {/* Left cluster: lock + volume */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLocked((l) => !l)}
                  aria-label={locked ? 'Unlock controls' : 'Lock controls'}
                  className={`rounded-full p-2 ${
                    locked
                      ? 'text-primary'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {locked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </button>
                <div className="flex items-center">
                  <button
                    onClick={toggleMute}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white"
                  >
                    {muted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={onVolume}
                    className="hidden sm:block w-20 h-1 accent-primary"
                    aria-label="Volume"
                  />
                </div>
              </div>

              {/* Center cluster: -10s / play / +10s (also visible on mobile) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => seekBy(-10)}
                  aria-label="Rewind 10 seconds"
                  className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white sm:hidden"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="rounded-full p-2 text-white hover:bg-white/10 sm:hidden"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" fill="currentColor" />
                  ) : (
                    <Play className="h-6 w-6" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={() => seekBy(10)}
                  aria-label="Forward 10 seconds"
                  className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white sm:hidden"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
              </div>

              {/* Right cluster: download, fit, fullscreen */}
              <div className="flex items-center gap-1">
                <button
                  aria-label="Download"
                  className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={cycleAspect}
                  aria-label="Aspect ratio"
                  className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <span className="text-[10px] font-bold uppercase">
                    {aspectMode === 'fit' ? 'Fit' : aspectMode === 'fill' ? 'Fill' : 'Stretch'}
                  </span>
                </button>
                <button
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {fullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock indicator when controls are locked */}
      <AnimatePresence>
        {locked && (
          <motion.div
            className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Lock className="h-4 w-4 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
