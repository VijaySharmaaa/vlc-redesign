# Edge-case checklist

Check every changed area against the relevant rows before a phase is closed. Record the result in PROGRESS.md as pass / fixed / deferred (with a reason).

## Window & display
- [ ] Window at its minimum size of 800 × 600; maximised; snapped half and quarter (Win 11 snap layouts); restored after maximise.
- [ ] Dragging between monitors with different DPI (100 % ↔ 150 % / 200 %); changing scale while running.
- [ ] Multi-monitor fullscreen (`qt-fullscreen-screennumber`); unplugging the monitor VLC is on.
- [ ] Windows 10 vs 11 (Mica present / absent); Windows 7/8.1 if the build claims support. No crash when DWM APIs are missing.
- [ ] Switching Windows light/dark while VLC is open; high-contrast mode (fall back to system colours, keep it readable).
- [ ] "Animation effects" off: no motion, and state changes are still visible.
- [ ] Taskbar on top/left/auto-hide (maximised window must not cover it); title-bar double-click, Alt+Space system menu, Win+↑/↓.
- [ ] Touch and pen input on the title bar, seek and volume.

## Interface states
- [ ] Menu bar hidden or shown (Ctrl+H in v3 minimal view); minimal view; fullscreen with the fullscreen controller on and off (`qt-fs-controller`).
- [ ] Playlist docked vs detached window; playlist panel at XS (overlay drawer).
- [ ] Saved custom toolbar strings from an old VLC (must still load); empty or corrupt toolbar strings fall back to the defaults; the toolbar editor round-trips.
- [ ] First run (privacy dialog `qt-privacy-ask`); a clean profile vs a profile with old `vlc-qt-interface.ini`.
- [ ] Systray on/off, start minimised, pause on minimise; taskbar thumbnail buttons.
- [ ] `-I skins2` and `--qt-minimal-view` still work; skins2 isn't affected by the theme.
- [ ] Translations: long German/Russian strings in menus and buttons (no clipping), right-to-left (Arabic/Hebrew) layout mirroring, CJK fonts.
- [ ] Keyboard only: tab order, focus visible on every control, Esc closes the top popover/dialog first, hotkeys don't fire while typing in a field.
- [ ] Screen reader (Narrator): every icon button has a name, and state changes (play/pause, mute) are announced.

## Media & playback
- [ ] Nothing loaded (idle): controls disabled sensibly, no division by zero in time/seek code.
- [ ] Live streams and unknown length: seek disabled, "Live" label, no negative remaining time.
- [ ] Very short (< 1 s) and very long (> 10 h, h:mm:ss) media; media with and without chapters (chapter ticks).
- [ ] Audio-only, video-only, no art, huge art, transparent PNG art.
- [ ] No audio tracks, no subtitle tracks, 20+ tracks (popover scrolls), tracks added mid-playback (an .srt dropped in).
- [ ] Speed at the extremes (0.25×, 4×, and values typed via hotkeys that aren't presets).
- [ ] Volume 0, 100, 125, and `qt-max-volume` set to 200/300 (tick and boost colour scale correctly); mute → unmute restores the level.
- [ ] Buffering that never finishes; the network dropping mid-stream; an unreachable URL (error dialog, Retry works, Show log opens messages).
- [ ] DVD/Blu-ray menus, teletext, 360°/VR video, interlaced video, HDR, rotated phone video, 4:3 / 21:9 / 1:1 aspect ratios.
- [ ] Opening from Explorer while VLC is running with "one instance" on (enqueue vs play); command-line files; drag-and-drop of files, folders, URLs and `.srt` (Shift = enqueue).
- [ ] Unicode, emoji, very long and UNC (`\\server\share`) paths and titles: no crash, sensible ellipsis.

## Library & playlist
- [ ] Empty library (no Videos/Music folders, permissions denied); a folder with 10,000+ files (no UI freeze; lazy loading).
- [ ] Playlist with 10,000 items: scrolling, filter, sort, remove, current-item tracking.
- [ ] Recent media pointing at deleted files or offline network shares.
- [ ] Removable drives and discs inserted or removed while browsing; UPnP servers appearing and disappearing.

## Settings & robustness
- [ ] Preferences: Save, Cancel, Reset; simple ↔ all settings; values written to the same config variables as before; old config files still load.
- [ ] Portable mode (`--config` / settings next to the exe).
- [ ] Rapid repeated clicks (play/pause spam, opening/closing panels quickly): no stuck animations or leaked widgets.
- [ ] Closing VLC during playback, during buffering, or with a dialog open: clean shutdown, no crash, settings saved.
- [ ] Memory: open and close every panel and dialog 50 times; no growth (check with Process Explorer or a debug build).
