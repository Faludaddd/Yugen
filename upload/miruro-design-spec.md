# Miruro.tv — UI/UX Design Specification

> Reverse-engineered from `Miruro · Watch Free Anime Online · Stream Subbed & Dubbed Anime in HD.mht`
> Source: `https://www.miruro.tv/` · Version `v1.12.1`
> Reference images extracted to `/home/z/my-project/upload/miruro-extracted/`

---

## 1. Overview

Miruro is a **dark-mode-first anime streaming site** built with React + Vite (Rolldown runtime) and **Swiper.js** for carousels. The design language is **dark, minimal, glassmorphic** with a signature **lavender-purple accent (`#b5a8ff`)**. The homepage is laid out as a single column capped at **109 rem (~1744 px)**, with a fixed translucent top navbar, a hero carousel of full-bleed banner art, a horizontally-scrolling genre rail, a "continue watching" rail of 16:9 thumbnails, and then a two-column layout: a paginated poster-card grid (NEWEST / POPULAR / TOP RATED) on the left and a sidebar of "TOP AIRING / JUST FINISHED / TOP MOVIES" list cards on the right. Visual polish comes from **per-anime accent colors** (every title gets its own pastel hue that drives gradients, hover states, and list buttons), a **multi-direction dark gradient overlay** on hero slides, **backdrop-blur glassmorphism** on action buttons and pagination chips, and **subtle `animFadeIn`/`animSlideUp`** entrance animations.

---

## 2. Color Palette

### Dark-mode (default — site uses `class="dark-mode"` on `<html>`)

| Token                          | Value                                | Usage                                                |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| `--global-primary-bg`          | `#080808`                            | Page background (near-black)                         |
| `--global-primary-bg-tr`       | `rgba(8, 8, 8, .9)`                  | Translucent page bg (navbar, modals)                 |
| `--global-secondary-bg`        | `#141414`                            | Secondary surface                                    |
| `--global-tertiary-bg`         | `#222222`                            | Tertiary surface                                     |
| `--global-div`                 | `#141414`                            | Card / button background                             |
| `--global-div-tr`              | `#0e0e0e`                            | Translucent card bg                                  |
| `--global-div-tr-2`            | `rgba(14, 14, 14, .3)`               | More translucent overlay (hero chips, action btns)   |
| `--global-card-bg`             | `#181818`                            | Solid card bg                                        |
| `--global-card-title-bg`       | `#151515`                            | Card title hover strip                               |
| `--global-text`                | `#e8e8e8`                            | Primary text                                         |
| `--global-text-muted`          | `#696969`                            | Secondary / muted text                               |
| `--global-text-muted-strong`   | `#a8a8a8`                            | Strong muted text                                    |
| `--global-border-color`        | `rgba(245, 245, 245, .1)`            | Subtle white border on dark                          |
| `--global-shadow`              | `rgba(0, 0, 0, .6)`                  | Card / dropdown shadows                              |
| `--global-button-bg`           | `#202020`                            | Solid button bg                                      |
| `--global-button-hover-bg`     | `#292929`                            | Button hover                                         |
| `--global-button-text`         | `#ebebeb`                            | Button text                                          |
| `--global-primary-skeleton`    | `rgba(85, 85, 85, .1)`               | Loading skeleton base                                |
| `--global-secondary-skeleton`  | `rgba(85, 85, 85, .3)`               | Loading skeleton shimmer                             |

### Brand / accent

| Token                       | Value                            | Usage                                                  |
| --------------------------- | -------------------------------- | ------------------------------------------------------ |
| `--primary-accent`          | `#b5a8ff` (lavender)             | Links, active tab text, focus rings, selection color   |
| `--primary-accent-bg`       | `#595991` (muted purple)         | Selection background                                   |
| `--primary-accent-tr`       | `rgba(128, 128, 207, .25)`       | Active tab background, hover chips                     |
| `--primary-accent-dk-tr`    | `rgba(128, 128, 207, .1)`        | Subtle accent overlays                                 |

### Status colors (also used as indicator dots on cards)

| Token                | Value      | Meaning                            |
| -------------------- | ---------- | ---------------------------------- |
| `--ongoing`          | `#aaff00`  | Releasing / ongoing (lime)         |
| `--completed`        | `#00aaff`  | Finished (cyan)                    |
| `--cancelled`        | `#ff0000`  | Cancelled (red)                    |
| `--not-yet-aired`    | `#ffa500`  | Not yet aired (orange)             |
| `--favourite`        | `#e85d8a`  | Favourite (pink)                   |
| `--favourite-bg`     | `rgba(232, 93, 138, .1)` | Favourite bg chip     |

### Banner / social brand colors

| Source                       | Color      |
| ---------------------------- | ---------- |
| Bookmark Miruro banner       | `#d4a017` (gold) |
| Discord banner / link        | `#5865F2` (blurple) |
| Reddit social                | `#ff4500`  |
| Twitter / X                  | (inherits) |

### Per-anime accent (driven inline by `--side-list-accent`, `--card-title-hover-color`, `--card-image-hover-color`, `--list-button-accent`, `--home-carousel-title-color`)

Sampled from the homepage (one color per anime, assigned by the backend):

```
#28bbe4  #e49335  #50a1f1  #435dff  #fe5093  #f1bb50
#5daee4  #1abbd6  #5daed6  #0d8693  ...
```

Hero titles use this as the start color of a `linear-gradient(45deg, <color>, white)` clipped to text.

### Genre button hover colors (one per genre)

```
Action #FF4500  Adventure #FFD700   Comedy #FF69B4   Drama #FF6347
Ecchi  #FF00FF  Fantasy  #8A2BE2    Horror #DC143C   Mahou Shoujo #FF1493
Mecha  #00CED1  Music    #1E90FF    Mystery #9400D3  Psychological #FF8C00
Romance #FF69B4 Sci-Fi  #00FF7F    Slice of Life #32CD32  Sports #1E90FF
Supernatural #FF00FF   Thriller #FF6347
```

### Other themes (defined but **dark-mode is default**)

- `light-mode` — `#f5f5f5` page bg, `#333` text
- `anilist-mode` — `rgb(11,22,34)` deep navy
- `catppuccin-mode` — `#1e1e2e` mocha

---

## 3. Typography

- **Font family:** `"Geist", ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, …` (self-hosted at `/fonts/geist/sans/Geist[wght].woff2`).
- **Monospace:** `"Geist Mono", monospace` (for `<pre>`/`<code>`).
- **Base body font size:** browser default (16 px) — no explicit `font-size` on `html`/`body`; smaller text uses `rem` fractions.
- **Body line-height:** default (`1.5` from Geist).
- **Headings:** no global heading scale — sizes are set per-component:

| Element / class                         | Size                                  | Weight |
| ---------------------------------------- | ------------------------------------- | ------ |
| Logo "MIRURO" (`_logoWrapper_1dhmn_55`)  | `1.5rem`                              | 700    |
| Hero slide title (`_slideTitleText_1c8fj_128`) | `clamp(1.4rem, 3vw, 2.5rem)`    | 700    |
| Sidebar list header (`_listHeader_6sw3k_11`)   | `1.1rem`                        | 700    |
| Drawer header (`_header_8assr_31`)       | `1.3rem`                              | 700    |
| Card title — medium (`_titleMedium_5iwv2_50`) | `0.83rem` (desktop) / `0.7rem` (mobile) | 500 |
| Hero info chip (`_slideInfoItem_1c8fj_176`)   | `clamp(0.75rem, 1.2vw, 0.9rem)` | 500    |
| Card detail pill (`_cardDetail_eylnt_77`)      | `0.75rem` desktop / `0.625rem` mobile | 700 |
| Card EP label (`_cardLabel_1wtl4_82`)    | `0.7rem`                              | 700    |
| Tab button (`_tab_g07cj_7`)              | `0.8rem`                              | 500    |
| Genre button (`_genreButton_8m5e1_38`)   | `0.8rem`                              | 500    |
| Search input                             | `0.85rem`                             | —      |
| Hero action button (`_slideActionButton_1c8fj_190`) | `1rem`                  | 700    |
| Footer link                              | `0.9rem`                              | —      |

