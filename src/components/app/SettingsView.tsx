'use client';

/**
 * SettingsView — app-style settings screen.
 *
 * Sections:
 *   - Playback (default audio, quality, speed, autoplay next, skip intro/outro, hw accel)
 *   - Display (poster size, show filler, hide spoilers)
 *   - Data (low data mode, clear cache)
 *   - About (version, source, credits)
 */

import { useSettings, type AudioMode, type Quality } from '@/lib/settings';
import { motion } from 'framer-motion';
import {
  Volume2,
  Gauge,
  Play,
  SkipForward,
  SkipBack,
  Cpu,
  Layout,
  Eye,
  EyeOff,
  Wifi,
  Trash2,
  Info,
  Heart,
  Github,
  ChevronRight,
  PictureInPicture2,
  FastForward,
  Hand,
  Type,
  Repeat,
} from 'lucide-react';

export function SettingsView() {
  const s = useSettings();

  return (
    <div className="space-y-6 pb-6">
      {/* ── Playback ── */}
      <Section title="Playback" icon={<Play className="h-4 w-4" />}>
        {/* Default audio */}
        <Row label="Default audio" desc="Sub or Dub when starting an episode">
          <SegmentedControl
            value={s.defaultAudio}
            onChange={(v) => s.setDefaultAudio(v as AudioMode)}
            options={[
              { value: 'sub', label: 'Sub' },
              { value: 'dub', label: 'Dub' },
            ]}
          />
        </Row>

        {/* Default quality */}
        <Row label="Default quality" desc="Preferred video resolution">
          <SelectInput
            value={s.defaultQuality}
            onChange={(v) => s.setDefaultQuality(v as Quality)}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: '1080p', label: '1080p' },
              { value: '720p', label: '720p' },
              { value: '480p', label: '480p' },
              { value: '360p', label: '360p' },
            ]}
          />
        </Row>

        {/* Default speed */}
        <Row label="Playback speed" desc={`Default: ${s.defaultPlaybackSpeed}×`}>
          <SelectInput
            value={String(s.defaultPlaybackSpeed)}
            onChange={(v) => s.setDefaultPlaybackSpeed(parseFloat(v))}
            options={[
              { value: '0.5', label: '0.5×' },
              { value: '0.75', label: '0.75×' },
              { value: '1', label: '1× (Normal)' },
              { value: '1.25', label: '1.25×' },
              { value: '1.5', label: '1.5×' },
              { value: '2', label: '2×' },
            ]}
          />
        </Row>

        {/* Autoplay next */}
        <ToggleRow
          icon={<SkipForward className="h-4 w-4" />}
          label="Autoplay next episode"
          desc="Automatically play the next episode when current ends"
          value={s.autoplayNext}
          onChange={s.setAutoplayNext}
        />

        {/* Skip intro */}
        <ToggleRow
          icon={<SkipBack className="h-4 w-4" />}
          label="Show skip intro button"
          desc="Display a skip-intro button during opening"
          value={s.skipIntro}
          onChange={s.setSkipIntro}
        />

        {/* Skip outro */}
        <ToggleRow
          icon={<SkipForward className="h-4 w-4" />}
          label="Show skip outro button"
          desc="Display a skip-outro button during ending"
          value={s.skipOutro}
          onChange={s.setSkipOutro}
        />

        {/* HW accel */}
        <ToggleRow
          icon={<Cpu className="h-4 w-4" />}
          label="Hardware acceleration"
          desc="Use native HLS playback when available (Safari)"
          value={s.hwAccel}
          onChange={s.setHwAccel}
        />

        {/* PiP */}
        <ToggleRow
          icon={<PictureInPicture2 className="h-4 w-4" />}
          label="Picture-in-Picture"
          desc="Show PiP button to watch while browsing"
          value={s.pipMode}
          onChange={s.setPipMode}
        />

        {/* Hold for 2x */}
        <ToggleRow
          icon={<FastForward className="h-4 w-4" />}
          label="Hold for 2× speed"
          desc="Press and hold the player to temporarily play at 2×"
          value={s.holdFor2x}
          onChange={s.setHoldFor2x}
        />

        {/* Swipe gestures */}
        <ToggleRow
          icon={<Hand className="h-4 w-4" />}
          label="Swipe gestures"
          desc="Swipe horizontally to seek, vertically (right side) for volume"
          value={s.swipeGestures}
          onChange={s.setSwipeGestures}
        />
      </Section>

      {/* ── Display ── */}
      <Section title="Display" icon={<Layout className="h-4 w-4" />}>
        <Row label="Poster size" desc="Size of anime posters in grids">
          <SegmentedControl
            value={s.posterSize}
            onChange={(v) => s.setPosterSize(v as 'compact' | 'comfortable' | 'large')}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Normal' },
              { value: 'large', label: 'Large' },
            ]}
          />
        </Row>

        <ToggleRow
          icon={<Eye className="h-4 w-4" />}
          label="Show filler episodes"
          desc="Mark filler episodes in episode lists"
          value={s.showFillerEpisodes}
          onChange={s.setShowFillerEpisodes}
        />

        <ToggleRow
          icon={<EyeOff className="h-4 w-4" />}
          label="Hide spoilers in synopsis"
          desc="Blur synopsis text until tapped"
          value={s.hideSpoilersInSynopsis}
          onChange={s.setHideSpoilersInSynopsis}
        />

        <ToggleRow
          icon={<Type className="h-4 w-4" />}
          label="Marquee long titles"
          desc="Scroll long anime titles in the player"
          value={s.marqueeTitles}
          onChange={s.setMarqueeTitles}
        />
      </Section>

      {/* ── Continue Watching ── */}
      <Section title="Continue Watching" icon={<Repeat className="h-4 w-4" />}>
        <Row
          label="Clear watch progress"
          desc={s.watchProgress.length > 0 ? `${s.watchProgress.length} episodes tracked` : 'No progress yet'}
        >
          {s.watchProgress.length > 0 ? (
            <button
              onClick={s.clearAllProgress}
              className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:text-[var(--destructive)]"
            >
              Clear
            </button>
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">—</span>
          )}
        </Row>
      </Section>

      {/* ── Data ── */}
      <Section title="Data" icon={<Wifi className="h-4 w-4" />}>
        <ToggleRow
          icon={<Wifi className="h-4 w-4" />}
          label="Low data mode"
          desc="Use smaller images and disable autoplay"
          value={s.useLowDataMode}
          onChange={s.setUseLowDataMode}
        />
        <Row label="Clear cache" desc="Force re-fetch of anime catalog from AniList">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                // Clear our search cache keys (the AniList cache is server-side,
                // but we can also clear localStorage browser cache)
                localStorage.removeItem('anistream-anilist-cache');
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </Row>
      </Section>

      {/* ── Recent activity ── */}
      <Section title="Recent activity" icon={<Info className="h-4 w-4" />}>
        <Row
          label="Recent searches"
          desc={s.recentSearches.length > 0 ? `${s.recentSearches.length} saved` : 'None yet'}
        >
          {s.recentSearches.length > 0 ? (
            <button
              onClick={s.clearRecentSearches}
              className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:text-[var(--destructive)]"
            >
              Clear
            </button>
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">—</span>
          )}
        </Row>
        <Row
          label="Recently viewed"
          desc={s.recentAnimeIds.length > 0 ? `${s.recentAnimeIds.length} anime` : 'None yet'}
        >
          {s.recentAnimeIds.length > 0 ? (
            <button
              onClick={s.clearRecentAnime}
              className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:text-[var(--destructive)]"
            >
              Clear
            </button>
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">—</span>
          )}
        </Row>
      </Section>

      {/* ── About ── */}
      <Section title="About" icon={<Heart className="h-4 w-4" />}>
        <Row label="App name" desc="Yugen (幽玄)">
          <span className="text-xs text-[var(--muted-foreground)]">v1.0.0</span>
        </Row>
        <Row label="Data source" desc="AniList GraphQL API">
          <span className="text-xs text-[var(--muted-foreground)]">Live</span>
        </Row>
        <Row label="Made with" desc="Next.js + Tailwind + hls.js">
          <Heart className="h-3.5 w-3.5" style={{ color: 'var(--status-favourite)' }} fill="currentColor" />
        </Row>
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--card)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--secondary)]">
            <Github className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--foreground)]">AniList.co</div>
            <div className="text-xs text-[var(--muted-foreground)]">Open anime database</div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
        </a>
      </Section>

      {/* Footer */}
      <div className="px-4 text-center text-[0.7rem] text-[var(--muted-foreground)]">
        Made with <Heart className="inline h-2.5 w-2.5" style={{ color: 'var(--status-favourite)' }} fill="currentColor" /> for anime fans.
        <br />
        For educational purposes only. Support official releases.
      </div>
    </div>
  );
}

// ─── Reusable building blocks ─────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        {icon}
        {title}
      </h2>
      <div
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[0.9rem] font-medium text-[var(--foreground)]">{label}</div>
        {desc && (
          <div className="mt-0.5 text-[0.7rem] text-[var(--muted-foreground)]">{desc}</div>
        )}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <Row label={label} desc={desc}>
      <button
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        className="relative h-6 w-11 rounded-full transition-colors"
        style={{
          background: value ? 'var(--primary)' : 'var(--secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <motion.div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md"
          animate={{ left: value ? '1.5rem' : '0.125rem' }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        />
      </button>
    </Row>
  );
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div
      className="flex overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--secondary)]"
      style={{ borderRadius: 'calc(var(--radius) - 4px)' }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="relative px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}
          >
            {active && (
              <motion.div
                layoutId={`seg-${options.map((o) => o.value).join('')}`}
                className="absolute inset-0 rounded-[calc(var(--radius)-4px)]"
                style={{ background: 'var(--primary)' }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
      style={{ borderRadius: 'calc(var(--radius) - 4px)' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[var(--card)] text-[var(--foreground)]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
