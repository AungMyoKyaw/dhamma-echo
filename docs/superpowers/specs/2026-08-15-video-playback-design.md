# Video Playback Design

## Goal

Make Dhamma Echo play Dhamma talk videos from the existing catalogue as a first-class surface alongside audio. Video rows (~14,500 in the current `dhamma.db`) become reachable, identifiable, and playable in the same desktop shell without changing the catalogue footprint, the Tauri command surface, the local-first privacy model, or the persistent-audio-player promise.

## Context

The bundled `dhamma.db` `media` table carries three `type` values today:

| type  | format       | rows   | webview playable              |
| ----- | ------------ | ------ | ----------------------------- |
| audio | mp3          | 29,070 | yes                           |
| audio | wma          | 1,493  | no (macOS webview)            |
| video | mp4          | 14,474 | **yes (new)**                 |
| video | wmv          | 390    | no (browser does not support) |
| video | mpg          | 1      | no                            |
| ebook | pdf/doc/docx | 2,532  | out of scope                  |

Host distribution for the 14,474 video rows:

| host                             | count   |
| -------------------------------- | ------- |
| `dhammadownload.com`             | 14,456  |
| `www.dhammadownload.com`         | 2       |
| `ddhammadownload.com` (typo)     | 16      |
| `wwww.dhammadownload.com` (typo) | 0 (mp4) |
| `mms://...`                      | 0 (mp4) |
| `file:///`                       | 0 (mp4) |

Almost all video rows resolve on the canonical `dhammadownload.com` host that is already in the CSP and URL allowlist. The few typo/`mms`/`file` rows for video are negligible (16) and remain searchable but unplayable, mirroring the existing WMA behavior.

Rust already filters catalogue queries on `m.type = 'audio'`. The `type` column is the source of truth for audio vs video; the `format` column is a sub-classification within a type. Widening the search/filter to video is therefore a `m.type IN ('audio','video')` change plus a `format` filter that accepts `mp4` and `wmv`.

## Product constraints

- Desktop application remains Svelte 5 + TypeScript + Vite + Tailwind CSS v4 inside Tauri 2.
- Bun remains the JavaScript package manager and `bun.lock` remains authoritative.
- The six-command Tauri surface stays closed. No new commands.
- The CSP permits media from `https://dhammadownload.com` and `https://www.dhammadownload.com` only. **No CSP change.**
- The persistent audio player remains the audio transport. Video is a deliberate, route-level surface that does not share the footer.
- Existing local-first behavior: favorites, history, queue, resume positions, settings remain in the webview and are keyed by track ID regardless of media type.
- 100% line/branch/function coverage requirement for the core TypeScript modules is preserved.
- No new production dependency. Native `<video>` element wrapped by a generalized `MediaEngine`. Video.js is explicitly rejected (see Research decisions).
- macOS webview (WKWebView) is the only target. HLS/DASH streaming and external captions are out of scope.

## Research decisions

### Discriminator: `media.type`, not `format`

The catalogue schema already separates audio and video at the `type` column. Every Rust query already filters on `m.type = 'audio'`. The `format` column is a sub-classification within a type. We pass `media_type` through the IPC response so the frontend can choose `<audio>` vs `<video>` from a single, unambiguous field. Inspecting `format === 'mp4'` to decide media kind would couple the frontend to the format taxonomy and break if `m4v`/`webm` ever appear.

### Native `<video>` over Video.js or Plyr

Video.js v10 (`@videojs/react/video`) is the headline recommendation for new projects. After reading its docs on Context7:

- v10 is **React-first**. The `Player.Provider` / `Player.usePlayer` hook model maps to Svelte 5 runes only with a heavy adapter.
- The project's `Player.svelte` is a custom skin (play/pause, seek-15, scrubber, rate, queue). Video.js's biggest ergonomic win — a ready-made UI — is irrelevant.
- The `production-ui-hardening` design forbade new production dependencies for `UI` work, and nothing about video rewrites that trade-off.
- Native `<video>` inherits the same `HTMLMediaElement` API as the existing `<audio>` element, so the existing `AudioEngine` (extended to `MediaEngine`) and `PlayerEvent` stream extend verbatim.

