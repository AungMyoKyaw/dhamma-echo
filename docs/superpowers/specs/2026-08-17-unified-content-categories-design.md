# Unified Content Categories Design

## Goal

Make the Explore category strip represent the catalogue that the application can
actually search and play. Video categories must appear alongside the existing
audio and Abhidhamma categories, and selecting a category must return the same
kind of rows counted by its chip.

## Context

The bundled database contains these meaningful category records:

- Audio in Myanmar
- Audio in English
- Video in Myanmar
- Video in English
- Abhidhamma in Myanmar
- Abhidhamma in English

The current `list_audio_categories` query only includes category types
`audio` and `abhidhamma`, and joins only `media.type = 'audio'`. The Explore
view consequently renders an audio-only strip even though `search_audio`
already returns both audio and video rows.

The database also contains a small amount of media whose `media.type` does not
match an `audio` or `video` category label. Category counts and category search
must use one shared semantic rule so those rows do not make the UI count and
the result set disagree.

## Approaches considered

### Append video categories to the existing audio response

Widen the category query to include `video` rows and leave the existing
`audioCount` field and category filtering untouched. This is the smallest code
change, but it makes the field name inaccurate and allows mixed-media rows to
appear under a category whose label describes one media type.

### Unified content categories with server-side semantic matching (selected)

Expose a neutral `ContentCategory` model with a `count` field. Include category
types `audio`, `video`, and `abhidhamma`, while counting only `audio`/`video`
media. Audio categories count audio rows, video categories count video rows,
and Abhidhamma categories count both media types. Category search applies the
same rule from the selected category's database type, so each chip's count
matches its results.

Keep the existing `list_audio_categories` Tauri command string for IPC
stability; only its internal model and implementation become content-aware.

### Add a separate media-type filter

Add Audio/Video state to the Explore form and keep category selection separate.
This offers more combinations later, but introduces another filter state and
interaction surface for a request that only needs the existing category strip
to become complete.

## Design

### Data and API

- Replace the misleading category payload shape with `ContentCategory`:
  `id`, `name`, `language`, and `count`.
- Keep the existing `list_audio_categories` command boundary so no new Tauri
  capability or command is introduced.
- Update the Rust category query to include `audio`, `video`, and
  `abhidhamma` category types.
- Join only `media.type IN ('audio', 'video')`.
- For `audio` and `video` category types, count rows whose media type matches
  the category type. For `abhidhamma`, count both audio and video rows.
- Apply the same category-type rule inside `search_audio` when a category ID
  is provided. Invalid or unsupported category types do not become visible
  through the category endpoint and do not broaden a category search.
- Keep the existing summary, collections, teacher counts, and media playback
  behavior unchanged. This change is limited to category discovery and the
  category-scoped search predicate.

### Explore UI

- Rename the category strip's accessible label to `Content categories`.
- Rename the default chip to `All content`.
- Render `item.count` instead of `item.audioCount`.
- Change the fallback copy to refer to the complete talk catalogue rather than
  an audio-only catalogue.
- Preserve the current chip layout, colors, active state, and category filter
  pill. The new Video in Myanmar and Video in English chips therefore inherit
  the existing visual language without introducing a second control style.

### Mock catalogue

Update the deterministic browser mock to include the video category records
and at least one video track mapped to a video category. This keeps the web
preview representative of the bundled catalogue and lets the category filter
be exercised without Tauri.

### Error handling and compatibility

No new error states are required. Existing category loading and retry behavior
remain unchanged. The IPC command name remains stable, and no database schema,
CSP, dependency, or persistence change is needed.

## Testing

- Rust database tests prove all six meaningful categories are returned, counts
  are based on the semantic media rule, and category filtering keeps audio and
  video rows aligned with their category type.
- Mock-data tests prove video categories are exposed and a video category can
  return a video row.
- Existing API, reducer, app, and coverage tests remain green after the
  neutral category field rename.
- Run formatting, lint, Svelte typecheck, unit/coverage tests, production
  build, and the web smoke check.
- Render the Explore route through the browser preview and verify the Video in
  Myanmar/English chips are visible, selecting one changes the active chip,
  and the result list is filtered without console/runtime errors.

## Acceptance criteria

- Explore visibly includes Video in Myanmar and Video in English categories.
- Audio, video, and Abhidhamma chip counts match the rows returned by selecting
  each category.
- `All content` returns the existing combined audio/video search set.
- Audio playback and the existing video player remain unchanged.
- No new Tauri command, dependency, permission, CSP host, or persistence key
  is added.
- Required web quality gates pass.
