# Home "Continue listening" — resume last played media

Date: 2026-08-06
Status: approved

## Goal

Let the user resume their last played talk directly from the Home screen: a prominent card for the most recent track plus a short list of the last few played talks, each resuming at its saved position.

## Context

- `library.history` already records `{ id, playedAt }` entries, most-recent-first, deduped, capped at 100 (`store.ts` `record-history`).
- `library.resume` already maps track ID → saved seconds, and `DhammaApp.playTrack` already seeks to it (`app.ts:151`).
- The Tauri command `get_audio_track(id)` exists and is registered (`src-tauri/src/commands.rs:54`, `lib.rs:35`) but is not exposed in the frontend `CatalogueApi`.
- Home currently has no way to resolve a history ID to an `AudioTrack` unless it happens to be in the player queue or current search results.

## Design

### API (`src/api.ts`)

Add `getAudioTrack(id: number): Promise<AudioTrack>` calling the existing `get_audio_track` Tauri command. Failures surface as `CatalogueError` like the other methods.

### State (`src/types.ts`, `src/store.ts`)

New slice: `homeRecent: { status: "idle" | "loading" | "ready" | "error"; tracks: AudioTrack[] }`.

New actions:

- `recent-started` → status `loading`
- `recent-loaded; tracks: AudioTrack[]` → status `ready`
- `recent-failed` → status `error` (no message needed; UI omits the section)

### Loading (`src/app.ts`, `src/main.ts`)

`DhammaApp.loadRecent()`:

1. Take the first 5 entries of `library.history` (already deduped, most-recent-first).
2. Dispatch `recent-started`; fetch each via `api.getAudioTrack(id)` in parallel.
3. IDs that fail to resolve (deleted from catalogue, error) are silently dropped.
4. Dispatch `recent-loaded` with the resolved tracks, preserving history order.

Called from `app.start()` after hydration and whenever a `navigate` action targets `home` (wired in `main.ts` click handler alongside the existing `navigate` dispatch). Empty history short-circuits to `recent-loaded` with `[]` without network calls.

### View (`src/view.ts`)

`renderHome` gains a "Continue listening" section between the hero/stats and featured teachers:

- Hidden entirely when history is empty or status is `error`.
- Loading status renders a single compact skeleton row.
- Ready: one prominent card for the most recent track (title, teacher, `Resume at mm:ss` from `library.resume`, large play button) plus up to 4 compact rows for the rest. Rows reuse the existing `renderTrack` markup where practical; the card is a new small renderer.
- All items use existing `data-action="play-track"` + `data-id`.

### Playback wiring (`src/main.ts`)

In the `play-track` click handler, when `app.findTrack(id)` returns `null`, fall back to `await app.getAudioTrack(id)` (resolved from `homeRecent.tracks` or a fresh API call) and play it. `playTrack` already seeks to `library.resume[String(id)]`, so resume-from-saved-position needs no extra work.

## Error handling

- Catalogue fetch fails → section omitted; Home otherwise unaffected.
- Playback errors → existing player error path (`set-player-error`, retry button).
- Unresolvable history IDs → dropped from the list, never shown as broken rows.

## Testing

- `tests/api.test.mjs`: `getAudioTrack` invokes `get_audio_track` with `{ id }` and maps errors.
- `tests/app.test.mjs`: `loadRecent` resolves top-5 history entries, drops missing IDs, preserves order, skips fetch when history empty.
- `tests/store.test.mjs`: `recent-started` / `recent-loaded` / `recent-failed` reducers.
- `tests/view.test.mjs`: section renders card + rows with resume label, hidden when history empty.

## Out of scope (deliberate)

- Preloading recent tracks at startup regardless of route (add only if Home render feels slow).
- Full history view on Home (overlaps with Library; history is already capped at 100).
- Persisting the queue across launches.