Plyr is a smaller alternative but the same reasoning applies: we already built and own the controls.

### Single engine, two elements

`AudioEngine` already abstracts away the media element behind an `AudioLike` interface. `AudioLike` is structurally a subset of `HTMLMediaElement` (no `videoWidth`/`videoHeight`/poster attributes — fine to leave out). The existing `MediaLike` shaping carries over to `<video>` without an engine rewrite. The change is to widen `mediaUrlCandidates` (frontend URL guard) and the Rust `is_webview_playable` predicate to accept `mp4`, and to expose `mediaType` through the IPC model.

### One route, one player

A new `play` route renders a `VideoView` for `mediaType === 'video'`. The persistent audio player in the footer hides while the route is active. Audio continues to use the persistent footer as before. This honors the UI shell documentation's "persistent audio player" promise without forcing video into the same chrome.

### Typo/`mms`/`file` rows stay in the catalogue

The 16 video rows on `ddhammadownload.com` (typo) and `file:///` URLs are kept in the catalogue and marked `playable: false` with a "Source unavailable" reason. This mirrors the existing WMA behavior. Hiding them would silently drop catalogue data and drift away from the source of truth.

### Resume, history, favorites, queue are media-type-agnostic

All library state is keyed by track ID. The player route — audio or video — reads and writes the same `library.resume`, `library.history`, `library.favorites`, and `player.queue` slices. No new persistence keys.

### No new Tauri commands

The existing six commands (`search_audio`, `get_audio_track`, `search_collections`, `get_collection`, `get_teacher`, `get_summary`) continue to serve both audio and video. `get_audio_track` is renamed mentally but **not** renamed at the IPC boundary — the command name `get_audio_track` is preserved for backward compatibility, and the response shape gains `mediaType`.

## Behavior

### Discovery

The Explore and Collection views already return `AudioTrack` rows. After this change, the same rows can carry `mediaType: "audio"` or `mediaType: "video"`. The Explore format filter widens to include `mp4` and `wmv`. The catalogue page continues to render rows with the same `TrackRow` component; a small "Video" badge differentiates video rows.

### Track selection

- `AudioTrack` with `mediaType: "audio"` → existing path: `App.playTrack` constructs an `<audio>` element, loads the candidate URL, the persistent footer plays.
- `AudioTrack` with `mediaType: "video"` → `App.playTrack` navigates to the `play` route, renders `VideoView`, the footer hides while the route is active.

In both cases `App.playTrack` records history, looks up `library.resume[track.id]`, and seeks after metadata loads. The resume key is the track ID; video and audio tracks share the same `resume` map.

### Video transport

`VideoView` renders a 16:9 `<video>` element with the candidate URL set, custom controls (play/pause, seek-15, scrubber, rate, queue), and an `Esc` / `←` close button that returns to the previous route. The transport skin is the same component class the audio player uses, so keyboard shortcuts (`space`, `←`, `→`) work identically.

### Loading, error, retry

`<video>` fires the same `loadedmetadata`, `play`, `pause`, `timeupdate`, `ended`, `error` events as `<audio>`. The generalized `MediaEngine` listens to the same set and emits the same `PlayerEvent` stream. The candidate-fallback loop (primary host → fallback host → final error) is reused verbatim. The retry button is rendered in `VideoView` the same way it is in the persistent footer.

### Resume

`resume[trackId]` is applied after `loadedmetadata`. The bounded clamp (`resumeAt` ≤ `duration`) carries over. Video tracks without a saved resume start from 0. Completion resets the saved position to 0, same as audio.

### Format filter

The Explore format dropdown gains `mp4` and `wmv`. Selecting `mp4` matches `format = 'mp4'` rows regardless of `mediaType`; selected `wmv` matches `wmv`. Selecting `all` (default) shows both audio and video rows.