---

## 4. Layout Structure (top to bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ <html class="dark-mode" style="--primary-accent: #b5a8ff…"> │
│   body { max-width: 109rem; margin: 0 auto;                 │
│           padding: 4.5rem 0.6rem 1em; }                     │
│                                                             │
│  ┌─ .shell (flex column, min-h-100svh) ──────────────────┐  │
│  │ ┌─ NAVBAR (fixed, top, translucent) ────────────────┐ │  │
│  │ │ [☰] [MIRURO logo]   [🔍 Search Anime]   [🔔][👤]  │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ DRAWER (slides from left, 300px) ─────────────────┐ │  │
│  │ │ Header · NavList: Home/Trending/Schedule/History   │ │  │
│  │ │ Info row · Theme row · Bottom                       │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ Banner stack (.stack) ────────────────────────────┐ │  │
│  │ │  ⚠ Bookmark Miruro so you never lose us  [miruro.com] │  │
│  │ │  💬 Join the Discord community            [Join]       │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ HERO CAROUSEL (.carouselWrapper, h:30rem) ────────┐ │  │
│  │ │ [EP 3 5D 21H]                            [1 / 10]  │ │  │
│  │ │   full-bleed banner image, 3-way dark gradient     │ │  │
│  │ │                                                     │ │  │
│  │ │   [TV] [📺14] [⭐86] [⏱24 mins]                      │ │  │
│  │ │   <gradient title text>                             │ │  │
│  │ │   Adventure · Drama · Ecchi  ·  Studio Bind         │ │  │
│  │ │   <3-line synopsis>                                 │ │  │
│  │ │                       [DETAILS]  [WATCH NOW]        │ │  │
│  │ │ < [>]                                          [>] >│ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ GENRE RAIL (.slider, h-scroll) ───────────────────┐ │  │
│  │ │ [Action][Adventure][Comedy][Drama]…(20 genres)     │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ "Your Watchlist" rail (16:9 cards) ───────────────┐ │  │
│  │ │ [card][card][card][card] [View More]               │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ .contentSidebarLayout (row ≥1000px, col below) ───┐ │  │
│  │ │ ┌─ MAIN ─────────┐  ┌─ SIDEBAR ────────────────┐   │ │  │
│  │ │ │ Notice section │  │ TOP AIRING (list cards)  │   │ │  │
│  │ │ │ Tabs: NEWEST / │  │ JUST FINISHED (list)     │   │ │  │
│  │ │ │  POPULAR /     │  │ TOP MOVIES (list)        │   │ │  │
│  │ │ │  TOP RATED     │  │                          │   │ │  │
│  │ │ │ [page ≤ 1]     │  │                          │   │ │  │
│  │ │ │ ┌─Card grid──┐ │  │                          │   │ │  │
│  │ │ │ │ poster ×N  │ │  │                          │   │ │  │
│  │ │ │ └────────────┘ │  │                          │   │ │  │
│  │ │ └────────────────┘  └──────────────────────────┘   │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ ┌─ FOOTER ───────────────────────────────────────────┐ │  │
│  │ │ [logo] This website does not retain any files…     │ │  │
│  │ │ Trending · Search · Schedule · Domains · Status    │ │  │
│  │ │ © 2026 miruro.com | Website by Miruro no Kuon v1.12.1 │  │
│  │ │ [social icons] [theme switcher]                    │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Body / shell

- `body` — `max-width: 109rem` (~1744 px), `padding: 4.5rem 0.6rem 1em` (top padding = navbar height)
- Mobile (`≤500px`) — `padding: 4rem 0.5rem 0`
- `.shell` — `display: flex; flex-direction: column; min-height: 100svh`
- `.shell .otc` (main wrapper) — `flex: 1 1 auto`
- Background: `var(--global-primary-bg)` = `#080808`

### Z-index scale (defined in `:root`)

```
below -1 · base 0 · above 1 · sticky 10 · content 100 · loading 200
dropdown 300 · tooltip 400 · popover 500 · navbar 600 · mobile-menu 700
modal-backdrop 800 · sidebar 900 · modal 1000 · popup 1100 · max 9999
```

---

## 5. Navigation

### Top navbar (`._navbar_1dhmn_1`)

- `position: fixed; top: 0; left: 0; right: 0; z-index: 600`
- `padding: 0.6rem`
- Background: `var(--global-div-tr)` (= `#0e0e0e`, near-opaque)
- Border-bottom: `1px solid var(--global-border-color)`
- When `data-scrolled="true"` → `box-shadow: 0 10px 20px var(--global-shadow)`
- On mobile (`≤700px`) → bg becomes `var(--global-primary-bg)`, padding `1rem 0.5rem`, no bottom border

### Navbar layout (`._topContainer_1dhmn_40`)

`display: flex; gap: 0.5rem; align-items: center; justify-content: space-between`

- **Left group** (`._leftGroup_1dhmn_47`, height `2rem`):
  - Hamburger button (`.navButton`, `1.2rem` icon)
  - Logo: `<a class="_logoWrapper_1dhmn_55"><img class="_logoImg_1dhmn_78"></a>` — text "MIRURO" rendered from a transparent PNG (`--logo-text-transparent: url(/assets/transparent-white-DRs0RmF1.png)`), `width: 7rem`. Hover → `color: var(--primary-accent)`, scale `0.95`.
- **Center** (`._searchSection_1dhmn_92`, `flex: 1 1 0%`, `max-width: 35rem`):
  - Search input container (`._inputContainer_1dhmn_100`) — `padding: 0.6rem`, `bg: var(--global-div)`, `border: 1px solid var(--global-border-color)`, `border-radius: var(--global-border-radius)`. Contains:
    - Search icon (left, `font-size: 1.2rem`, opacity `0.5` → `1` on focus)
    - `<input>` placeholder `"Search Anime"`, `font-size: 0.85rem`, no border, transparent bg
    - Hidden dropdown container (`._container_9iqh4_1`) for results — `position: absolute; top: calc(100% + 0.5rem)`, opens with `max-height: 500px`, shows keyboard-shortcut hints ("↑↓ to navigate, ↵ to select, Esc to exit") and a `VIEW ALL` item
  - Hidden on mobile (`≤500px`) unless `data-visible="true"`
- **Right group** (`._actionButtons_1dhmn_48`): two square `navButton`s — notification bell + profile. Each: `padding: 1.2rem 0.6rem`, `font-size: 1.2rem`, `bg: var(--global-div)`, `border: 1px solid var(--global-border-color)`, `border-radius: var(--global-border-radius)`. Press → `scale(0.9)`.
- **Right dropdown menu** (`#rightDropdownMenu`): opens below profile button — `width: 12.5rem`, contains "Log in with [AniList] [MAL]" buttons, then Profile / Settings / History links with icons. `box-shadow: 0 8px 16px rgba(0,0,0,0.3)`.

### Drawer (left sidebar) (`._drawer_8assr_1`)

- `position: fixed; top: 0; left: 0; z-index: 900; width: 300px; height: 100%`
- `bg: var(--global-div-tr)`; `box-shadow: -2px 0 5px rgba(0,0,0,0.3)`
- Closed: `transform: translate(-100%); pointer-events: none`
- Open: `transform: translate(0)`
- Mobile (`≤700px`): `width: 100%` (full-width overlay)
- `transition: transform 0.4s`

Drawer contents:

1. **Header** (`._header_8assr_31`) — `padding: 0.725rem`, `font-size: 1.3rem`, `font-weight: 700`, with close button
2. **NavList** (`._navList_8assr_108`) — `flex column; gap: 0.5rem; padding: 0.5rem`. Items: Home, Trending, Schedule, History. Each `navItem` is `<a>` with icon (`1em`) + text (`_navItemText_8assr_155`: `font-size: 1rem; font-weight: 500; max-width: 150px`). Active item has `.active` class.
3. **InfoRow** — Status link · Domains link · version `v1.12.1`
4. **ThemeRow** — segmented theme picker (dark / light / anilist / catppuccin)
5. **BottomSection** — `border-top: 1px solid var(--global-border-color); padding: 0.5rem`

