# VLC for Windows — redesign spec

Source of truth: `design/prototype/` (the live HTML prototype) and `design/tokens.json`. Where this document and the prototype disagree, **the prototype wins**. Read the prototype's markup for exact padding, radii and colours.

## 1. Principles

1. **Still VLC.** Classic menu bar, every menu item, every shortcut and every existing feature stays. Nothing is removed, only reorganised.
2. **Simple by default, expert on demand.** View → Advanced Controls adds A–B loop, frame step, snapshot, record and aspect ratio to the control deck. Preferences open simple; "Show all settings" reveals the full module tree.
3. **Windows 11 native feel.** Segoe UI Variable, Mica/acrylic on floating surfaces, 46 px caption buttons, Fluent-style motion. Respects light/dark and "Animation effects" off.
4. **One accent.** Traffic-cone orange `#ff8a1f` on warm neutrals. Text on accent is `#1c1206`. Video surfaces stay dark in both themes.

## 2. Window anatomy (docked layout, 1280 × 800)

```
┌──────────────────────────────────────────────────────────────── 40 px title bar (CSD) ┐
│ [cone 18] Media Playback Audio Video Subtitle Tools View Help   <title, centred, mute>  ─ ▢ ✕ │
├────────────┬─────────────────────────────────────────────────────────┬──────────────────┤
│ Sidebar    │  Content view (library / player / audio / settings)     │ Playlist (docked)│
│ [+ Open    │                                                         │ 360/320/300 px   │
│   media]   │                                                         │ filter field     │
│ Home       │                                                         │ rows 40 px       │
│ Videos     │                                                         │                  │
│ Music      │                                                         │                  │
│ Network    │                                                         │                  │
│ …          │                                                         │                  │
│ Preferences│                                                         │                  │
├────────────┴─────────────────────────────────────────────────────────┴──────────────────┤
│ Player view: control deck (seek row + button row)  |  Library view: 76 px now-playing bar │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Title bar** 40 px, `--chrome`, bottom hairline `ink/0.06`. Cone (18 px) acts as "go to library". Menu titles: 28 px tall, 9 px x-padding, 5 px radius, `--tx2`; open/hover fill `ink/0.07–0.09`. Window buttons 46 px wide; close hover `#c42b1c`. `Alt` toggles menu bar if hidden.
- **Sidebar**: `--chrome`, padding 14/10, right hairline. Primary "Open media" button 38 px, accent fill, radius 7. Nav items 36 px, radius 6, 20 px filled icon + 13 px label, gap 12. Active item: bg `accent/0.12`, text `--accTx`. Preferences pinned at bottom. **< 1200 px → icon rail.**
- **Player (docked)**: video on black; control deck under it (not overlaid). Paused → 76 px circular badge (`rgba(0,0,0,.55)`, 1 px `ink/.15` border, 44 px filled play glyph).
- **Player (immersive)**: video full height; control deck floats as a translucent bar (`--glass` + blur) 16 px from edges; auto-hides after 2.5 s idle (opacity 0 + 12 px down, 300 ms), cursor hidden.

## 3. Control deck

Row 1 — seek: elapsed time · track (4 px, hover 6 px, chapter ticks as 2 px gaps) · knob 14 px white with 3 px `accent/0.35` halo (hover 16 px) · remaining time (`−9:36`), tabular numerals 12 px. Hover shows a time tooltip.

Row 2 — buttons (36 × 36 icon buttons, radius 6, glyph 22):

| Group | Buttons |
|---|---|
| Transport | **Play/Pause 44 px circle, accent fill** (press: scale .92/100 ms) · Previous · Stop* · Next |
| Modes* | Loop (off → all → one; accent when on) · Random |
| Expert (Advanced Controls only) | A–B loop · Frame step · Snapshot · Record · Aspect ratio (text badge e.g. `16:9`) |
| Right side | Tracks (subtitles icon; opens popover) · Speed label (`1.00×`, accent when ≠ 1) · Effects (tune) · Playlist · Mini player* · Fullscreen* · │ · Mute · Volume slider |

`*` move into menus at XS. Icon-button states: rest `--tx2`; hover fill `ink/.07`; **on** = accent glyph; **open** = accent glyph + `ink/.09` fill; disabled 35 % opacity. Separators: 1 × 20 px `ink/.10`, 6 px margins.

**Volume**: 140 px, 4 px track, max **125 %**, 1 px tick at 100 %, fill `#ff8a1f` → `#ff5a1f` above 100 %. Icon swaps volume_off / volume_down / volume_up.

## 4. Library

- **Home**: page title 26/600. "Continue watching" row of 16:9 cards (radius 8) with bottom 3 px progress bar and "9:37 left" badge (`rgba(0,0,0,.75)`). Then "Recent media" table: 44 px rows — type icon · title · full path (mono, muted) · when · duration.
- **Videos**: responsive grid (5/4/3/2 cols). Card: 16:9 thumb, duration badge, title 14/600, meta 12 muted (`2010 · 1080p · H.264 · 5.1`). Hover: 1 px accent border.
- **Music**: square album cards → click opens **Audio mode**.
- **Network**: groups "On your network" (SMB/UPnP/Windows shares) and "Streams" (Open network stream, Icecast directory, Podcasts). Tile: 40 px tinted icon square + name + mono address.
- **Empty state**: 1.5 px dashed `ink/.14` box, radius 12, min-height 420, primary "Add a folder" + outline "Open media…".
- **Search** field top-right of content: 34 px, `--surface`, hairline border.
- **Now-playing bar** (library views, after first playback): 76 px, `--chrome`; left: 64×40 thumb + title/meta; centre: prev · 36 px play · next + 3 px seek; right: volume, expand.