### WMV / mpg / typo / mms / file rows

These are surfaced in the catalogue (searchable, browsable, count in summary) but marked unplayable. The `TrackRow` shows a "Source unavailable" hint and disables the play button. Download (if ever added) is also disabled. This matches the existing WMA pattern.

## Architecture and components

### Rust (`src-tauri/src/`)

**`models.rs`**

- `AudioTrack` gains `pub media_type: String` (values `"audio" | "video"`).
- `AudioSearchRequest.format` widens: `["mp3", "wma", "mp4", "wmv"]`.

**`db.rs`**

- `is_webview_playable` accepts `mp3` and `mp4`. Host prefix list unchanged.
- `map_audio_track` reads `m.type` and emits `media_type`. Rename mentally to `map_media_track`; the public function name stays `map_audio_track` for stability.
- `audio` / search queries change `m.type = 'audio'` to `m.type IN ('audio', 'video')` and `SELECT` `m.type` alongside the existing columns.
- Categorical queries (e.g. `c.type IN ('audio', 'abhidhamma')`) and teacher summary queries continue to filter on `m.type = 'audio'` so collections and teacher counts remain audio-only. Video does not appear in teacher or category counts in this release.

**`commands.rs`**

- No new commands. `search_audio` and `get_audio_track` return the same shapes with the new `mediaType` field.

### Frontend (`src/`)

**`types.ts`**

- `AudioTrack` gains `mediaType: "audio" | "video"`.
- `FormatFilter` widens to `| "mp4" | "wmv"`.
- `Route` widens to `| "play"`.

**`utils.ts`**

- `mediaUrlCandidates` accepts `mp3` and `mp4`. The published error message for other formats is updated to name the unplayable formats (`wma`, `wmv`, `mpg`).

**`player.ts`**

- Rename `AudioEngine` → `MediaEngine` (file rename tracked separately; the class name is the public symbol). The `MediaLike` interface is structurally the same as `AudioLike` with the same method set.
- The existing `MediaLike` interface already accommodates `<video>` (no additions needed).
- The candidate-fallback loop is unchanged.

**`app.ts`**

- `playTrack` branches on `track.mediaType`:
  - `"audio"` → existing path, persistent footer plays.
  - `"video"` → navigate to `play` route, render `VideoView`.
- `findTrack` and `getAudioTrack` continue to return an `AudioTrack` regardless of `mediaType`; the caller decides what to do with the result.

**`store.ts`**

- `Route` widens to include `"play"`.
- `play` route participates in `navigationContext` so the close button returns to the previous route (collection, teacher, library, etc.).

**`views/`**

- New `VideoView.svelte`:
  - 16:9 `<video>` element with the candidate URL.
  - Header strip: title (with `lang="my"` when Myanmar), teacher, close button.
  - Transport skin: play/pause, seek-15, scrubber, rate, queue.
  - Loading and error states mirror the persistent footer.
  - Esc closes the route.

**`components/`**

- `Player.svelte` continues to render the persistent audio transport. The component is hidden when `state.route === "play"` and `state.player.current?.mediaType === "video"`.
- `TrackRow.svelte` adds a small "Video" badge for `mediaType === "video"` rows. Unplayable video rows (wmv, typo, file, mms) show a "Source unavailable" hint and disable the play button.

**`main.ts`**

- Navigation to a video track uses `data-action="play-track"` plus a `data-media-type="video"` attribute. The click handler routes to `play` for video and to the existing audio path for audio.

### CSP

No change. `media-src https://dhammadownload.com https://www.dhammadownload.com` already covers video on the same hosts.

### Trust boundaries

- The webview still calls only the six existing Tauri commands.
- Rust validates identifiers, page limits, and the format filter (`mp3`, `wma`, `mp4`, `wmv`).
- `is_webview_playable` is the canonical "is this URL safe to play" check in Rust.
- The frontend `mediaUrlCandidates` remains the per-request URL guard.
- The asset:// protocol is unchanged (poster images are not introduced in this release).

### Persistence