### Footer

Two stacked `_footerBaseContainer_1yuuo_18` blocks:

- **Main footer** (`data-sub="false"`, `padding: 1rem 0 0.5rem`):
  - Footer logo (masked `.app-icon` via `mask-image: var(--logo)`, `max-width: 4.375rem`)
  - Disclaimer: "This website does not retain any files on its server…"
  - Link list 1 ("Browse"): Trending · Search · Schedule
  - Link list 2: Domains · Status
- **Sub footer** (`data-sub="true"`, `border-top: .125rem solid var(--global-secondary-bg)`):
  - `© 2026 miruro.com | Website by Miruro no Kuon v1.12.1`
  - Social icons (Discord `#5865f2`, Reddit `#ff4500`, X/Twitter) — each `border-radius: 50%`, `padding: 0.5rem`, `bg: var(--global-div)`
  - Theme switcher

Footer links: `font-size: 0.9rem; color: var(--global-text-muted)`; hover → `var(--global-button-text)`.

---

## 6. Anime Card Design

The site uses **two card variants**:

### Variant A — Poster card (used in main grid) — `._styledCardItem_5iwv2_1`

Vertical 2:3 portrait card (matches AniList poster ratio `460×650` → CSS uses `padding-top: calc(138.346%)`).

```
┌──────────────────────┐  ← _animeImage_eylnt_19 (padding-top: 138.346%)
│   poster image        │     border-radius: var(--global-border-radius)
│                       │     bg: transparent
│   [edit-list btn]  →  │  ← _listButtonContainer_5iwv2_61 (top-right, hover-only)
│                       │
│                       │
└──────────────────────┘
● Title text here       ← _titleContainer_5iwv2_11 (padding 0.4rem 0.3rem)
  [TV] [2026] [1 ep]    ← _cardDetails_eylnt_77 (small pills)
```

**Hover/focus behaviour:**

- Image wrapper (`._imageWrapper_eylnt_34`) `:hover`:
  - `filter: brightness(0.5)` on the `<img>`
  - A center play icon (`.playIcon_eylnt_62`) appears: `opacity: 0 → 1`, `transform: translate(-50%,-50%) scale(1)` (from `scale(0.x)`)
  - Color tint from inline `--card-image-hover-color` (per-anime)
  - `._imageDisplayWrapper_eylnt_10:hover` → `transform: translateY(-5px)`
- Card title (`._title_5iwv2_11`) → color = `--card-title-hover-color` (per-anime), title container bg = `--global-card-title-bg`
- Edit-list button (`._editListButton_qaxcl_1`) appears: `opacity: 0 → 1`, `transform: scale(0.85) → scale(1)`. Position `top: 0.25rem; right: 0.25rem`. Bg: `var(--global-div-tr)` + `backdrop-filter: blur(10px)`. Border hover = `--list-button-accent` (per-anime).

**Title row** (`._titleContainer_5iwv2_11`): `display: flex; gap: 0.4rem; align-items: center; padding: 0.4rem 0.3rem`.

