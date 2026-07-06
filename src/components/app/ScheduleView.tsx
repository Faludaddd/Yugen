'use client';

/**
 * ScheduleView — real airing schedule from AniList.
 *
 * Fetches currently-releasing anime and their nextAiringEpisode data,
 * then groups them by day of week (user's local timezone).
 *
 * Features:
 *   - Day-of-week selector (horizontal pills, today highlighted)
 *   - Per-day list of upcoming episodes
 *   - Each row: poster, title, episode number, airing time + countdown
 *   - "Already aired" episodes shown with muted styling
 *   - Empty state for days with no episodes
 */

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Anime } from '@/lib/streaming/types';

interface ScheduleEntry {
  anime: Anime;
  episode: number;
  airingAt: string; // ISO date string
  timeUntilAiring: number; // seconds
  hasAired: boolean;
}

interface ScheduleDay {
  date: string; // ISO date
  dayName: string;
  entries: ScheduleEntry[];
}

interface ScheduleViewProps {
  onSelect: (a: Anime) => void;
}

export function ScheduleView({ onSelect }: ScheduleViewProps) {
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Tick every minute so countdowns update
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Load schedule
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/anime?section=schedule', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.days && Array.isArray(data.days)) {
          setDays(data.days);
          // Pick "today" if available, else first day
          const todayStr = new Date().toDateString();
          const todayIdx = data.days.findIndex(
            (d: ScheduleDay) => new Date(d.date).toDateString() === todayStr
          );
          setSelectedDayIdx(todayIdx >= 0 ? todayIdx : 0);
        } else {
          setError('No schedule data available');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load schedule');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 w-16 flex-shrink-0 animate-pulse rounded-lg bg-[var(--secondary)]" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-12 flex-shrink-0 animate-pulse rounded bg-[var(--secondary)]" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--secondary)]" />
              <div className="h-2 w-1/3 animate-pulse rounded bg-[var(--secondary)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-amber-400 opacity-60" />
        <div className="mb-1 text-base font-semibold">Couldn&apos;t load schedule</div>
        <div className="text-sm text-[var(--muted-foreground)]">{error}</div>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="mb-3 h-10 w-10 text-[var(--muted-foreground)] opacity-40" />
        <div className="mb-1 text-base font-semibold">No upcoming episodes</div>
        <div className="text-sm text-[var(--muted-foreground)]">
          No anime are scheduled to air in the next 7 days.
        </div>
      </div>
    );
  }

  const selectedDay = days[selectedDayIdx] ?? days[0];
  const todayStr = new Date().toDateString();
  const isToday = new Date(selectedDay.date).toDateString() === todayStr;

  return (
    <div className="space-y-4">
      {/* Day selector — horizontal pills */}
      <div className="-mx-3 flex gap-1.5 overflow-x-auto scrollbar-none px-3 pb-1">
        {days.map((day, idx) => {
          const date = new Date(day.date);
          const dayToday = date.toDateString() === todayStr;
          const active = idx === selectedDayIdx;
          return (
            <button
              key={day.date}
              onClick={() => setSelectedDayIdx(idx)}
              className="relative flex min-w-[3.5rem] flex-col items-center rounded-xl border px-3 py-2 transition-all"
              style={{
                background: active ? 'var(--primary)' : 'var(--secondary)',
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
              }}
            >
              <span className="text-[0.65rem] font-bold uppercase opacity-80">
                {day.dayName}
              </span>
              <span className="text-base font-bold leading-tight">
                {date.getDate()}
              </span>
              {dayToday && (
                <span
                  className="absolute -top-1 h-2 w-2 rounded-full"
                  style={{
                    // Always render the today dot, regardless of selection
                    background: active ? 'var(--primary-foreground)' : 'var(--primary)',
                    boxShadow: active ? 'none' : '0 0 0 2px var(--background)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">
            {isToday ? 'Today' : selectedDay.dayName}
            {', '}
            {new Date(selectedDay.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {selectedDay.entries.length}{' '}
            {selectedDay.entries.length === 1 ? 'episode' : 'episodes'} airing
          </p>
        </div>
      </div>

      {/* Episode list for selected day */}
      <div className="space-y-2">
        {selectedDay.entries.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-8 text-center text-sm text-[var(--muted-foreground)]">
            No episodes airing this day.
          </div>
        ) : (
          selectedDay.entries.map((entry, i) => {
            const airingAt = new Date(entry.airingAt);
            const timeStr = airingAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
            const secondsLeft = Math.max(0, entry.timeUntilAiring - Math.floor((now - Date.now()) / 1000));
            const countdown = formatCountdown(secondsLeft);
            const animeColor = entry.anime.color || '#b5a8ff';

            return (
              <motion.button
                key={`${entry.anime.id}-${entry.episode}`}
                onClick={() => onSelect(entry.anime)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-[var(--card)] p-2.5 text-left transition-all hover:border-[var(--border)] hover:bg-[var(--secondary)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                {/* Poster */}
                <div
                  className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-[var(--secondary)]"
                  style={{ border: `2px solid ${animeColor}33` }}
                >
                  {entry.anime.posterUrl && (
                    <img
                      src={entry.anime.posterUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Title + meta */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                    {entry.anime.titleEnglish || entry.anime.titleRomaji}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <span
                      className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold"
                      style={{ background: `${animeColor}22`, color: animeColor }}
                    >
                      EP {entry.episode}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {timeStr}
                    </span>
                  </div>
                </div>

                {/* Countdown / status */}
                <div className="flex-shrink-0 text-right">
                  {entry.hasAired ? (
                    <span className="text-[0.65rem] font-medium text-[var(--muted-foreground)]">
                      Aired
                    </span>
                  ) : (
                    <div>
                      <div className="text-[0.65rem] uppercase tracking-wider text-[var(--muted-foreground)]">
                        in
                      </div>
                      <div
                        className="text-[0.75rem] font-bold"
                        style={{ color: animeColor }}
                      >
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Now';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
