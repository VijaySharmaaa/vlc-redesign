# VLC 3 implementation plan — mapping the design onto the 3.0.x Qt 5 interface

Target branch: **`3.0.x`** (VLC 3.0.24 → 3.0.25-dev, Nov 2026). The redesign lives in **your own fork**. VideoLAN only takes fixes into 3.0.x, so it won't be merged upstream.

## 1. Facts about the 3.0.x codebase (checked Nov 2026)

| Topic | Fact | Consequence |
|---|---|---|
| UI tech | Qt 5 **Widgets**, C++ only (no QML). All UI code is in `modules/gui/qt/` | Every screen is built from QWidgets, layouts, custom `paintEvent`s and Qt stylesheets (QSS). |
| Qt version on Windows | contribs build **Qt 5.6.3** (`contrib/src/qt/rules.mak`, qtbase + qtsvg only) | No QtQuick, no QtWinExtras, no APIs newer than 5.6 (check every API's "since"). Upgrading Qt is a big contrib change; don't do it. |
| Windows target | `build.sh` defaults to `_WIN32_WINNT=WINVER=0x0502` (Server 2003 / XP x64; `build.sh:311-315`). `-u` (UCRT) raises it to `0x0601`, `-u -w` to `0x0A00`, `-S <ntddi>` overrides it | Win 10/11-only APIs (DWM Mica, immersive dark mode, DirectComposition) must be loaded at runtime with `GetProcAddress` and fall back gracefully. |
| Build | Cross-compiled with mingw-w64 **gcc** from Linux. CI image `registry.videolan.org/vlc-debian-win64-3.0:20260930101942`. Prebuilt contribs: `https://artifacts.videolan.org/vlc-3.0/win64/vlc-contrib-x86_64-w64-mingw32-<SHA>.tar.zst`, where SHA comes from `extras/ci/get-contrib-sha.sh win64` | Use that Docker image (on WSL2 or Linux) so the prebuilt contribs match the compiler. MSVC isn't supported. |
| Build script | `extras/package/win32/build.sh -a x86_64 [-p] [-d] [-r] [-i n]` | `-p` prebuilt contribs, `-d` PDBs, `-r` release, `-i n` nightly installer (7z + exe + msi). If the prebuilt download fails, `build.sh` silently falls back to building contribs from source (`:425-439`), so watch for that. Without `-i`/`-o` it only runs `make`: run `make package-win-common` (`package.mak:50`) for a runnable folder. |
| New files | Register in `modules/gui/qt/Makefile.am` (sources, `nodist_` moc list, `.ui`) and resources in `modules/gui/qt/vlc.qrc` | Otherwise moc/uic/rcc won't run and the link fails. |
| Existing theming hooks | `qt-dark-palette` → `applyDarkPalette()` (`qt.cpp:397-448`), applied at `qt.cpp:686`, *after* `MainInterface` is built. `isDarkPaletteEnabled()` caches its first answer in a `static` (`qt.cpp:393`), so the theme can't change at runtime yet. A DWM dark title bar is already set at runtime in the `QVLCFrame`/`QVLCDialog`/`QVLCMW` constructors (`util/qvlcframe.hpp:49-83`). QStyle chooser → QSettings `MainWindow/QtStyle` (`simple_preferences.cpp:793-829`, applied `qt.cpp:681`). 14 `setStyleSheet` calls in 7 files, 11 `styleSheet` entries in `.ui` files, ~52 `QColor(` literals, `styles/seekstyle.*` | Replace all of them with one theme system applied before the main window is built, and drop the static cache (see Phase 1). |
| Qt API compatibility | `qt.hpp:133` provides a `QOverload` polyfill for Qt 5.6; `simple_preferences.cpp:821` already uses a C++14 init-capture (warns under `-std=gnu++11`) | Check `qt.hpp` before assuming an API is missing; don't copy the init-capture pattern. |
| Icons | PNG/SVG files in `modules/gui/qt/pixmaps/` (toolbar, menus, playlist, prefs, types) listed in `vlc.qrc` | Replace with the design's glyph set as SVG (qtsvg is available). |

## 2. Code map

| Design area | 3.0.x code | Notes |
|---|---|---|
| App start, options | `qt.cpp` (`add_bool("qt-…")`, `Open`, dark palette), `util/qvlcapp.hpp` | Add new options here, e.g. `qt-redesign-theme` (system/dark/light) and `qt-player-layout` (docked/immersive). |
| Main window | `main_interface.cpp/.hpp` (`MainInterface : QVLCMW`): menu bar, `VideoWidget`, `BackgroundWidget` (cone), `PlaylistWidget` (docked or separate), `ControlsWidget`, `InputControlsWidget`, status bar, minimal view, fullscreen | The central "stack" (background / video / playlist) becomes: sidebar + content stack (Library, Player, Audio, Settings) + playlist panel + bottom deck or now-playing bar. |
| Windows-specific | `main_interface_win32.cpp`: `MainInterfaceWin32` is a `QAbstractNativeEventFilter` installed app-wide (`:94`), **not** a `nativeEvent` override, and it never checks `msg->hwnd`. Handles `TaskbarButtonCreated`, `THBN_CLICKED`, `WM_APPCOMMAND`. Thumbnail buttons via COM `ITaskbarList3` (`:124-210`). HWND via `WinId()`. Snap detection via `GetWindowPlacement` in `resizeEvent` (`:365`). No `WM_NCCALCSIZE`/`WM_NCHITTEST` code exists | Put the frameless/custom title bar code (`WM_NCCALCSIZE`, `WM_NCHITTEST`, snap layouts), DWM shadow, dark title bar and Mica (runtime-loaded) here, gated on `msg->hwnd == WinId(this)` so dialogs and the FSC aren't affected. Keep the taskbar thumbnail buttons. `resizeStack`, `setMinimalView` and the tiling logic do height maths that assume a native frame and menu bar. |
| Menu bar & menus | `menus.cpp/.hpp` (`VLCMenuBar::createMenuBar`, `:326-349`, fills `QMainWindow::menuBar()`; Playback/Audio/Video/Subtitle/View are rebuilt on `aboutToShow`), `actions_manager.*` | Keep every menu and action. Move the menu bar into the custom 40 px title bar with `QMainWindow::setMenuWidget()` and update every `menuBar()` call (`main_interface.cpp:318, 849-850, 1131, 1145-1183`, `menus.cpp:332`). Ctrl+H, Ctrl+L, F11 and the menu shortcuts are hard-coded in `menus.cpp:360-513` and `main_interface.cpp:1667`; other keys go through `key-pressed` → core `key-*`. Restyle `QMenu` with QSS + icons. |
| Control deck | `components/controller.cpp/.hpp`: `AbstractController`, `ControlsWidget` (2 lines), `AdvControlsWidget`, `InputControlsWidget`, `FullscreenControllerWidget`; layouts are strings in QSettings (`MainWindow/MainToolbar1`, `MainToolbar2`, `AdvToolbar`, `InputToolbar`, **`FSCtoolbar`**, plus `ToolbarPos`; defaults `MAIN_TB1_DEFAULT`, `MAIN_TB2_DEFAULT`, `ADV_TB_DEFAULT`, `INPT_TB_DEFAULT`, `FSC_TB_DEFAULT` in `controller.hpp:37-41`) built from `buttonType_e` | Keep the system and the toolbar editor (`dialogs/toolbar.cpp`). Make the design's simple and Advanced Controls decks the **new default strings**. Add any missing types (tracks popover button, speed popover, mini-player button) as new `buttonType_e` values appended at the end of their range (see 2.1) so stored layouts stay valid. |
| Control widgets | `components/controller_widget.cpp` (`SoundWidget`, `AtoB_Button`, `LoopButton`, `PlayButton`, `AspectRatioComboBox`; teletext is `AbstractController::telexFrame()` in `controller.cpp:591`, there is no `TeletextController`), `util/buttons/RoundButton.cpp`, `DeckButtonsLayout.cpp`, `BrowseButton.cpp` | Restyle: 36 px icon buttons, 44 px accent play circle, press scale (`QPropertyAnimation`). |
| Seek bar | `util/input_slider.cpp` (`SeekSlider`, chapters, time tooltip `util/timetooltip.cpp`), `styles/seekstyle.cpp` | Repaint to spec: 4→6 px track on hover, chapter gaps, 14→16 px knob with halo. |
| Volume | `util/input_slider.cpp` (`SoundSlider`, `qt-slider-colours`), max via `qt-max-volume` (125) | Flat 4 px track, tick at 100 %, boost colour. |
| Video area, paused badge, buffering | `components/interface_widgets.cpp` (`VideoWidget`, `BackgroundWidget`), `input_manager.cpp` (state, buffering events) | The vout draws into `VideoWidget`'s child `stable` widget (`WA_NativeWindow` + `WA_PaintOnScreen`, `interface_widgets.cpp:123-158`), so Qt children can't paint over it. Copy the FSC pattern instead: a frameless `Qt::Tool` top-level window parented to `MainInterface`, `WA_ShowWithoutActivating`, positioned over the video. Buffering: `InputManager::cachingChanged(float)`; state: `playingStatusChanged(int)`. **Spike this early.** |
| Immersive layout | `FullscreenControllerWidget` (`controller.cpp:782+`; frameless `Qt::Tool` window, whole-window `setWindowOpacity(qt-fs-opacity)`, shown by the vout's `mouse-moved` callback, `qt-fs-sensitivity`) | Reuse it in windowed mode for the immersive layout; restyle with a translucent background. |
| Playlist panel | `components/playlist/playlist.cpp` (`PlaylistWidget`), `standardpanel.cpp` (views), `playlist_model.cpp`, `views.cpp` (delegates), `selector.cpp` (`PLSelector` left tree) | Docked right panel, 40 px custom delegate rows, filter field, context menu. |
| Sidebar nav | `components/playlist/selector.cpp` (`PLSelector`, a `QTreeWidget`: Playlist, Media Library (only if enabled), My Computer › My Videos/Music/Pictures, Devices, Local Network, Internet; SD items from `vlc_sd_GetNames()` sorted by `SD_CAT_*`, `:227-329`) | Reuse its data (service-discovery nodes) behind a new sidebar widget: Home, Videos, Music, Network, Preferences. |
| Library: Home | Data: `recents.cpp` (`RecentsMRL`: recent MRLs + saved play times, which drive `qt-continue`) | Continue watching = recents that have a saved time. Recent media = recents list. |
| Library: Videos / Music | Data: service discovery `video_dir` / `audio_dir` (`modules/services_discovery/mediadirs.c`). The "Media Library" playlist node exists only when the `media-library` option is on (default **off**, `src/libvlc-module.c:2104`); it is a flat list saved to `<userdata>/ml.xspf`, with no database and no scanning | Grid views on these nodes. Album grouping from input-item meta (artist/album/art) needs preparsing. **No video thumbnails exist in v3**: start with the striped placeholder; thumbnails are an optional later task. |
| Library: Network | SD nodes: `upnp` (only if its contrib is built), `sap`, `microdns`, `podcast`, lua `icecast`; discs come from `windrive.c`, which registers as SD **`disc`** ("Discs", `SD_CAT_DEVICES`) | "On your network" (UPnP + Windows shares) and "Streams" groups. |
| Now-playing bar, mini player | `main_interface.cpp` (minimal view, `qt-minimal-view`) | New 76 px bar widget shown in library views. Mini player = small frameless always-on-top `QWidget` window. |
| Audio mode + visualizer | `BackgroundWidget` (art), audio visualization filters (`modules/visualization`). `VisualSelector` is only forward-declared; its creation is under `#if 0` (`main_interface.cpp:516-520`) | Album art and tracklist view. For the spectrum, either run the `visual` filter or animate fake bars from playback state. Decide in a spike. |
| Tracks / speed popovers | `components/interface_widgets.cpp` (`SpeedControlWidget`, `SpeedLabel`), menus for audio/subtitle tracks in `menus.cpp` | Popup `QFrame` with two columns bound to the track variables (`audio-es`, `spu-es`). |
| Effects & filters | `dialogs/extended.cpp`, `components/extended_panels.cpp`, `ui/equalizer.ui`, `ui/video_effects.ui` | Re-layout as a docked side sheet (`QWidget` panel) with tabs Equalizer · Video · Synchronization. Keep the logic in `extended_panels.cpp`. Today's tabs: Audio Effects (Equalizer, Compressor, Spatializer, Stereo Widener, Advanced), Video Effects (Essential, Crop, Colors, Geometry, Overlay, Advanced), Synchronization, v4l2 (optional). `ExtVideo` is a `QObject` that `setupUi`s onto its parent `QTabWidget`, so the whole tab widget must move; the Save logic (`putAudioConfig`/`putVideoConfig`) lives in `ExtendedDialog` and must move with it. Panels act on the live player through `var_*`, so they don't depend on the dialog. |
| Open media | `dialogs/open.cpp`, `components/open_panels.cpp`, `ui/open*.ui`, `dialogs/openurl.cpp` | One tabbed sheet (File · Disc · Network · Capture). Re-layout the `.ui` files and restyle. |
| Preferences | `dialogs/preferences.cpp`, `components/simple_preferences.cpp`, `ui/sprefs_*.ui`, `complete_preferences.cpp`, `preferences_widgets.cpp` | In-window simple prefs view (section list + row cards). "Show all settings" opens the existing complete prefs. `sprefs_*.ui` exist for interface, audio, video, subtitles, input; Hotkeys has no `.ui` (`KeySelectorControl`). `PrefsDialog` is created with `new` on every open (`dialogs_provider.cpp:252`); most other dialogs are `Singleton<T>`. |
| Media info, go to time, about, errors, messages | `dialogs/mediainfo.cpp` + `components/info_panels.cpp`, `dialogs/gototime.cpp`, `dialogs/help.cpp` + `ui/about.ui`, `dialogs/errors.cpp`, `dialogs/messages.cpp` | Restyle; error dialog gets the design's layout (Show log + Retry). |
| Toasts | none (there's an OSD on the video) | New `ToastWidget` (frameless child, fade/rise, 2.4 s). |
| Drop target | `MainInterface::dropEvent` / `dropEventPlay` (`main_interface.cpp:1556-1649`) | Overlay widget shown on `dragEnterEvent`. **Shift = enqueue is not supported today**: `dropEvent` always plays; only drops on `PlaylistWidget` enqueue. Add a `keyboardModifiers()` check (a behaviour change; confirm with the owner). A single URL dropped during playback is tried as a subtitle first (`:1580`). Drags over the native video child may not reach Qt; verify in the overlay spike. |
| Icons | `pixmaps/**`, `vlc.qrc` | New SVG set; keep file names where code references them, or update references. |
| App icon | `share/icons/vlc.ico` + PNG sizes (used by `bin/vlc_win32_rc.rc.in`), NSIS assets in `extras/package/win32/NSIS` | Change it only after the user picks 1a / 1b / 1c. |
| Easter-egg icons | `qt.cpp` (`qt-icon-change`, xmas cone) | Keep them working with the new icon set. |

### 2.1 Verified details (code check, Nov 2026)

**Main window layout.** `MainInterface : QVLCMW : QMainWindow`. The central widget's `QVBoxLayout` holds, in order: resume panel, `stackCentralW` (`QVLCStackedWidget`), `InputControlsWidget`, `ControlsWidget` (moved to row 0 by `MainWindow/ToolbarPos`) (`main_interface.cpp:466-512`). The stack holds `bgWidget`, `videoWidget` (only with `embedded-video`) and `playlistWidget` (only when docked). `showTab()` (`:651-723`) reparents the native `videoWidget` into `playlistWidget->artContainer` when switching to the playlist; `resizeStack()` resizes the whole window unless fullscreen, maximised or tiled. Docking: QSettings `MainWindow/pl-dock-status` (default true), `dockPlaylist()` (`:1083`); undocked → `PlaylistDialog` singleton.

**Toolbar strings.** Defaults (`controller.hpp:37-41`):
```
MAIN_TB1_DEFAULT "64;39;64;38;65"
MAIN_TB2_DEFAULT "0-2;64;3;1;4;64;7;9;64;10;20;19;64-4;37;65;35-4"
ADV_TB_DEFAULT   "12;11;13;14"
INPT_TB_DEFAULT  "43;33-4;44"
FSC_TB_DEFAULT   "0-2;64;3;1;4;64;37;64;38;64;8;65;25;35-4;34"
```
Grammar (`parseAndCreate`, `controller.cpp:117-161`): items separated by `;`, each `type[-flags]`; flags bitmask `WIDGET_FLAT=0x1`, `WIDGET_BIG=0x2`, `WIDGET_SHINY=0x4`; malformed items are skipped with a warning.
`buttonType_e` ranges (`controller.hpp:56-99`): buttons `0..25` then `BUTTON_MAX` (room up to 31); special widgets `0x20..0x2C` then `SPECIAL_MAX` (room up to 63); spacers `0x40`, `0x41`. A new button also needs entries in `nameL`, `tooltipL` and `iconL` (sized `[BUTTON_MAX]`).

**Existing upstream bugs found (not ours; note only):**
- `main_interface.cpp:1035` reads `"playlistSize"` without the `MainWindow/` prefix, so the saved docked-playlist size is never restored.
- `dialogs/toolbar.cpp:267` compares `MainWindow/FSCToolbar` (capital T) but writes `FSCtoolbar` (`:285`), so closing the editor unchanged still rewrites settings.

**Embeddable in-window vs separate window.** Embeddable: playlist (already moves between dialog and window), info panels, open panels, simple-prefs panels, effects panels (with the Save logic moved). Separate windows only: `QVLCFrame` dialogs (MediaInfo, Help, Messages, Update), the complete `PrefsDialog`, the native `QFileDialog` unless `qt-embedded-open`.

## 3. Design → v3 adaptations (agree these before coding)

1. **Mica / acrylic**: use it on Windows 11 (runtime-loaded `DwmSetWindowAttribute` `DWMWA_SYSTEMBACKDROP_TYPE`). Otherwise use the solid `--chrome` / `--glass` colours. Floating bars use a semi-transparent painted background, not a real blur.
2. **Overlays over video**: the video is a native child window, so any widget painted on top must be its own native window or top-level popup. Prove this in a spike before Phase 3.
3. **Library data** is thinner than in v4: no media database and no thumbnails. Show what v3 can supply; leave space for thumbnails.
4. **Fonts**: Segoe UI Variable on Windows 11, Segoe UI elsewhere. Use the system fonts; don't bundle Segoe. JetBrains Mono (OFL) can be bundled, or use Consolas.
5. **Icons**: Material Symbols Rounded is Apache-2.0. That's fine in a GPLv2-or-later fork when distributed under GPLv3. Record it in the licence file, or redraw the icons.
6. **Animation**: `QPropertyAnimation` + `QGraphicsOpacityEffect` (avoid opacity effects over video). Respect `SystemParametersInfo(SPI_GETCLIENTAREAANIMATION)`.
7. **HiDPI**: `qt.cpp` already sets `AA_EnableHighDpiScaling` and `AA_UseHighDpiPixmaps`. Write sizes in device-independent px from the tokens, and use SVG icons so they stay sharp.

8. **Shortcut clash**: the design uses Ctrl+H for the mini player, but in VLC 3 Ctrl+H toggles the Minimal Interface. Keep VLC 3's binding and give the mini player a free shortcut, or a View menu entry only. Ask the user which.

## 4. Phases (each one is a branch with small commits that each build and run)

**Phase 0 — Environment & baseline.** Docker/WSL build of unmodified `3.0.x` with prebuilt contribs. Find the fast incremental loop (rebuild only `libqt_plugin.la` and refresh the package). Take baseline screenshots of every main screen. Render the design references.

**Phase 1 — Theme foundation.** A `ThemeManager` (new `util/theme.cpp/.hpp`) that holds the dark and light tokens (start from `design/v3/redesign_tokens.hpp`), builds the `QPalette`, generates the application QSS from tokens, follows the Windows light/dark setting (registry `AppsUseLightTheme`) with a `qt-redesign-theme` override, and gives every widget sizes and fonts. Replace `qt-dark-palette` and the scattered `setStyleSheet` calls. Add the new icon set. Result: the whole app is restyled with no layout changes.

**Phase 2 — Window shell.** Frameless window with a custom 40 px title bar: cone, inline menu bar, centred title, caption buttons. Keep native snap, resize and Aero shake. Add the sidebar (with an icon rail below 1200 px), a central `QStackedWidget` with fade/rise view transitions, breakpoints (L/M/S/XS), toasts and the drop target.

**Phase 3 — Player.** Docked deck under the video (new default toolbar strings), seek and volume repaint, paused badge, buffering, tracks and speed popovers, playlist panel (40 px delegate, filter, context menu, overlay drawer at XS), immersive layout (based on the FSC), now-playing bar, mini player, audio mode.

**Phase 4 — Library.** Home (continue watching + recent), Videos and Music grids, Network, empty state, search.

**Phase 5 — Sheets & dialogs.** Effects & filters sheet, Open media sheet, in-window Preferences, Media info, Go to time, Error, About.

**Phase 6 — Polish.** Light theme on every screen, XS behaviour, keyboard focus and accessibility (`setAccessibleName`, tab order), reduced motion, HiDPI 100/125/150/200 %, Windows 10 and 11, app icon, and a screenshot comparison against every row of `SCREEN_INVENTORY.md`.

## 5. Checks for every phase
- Build with `build.sh` or the incremental loop. The plugin must load, so check `vlc.exe -vvv` for qt module errors.
- Run on Windows 10 and 11: dark/light, 100 % and 150 % scale, window widths 1920, 1280, 1024 and 800.
- Reproduce the phase's `SCREEN_INVENTORY.md` states, screenshot them, compare with `references/`, and log differences in `PROGRESS.md`.
- Existing features still work: the toolbar editor, minimal view, fullscreen controller, systray, taskbar buttons, all hotkeys, the separate playlist window, and skins2 (`-I skins2` must still start).