- **Status indicator dot** (`._indicatorDot_17f3f_1`): `width/height: 0.5rem; border-radius: 50%` — colored by status:
  - `._ongoing_17f3f_16` → `bg: var(--ongoing)` (#aaff00 lime)
  - `._notYetAired_17f3f_28` → `bg: var(--not-yet-aired)` (#ffa500 orange)
  - (also: `._completed_17f3f_*` → cyan, `._cancelled_*` → red)
- **Title text** (`._title_5iwv2_11`): `font-size: 0.83rem` desktop / `0.7rem` mobile; `font-weight: 500`; `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. Has `title="Title: <name>"` attribute.

**Card details** (`._cardDetails_eylnt_77`): horizontal scroll row of small pills.

- `font-size: 0.75rem` desktop / `0.625rem` mobile; `font-weight: 700`; `color: var(--global-text-muted)`
- Each pill (`._cardDetail_eylnt_77`): `padding: 0.2rem; gap: 0.2rem; bg: var(--global-div); border-radius: var(--global-border-radius)`
- Typical content: format (TV / ONA / MOVIE / SPECIAL / TV_SHORT), year, episode count with icon. Hover → `color: #fff`.
- `._cardDetail_eylnt_77._hideOnMobile_eylnt_110.hide-on-mobile` — extra detail hidden on mobile.

**Grid** (`._styledCardGrid_1fgxz_1[data-layout="classic"]`):

```
grid-template-columns: repeat(auto-fill, minmax(var(--card-grid-col-*), 1fr));
gap: 2rem  (desktop)
```

`--card-grid-col-*` breakpoints (set inline on the layout container):

| Breakpoint       | Min cell width | Gap   |
| ---------------- | -------------- | ----- |
| default (>1450)  | `10.5rem`      | `2rem` |
| `≤1450px`        | `8.5rem`       | `2rem` |
| `≤1350px`        | `10rem`        | `1.5rem` |
| `≤800px`         | `8rem`         | `1rem`  |
| `≤450px`         | `6.5rem`       | `0.8rem` |

So at full desktop width you get **~10–12 cards per row**; at mobile `≤450px` you get **3 cards per row**.

### Variant B — Continue-watching card (horizontal, in rails) — `._verticalCardShell_1wtl4_51`

Used in "Your Watchlist" / "Watch History" rails. 16:9 landscape.

```
┌────────────────────────┐  ← _cardVerticalWrapper_1wtl4_59 (16:9 image)
│   banner image          │     border-top-left/right-radius: var(--global-border-radius)
│                    [×]  │  ← _cardRemoveButton (top-right, opacity 0.2 → 1)
│ [EP 2]                  │  ← _cardLabel_1wtl4_82 (bottom-left, "EP 2")
│ ━━━━━━━━━░░░░░░░░░░░    │  ← _cardProgressBar (3% progress shown)
└────────────────────────┘
Jaadugar: A Witch in Mongolia  ← _cardTitleBelow_1wtl4_94
```

**Card image** (`._cardImage_1wtl4_43`): `width: 100%; height: 100%; aspect-ratio: 16/9; object-fit: cover`.

**Hover behaviour:**

- Image: `filter: brightness(0.5); transform: scale(1.1)`
- Center play button (`._playButton_1wtl4_1`) appears: `position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0.9) → scale(1)`. Style: `font-size: 2.5rem; color: #fff; border: 2px solid var(--global-border-color); border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3)`.
- Remove button (`._cardRemoveButton_1wtl4_103`): `opacity: 0.2 → 1`, `transform: scale(1)`.

**Card label** (`._cardLabel_1wtl4_82`): `padding: 0.25rem; font-size: 0.7rem; font-weight: 700; color: #fff; bg: rgba(0,0,0,0.75); border-radius: var(--global-border-radius)`. Position: absolute bottom-left of image.

**Progress bar** (`._cardProgressBar_1wtl4_20`): `position: absolute; bottom: -0.05rem; left: 0; height: 0.25rem; width: 100%`. Filled track: `bg: rgba(255,255,255,0.3)`. Playback: `bg: red; width: min(100%, max(5%, <percent>))`.

**Title below** (`._cardTitleBelow_1wtl4_94`): `padding: 0.35rem; font-size: 0.8rem` (mobile `0.75rem`); `font-weight: 500`; `white-space: nowrap; text-overflow: ellipsis`; `bg: var(--global-div-tr)`.

**"View More" tile** at end of rail: `._buttonCard_1ckyp_56`, `_fullHeightSlide_1ckyp_52` — full-height link button labeled `"View More"`.

### Variant C — Sidebar list card (TOP AIRING etc.) — `._sideListCard_6sw3k_38`

Horizontal list item `height: 6rem`:

```
┌──┬─────────────────────────────────────────┐
│pp│  ● Title (2-line clamp)            [+]  │  ← _cardContent_6sw3k_165
│os│  [TV] [📅 2026] [⭐ 86]                  │  ← _sideListCardDetails_6sw3k_124
│te│  ╳▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ (banner img)  │  ← _bannerImageContainer_6sw3k_65 (60% width, grayscale → color on hover)
└──┴─────────────────────────────────────────┘
```

- `position: relative; display: flex; gap: 0.5rem; align-items: center; height: 6rem; bg: var(--global-div); border-radius: var(--global-border-radius)`
- **Banner image** (`._bannerImageContainer_6sw3k_65`): `position: absolute; right: 0; width: 60%; height: 100%; overflow: hidden`. Image: `object-fit: cover; filter: grayscale(100%)` → hover `grayscale(0)`. Gradient overlay (`._gradientOverlay_6sw3k_74`): `linear-gradient(-70deg, transparent -200%, var(--global-div) 80%)`.
- **Cover poster** (`._sideListCoverImage_6sw3k_103`): `width: 4.25rem; height: 6rem; object-fit: cover`. Sits in front of the banner on the left.
- **Title** (`._sideListCardTitle_6sw3k_108`): `-webkit-line-clamp: 2`. Has status indicator dot before it.
- **Details pills** (`._sideListCardDetail_6sw3k_124`): `font-size: 0.75rem; font-weight: 500; bg: var(--global-primary-skeleton); padding: 0.1rem 0.2rem; border-radius: var(--global-border-radius)`. Contains format, year, score.
- **Edit-list button** (`.editListButton`): appears on hover, uses `--side-list-accent` (per-anime).
- **Hover**: `margin-left: 0.35rem` (whole card slides right), `color: var(--side-list-accent)`, `filter: brightness(1.1)`, banner becomes color.
- **Animation**: `animSlideUp` with `animation-delay` per item (staggered).

Sidebar list header (`._listHeader_6sw3k_11`): `font-size: 1.1rem; font-weight: 700; padding: 0.25rem 0 1rem`. Has a small icon before the label.

---

## 7. Hero / Featured Section (`._carouselWrapper_1c8fj_1`)

- `position: relative; max-width: 100%; height: 30rem; overflow: hidden; border-radius: var(--global-border-radius)`
- Responsive heights: `26rem` (≤1000px) → `22rem` (≤800px) → `26rem` (≤500px, taller because of stacked content)
- Powered by **Swiper.js** (`swiper-wrapper`, `swiper-slide`)
- Each slide has a unique anime accent color applied via inline style:
  - `--home-carousel-title-color: #28bbe4` (etc.)
  - `--home-carousel-title-gradient: linear-gradient(45deg, #28bbe4, white)`

### Slide structure

```html
<div class="swiper-slide">
  <div class="_slideImageContainer_1c8fj_51">
    <img class="_slideImageElement_1c8fj_58" src="<banner-1900x400.jpg>"
         style="position:absolute; width:100%; height:100%; object-fit:cover">
    <div class="_slideDarkOverlay_1c8fj_68"></div>  <!-- gradient overlay -->
    <div class="_slideContentContainer_1c8fj_80">
      <div class="_slideContentDetails_1c8fj_88">  <!-- bottom-left, max-width 50% -->
        <div class="_slideDetailsWrapper_1c8fj_169">
          <div class="_slideInfoItem_1c8fj_176">TV</div>
          <div class="_slideInfoItem_1c8fj_176">📺 14</div>
          <div class="_slideInfoItem_1c8fj_176">⭐ 86</div>
          <div class="_slideInfoItem_1c8fj_176">⏱ 24 mins</div>
        </div>
        <div class="_slideTitleText_1c8fj_128"
             style="--home-carousel-title-color: #28bbe4;
                    --home-carousel-title-gradient: linear-gradient(45deg, #28bbe4, white)">
          Mushoku Tensei: Jobless Reincarnation Season 3
        </div>
        <div class="_slideDetailsWrapper_1c8fj_169">
          <div class="_slideInfoItem_1c8fj_176">Adventure · Drama · Ecchi</div>
          <div class="_slideInfoItem_1c8fj_176">Studio Bind</div>
        </div>
        <p class="_slideDescriptionText_1c8fj_139">The third season of Mushoku Tensei…</p>
      </div>
      <div class="_slideActionButtons_1c8fj_190">  <!-- bottom-right -->
        <a class="_slideActionButton_1c8fj_190" href="…/info">DETAILS</a>
        <a class="_slideActionButton_1c8fj_190" href="…/watch">WATCH NOW</a>
      </div>
    </div>
  </div>
</div>
```

### Key slide CSS

- **Dark overlay** (`._slideDarkOverlay_1c8fj_68`) — `position: absolute; inset: 0; pointer-events: none`. Background uses **three stacked linear-gradients** for a soft "vignette from three corners" effect:
  ```css
  background:
    linear-gradient(45deg, var(--global-primary-bg) 5%, transparent 60%),
    linear-gradient(0deg,  var(--global-primary-bg) 1%, transparent 60%),
    linear-gradient(-45deg,var(--global-primary-bg) 5%, transparent 60%);
  ```
- **Content container** (`._slideContentContainer_1c8fj_80`) — `display: flex; flex-direction: column; justify-content: space-between; height: 100%; pointer-events: none` (children re-enable pointer events).
- **Content details** (`._slideContentDetails_1c8fj_88`) — `position: absolute; bottom: 1rem; left: 1rem; max-width: 50%; padding: 0.5rem; border-radius: 1rem`. Mobile (`≤1000px`): `bottom: 3.75rem; max-width: 90%`. Mobile (`≤500px`): `max-width: 100%; max-height: 18rem`.
- **Info chips** (`._slideInfoItem_1c8fj_176`): `padding: 0.3rem 0.6rem; font-size: clamp(0.75rem, 1.2vw, 0.9rem); font-weight: 500; color: var(--global-text); bg: var(--global-div-tr-2); border: 1px solid var(--global-border-color); border-radius: 1rem` (pill shape).
- **Slide title** (`._slideTitleText_1c8fj_128`): `font-size: clamp(1.4rem, 3vw, 2.5rem); font-weight: 700; text-align: center`. **Gradient text effect**:
  ```css
  color: var(--home-carousel-title-color, white);
  background-image: var(--home-carousel-title-gradient);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  ```
- **Description** (`._slideDescriptionText_1c8fj_139`): `font-size: clamp(0.9rem, 1.5vw, 0.9rem); color: var(--global-text-muted); -webkit-line-clamp: 3` (≤1000px: `2` lines; ≤800px: `display: none`).
- **Action buttons** (`._slideActionButton_1c8fj_190`):
  - `position: absolute; bottom: 1rem; right: 1rem` (parent is `.slideActionButtons`)
  - `padding: 0.75rem 0.85rem; font-size: 1rem; font-weight: 700`
  - `bg: var(--global-div-tr-2)` (= `rgba(14,14,14,0.3)`)
  - `backdrop-filter: blur(10px) contrast(125%)` ← **glassmorphism**
  - `border: 1px solid var(--global-border-color)`
  - `border-radius: 2rem` (fully rounded pill)
  - Hover: `border-color: var(--global-text); transform: scale(1.05)`
  - Mobile (`≤1000px`): `width: 6.5rem; height: 2rem; font-size: 0.7rem`
  - Mobile (`≤500px`): `flex: 1` (full-width stacked)

### Carousel controls

- **Next-airing badge** (`._nextAiringWrapper_1c8fj_297`, top-left): `position: absolute; top: 1rem; left: 1rem; z-index: 10`. Pill chip showing e.g. `EP 3 5D 21H`. Same glassmorphic style as info chips (`bg: var(--global-div-tr-2); backdrop-filter: blur(10px) contrast(125%); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); padding: 0.5rem 0.6rem; font-weight: 600`).
- **Fraction pagination** (`._paginationWrapper_1c8fj_259`, top-right): `top: 1rem; right: 1rem`. Contains `._fraction_1c8fj_269` with current/total like `1 / 10`. Style: `min-width: 3.25rem; padding: 0.5rem; font-weight: 600; text-align: center; bg: var(--global-div-tr-2); backdrop-filter: blur(10px) contrast(125%); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius)`. Current = `font-size: 1rem`, total = `font-size: 0.65rem`.
- **Navigation arrows** (`._navigationButton_1c8fj_284`): positioned on the sides, same glassmorphic chip style, `border-radius: var(--global-border-radius)`. Hover: `border-color: var(--global-text); transform: scale(1.05)`. **Hidden on mobile** (`≤500px`).

---

## 8. Content Rails

### Genre rail (`._slider_8m5e1_1`)

- `position: relative; display: flex; align-items: center; padding: 0.75rem 2.25rem`
- Uses `_scrollableContainer_8m5e1_11`: `overflow: auto; scrollbar-width: none` (hidden scrollbars), with a **CSS mask gradient** for soft fade edges:
  ```css
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  ```
- Inner container (`._container_8m5e1_29`): `display: flex; gap: 0.5rem; width: max-content`
- **Genre buttons** (`._genreButton_8m5e1_38`): `<a>` tags with inline `--genre-hover-color` per genre.
  - `padding: 0.5rem 1.75rem; font-size: 0.8rem; font-weight: 500; color: var(--global-text); bg: var(--global-div); border-radius: var(--global-border-radius)`
  - `transition: color 0.3s ease-in-out`
  - Hover → `color: var(--genre-hover-color)` (e.g. Action → `#FF4500`)
  - Active → `color: var(--primary-accent)`
- **Scroll arrows** (`._scrollButton_8m5e1_66`): `position: absolute; top: 50%; transform: translateY(-50%)`. `padding: 0.5rem; border-radius: 50%; bg: var(--global-div-tr)`. `[data-side="left"]` → `left: 0`. `[data-side="right"]` → `right: 0`. Hover → `color: var(--primary-accent)`. Visibility animated via `opacity`.

### "Your Watchlist" rail

- Title row contains `<h2>Your Watchlist</h2>` and a `<a>Watch History</a>` link (sub-tab)
- Uses Swiper with `_verticalCardShell_1wtl4_51` cards (Variant B above)
- Last slide is a `_fullHeightSlide_1ckyp_52` containing `<a class="_buttonCard_1ckyp_56" href="/history">View More</a>`
- Slide width on captured screenshot: `364.667px; margin-right: 20px`

### Tabs + pagination header (`._tabsAndPaginationContainer_g07cj_7`)

- `display: flex; gap: 0.5rem; align-items: center; justify-content: space-between`
- **Tab container** (`._tabContainer_g07cj_26`): `display: flex; width: max-content; border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius)` — segmented control look
- **Tab button** (`._tab_g07cj_7`): `padding: 0.75rem 1.25rem; font-size: 0.8rem; font-weight: 500; color: var(--global-text); bg: var(--global-div); outline: 1px solid var(--global-border-color)`. Mobile: `padding: 0.5rem 1rem`
- **Active tab** (`._tabActive_g07cj_51`): `color: var(--primary-accent); bg: var(--primary-accent-tr)` (lavender text on translucent lavender bg)
- **Tab hover/active** → `color: var(--primary-accent)`
- **Pagination** (`._compactWrapper_1xyro_10`): `display: flex; align-items: center; border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius)`. Contains:
  - Prev/Next buttons (`._button_1xyro_20`): `padding: 0.5rem 1rem; bg: var(--global-div)`. Disabled → `opacity: 0.5`. Hover → `filter: brightness(1.5)`
  - Page input (`._input_1xyro_41`): `width: 1.5rem; padding: 0.5rem; text-align: center; bg: var(--global-div); opacity: 0.5`

### Notice section (`._noticeSection_attug_1`)

A row of promotional cards (e.g. "Love the Site?", "Comments are Back!", "Join our Subreddit"). Used above the tabs grid.

- `display: flex; flex-direction: column; bg: var(--global-div-tr); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius)`
- Each row (`._noticeRow_attug_13`): `display: flex; gap: clamp(0.5rem, 2vw, 0.75rem); padding: 0.75rem; align-items: center`
  - Circular image (`._noticeImage_attug_21`): `width: 100%; height: 100%; object-fit: cover; border-radius: 50%; bg: var(--global-div)` (probably 2.5rem–3rem circle)
  - Text content (`._noticeTextContainer_attug_50`): column with title + sub-text
  - Social link icons (`._socialLink_attug_83`): `border-radius: 50%; padding: 0.5rem; bg: var(--global-div); color: var(--global-text-muted)`; hover → `color: var(--global-text)`. Per-brand color via `--brand: #ff4500` (Reddit), `--brand: #5865f2` (Discord).

### Sidebar (`._side_k3w5r_49`) — right column

- Desktop: `width: 24rem; flex-shrink: 0; gap: 1rem`
- Tablet (`≤1000px`): becomes a horizontal flex-wrap with each child `flex: 1 1 0%; min-width: 22rem`
- Contains 3 list sections (TOP AIRING, JUST FINISHED, TOP MOVIES), each using `._sideListContainer_6sw3k_1` with Variant C cards.

### Banner stack (`._stack_1rbc7_1`)

- `display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.5rem`
- Each banner (`._banner_1rbc7_8`): `display: grid; grid-template-columns: 1fr auto 1fr; padding: 0.3rem 0.6rem; font-size: 0.85rem; line-height: 1.3; border-radius: var(--global-border-radius)`
- Bg: `color-mix(in srgb, var(--msg-color) 20%, var(--global-div))` (tints the bg with the banner's color)
- Border: `1px solid color-mix(in srgb, var(--msg-color) 50%, var(--global-border-color))`
- Inline `--msg-color: #d4a017` (gold) for the bookmark banner, `--msg-color: #5865F2` (Discord blurple) for the Discord banner.
- Each banner has an icon, a title text, and either an action CTA link (`._cta_1rbc7_45`) or close button (`._close_1rbc7_62`).

---

## 9. Special Effects / Visual Style

### Glassmorphism

Used heavily on the hero carousel chips/buttons and on the edit-list button:

```css
background: var(--global-div-tr-2);          /* rgba(14, 14, 14, .3) */
backdrop-filter: blur(10px) contrast(125%);
border: 1px solid var(--global-border-color); /* rgba(245, 245, 245, .1) */
```

### Per-anime accent system

Each anime carries an inline color (sampled from its cover art by the backend) that powers:

- `--home-carousel-title-color` + `--home-carousel-title-gradient` (hero title text gradient)
- `--card-title-hover-color` (card title hover color)
- `--card-image-hover-color` (card hover color tint)
- `--list-button-accent` (edit-list button border on hover)
- `--side-list-accent` (sidebar list card hover color)

This is the **signature visual touch** — every anime has its own identity color.

### Gradient text

Hero titles use `background-clip: text` with a `linear-gradient(45deg, <anime-color>, white)` — gives a soft color-to-white wash that reads as both branded and legible.

### Multi-direction dark overlay

Hero slides use **three stacked linear-gradients** (45°, 0°, -45°) from `var(--global-primary-bg)` to transparent — creating a soft "fade from three corners" vignette that keeps the bottom-left (where text sits) readable while letting the top-right art breathe.

### Animations (defined in inline `<link rel="stylesheet" href="data:text/css;base64,…">`)

```css
@keyframes fadeIn   { from {opacity:0} to {opacity:1} }
@keyframes grow     { 0% {opacity:1; transform:scale(0)} 100% {opacity:1; transform:scale(1)} }
@keyframes popIn    { 0% {opacity:0; transform:scale(0.98)} 100% {opacity:1; transform:scale(1)} }
@keyframes shrinkIn { 0% {opacity:0; transform:scale(1.05)} 100% {opacity:1; transform:scale(1)} }
@keyframes slideUp    { 0% {opacity:0; transform:translateY(10px)}  100% {opacity:1; transform:translateY(0)} }
@keyframes slideRight { 0% {opacity:0; transform:translateX(-10px)} 100% {opacity:1; transform:translateY(0)} }
@keyframes slideLeft  { 0% {opacity:0; transform:translateX(10px)}  100% {opacity:1; transform:translateY(0)} }
```

Helper classes: `.animFadeIn`, `.animPopIn`, `.animPopInSk`, `.animShrinkIn`, `.animSlideUp`, `.animSlideRight`, `.animSlideLeft`. Each reads `--animation-duration`, `--animation-easing`, `--animation-delay`, `--animation-iteration-count`, `--animation-fill-mode` (most components default to `0.4s ease-in-out`). Used on first-render of navbar, hero, rails, sidebar list cards (staggered via `animation-delay`).

### Hidden scrollbars (everywhere)

```css
scrollbar-width: none;            /* Firefox */
::-webkit-scrollbar { display: none; }   /* Chrome/Safari */
```

Applied to: nav list, search results, scrollable tab container, genre rail, side list wrapper, card details row, modal content, etc. — the site relies on touch/mouse scroll with **no visible scrollbars**.

### CSS masks for rail edges

```css
mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
```

Used on the genre rail scroll container for a soft fade-off on both edges.

### Selection color

```css
::selection { color: var(--primary-accent); background-color: var(--primary-accent-bg); }
```

Selected text gets lavender text on muted-purple bg.

### Modal/overlay

- `._overlayContainer_1bzcd_1`: `position: fixed; inset: 0; bg: rgba(0,0,0,0.498); backdrop-filter: blur(10px); opacity: 0 → 1; transition: 0.4s`. Hidden scrollbar.
- Modals (`._modal_8w0d1_1`): `width: min(64rem, -2rem + 100vw); height: min(44rem, -2rem + 100vh); bg: var(--global-div-tr); border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius)`.
- Toasts (Sonner library) — fixed bottom-right, 8px border-radius, dark theme aware.

### Border radius scale

```css
--global-border-radius: 1rem;   /* touch devices / mobile */
--global-border-radius: .5rem;  /* fine pointer (desktop) */
```

Then `var(--global-border-radius)` is reused for **every** component — buttons, cards, inputs, banners, modals, dropdowns, chips (except pill-shaped action buttons which use `border-radius: 2rem`, info chips `1rem`, scroll buttons `border-radius: 50%`).

---

## 10. Mobile vs Desktop Differences

| Aspect                       | Desktop (>1000px)                                  | Tablet (≤1000px)                          | Mobile (≤500px)                              |
| ---------------------------- | -------------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| Body padding                 | `4.5rem 0.6rem 1em`                                | same                                      | `4rem 0.5rem 0`                              |
| Border radius                | `.5rem`                                            | `1rem`                                    | `1rem`                                       |
| Navbar                       | Inline search bar + 2 right buttons                | same                                      | Search hidden (hamburger opens it); navbar bg solid |
| Drawer                       | 300px left                                         | 100% width                                | 100% width                                   |
| Hero carousel height         | `30rem`                                            | `26rem`                                   | `22rem` → `26rem` (≤500px, taller for stacked content) |
| Hero content position        | bottom-left, max-width 50%                         | max-width 90%, bottom 3.75rem             | max-width 100%, max-height 18rem             |
| Hero description             | 3-line clamp                                       | 2-line clamp                              | `display: none`                              |
| Hero action buttons          | Pill, two side-by-side at bottom-right             | `width: 6.5rem; height: 2rem`             | `flex: 1` (stacked full-width)               |
| Carousel arrows              | Visible                                            | Visible                                   | `display: none`                              |
| Content/sidebar layout       | Row: main + 24rem sidebar                          | Wrap: sidebar items below main, min 22rem each | Stack                                        |
| Card grid columns            | ~10–12 per row (`minmax(10.5rem, 1fr)`)            | ~6–8 per row                              | 3 per row (`minmax(6.5rem, 1fr)`)            |
| Card title                   | `0.83rem`                                          | `0.83rem`                                 | `0.7rem`                                     |
| Card detail pills            | `0.75rem`                                          | `0.75rem`                                 | `0.625rem`                                   |
| Hide-on-mobile details       | Shown                                              | Shown                                     | Hidden (`hide-on-mobile`)                    |
| Search input                 | Always visible                                     | Always visible                            | Hidden until hamburger → search icon         |
| Touch tap highlight          | default                                            | default                                   | `-webkit-tap-highlight-color: transparent`   |

---

## 11. Key CSS Snippets (replicate these directly)

### A. CSS variables (paste into Tailwind `@layer base` or globals.css)

```css
:root {
  --app-font-family: "Geist", ui-sans-serif, system-ui, sans-serif;
  --global-border-radius: 0.5rem;
}
@media (pointer: coarse) { :root { --global-border-radius: 1rem; } }

:root.dark-mode {
  color-scheme: dark;
  --opposite: #ffffff;
  --global-primary-bg: #080808;
  --global-primary-bg-tr: rgba(8, 8, 8, 0.9);
  --global-secondary-bg: #141414;
  --global-tertiary-bg: #222222;
  --global-div: #141414;
  --global-div-tr: #0e0e0e;
  --global-div-tr-2: rgba(14, 14, 14, 0.3);
  --global-text: #e8e8e8;
  --global-text-muted: #696969;
  --global-text-muted-strong: #a8a8a8;
  --global-border-color: rgba(245, 245, 245, 0.1);
  --global-card-bg: #181818;
  --global-card-title-bg: #151515;
  --global-shadow: rgba(0, 0, 0, 0.6);
  --global-button-bg: #202020;
  --global-button-hover-bg: #292929;
  --global-button-text: #ebebeb;
  --global-primary-skeleton: rgba(85, 85, 85, 0.1);
  --global-secondary-skeleton: rgba(85, 85, 85, 0.3);

  --primary-accent: #b5a8ff;
  --primary-accent-bg: #595991;
  --primary-accent-tr: rgba(128, 128, 207, 0.25);
  --primary-accent-dk-tr: rgba(128, 128, 207, 0.1);

  --ongoing: #aaff00;
  --completed: #00aaff;
  --cancelled: #ff0000;
  --not-yet-aired: #ffa500;
  --favourite: #e85d8a;
}
```

### B. Body / shell

```css
html, body { background-color: var(--global-primary-bg); color: var(--global-text); font-family: var(--app-font-family); }
body { max-width: 109rem; padding: 4.5rem 0.6rem 1em; margin: 0 auto; }
@media (max-width: 500px) { body { padding: 4rem 0.5rem 0; -webkit-tap-highlight-color: transparent; } }
::selection { color: var(--primary-accent); background-color: var(--primary-accent-bg); }
```

### C. Glassmorphic chip (hero info, action buttons, pagination)

```css
.glass-chip {
  background: var(--global-div-tr-2);
  backdrop-filter: blur(10px) contrast(125%);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  color: var(--global-text);
}
```

### D. Hero slide dark overlay (the signature 3-way gradient)

```css
.hero-overlay {
  position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(45deg,  var(--global-primary-bg) 5%, transparent 60%),
    linear-gradient(0deg,   var(--global-primary-bg) 1%, transparent 60%),
    linear-gradient(-45deg, var(--global-primary-bg) 5%, transparent 60%);
}
```

### E. Hero title with per-anime gradient text

```css
.hero-title {
  font-size: clamp(1.4rem, 3vw, 2.5rem);
  font-weight: 700;
  color: var(--home-carousel-title-color, white);
  background-image: var(--home-carousel-title-gradient, linear-gradient(45deg, white, white));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
/* inline style on element: */
/* style="--home-carousel-title-color: #28bbe4; */
/*        --home-carousel-title-gradient: linear-gradient(45deg, #28bbe4, white);" */
```

### F. Hero action button (pill + glass)

```css
.hero-action-btn {
  display: flex; align-items: center; justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 0.85rem;
  font-size: 1rem; font-weight: 700;
  color: var(--global-text); text-decoration: none;
  background: var(--global-div-tr-2);
  backdrop-filter: blur(10px) contrast(125%);
  border: 1px solid var(--global-border-color);
  border-radius: 2rem;
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}
.hero-action-btn:hover { border-color: var(--global-text); transform: scale(1.05); }
```

### G. Anime poster card (grid variant)

```css
.anime-card { width: 100%; border-radius: var(--global-border-radius); transition: 0.2s ease-in-out; }
.anime-card-image {
  position: relative;
  padding-top: 138.346%;            /* 2:3 portrait */
  overflow: hidden;
  border-radius: var(--global-border-radius);
  background: transparent;
}
.anime-card-image img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  transition: filter 0.2s ease-in-out, transform 0.5s ease-in-out;
}
.anime-card:hover .anime-card-image img { filter: brightness(0.5); transform: scale(1.05); }
.anime-card-title { margin: 0.35rem 0.35rem 0; font-size: 0.83rem; font-weight: 500;
  color: var(--global-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.2s; }
.anime-card:hover .anime-card-title { color: var(--card-title-hover-color, inherit); }
.anime-card-details { display: flex; gap: 0.5rem; padding: 0 0.3rem;
  font-size: 0.75rem; font-weight: 700; color: var(--global-text-muted); }
.anime-card-details > * { padding: 0.2rem; background: var(--global-div);
  border-radius: var(--global-border-radius); }
.anime-card-grid {
  display: grid; gap: 2rem;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
}
@media (max-width: 1350px) { .anime-card-grid { grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: 1.5rem; } }
@media (max-width: 800px)  { .anime-card-grid { grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: 1rem; } }
@media (max-width: 450px)  { .anime-card-grid { grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr)); gap: 0.8rem; } }
```

### H. Status indicator dot

```css
.indicator-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex-shrink: 0; }
.indicator-dot.ongoing     { background-color: #aaff00; }
.indicator-dot.completed   { background-color: #00aaff; }
.indicator-dot.cancelled   { background-color: #ff0000; }
.indicator-dot.not-aired   { background-color: #ffa500; }
```

### I. Continue-watching card (16:9 with progress + play button on hover)

```css
.watch-card {
  position: relative; display: flex; flex-direction: column;
  overflow: hidden;
  border-top-left-radius: var(--global-border-radius);
  border-top-right-radius: var(--global-border-radius);
  text-decoration: none; color: inherit;
}
.watch-card img {
  width: 100%; aspect-ratio: 16 / 9; object-fit: cover;
  transition: filter 0.25s ease, transform 0.35s ease;
}
.watch-card:hover img { filter: brightness(0.5); transform: scale(1.1); }
.watch-card .play-btn {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%) scale(0.9);
  width: 2.5rem; height: 2.5rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; color: #fff;
  border: 2px solid var(--global-border-color);
  border-radius: 50%;
  opacity: 0; transition: opacity 0.2s, transform 0.2s;
}
.watch-card:hover .play-btn { opacity: 1; transform: translate(-50%,-50%) scale(1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
.watch-card .progress {
  position: absolute; bottom: 0; left: 0; height: 0.25rem; width: 100%;
  background: rgba(255,255,255,0.3);
}
.watch-card .progress > span { display: block; height: 100%; background: red; }
.watch-card .ep-label {
  position: absolute; bottom: 0.25rem; left: 0.25rem;
  padding: 0.25rem; font-size: 0.7rem; font-weight: 700;
  color: #fff; background: rgba(0,0,0,0.75);
  border-radius: var(--global-border-radius);
}
.watch-card .title-below {
  padding: 0.35rem; font-size: 0.8rem; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  background: var(--global-div-tr);
  border-bottom-left-radius: var(--global-border-radius);
  border-bottom-right-radius: var(--global-border-radius);
}
```

### J. Sidebar list card (TOP AIRING)

```css
.side-list-card {
  position: relative; display: flex; gap: 0.5rem; align-items: center;
  height: 6rem; overflow: hidden; cursor: pointer;
  background: var(--global-div);
  border-radius: var(--global-border-radius);
  transition: margin-left 0.2s, filter 0.2s;
}
.side-list-card:hover { margin-left: 0.35rem; color: var(--side-list-accent, var(--primary-accent));
  filter: brightness(1.1); }
.side-list-card .banner-bg {
  position: absolute; right: 0; top: 0; bottom: 0; width: 60%; overflow: hidden;
}
.side-list-card .banner-bg img { width: 100%; height: 100%; object-fit: cover;
  filter: grayscale(100%); transition: filter 0.3s; }
.side-list-card:hover .banner-bg img { filter: grayscale(0); }
.side-list-card .banner-bg::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(-70deg, transparent -200%, var(--global-div) 80%);
}
.side-list-card .cover { width: 4.25rem; height: 6rem; object-fit: cover; position: relative; z-index: 1; }
```

### K. Tabs (segmented control)

```css
.tab-container { display: flex; width: max-content; overflow: hidden;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius); }
.tab { padding: 0.75rem 1.25rem; font-size: 0.8rem; font-weight: 500;
  color: var(--global-text); background: var(--global-div);
  outline: 1px solid var(--global-border-color); border: none; cursor: pointer; }
.tab:hover, .tab:active { color: var(--primary-accent); }
.tab.active { color: var(--primary-accent); background: var(--primary-accent-tr); }
```

### L. Genre rail with masked edges

```css
.genre-rail {
  position: relative; display: flex; align-items: center; padding: 0.75rem 2.25rem;
}
.genre-rail-scroll {
  display: flex; overflow: auto; scrollbar-width: none;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}
.genre-rail-scroll::-webkit-scrollbar { display: none; }
.genre-rail-inner { display: flex; gap: 0.5rem; width: max-content; margin: 0 auto; }
.genre-btn {
  padding: 0.5rem 1.75rem; font-size: 0.8rem; font-weight: 500;
  color: var(--global-text); text-decoration: none;
  background: var(--global-div); border: none;
  border-radius: var(--global-border-radius);
  transition: color 0.3s;
}
.genre-btn:hover { color: var(--genre-hover-color, var(--global-text)); }
.genre-btn:active { color: var(--primary-accent); }
```

### M. Navbar

```css
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 600;
  padding: 0.6rem; background: var(--global-div-tr);
  border-bottom: 1px solid var(--global-border-color);
  transition: box-shadow 0.2s;
}
.navbar.scrolled { box-shadow: 0 10px 20px var(--global-shadow); }
.navbar-top { display: flex; gap: 0.5rem; align-items: center; justify-content: space-between; }
.nav-search {
  flex: 1 1 0%; max-width: 35rem; position: relative;
  display: flex; align-items: center; padding: 0.6rem;
  background: var(--global-div); border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
}
.nav-search input { flex: 1; padding: 0; font-size: 0.85rem; color: var(--global-text);
  background: transparent; border: none; outline: none; }
```

### N. Drawer (left sidebar)

```css
.drawer {
  position: fixed; top: 0; left: 0; z-index: 900;
  width: 300px; height: 100%;
  background: var(--global-div-tr);
  box-shadow: -2px 0 5px rgba(0,0,0,0.3);
  transform: translateX(-100%); pointer-events: none;
  transition: transform 0.4s;
}
.drawer.open { transform: translateX(0); pointer-events: auto; }
@media (max-width: 700px) { .drawer { width: 100%; } }
```

### O. Entrance animations (Tailwind plugin or globals.css)

```css
@keyframes fadeIn  { from {opacity:0} to {opacity:1} }
@keyframes popIn   { from {opacity:0; transform:scale(0.98)} to {opacity:1; transform:scale(1)} }
@keyframes slideUp { from {opacity:0; transform:translateY(10px)} to {opacity:1; transform:translateY(0)} }
@keyframes slideLeft { from {opacity:0; transform:translateX(10px)} to {opacity:1; transform:translateX(0)} }

.anim-fade-in   { animation: fadeIn   0.4s ease-in-out both; }
.anim-pop-in    { animation: popIn    0.4s ease-in-out both; }
.anim-slide-up  { animation: slideUp  0.4s ease-in-out both; }
.anim-slide-left{ animation: slideLeft 0.4s ease-in-out both; }
```

---

## 12. Recommended Implementation Approach (Next.js + Tailwind)

### Stack

- **Next.js 16** (App Router) — already in your `my-project` setup
- **TypeScript** for typed anime/genre/episode models
- **Tailwind CSS v4** — map the CSS variables to `@theme` so utilities pick them up
- **shadcn/ui** for primitives (Dialog, DropdownMenu, Tabs, Sonner toasts) — Miruro uses very similar styles already
- **Swiper.js** (`swiper/react`) for the hero carousel and rails — matches the original site exactly
- **Geist font** — install via `geist` package or self-host from `/public/fonts/geist/`
- **lucide-react** for icons (Miruro uses Font Awesome-style icons that match Lucide closely)
- **next/image** for all poster/banner images — set `width={460} height={650}` for posters and `width={1900} height={400}` for banners to avoid layout shift

### Tailwind v4 theme mapping

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --color-bg: #080808;
  --color-bg-soft: #141414;
  --color-bg-soft-tr: #0e0e0e;
  --color-card: #181818;
  --color-border: rgba(245, 245, 245, 0.1);
  --color-text: #e8e8e8;
  --color-text-muted: #696969;
  --color-text-muted-strong: #a8a8a8;
  --color-accent: #b5a8ff;
  --color-accent-bg: #595991;
  --color-accent-tr: rgba(128, 128, 207, 0.25);
  --color-status-ongoing: #aaff00;
  --color-status-completed: #00aaff;
  --color-status-not-aired: #ffa500;
  --color-status-cancelled: #ff0000;
  --color-favourite: #e85d8a;
  --radius-card: 0.5rem;
}
@media (pointer: coarse) {
  @theme { --radius-card: 1rem; }
}

@layer base {
  body {
    @apply bg-bg text-text font-sans antialiased;
    max-width: 109rem;
    margin: 0 auto;
    padding: 4.5rem 0.6rem 1em;
  }
  @media (max-width: 500px) {
    body { padding: 4rem 0.5rem 0; -webkit-tap-highlight-color: transparent; }
  }
  ::selection { color: var(--color-accent); background: var(--color-accent-bg); }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
}
```

### Suggested component breakdown

```
app/
  layout.tsx                  // <html class="dark-mode" style="--primary-accent: #b5a8ff; --global-border-radius: 1rem;">
  page.tsx                    // HomePage
  globals.css
components/
  layout/
    Navbar.tsx                // fixed top, search + logo + actions
    Drawer.tsx                // left slide-in nav drawer
    Footer.tsx
  home/
    BannerStack.tsx           // dismissible promo banners (gold + discord)
    HeroCarousel.tsx          // Swiper-based, glassmorphic chips, gradient titles
    HeroSlide.tsx             // one slide: bg image + 3-way overlay + content
    GenreRail.tsx             // h-scroll with masked edges + per-genre hover color
    WatchlistRail.tsx         // 16:9 cards with progress + play-on-hover
    NoticeSection.tsx         // promo cards above tabs
    HomeTabs.tsx              // NEWEST / POPULAR / TOP RATED + pagination
  anime/
    PosterCard.tsx            // 2:3 portrait card (grid variant)
    PosterCardGrid.tsx        // responsive auto-fill grid
    WatchCard.tsx             // 16:9 continue-watching card
    SideListCard.tsx          // sidebar horizontal card with grayscale banner
    SideList.tsx              // TOP AIRING / JUST FINISHED / TOP MOVIES container
    StatusDot.tsx             // colored status indicator
  ui/
    GlassChip.tsx             // backdrop-blur chip (hero info, pagination)
    Pill.tsx                  // pill-shaped action button
    SegmentedTabs.tsx         // tab container with active accent
    ScrollButton.tsx          // circular scroll-arrow
lib/
  anime-accent.ts             // helper: given an anime ID, return its accent color
  genres.ts                   // list of genres + hover colors
```

### Per-anime accent color

Since the original site gets this from the backend, replicate it by either:

1. **Pre-compute** the accent from each poster via an image-color-extraction library (`colorthief` / `node-vibrant`) at build time, store in your anime metadata.
2. **Hardcode** a palette of pastel hues (`#28bbe4`, `#e49335`, `#50a1f1`, `#435dff`, `#fe5093`, `#f1bb50`, `#5daee4`, `#1abbd6`, `#0d8693`, …) and pick by `hash(animeId) % palette.length`.

Then pass to each card/slide as inline CSS vars:

```tsx
<div
  className="anime-card"
  style={{
    '--card-title-hover-color': accent,
    '--card-image-hover-color': accent,
    '--list-button-accent': accent,
  } as React.CSSProperties}
>
```

For hero slide titles, also pass:

```tsx
style={{
  '--home-carousel-title-color': accent,
  '--home-carousel-title-gradient': `linear-gradient(45deg, ${accent}, white)`,
} as React.CSSProperties}
```

### Hero carousel with Swiper

```tsx
// HeroCarousel.tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';

<Swiper
  modules={[Pagination, Navigation, EffectFade]}
  pagination={{ type: 'fraction' }}
  navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
  loop
  className="h-[30rem] rounded-[var(--radius-card)]"
>
  {slides.map(slide => (
    <SwiperSlide key={slide.id}>
      <HeroSlide slide={slide} />
    </SwiperSlide>
  ))}
</Swiper>
```

### Implementation order (recommended)

1. Set up `globals.css` with the CSS variables and base body styles above.
2. Install Geist: `npm i geist` → import in `layout.tsx`.
3. Build `Navbar` + `Drawer` (static — get the layout right first).
4. Build `PosterCard` + `PosterCardGrid` with mock data — this is the most-reused component.
5. Build `HeroCarousel` + `HeroSlide` with the 3-way gradient overlay and glassmorphic chips.
6. Build `GenreRail` with masked-scroll + per-genre hover colors.
7. Build `WatchlistRail` (16:9 cards, progress bar, play-on-hover).
8. Build `SideList` + `SideListCard` (grayscale banner → color on hover).
9. Build `HomeTabs` (NEWEST/POPULAR/TOP RATED segmented control + pagination).
10. Add entrance animations (`animFadeIn`, `animSlideUp`) with staggered delays on rails.
11. Wire up the per-anime accent color system.
12. Mobile QA: verify the breakpoints at 1450, 1350, 1000, 800, 700, 500.

### Reference assets

- Sample posters (460×650, 2:3): `/home/z/my-project/upload/miruro-extracted/image-0[0-7]-*.png|jpg`
- Sample banners (1900×400 or 1697×764): `/home/z/my-project/upload/miruro-extracted/banner-0[0-3]-*.jpg`
- Use these as placeholder images while developing before wiring up real AniList/TVDB image URLs.

### Final notes

- **Don't use card box-shadows** — Miruro cards rely on borders (`1px solid var(--global-border-color)`) and brightness/scale on hover, never on drop shadows. Only modals/dropdowns get `box-shadow: 0 8px 16px rgba(0,0,0,0.3)`.
- **Hide scrollbars globally** on scrollable rails — the design depends on clean edges.
- **Use CSS masks** (not gradients overlayed with bg color) for the genre rail's fade-off edges.
- **Stagger rail item entrance animations** via `animation-delay: ${i * 0.05}s` to get the cascade effect.
- **The hero overlay is THREE gradients, not one** — replicating this exactly is what makes it look like Miruro rather than a generic Netflix clone.
- **Per-anime accent is the secret sauce** — without it, the design will look flat. Prioritize getting it wired through early.
