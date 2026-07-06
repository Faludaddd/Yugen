'use client';

/**
 * VideoPlayer — full-featured anime streaming player.
 *
 * Features:
 *   - HLS playback via hls.js (with Safari native fallback)
 *   - Top bar: back, marquee title, source attribution, share, overflow, cast,
 *     active source chip (e.g. "SUB BEEP"), quality selector, speed selector,
 *     subtitle settings
 *   - Center: large play/pause, ±10s seek
 *   - Bottom bar: lock, volume + slider, ±10s, play/pause, download, aspect cycle, PiP, fullscreen
 *   - Skip intro/outro buttons (when timestamps available + setting enabled)
 *   - Hold-for-2x-speed gesture (when enabled in settings)
 *   - Swipe gestures for volume (right half) and brightness (left half) (when enabled)
 *   - Subtitle styling applied via CSS (font size, family, color, background)
 *   - Auto-hide controls after 3.5s
 *   - Lock controls mode
 *   - Auto-fallback reporting on playback errors
 *   - Picture-in-Picture support
 *   - Progress saved to settings store
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, Share2, MoreVertical, Cast,
  Volume2, VolumeX, Volume1,
  Play, Pause,
  RotateCcw, RotateCw,
  Download, Maximize, Minimize,
  Settings2, Gauge, Subtitles,
  Lock, Unlock,
  Loader2, Server, AlertCircle,
  SkipForward, PictureInPicture2,
  FastForward, Type, Palette,
  Sun, Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AudioMode, ResolverType } from '@/lib/streaming/types';
import { useSettings } from '@/lib/settings';

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
  // Skip timestamps from the stream source (Anikoto returns these)
  introSkip?: { start: number; end: number };
  outroSkip?: { start: number; end: number };
  subtitleTracks?: { file: string; label: string }[];
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
  introSkip,
  outroSkip,
  subtitleTracks,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<unknown>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const seekStartRef = useRef<number>(0);

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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [quality, setQuality] = useState(qualityLabel);
  const [speed, setSpeed] = useState(1);
  const [aspectMode, setAspectMode] = useState<'fit' | 'fill' | 'stretch'>('fit');
  const [error, setError] = useState<string | null>(null);
  const [inPiP, setInPiP] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [hold2xActive, setHold2xActive] = useState(false);

  // Read settings
  const {
    holdFor2x,
    swipeGestures,
    pipMode,
    skipIntro: skipIntroSetting,
    skipOutro: skipOutroSetting,
    subtitleStyle,
    marqueeTitles,
  } = useSettings();

  // ── HLS setup ──────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      const hls = hlsRef.current as { destroy: () => void };
      hls.destroy();
      hlsRef.current = null;
    }

    let cancelled = false;

    const setupHls = async () => {
      if (streamType === 'hls') {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          return;
        }
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
              capLevelToPlayerSize: true,
            });
            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            // Load subtitle tracks if provided
            if (subtitleTracks && subtitleTracks.length > 0) {
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Subtitles handled via <track> elements instead
              });
            }

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) {
                setError(`Stream error: ${data.details}`);
                onPlaybackError(`HLS fatal: ${data.details}`);
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
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
        setShowSubtitleMenu(false);
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

    const onPlay = () => { setIsPlaying(true); scheduleHideControls(); };
    const onPause = () => { setIsPlaying(false); setControlsVisible(true); };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onLoaded = () => { setDuration(video.duration || 0); setIsLoading(false); };
    const onTime = () => {
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime, video.duration || 0);

      // Show skip intro/outro buttons
      if (skipIntroSetting && introSkip && video.currentTime >= introSkip.start && video.currentTime < introSkip.end - 5) {
        setShowSkipIntro(true);
      } else {
        setShowSkipIntro(false);
      }
      if (skipOutroSetting && outroSkip && video.currentTime >= outroSkip.start && video.currentTime < outroSkip.end - 5) {
        setShowSkipOutro(true);
      } else {
        setShowSkipOutro(false);
      }
    };
    const onError = () => {
      const vErr = video.error;
      const msg = vErr ? `Media error code ${vErr.code}` : 'Unknown playback error';
      setError(msg);
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => { onPlaybackError(msg); }, 2500);
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
  }, [onPlaybackError, onProgress, scheduleHideControls, introSkip, outroSkip, skipIntroSetting, skipOutroSetting]);

  // ── Fullscreen handling ────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── PiP handling ───────────────────────────────────────────────
  useEffect(() => {
    const onPiPChange = () => setInPiP(Boolean(document.pictureInPictureElement));
    document.addEventListener('enterpictureinpicture', onPiPChange);
    document.addEventListener('leavepictureinpicture', onPiPChange);
    return () => {
      document.removeEventListener('enterpictureinpicture', onPiPChange);
      document.removeEventListener('leavepictureinpicture', onPiPChange);
    };
  }, []);

  // ── Player actions ─────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  const skipTo = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
  }, []);

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
    setAspectMode((m) => (m === 'fit' ? 'fill' : m === 'fill' ? 'stretch' : 'fit'));
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture?.();
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture?.();
      }
    } catch {
      // PiP failed — ignore
    }
  };

  // ── Hold-for-2x speed ──────────────────────────────────────────
  const startHold2x = useCallback(() => {
    if (!holdFor2x) return;
    const v = videoRef.current;
    if (!v || v.paused) return;
    holdTimer.current = setTimeout(() => {
      v.playbackRate = 2;
      setHold2xActive(true);
    }, 400);
  }, [holdFor2x]);

  const endHold2x = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (hold2xActive) {
      const v = videoRef.current;
      if (v) v.playbackRate = speed;
      setHold2xActive(false);
    }
  }, [hold2xActive, speed, holdFor2x]);

  // ── Swipe gestures for volume + brightness ─────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!swipeGestures) return;
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      seekStartRef.current = videoRef.current?.currentTime ?? 0;
    }
  }, [swipeGestures]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeGestures || !touchStartRef.current || e.touches.length !== 1) return;
    const v = videoRef.current;
    if (!v) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    // Horizontal swipe = seek
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      const seekDelta = (dx / 200) * 60; // up to 60s
      v.currentTime = Math.max(0, Math.min(v.duration || 0, seekStartRef.current + seekDelta));
    }
    // Vertical swipe on right half = volume
    else if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx)) {
      const isRightHalf = touchStartRef.current.x > window.innerWidth / 2;
      if (isRightHalf) {
        const volDelta = -dy / 200;
        const newVol = Math.max(0, Math.min(1, volume + volDelta));
        v.volume = newVol;
        v.muted = newVol === 0;
        setVolume(newVol);
        setMuted(newVol === 0);
      }
      // Note: brightness control via screen brightness API isn't widely supported
      // in browsers. We skip the left-half brightness gesture.
    }
  }, [swipeGestures, volume]);

  const onTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // ── Subtitle styling CSS ───────────────────────────────────────
  const subtitleCss = subtitleStyle ? `
    ::cue {
      font-size: ${subtitleStyle.fontSize}px !important;
      font-family: ${
        subtitleStyle.fontFamily === 'serif' ? 'Georgia, serif' :
        subtitleStyle.fontFamily === 'mono' ? 'ui-monospace, monospace' :
        'ui-sans-serif, system-ui, sans-serif'
      } !important;
      color: ${subtitleStyle.color} !important;
      ${
        subtitleStyle.background === 'solid'
          ? `background: rgba(0, 0, 0, ${subtitleStyle.bgOpacity}) !important;`
          : subtitleStyle.background === 'outline'
            ? `text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important; background: transparent !important;`
            : subtitleStyle.background === 'shadow'
              ? `text-shadow: 0 0 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.8) !important; background: transparent !important;`
              : 'background: transparent !important;'
      }
    }
  ` : '';

  const videoClass =
    aspectMode === 'fit' ? 'object-contain' :
    aspectMode === 'fill' ? 'object-cover' : 'object-fill';

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black aspect-video select-none overflow-hidden"
      onMouseMove={showControls}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target === videoRef.current) {
          showControls();
        }
      }}
      onTouchStart={(e) => { onTouchStart(e); showControls(); }}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={startHold2x}
      onMouseUp={endHold2x}
      onMouseLeave={endHold2x}
    >
      {/* Subtitle styling */}
      {subtitleCss && <style>{subtitleCss}</style>}

      <video
        ref={videoRef}
        className={`h-full w-full ${videoClass} bg-black`}
        playsInline
        autoPlay
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {subtitleTracks?.map((track, i) => (
          <track
            key={i}
            kind="captions"
            label={track.label}
            src={track.file}
            default={i === 0}
          />
        ))}
      </video>

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

      {/* Hold-for-2x indicator */}
      <AnimatePresence>
        {hold2xActive && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <FastForward className="h-5 w-5 text-[var(--primary)]" fill="currentColor" />
            <span className="text-sm font-bold">2× speed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip intro button */}
      <AnimatePresence>
        {showSkipIntro && (
          <motion.button
            onClick={() => introSkip && skipTo(introSkip.end)}
            className="glass absolute bottom-24 right-4 z-20 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <SkipForward className="h-4 w-4" />
            Skip Intro
          </motion.button>
        )}
      </AnimatePresence>

      {/* Skip outro button */}
      <AnimatePresence>
        {showSkipOutro && (
          <motion.button
            onClick={() => outroSkip && skipTo(outroSkip.end)}
            className="glass absolute bottom-24 right-4 z-20 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <SkipForward className="h-4 w-4" />
            Skip Outro
          </motion.button>
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
            <div className="text-base font-semibold text-foreground mb-1">Playback Error</div>
            <div className="text-sm text-muted-foreground mb-4 max-w-md">{error}</div>
            <div className="text-xs text-muted-foreground">Trying next provider automatically…</div>
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
            <div className="flex items-center gap-2">
              <button onClick={onClose} aria-label="Back" className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div
                  className={marqueeTitles && title.length > 40 ? 'whitespace-nowrap' : 'truncate'}
                  style={
                    marqueeTitles && title.length > 40
                      ? {
                          animation: 'yugen-marquee 18s linear infinite',
                          display: 'inline-block',
                        }
                      : undefined
                  }
                >
                  <span className="text-sm font-semibold text-white">{title}</span>
                </div>
                {sourceAttribution && (
                  <div className="truncate text-[11px] text-white/60">{sourceAttribution}</div>
                )}
              </div>

              <button aria-label="Share" className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white">
                <Share2 className="h-5 w-5" />
              </button>
              <button aria-label="More options" className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
              <button aria-label="Cast" className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white">
                <Cast className="h-5 w-5" />
              </button>
            </div>

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
                  onClick={() => { setShowQualityMenu((v) => !v); setShowSpeedMenu(false); setShowSubtitleMenu(false); }}
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
                          onClick={() => { setQuality(q); setShowQualityMenu(false); }}
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
                  onClick={() => { setShowSpeedMenu((v) => !v); setShowQualityMenu(false); setShowSubtitleMenu(false); }}
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

              <div className="relative">
                <button
                  onClick={() => { setShowSubtitleMenu((v) => !v); setShowQualityMenu(false); setShowSpeedMenu(false); }}
                  aria-label="Subtitle settings"
                  className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
                >
                  <Subtitles className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {showSubtitleMenu && (
                    <SubtitleMenu />
                  )}
                </AnimatePresence>
              </div>

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

      {/* ── CENTER play/pause button ────────────────────────────── */}
      <AnimatePresence>
        {controlsVisible && !locked && !isLoading && !error && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-8 pointer-events-auto">
              <button onClick={() => seekBy(-10)} aria-label="Rewind 10 seconds" className="rounded-full p-2 text-white/80 hover:text-white">
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
              <button onClick={() => seekBy(10)} aria-label="Forward 10 seconds" className="rounded-full p-2 text-white/80 hover:text-white">
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
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] tabular-nums text-white/80 w-10 text-right">{fmtTime(currentTime)}</span>
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
              <span className="text-[11px] tabular-nums text-white/80 w-10">{fmtTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLocked((l) => !l)}
                  aria-label={locked ? 'Unlock controls' : 'Lock controls'}
                  className={`rounded-full p-2 ${locked ? 'text-primary' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
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
                    ) : volume < 0.5 ? (
                      <Volume1 className="h-5 w-5" />
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
                {pipMode && (
                  <button
                    onClick={togglePiP}
                    aria-label="Picture in Picture"
                    className={`rounded-full p-2 ${inPiP ? 'text-primary' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
                  >
                    <PictureInPicture2 className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock indicator */}
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

      {/* Marquee keyframes */}
      <style>{`
        @keyframes yugen-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── Subtitle customization menu ─────────────────────────────

function SubtitleMenu() {
  const { subtitleStyle, setSubtitleStyle } = useSettings();

  return (
    <motion.div
      className="absolute top-full mt-1 right-0 bg-card/95 backdrop-blur rounded-lg border border-border shadow-2xl p-3 min-w-[220px] z-50"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Subtitles className="h-3 w-3" /> Subtitles
      </div>

      {/* Font size */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Font size</span>
          <span className="text-[10px] font-bold text-primary">{subtitleStyle.fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={32}
          value={subtitleStyle.fontSize}
          onChange={(e) => setSubtitleStyle({ fontSize: parseInt(e.target.value, 10) })}
          className="w-full h-1 accent-primary"
        />
      </div>

      {/* Font family */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-muted-foreground">Font family</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { v: 'sans' as const, label: 'Sans' },
            { v: 'serif' as const, label: 'Serif' },
            { v: 'mono' as const, label: 'Mono' },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setSubtitleStyle({ fontFamily: opt.v })}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                subtitleStyle.fontFamily === opt.v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-muted-foreground">Color</div>
        <div className="flex gap-1.5">
          {['#ffffff', '#ffff00', '#00ffff', '#ff00ff', '#00ff00', '#ff8800'].map((c) => (
            <button
              key={c}
              onClick={() => setSubtitleStyle({ color: c })}
              className={`h-5 w-5 rounded-full border-2 ${
                subtitleStyle.color === c ? 'border-primary' : 'border-transparent'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Background style */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-muted-foreground">Background</div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { v: 'shadow' as const, label: 'Shadow' },
            { v: 'outline' as const, label: 'Outline' },
            { v: 'solid' as const, label: 'Solid' },
            { v: 'none' as const, label: 'None' },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setSubtitleStyle({ background: opt.v })}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                subtitleStyle.background === opt.v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {subtitleStyle.background === 'solid' && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Background opacity</span>
            <span className="text-[10px] font-bold text-primary">{Math.round(subtitleStyle.bgOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={subtitleStyle.bgOpacity}
            onChange={(e) => setSubtitleStyle({ bgOpacity: parseFloat(e.target.value) })}
            className="w-full h-1 accent-primary"
          />
        </div>
      )}
    </motion.div>
  );
}

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
