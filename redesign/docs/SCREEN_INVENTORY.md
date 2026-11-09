# Screen & state inventory

Every frame on the design's flow boards. Each row is an **acceptance target**: when the feature ships, the real VLC build should reproduce that state.

- Default frame: 1280 × 800, dark theme, **docked** layout, unless noted.
- `scene` is the prototype's state string. Open `design/prototype/VLC Redesign.dc.html` and read `parseScene()` and the `state` object to see exactly what each key does.
- Reference renders: run `tools/render-references.mjs` (see README) to get a PNG of every board.

---

## 1. Playback flows (`VLC Flows - Playback.dc.html`)

### 1.1 First launch → first playback
| ID | State | scene | Notes |
|---|---|---|---|
| 1.1.1 | Empty library | `view=library;nav=Home;empty=1` | First run. One primary action (Add a folder), one secondary (Open media). Now-playing bar hidden until something has played. |
| 1.1.2 | Drag files in | `view=library;nav=Home;empty=1;drop=1` | Dragging files anywhere over the window shows the drop target. Shift adds to playlist instead of playing. |
| 1.1.3 | Open media · File | `view=library;nav=Home;empty=1;dlg=1;dlgTab=File` | One tabbed sheet merges File / Disc / Network / Capture. |
| 1.1.4 | Library home | `view=library;nav=Home` | Continue watching (resume progress) then Recent media with full paths. |
| 1.1.5 | Videos | `view=library;nav=Videos` | Video grid; durations on thumbnails; codec + resolution in metadata. |
| 1.1.6 | Playback | `view=player;tv=4` | Clicking a card goes straight into the player with the playlist docked. |

### 1.2 Watching a video
| ID | State | scene | Notes |
|---|---|---|---|
| 1.2.1 | Playing · docked | `view=player` | Controls under the video, docked playlist on the right. |
| 1.2.2 | Paused | `view=player;playing=0` | 76 px centre play badge; click video to resume. |
| 1.2.3 | Playlist hidden | `view=player;playlistOpen=0` | Ctrl+L or playlist button; video expands full width. |
| 1.2.4 | Expert controls | `view=player;playlistOpen=0;expert=1` | View → Advanced Controls adds A–B loop, frame step, snapshot, record, aspect ratio. |
| 1.2.5 | Immersive | `view=player;playlistOpen=0` (layout=immersive) | Floating translucent (Mica/acrylic) bar over full-height video. |
| 1.2.6 | Immersive · idle | `view=player;playlistOpen=0;idle=1` (immersive) | After 2.5 s idle: bar, title and cursor fade out (300 ms). |
| 1.2.7 | Mini player | `view=player;mini=1` | Ctrl+H / PiP button. Compact always-on-top window with transport. |

### 1.3 Audio tracks & subtitles
| ID | State | scene | Notes |
|---|---|---|---|
| 1.3.1 | Tracks popover | `view=player;pop=tracks` | Audio tracks left, subtitles right, codec/channel details per track. |
| 1.3.2 | Commentary track | `view=player;pop=tracks;aTrack=1` | Selection applies immediately. |
| 1.3.3 | Subtitles off | `view=player;pop=tracks;sTrack=0` | Subtitle icon returns to neutral colour. |
| 1.3.4 | Subtitle file added | `view=player;toast=Loaded subtitle: sintel.en.srt` | Add subtitle file… or drop .srt on video → toast. |
| 1.3.5 | Track synchronization | `view=player;fx=1;fxTab=Synchronization` | Audio / subtitle offsets in 50 ms steps. |

### 1.4 Speed, loop & volume
| ID | State | scene | Notes |
|---|---|---|---|
| 1.4.1 | Speed menu | `view=player;pop=speed` | 0.25×, 0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75×, 2×. |
| 1.4.2 | 1.50× active | `view=player;speed=1.5` | Non-default speed shown in accent. |
| 1.4.3 | Repeat one + random | `view=player;loop=one;shuffle=1` | Loop cycles off → all → one; random independent. |
| 1.4.4 | Volume boost | `view=player;vol=115` | Max 125 %. Tick at 100 %; fill turns #ff5a1f above it. |
| 1.4.5 | Muted | `view=player;muted=1` | M or speaker button; level remembered. |

### 1.5 Effects & filters (Ctrl+E — docked sheet over video)
| ID | State | scene | Notes |
|---|---|---|---|
| 1.5.1 | Equalizer | `view=player;fx=1` | 10-band, ±20 dB, preamp. |
| 1.5.2 | Preset: Rock | `view=player;fx=1;preset=Rock` | Presets as chips; editing a band → Custom. |
| 1.5.3 | Equalizer off | `view=player;fx=1;eqOn=0` | Bands dim, keep values. |
| 1.5.4 | Video adjustments | `view=player;fx=1;fxTab=Video` | Brightness, contrast, saturation, hue, gamma; reset. |

