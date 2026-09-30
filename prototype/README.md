# Dhamma Echo interactive prototype

Browser-only UI/UX prototype. The production Svelte/Rust application remains unchanged. Catalogue records are illustrative. Audio and downloads are simulated; the video player uses a real bundled **24-second silent interface sample**, not a Dhamma recording.

## Preview

Serve the repository root so the bundled font, logo, and sample video resolve:

```bash
python3 -m http.server 4175 --bind 127.0.0.1 --directory .
```

Open `http://127.0.0.1:4175/prototype/`. Direct video preview: `http://127.0.0.1:4175/prototype/#watch/7`.

## Rebuilt video journey

- **Play opens Watch**, not a fixed bottom video panel. The picture leads; seek, transport, speed, and fullscreen sit directly beneath it.
- **Back keeps playback alive.** Browse with a compact video dock, then use **Return to video** to restore the same frame. Filters, loaded result count, and browsing scroll position return with the source view.
- **Stop video is separate from Back.** Stop releases playback; Back only changes the task.
- **Up next is inline**, beside the picture on desktop and below it on mobile. Play, remove, clear, and six-second undo do not require a video queue modal.
- **Fullscreen contains the picture and controls**, not the sidebar, catalogue, or metadata. Controls remain visible. F toggles fullscreen; Escape leaves Watch for browsing when not fullscreen. M toggles mute.
- **Native media behavior:** the sample MP4 really plays, pauses, seeks, changes speed, and fires completion. One video element moves between Watch and the dock without reloading its source. Desktop volume controls manipulate the media element; mobile uses device volume. The sample itself is silent.
- **Preparing and error states** retain a visible recovery action. Autoplay or media failure is not reported as successful playback.
- Mobile Watch remains in the document flow. It never covers half the catalogue with a fixed video overlay. At 860×620, transport stays in the first viewport; the sample frame letterboxes rather than stretching.

## Other represented application workflows

Home, Explore, Collections, Teachers, My library, and Settings remain the primary routes. Teacher and collection details provide contextual Back navigation. Explore combines query, language, format, category, teacher, and collection filters, with active chips and progressive loading across 72 labeled sample records.

My library includes Downloads, Favorites, and History. Favorites, recent history, resume positions, settings, sidebar preference, and **sample download badges** persist under `dhamma-echo:prototype:v1`. No real media files are downloaded; no offline talk playback is provided. Queue and in-progress operations are session-only. Production storage keys are never read or written.

Settings include English/Myanmar UI, light/dark/system appearance, all six playback rates, browse limits, keyboard help, and About. Product strings are copied from `src/i18n.ts`; prototype-specific video copy lives in `video.js`. Illustrative talk content and developer preview controls remain their authored language.

Use **Sample prototype · Preview states** on catalogue routes to exercise loading, empty, error/retry, media/download failure, or first launch. First launch clears only the sample library. Reset restores the seeded sample session. WMA and WMV records stay searchable but cannot play or enter the queue.

## Files and verification

- `index.html`: shell and shared SVG icons.
- `app.js`, `data.js`: sample catalogue workflows and isolated browser state.
- `video.js`, `video.css`: dedicated Watch and compact dock.
- `styles.css`, `parity.css`: preserved identity and catalogue additions.
- `messages.js`: generated product dictionaries. Refresh with `bun scripts/prototype-sync-i18n.mjs`, then format the generated file.
- `FEATURES.md`: source-linked application/prototype comparison.
- `assets/video-sample.md`: sample clip provenance.

```bash
node --test tests/prototype-playback.test.mjs
bun run verify:web
```

Unit tests check state transitions, native-media delegation, queue, persistence, filters, unsupported formats, and watch/dock continuity. They do not measure browser layout or full component coverage. Browser checks separately exercise actual video playback and fullscreen, focus, recovery, and desktop/compact/mobile layouts in light/dark themes and Myanmar.

The established palette and fonts remain intact. `DESIGN.md` Colors, Typography, Shapes, and Components guide the styling; the redesigned video composition is a prototype-only proposal, not a production architecture change.