No new persisted keys. `library.resume`, `library.history`, `library.favorites`, `library.queue`, and `settings.*` are unchanged. Video tracks reuse the same slices.

### Security

- No new trust boundary.
- No new dependency, no new network host, no new Tauri capability, no new filesystem permission.
- Video URLs are gated by the same allowlist as audio.

## Testing

### Rust (`src-tauri/src/db.rs` + integration tests)

- `is_webview_playable` accepts `mp3` and `mp4` on `https://www.dhammadownload.com/` and `https://dhammadownload.com/`.
- `is_webview_playable` rejects `wmv`, `mpg`, `wma`, `file://`, `mms://`, `http://` (un-upgraded), foreign hosts, and any host carrying a port or credentials.
- `map_audio_track` emits `media_type` correctly for both `audio` and `video` rows.
- Search queries return both audio and video rows when `format` is `all`; only audio when `format` is `mp3`; only video when `format` is `mp4`.
- `get_audio_track` returns the right `mediaType` for an audio row and a video row.
- In-memory SQLite fixtures cover the union query path and the `format` filter widening.

### Frontend (`tests/`)

- `utils.test.mjs`: `mediaUrlCandidates` returns two HTTPS candidates for `mp4` URLs on the canonical hosts; rejects `wmv`; rejects foreign hosts; rejects credentials/ports.
- `player.test.mjs`: `MediaEngine` (renamed from `AudioEngine`) handles a fake `<video>`-shaped object identically — `loadedmetadata`, `timeupdate`, `ended`, `error`, candidate fallback.
- `store.test.mjs`: `Route` includes `"play"`; navigation reducer handles `play` → previous route restoration.
- `app.test.mjs`: `playTrack` with a video track sets `player.current` and navigates to `play`; with an audio track the persistent footer plays.
- `videoView.test.mjs`: `VideoView` renders a `<video>` element with the candidate URL, persists the `MediaEngine` lifecycle, hides the persistent footer, restores the previous route on close.
- `trackRow.test.mjs`: video badge renders for `mediaType === "video"`; unplayable rows show the "Source unavailable" hint and disable play.
- `policy.test.mjs`: no `.only` / `.skip` / `xit` / `xdescribe` in the new or modified tests.

### Coverage

`bun run test:coverage` must continue to report 100% line/branch/function coverage for the measured TypeScript modules. The new `MediaEngine`, `mediaUrlCandidates` mp4 branch, and `VideoView` reducer/handler paths are all exercised.

### Verification matrix

Before merge:

- `bun run verify` (web lint, typecheck, tests, coverage, build, Rust tests, Rust clippy).
- `bun run site:verify` (product site unchanged but still verified).
- Manual smoke: 1280×820 webview, navigate to a video track, play, pause, seek, queue, resume, close.

## Documentation

- Update `README.md` to mention video playback alongside audio.
- Update `docs/architecture/data-flow.md` to show the video path on the playback sequence diagram.
- Update `docs/architecture/modules.md` to reflect the renamed `MediaEngine` and the new `play` route.
- Update the product site landing page to mention video.
- `docs/superpowers/specs/` gains this design spec. `docs/superpowers/plans/` gains the execution checklist.

## Acceptance criteria

- A video track selected from Explore, a Collection, or a Teacher detail page opens the `play` route and plays inside the 16:9 surface.
- The persistent audio footer is hidden while the video route is active and reappears when the route is closed.
- Audio playback behavior is unchanged.
- Resume, history, favorites, and queue work identically for video and audio tracks.
- `mp4` and `wmv` appear in the Explore format filter. `wmv`, typo-host, `mms://`, and `file:///` rows are visible but unplayable with a clear "Source unavailable" reason.
- The CSP, the Tauri command surface, and the production dependencies are unchanged.
- 100% line/branch/function coverage on the measured TypeScript modules is preserved.
- No new focused/skipped tests in the required test set.
- `svelte-check`, ESLint, Prettier, Cargo fmt, and Cargo clippy all pass.
