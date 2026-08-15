# Video Playback — Execution Plan

Tracking checklist for [`2026-08-15-video-playback-design.md`](../specs/2026-08-15-video-playback-design.md). Run in order; each step is sized to land in one commit.

## 1. Rust: schema and queries

- [ ] Add `media_type: String` to `AudioTrack` in `src-tauri/src/models.rs`.
- [ ] Widen `AudioSearchRequest.format` validation in `commands.rs` to allow `mp3 | wma | mp4 | wmv`.
- [ ] Widen `is_webview_playable` in `db.rs` to accept `mp3` and `mp4` on the canonical hosts.
- [ ] Change `m.type = 'audio'` clauses to `m.type IN ('audio', 'video')` in the search SQL and `get_audio_track` queries.
- [ ] Keep teacher/category summary queries on `m.type = 'audio'` (video not counted in summaries).
- [ ] Update `map_audio_track` to read `m.type` and emit `media_type`.
- [ ] Update in-memory SQLite fixtures to include video rows.
- [ ] Add tests: `is_webview_playable` mp4 positive, wmv negative, file/mms/typo negative; `map_audio_track` media_type positive; search returns both audio and video; `get_audio_track` returns video.
- [ ] Run `cargo test --manifest-path src-tauri/Cargo.toml` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`.

## 2. Frontend: types, URL guard, engine rename

- [ ] Add `mediaType: "audio" | "video"` to `AudioTrack` in `src/types.ts`.
- [ ] Widen `FormatFilter` to include `mp4` and `wmv`.
- [ ] Widen `mediaUrlCandidates` in `src/utils.ts` to accept `mp3` and `mp4`; update the published error message.
- [ ] Rename `AudioEngine` → `MediaEngine` in `src/player.ts` and update the `AudioLike` interface documentation to note it covers both `<audio>` and `<video>`.
- [ ] Rename the file `src/player.ts` to `src/media.ts` if the rename is intended at the file level; otherwise keep the filename and update the class name only.
- [ ] Update all imports and tests to the new class name.
- [ ] Add tests: `mediaUrlCandidates` mp4 candidates positive; wmv negative; foreign host negative; credentials/port negative. `MediaEngine` handles a fake `<video>` element identically.
- [ ] Run `bun run test:coverage` to confirm 100% line/branch/function coverage is preserved.

## 3. Application controller and store

- [ ] Widen `Route` in `src/types.ts` and `src/store.ts` to include `"play"`.
- [ ] Branch `playTrack` in `src/app.ts` on `track.mediaType`: audio → existing path; video → navigate to `play`.
- [ ] Update `navigationContext` so the `play` route records its previous route and the close button restores it.
- [ ] Add tests: `playTrack` (audio) does not navigate; `playTrack` (video) navigates to `play`; close restores the previous route.

## 4. Video view and transport

- [ ] Create `src/views/VideoView.svelte` with:
  - 16:9 `<video>` element with the candidate URL.
  - Header strip: title (with `lang="my"` on Myanmar), teacher, close button.
  - Transport skin: play/pause, seek-15, scrubber, rate, queue badge.
  - Loading and error states mirroring the persistent footer.
  - `Esc` and `←` close the route.
- [ ] Hide the persistent `Player.svelte` footer when `state.route === "play"` and `state.player.current?.mediaType === "video"`.
- [ ] Update `App.svelte` to register the new route and to mount `VideoView` for `"play"`.
- [ ] Add tests in `tests/videoView.test.mjs`: renders `<video>` element with the candidate URL; transport updates `state.player`; close button dispatches the previous route; persistent footer is hidden.

## 5. Track row badges and unplayable state

- [ ] Add a "Video" badge to `TrackRow.svelte` for `mediaType === "video"` rows.
- [ ] Show a "Source unavailable" hint and disable the play button for `mediaType === "video"` rows that are `playable: false` (wmv, typo host, mms, file).
- [ ] Add tests: video badge renders for video rows; unplayable video rows show the hint and disable play.

## 6. Explore filter

- [ ] Update the Explore format filter UI in the catalogue view to render `mp4` and `wmv` as options.
- [ ] Confirm the filter selection maps to the widened `format` validation in Rust.
- [ ] Add tests: selecting `mp4` produces a search request with `format: "mp4"`; selecting `wmv` produces a search request with `format: "wmv"`.

## 7. Documentation

- [ ] Update `README.md` to mention video playback alongside audio.
- [ ] Update `docs/architecture/data-flow.md` to include the video path on the playback sequence diagram.
- [ ] Update `docs/architecture/modules.md` to reflect the renamed `MediaEngine` and the new `play` route.
- [ ] Update the product site landing page (`docs/index.html`) to mention video.
- [ ] Update `docs/superpowers/specs/` and `docs/superpowers/plans/` indexes if such indexes exist.

## 8. Verification

- [ ] `bun run verify` passes (web lint, typecheck, tests, coverage, build, Rust tests, Rust clippy).
- [ ] `bun run site:verify` passes.
- [ ] `bun run test:policy` confirms no focused/skipped tests.
- [ ] Manual smoke in a desktop build: navigate to a video track, play, pause, seek-15, queue, resume, close. Confirm the persistent footer is hidden while the video route is active and reappears on close.
- [ ] Manual smoke: audio playback at the persistent footer is unchanged.

## 9. Release

- [ ] Conventional-commit the changes incrementally (one commit per step, or grouped: Rust + frontend rename + video view + tests + docs).
- [ ] Do not amend unless explicitly asked.
- [ ] Stage files by name; avoid `git add -A`.
- [ ] Bump `version` in `src-tauri/tauri.conf.json` if the release flow requires it.
