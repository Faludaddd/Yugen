'use client';

/**
 * GenreRail — Miruro-style horizontal scrollable genre buttons with masked edges.
 *
 * Each genre has its own hover color (Action=red, Comedy=pink, etc.) per Miruro's spec.
 * Active genre highlighted with primary accent.
 */

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GenreRailProps {
  genres: string[];
  activeGenre: string | null;
  onGenreChange: (g: string | null) => void;
}

// Per-genre hover colors from Miruro spec
const GENRE_COLORS: Record<string, string> = {
  Action: '#FF4500',
  Adventure: '#FFD700',
  Comedy: '#FF69B4',
  Drama: '#FF6347',
  Ecchi: '#FF00FF',
  Fantasy: '#8A2BE2',
  Horror: '#DC143C',
  'Mahou Shoujo': '#FF1493',
  Mecha: '#00CED1',
  Music: '#1E90FF',
  Mystery: '#9400D3',
  Psychological: '#FF8C00',
  Romance: '#FF69B4',
  'Sci-Fi': '#00FF7F',
  'Slice of Life': '#32CD32',
  Sports: '#1E90FF',
  Supernatural: '#FF00FF',
  Thriller: '#FF6347',
};

export function GenreRail({ genres, activeGenre, onGenreChange }: GenreRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center px-2 py-3">
      <button
        onClick={() => scrollBy(-300)}
        aria-label="Scroll left"
        className="absolute left-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="rail-mask scrollbar-none flex w-full gap-2 overflow-x-auto px-5"
      >
        <button
          onClick={() => onGenreChange(null)}
          className={`genre-btn ${activeGenre === null ? 'active' : ''}`}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => onGenreChange(g === activeGenre ? null : g)}
            className={`genre-btn ${g === activeGenre ? 'active' : ''}`}
            style={{ ['--genre-hover-color' as string]: GENRE_COLORS[g] ?? '#b5a8ff' }}
          >
            {g}
          </button>
        ))}
      </div>

      <button
        onClick={() => scrollBy(300)}
        aria-label="Scroll right"
        className="absolute right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