### 1.6 Network stream
| ID | State | scene | Notes |
|---|---|---|---|
| 1.6.1 | Media menu | `view=player;menu=Media` | Classic menu bar kept; shortcuts right-aligned. |
| 1.6.2 | Network URL | `view=player;dlg=1;dlgTab=Network` | Mono URL field, supported protocols, recent streams. |
| 1.6.3 | Buffering | `view=player;buffering=1;bufPct=56` | Spinner + % over last frame; URL shown. |
| 1.6.4 | Playing stream | `view=player;playlistOpen=0;tv=3` | |
| 1.6.5 | Error | `view=player;modal=error;playing=0;url=rtsp://192.168.1.44:554/cam1` | Plain-language error, Show log + Retry. |

### 1.7 Open media · other sources
| ID | State | scene | Notes |
|---|---|---|---|
| 1.7.1 | Disc | `view=player;dlg=1;dlgTab=Disc` | DVD, Blu-ray, Audio CD, SVCD/VCD; device + disc-menu options. |
| 1.7.2 | Capture device | `view=player;dlg=1;dlgTab=Capture` | DirectShow camera + microphone. |

---

## 2. Library, menus & settings (`VLC Flows - Library, Menus & Settings.dc.html`)

### 2.1 Playlist management
| ID | State | scene | Notes |
|---|---|---|---|
| 2.1.1 | Docked playlist | `view=player` | Current item tinted, animated indicator; filter field on top. |
| 2.1.2 | Context menu | `view=player;ctx=2` | Play, Stream…, Save/Convert…, Show containing folder, Information…, Copy path, Remove selected (red), Sort by. |
| 2.1.3 | Media info · General | `view=player;modal=info` | Ctrl+I. |
| 2.1.4 | Media info · Codec | `view=player;modal=info;infoTab=Codec` | Ctrl+J. Every stream. |
| 2.1.5 | Media info · Statistics | `view=player;modal=info;infoTab=Statistics` | Bitrates, decoded/lost frames. |
| 2.1.6 | Go to time | `view=player;modal=jump;jumpVal=0:05:12` | Ctrl+T. |

### 2.2 Music
| ID | State | scene | Notes |
|---|---|---|---|
| 2.2.1 | Music library | `view=library;nav=Music` | Album grid. |
| 2.2.2 | Audio mode | `view=audio` | Album art, tracklist, live spectrum visualizer. |
| 2.2.3 | Paused | `view=audio;playing=0` | Visualizer settles flat. |
| 2.2.4 | Audio · immersive | `view=audio` (immersive) | Floating control bar. |
| 2.2.5 | Library with now playing | `view=library;nav=Home;mode=music` | 76 px now-playing bar persists across library pages; expand → audio mode. |

### 2.3 Network & streams
| 2.3.1 | Network | `view=library;nav=Network` | SMB, UPnP and Windows shares; Streams group (open stream, Icecast, podcasts). |
|---|---|---|---|

### 2.4 Menu bar — every menu
`view=player;menu=<Name>` for Media, Playback, Audio, Video, Subtitle, Tools, View, Help. Item lists and shortcuts are in the prototype's `M` object — keep them identical to VLC's existing menus (see `modules/gui/qt/menus.cpp`).

### 2.5 Preferences (Ctrl+P)
`view=settings;sec=<Section>` for Interface, Audio, Video, Subtitles / OSD, Input / Codecs, Hotkeys, Advanced. Rows per section are in the prototype's `SETTINGS` object. Simple prefs by default; Advanced → "Show all settings" reveals the full module tree (existing expert prefs).

### 2.6 System feedback
| 2.6.1 | Snapshot saved toast | `view=player;playlistOpen=0;toast=Snapshot saved to Pictures\vlcsnap-….png` | Rises in, auto-dismiss 2.4 s. |
|---|---|---|---|
| 2.6.2 | About | `view=library;nav=Home;modal=about` | Help → About. |

---

## 3. Screen sizes & themes (`VLC Screen Sizes & Themes.dc.html`)

### 3.1–3.5 Each key screen across breakpoints
Screens: Player (`view=player`), Library (`view=library;nav=Home`), Audio mode (`view=audio`), Preferences (`view=settings`), Effects open (`view=player;fx=1;playlistOpen=0`).
Sizes: **L** 1920×1080 · **M** 1280×800 · **S** 1024×700 · **XS** 800×600.

- < 1200 px: sidebar collapses to icon rail.
- XS: playlist becomes an overlay drawer with shadow (video keeps full width); stop, loop, random, speed, mini, fullscreen move to menus.
- Library grid columns: L 5 · M 4 · S 3 · XS 2. Docked playlist width: L 360 · M 320 · S 300.

### 3.6 XS details (800×600)
Playlist as overlay · Tracks popover at XS (`view=player;playlistOpen=0;pop=tracks`) · Open media at XS (`view=library;dlg=1`).

### 3.7 Light theme
Player, Library, Videos, Audio mode, Preferences, Effects, Tracks, Menu open (Tools), Open media, Media information (Codec), Error, Empty library, Immersive, Mini player — same structure; neutrals flip, accent and video surfaces stay.