## 5. Audio mode

Back-to-library pill (top-left) · large album art · album/artist header (Display 48/600 for track title) · format chip (`FLAC · 24/96`, accent tint) · tracklist (40 px rows, current row tinted with animated graphic_eq icon) · **spectrum visualizer** 84 px tall bar strip at the bottom (bar heights animate 250 ms linear, settle flat on pause).

## 6. Playlist panel (docked right / overlay drawer at XS)

Header: "Playlist" + count · add (+) · close. 32 px filter field. Rows 40 px: index or now-playing icon · title 13/500 + meta 11 · duration. Current: bg `accent/.12`, title `--accTx`, graphic_eq icon (pause icon when paused). Hover `ink/.05`. Right-click → context menu (see inventory 2.1.2). Slides in from right (220 ms).

## 7. Popovers, menus, dialogs, sheets

- **Menus/dropdowns**: panel `--raised`, 1 px `ink/.08`, radius 8, padding 4, shadow `0 16px 40px rgba(0,0,0,.5)`, min-width 290. Items 30 px, grid `22px icon | label | shortcut (12 px dim)`. Checked items show accent `check` instead of icon. Separators 1 px `ink/.08`, 4/8 margins.
- **Tracks popover**: two columns (Audio · Subtitles) with per-track detail line, + "Add subtitle file…". Rises 8 px from its button (160 ms).
- **Speed popover**: 8 presets, check on current.
- **Effects & filters sheet** (Ctrl+E): docked panel over the right of the video, `--fxbg`, tabs Equalizer · Video · Synchronization (tab underline 2 px accent).
  - Equalizer: enable toggle, preset chips (Flat, Rock, Pop, Jazz, Classical, Live, Headphones, Full bass), preamp, 10 bands 60 Hz–16 kHz, ±20 dB, 170 px tall, accent fill from 0 line.
  - Video: Brightness, Contrast, Saturation, Hue, Gamma sliders + "Reset to defaults".
  - Synchronization: audio delay and subtitle delay steppers (±50 ms, mono value `+0.150 s`) with shortcut hints.
- **Open media** dialog: one sheet with tabs File · Disc · Network · Capture (tab tiles 58 px with icon, active tinted). Network tab: 38 px mono URL field with accent focus ring, protocol help text, Recent list. Disc: type (DVD/Blu-ray/Audio CD/SVCD), device, "No disc menus". Capture: DirectShow video & audio device. "Show more options" expander. Footer: Cancel (secondary) + Play (split button, accent).
- **Media information**: tabs General · Metadata · Codec · Statistics; key/value grid; streams grouped.
- **Go to time**: small dialog, mono timecode input, Enter to jump.
- **Error**: 40 px red-tinted error icon, title "Your input can't be opened", technical detail in mono, buttons Show log + Retry. No shake.
- **About**: cone, version, tabs Authors / License / Credits.
- **Toasts**: bottom-centre, `--hover` bg, 1 px `ink/.10`, radius 8, accent info icon, auto-dismiss 2.4 s.
- **Drop target**: full-window dashed 2 px accent frame on `accent/.10`, "Drop to play" (Shift = enqueue).
- **Buffering**: 48 px ring (3 px `white/.15`, accent top arc) + "Buffering… 56%" + URL.

## 8. Preferences (in-window view, Ctrl+P)

Left section list (Interface, Audio, Video, Subtitles / OSD, Input / Codecs, Hotkeys, Advanced; 34 px items). Right: card of rows (min 60 px): label 13/500 + description 12 muted on the left; control on the right (toggle 40×20, select 32 px, keycap, or outline button). Advanced → "Show all settings" opens the existing complete/expert prefs tree. Exact rows: prototype `SETTINGS` object.

## 9. Mini player

Compact always-on-top window (~360 × 200): art/video thumb, title, seek, prev/play/next, restore. Ctrl+H. Pops in (240 ms).

## 10. App icon

Three 3D directions in `design/icons/` (SVG + multi-size .ico + PNGs 16–256):
- **1a Glossy 3D** — closest to the original cone, real volume, slab base.
- **1b 3D on dark tile** — same cone on a charcoal rounded tile with orange glow (title bar uses bare 1a).
- **1c Soft matte 3D** — clay-like, Windows 11 3D-emoji style.
In-app UI cone (title bar 18 px, headers) = `vlc-ui-cone-flat.svg`.

## 11. Accessibility

Every control focusable with a visible focus ring (2 px accent or `accent/.18` 3 px halo on inputs), tooltips include shortcuts (`Play / Pause (Space)`), Accessible.name on all icon-only buttons, text contrast ≥ 4.5:1 in both themes, motion off when Windows animation effects are disabled.

## 12. Keyboard (must keep working)

Space play/pause · ←/→ 3 s (Shift 10 s) · M mute · F fullscreen · Esc closes popovers/menus/dialogs · Ctrl+O open · Ctrl+N network · Ctrl+L playlist · Ctrl+E effects · Ctrl+I/J info/codec · Ctrl+T go to time · Ctrl+P prefs · Ctrl+H mini · Ctrl+B library · Shift+S snapshot · E next frame · Alt menu bar. Use VLC's existing hotkey system (`key-*` variables) — do not hard-code.
