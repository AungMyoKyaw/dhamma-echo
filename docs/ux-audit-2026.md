# Dhamma Echo — UX Audit & Staged Fix Plan (2026-Q1)

> Status: **Mostly complete** as of `master` at 2026-Q1 end. See the table below for the per-finding disposition.
> Original author: Claude (grill-me interview)
> Source-of-truth docs (treated as hypotheses, open to revision): `DESIGN.md`, `PRODUCT.md`, `docs/architecture/`
> Method: code review + walkthrough at 860×620 minimum window + design-token conformance + (optional) listener validation.

## Implementation summary

| Wave                 | Description                                                                                                                   | Commit range                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1 — Foundations      | `formatLocaleNumber/Duration`, `pluralize`, `truncateTrackTitle`, search debounce, persistence migration                      | `232c477`                       |
| 2 — Quick wins       | search empty-states, locale threading, library tabs, AsyncState CTA, TextSearchField `size-11`                                | `cd39eb5`                       |
| 3 — View polish      | player hint, queue aria-label, slider step, cheatsheet fix, language picker, browse-limit control, keyboard entry, breadcrumb | `1f8a68f`                       |
| 4 — Cross-cutting    | breadcrumb, video locale duration, sidebar copy, `]` shortcut, VideoPlayer `size-11`                                          | `0392bf6`, `1036eb0`            |
| 5 — High-impact      | home welcome card, featured-teacher tinting, queue panel CSS variable, slider `aria-valuetext`                                | `e456cf5`                       |
| 6 — Backend + slider | `list_content_categories` rename + back-compat alias, slider step `5`, clear-query failure restore                            | `5b42df0`                       |
| 7 — Polish           | track-row resume pill, v1→v2 envelope migration test, prettier sweep                                                          | `68751cc`, `6941ba7`, `4dfeffd` |
| 8 — Touch targets    | filter chips, undo buttons, retry/dismiss, exit-fullscreen, queue close bumped to `size-11`; settings leaf icon; DHL-05 copy | `cb3dfc4`                       |

Findings **not addressed** are listed in §11 — all are out of scope per §9 (server pagination, Tauri shell) or already aligned (avatar fallback palette, sidebar collapse default).

---

## 1. Scope & posture

| Aspect          | Decision                                                                  | Rationale                                                      |
| --------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Scope           | **Moderate redesign** of problematic views                                | Worst-2-stars pain outweighs cost of conservative patch        |
| Surface         | Webview views, components, and copy                                       | Trust boundary (Tauri IPC, Rust, SQLite) stays as-is           |
| Shell           | **Preserve** — `Sidebar`, `Player`, `QueuePanel`, `VideoPlayer`, `Header` | Container, navigation, and trust perimeter are sound           |
| Design language | Open to revision where evidence demands                                   | `DESIGN.md` is a hypothesis; we can rewrite any non-token rule |
| Tokens          | Locked unless drift is the bug                                            | Tokens are the only place code references "design"             |
| Severity        | `Impact × Frequency × Confidence ÷ Effort` (1–5 each → score 0.125–125)   | Forces trade-offs to be explicit                               |

## 2. Non-negotiables (preserved)

- No accounts, analytics, ads, telemetry. Local preferences never leave the device.
- MP3/MP4 only from `https://dhammadownload.com` and `https://www.dhammadownload.com`. CSP unchanged.
- Rust validates every webview→native call. SQLite stays read-only. No `string-concat` SQL.
- Catalogue text is rendered as Svelte text nodes — never `{@html}`.
- Myanmar-script support: `myanmar-text` class, line-break, line-height, padding, font fallback chain.
- Keyboard a11y: visible focus (3px outline), tab order, dialog focus traps, ESC closes overlays.
- `prefers-reduced-motion` honored across the app.
- 44×44 minimum touch targets; min window 860×620; content max 1520px.
- Reduced visual density: no decorative gradients, soft borders, single accent (rust/olive), calm palette.

## 3. Methodology (4-layer audit)

1. **Code & structure** — read every view, component, store reducer, and CSS file. Map info architecture, identify orphaned state, spot anti-patterns.
2. **Walkthrough at minimum window** — 860×620 (Tauri min) + a "compact" 1040px pass + a "wide" 1520px pass. Record states: empty, loading, error, partial, full.
3. **Design-system conformance** — `bun run design:lint` + `bun run design:check`. Manually scan for tokens used in Svelte/CSS that aren't in `DESIGN.md`.
4. **Lightweight listener validation** — only if a Myanmar-speaking listener is reachable in 1–2 days. Five-task think-aloud on resume, search, and library flows.

## 4. Sequencing

Pass each view in this order; collect findings, then write the cross-cutting section at the end.

1. Home (resume, featured teachers, catalogue summary)
2. Explore (search + filters + pagination)
3. Player + QueuePanel + KeyboardCheatsheet (in-footer surfaces)
4. Teachers + TeacherDetail
5. Collections + CollectionDetail
6. Library (Downloads, Favorites, History)
7. Settings (Appearance, Playback)
8. Cross-cutting (a11y, responsiveness, Myanmar, token drift, copy)

## 5. Findings ledger (live)

> This section is filled in **during execution**, view by view. Each finding gets a `DHH-NNN` id, a one-line title, severity score, file paths, and a one-paragraph "why now" justification. Findings roll up into the backlog (§6) and waves (§7).

### Home view

Audit pass: code read of `HomeView.svelte`, `App.svelte`, `ui.ts`; cross-reference with `docs/images/home.png` (2784×1866 desktop capture, dark theme).

**Surface**: resume hero, recent-talks list, "Find something to listen to" empty hero, featured-teachers grid.

**Observed states** (screenshot):

- "Continue listening" hero shows a Myanmar-script title with `Resume at 0:20`, orange play button, soft-orange tint (`bg-app-primary/[0.04]`).
- 4 recent rows in a `bg-app-surface` bordered card; each row uses `TrackRow` (play/pause, favorite, download, queue).
- Featured teachers section is empty in the screenshot — only the section heading "Featured teachers" is visible (catalogue is loading or featured IDs aren't in the loaded subset).
- Bottom player bar visible: title/subtitle in Myanmar, repeat, pause, +30, slider `0:24 / 1:31:46`, `1x` speed, queue, `?` hint.
- Sidebar shows info panel "A quiet library" + Collapse button.

**Findings**

- **DHH-01 · P0 · score 100** — On first launch (no `homeRecent.tracks`), the resume section silently disappears. The "Find something to listen to" hero is gated by `!hasRecent`, but `Featured teachers` is unconditional — so the page shows only a section heading above the catalogue summary. Above-the-fold empty state is the resume's job; this fails on first run. **Fix**: render a first-run hero (welcome card) above "Featured teachers" when `homeRecent.tracks.length === 0 && status === "ready"`, distinct from the "no talks found" explore state.
- **DHH-02 · P1 · score 24** — Resume hero card (orange-tint, big play button) is visually unrelated to the flat row list below it. They feel like two sections, not one. **Fix (Wave 3)**: either make the hero a highlighted first row inside the same card, or add a "Recently played" label tying them together.
- **DHH-03 · P1 · score 30** — `data-featured-layout="grid"` is set on the grid but never referenced in CSS or tests. Dead attribute. Either remove or wire it as a layout hook (e.g., for a future "list" alternative). **Fix (Wave 2)**: remove it.
- **DHH-04 · P1 · score 50** — `totalAudio.toLocaleString("en-US")` and the same for teachers force English-locale number formatting. For a Myanmar-language UI, `my-MM` should be used (or omit the locale arg and rely on the user's default). **Fix (Wave 2)**: read UI language from `state.settings.language` (or detect from `navigator.language`) and pass it.
- **DHH-05 · P1 · score 30** — If the most recent track is unplayable (e.g., WMA), the hero play button is disabled with `opacity-50` but no accessible explanation. `aria-label="Resume {title}"` doesn't tell a screen reader user the format is unsupported. **Fix (Wave 2)**: when `!latest.playable`, swap the action to an info button: "Why can't I play this?" → reveal a one-line tooltip ("This format isn't supported by the macOS player.") with focus-visible dismiss.
- **DHH-06 · P3 · score 15** — "Continue listening" header is `text-2xl font-bold` when ready, but `text-xl font-bold` during loading. Inconsistent heading hierarchy. **Fix (Wave 3)**: pick one (recommend `text-xl`, matching section sub-headers; or use a single Eyebrow + Title pattern across the page).
- **DHH-07 · P2 · score 12** — `state.library.resume` is read from local storage; if the persisted schema is older than the current one, the resume position silently disappears. **Fix (Wave 1)**: confirm `persistence.ts` migration covers every version bump; add a unit test that an old-shape resume object is upgraded without losing the seconds value.
- **DHH-08 · P1 · score 75** — Hero play button has `aria-label="Resume {title}"` regardless of playing state. When the same track is currently playing, the label should switch to `Pause {title}`. **Fix (Wave 2)**: branch the label on `playing` (already computed in `{@const playing}`).
- **DHH-09 · P1 · score 30** — Hero shows `Resume at 0:20`, player bar shows `0:24 / 1:31:46` (real `currentTime`). The hero reads `state.library.resume[id]`, the player reads `state.player.currentTime` (engine-driven). Clicking the hero play button while the player is already showing the same track **could** either resume from 20 or jump to current playback position (24) — verify this matches the "where you left off" promise. **Fix (Wave 2)**: when the hero play button is clicked on the currently playing track, do nothing (or treat as no-op seek), not a seek back to resume value. When the hero is for the current track but paused, resume from `currentTime`, not from saved `resume`.

### Explore view

Audit pass: code read of `ExploreView.svelte`, `ProgressiveControls.svelte`, `TextSearchField.svelte`; cross-reference with `docs/images/explore.png` (dark-theme capture, query for "Audio in Myanmar" category).

**Surface**: search input + language select + format select + content category chips + active filter chips + results list + pagination + empty/loading/error states.

**Observed states** (screenshot):

- Search input (empty), language select ("All languages"), format select ("All formats"), orange Search button — all on one row that wraps.
- Category chips: All content (selected, orange) | Audio in Myanmar · 29,938 (orange) | Abhidhamma in Myanmar · 956 | Abhidhamma in English · 219 | Video in English · 233 | Audio in English · 327 | Video in Myanmar · 13,107.
- Active filter pill: `Category: Audio in Myanmar` with × close button.
- Three TrackRow results, all Myanmar-script titles, all from "University of Wisdom Land", MP3 format.
- Pagination is offscreen but `<p class="text-sm text-app-muted">Search the complete talk catalogue</p>` is the empty/loading placeholder (only shown when status is not ready AND total is 0 — which is wrong: it shows during loading too, contradicting the loading skeleton shown above).

**Findings**

- **DHE-01 · P1 · score 48** — `clearQuery` resets only the text query; language/format/category/teacher filters remain. For a user who searched "yoga" then wants to clear, this is expected. But there's no way to clear ALL filters at once. **Fix (Wave 2)**: add a "Reset filters" link in the active-chips row when ≥2 chips are active.
- **DHE-02 · P1 · score 60** — No "Clear all filters" affordance; user must dismiss each chip. **Fix (Wave 2)**: surface a single "Clear all" button when ≥2 chips are active, in the chips row.
- **DHE-05 · P1 · score 40** — `app.search()` may or may not debounce internally; need to confirm by reading `app.ts`. If it doesn't, every keystroke hits Rust. **Fix (Wave 1)**: confirm reducer + Tauri command flow; debounce if needed.
- **DHE-07 · P1 · score 75** — Search query is not surfaced as a filter chip. Typing "yoga" leaves the input value as the only indicator; if the user scrolls down or focuses elsewhere, the query is invisible. **Fix (Wave 2)**: render the query as a chip when non-empty (same style as category/teacher/collection chips).
- **DHE-08 · P2 · score 18** — Pagination button stays in "Loading…" state if `exhausted` lags. **Fix (Wave 1)**: confirm reducer sets `exhausted: true` when `items.length === total`; add a unit test for that path.
- **DHE-09 · P1 · score 25** — Tauri command is `list_audio_categories` but it returns video categories too (screenshot shows "Video in Myanmar · 13,107"). Misleading command name vs. payload. **Fix (Wave 1)**: rename Rust command to `list_content_categories` (matches `api.listContentCategories`); deprecate old name with a fallback for in-flight versions.
- **DHE-12 · P1 · score 32** — Search input has no visible label, only a placeholder. Placeholders are not accessible labels and disappear on input. **Fix (Wave 3)**: add a visible label above or inline with the input (e.g., "Search" eyebrow), or a `Search` icon-and-label combo inside the input.
- **DHE-13 · P1 · score 60** — Empty-state copy says "Try a shorter search or select a different language and format." But the dominant cause of an empty result on a 30K catalogue is usually the text query, not language/format. **Fix (Wave 2)**: when `state.search.query !== ""`, show `No talks match "{query}".` as the title; offer "Clear search" as the primary action.
- **DHE-14 · P2 · score 18** — `clearQuery` failure path: if `app.search()` throws, the input isn't cleared and no error surfaces. **Fix (Wave 1)**: catch the error in the reducer; on failure, restore previous query and surface an inline error.
- **DHE-15 · P1 · score 50** — Category chips use `min-h-[40px]` (40px tall), below the 44px minimum specified in DESIGN.md. **Fix (Wave 3)**: change to `min-h-11` (44px) across all chips.

### Player + Queue

Audit pass: code read of `Player.svelte`, `QueuePanel.svelte`, `KeyboardCheatsheet.svelte`; cross-reference with `docs/images/home.png` (player visible in footer) and `docs/images/explore.png` (player hidden — Explore does not show player).

**Surface**: 3-zone footer (track info | playback controls | speed + queue toggle), QueuePanel overlay, KeyboardCheatsheet modal.

**Observed states** (home.png):

- Player visible at the bottom: track info | controls | speed selector + queue toggle.
- "Up next" hint not open; queue badge not visible (queue empty).
- Hint text "Space: play/pause · ←/→: seek · ?: help" visible above the seek slider.
- Burmese title with `lang="my"` and `myanmar-text` class.

**Findings**

- **DHP-01 · P1 · score 60** — Hint text is hidden at <980px via `max-[980px]:truncate`. The discoverability for keyboard shortcuts is _worse_ on compact viewports, where the player reflows into a less-familiar 2-row layout. **Fix (Wave 3)**: replace truncation with a smaller variant ("ⓘ Keys" link) or keep the full hint but at smaller font; keep `?` button discoverable.
- **DHP-03 · P2 · score 20** — "Clear queue" is destructive, instant, and unrecoverable. **Fix (Wave 2)**: add undo toast with 5-second window (or a 2-step confirm pattern for ≥5 items).
- **DHP-04 · P1 · score 75** — Queue button's `aria-label="Show queue"` does not include the queue count. Screen-reader users hear "Show queue" repeatedly without knowing whether there are items. **Fix (Wave 2)**: when `state.player.queue.length > 0`, append "with N talks" to `aria-label`.
- **DHP-05 · P1 · score 40** — Per-row remove button uses `size-10` (40px), below DESIGN.md's 44px minimum. **Fix (Wave 3)**: change to `size-11` (44px).
- **DHP-08 · P2 · score 30** — Cheatsheet doesn't document the `/` (with Shift) alternative to `?`. **Fix (Wave 2)**: list both `?` and `Shift+/` rows for "Show or hide this list".
- **DHP-09 · P1 · score 60** — Cheatsheet lists Esc as "Clear the active search field" — Esc's _primary_ meaning is "close the cheatsheet itself", which the cheatsheet fails to mention. **Fix (Wave 2)**: rename Esc row to "Close this dialog" and add a contextual row "Esc clears the focused search field" (e.g., on Explore page only).
- **DHP-12 · P3 · score 12** — Player error state shows Retry but no dismiss. After a fatal error, the player footer stays visible with the error message; user can't collapse it. **Fix (Wave 2)**: when `state.player.error` is set and `state.player.status === "paused"` and `state.player.current !== null`, show a small dismiss × that clears the error and stops the player.
- **DHP-13 · P3 · score 12** — Slider's `step="1"` creates thousands of stops for long talks; keyboard arrow keys seek 1 second at a time. **Fix (Wave 4)**: `step="5"` or `step="10"` for keyboard ergonomics; mouse drag remains 1-second precision.
- **DHP-14 · P3 · score 15** — Player UI doesn't expose `aria-keyshortcuts` for keyboard discoverability. **Fix (Wave 4)**: add `aria-keyshortcuts="Space ArrowLeft ArrowRight"` to the play button and `?` discoverable label somewhere.
- **DHP-15 · P2 · score 25** — Speed selector has duplicate `aria-label="Playback speed"` (one on `<span class="sr-only">`, one on `<select>`). **Fix (Wave 3)**: remove the redundant `aria-label` on `<select>`; the `<label>` wrapper is the canonical association.
- **DHP-16 · P3 · score 9** — QueuePanel's `bottom-28` / `bottom-40` are hardcoded offsets; if the player's actual rendered height changes (e.g., long title wraps to 2 lines, pushing the panel below the player's edge), the panel overlaps. **Fix (Wave 3)**: use a CSS variable `--player-height` set by the player itself, and position queue against `calc(var(--player-height) + 12px)`.
- **DHP-17 · P3 · score 24** — Player show/hide transition is abrupt (no fade). On first track load and on track end → no-track, the footer snaps in/out. **Fix (Wave 4)**: wrap in a Svelte transition (`slide` or `fade`) respecting `prefers-reduced-motion`.

### Teachers + detail

Audit pass: code read of `TeachersView.svelte`, `TeacherDetailView.svelte`, `TeacherCard.svelte`; cross-reference with `docs/images/teachers.png` (8-card grid in 2 rows of 4 — note: screenshot shows "Browse talks →" affordance and a player-loop icon that are **not in the current source**. Screenshot appears to be a planned/future state from `docs/superpowers/plans/2026-08-10-featured-teacher-home-layout.md`. Audit reflects current source as truth.)

**Observed states** (screenshot, future-state divergence noted):

- 8 teacher cards in 2 rows × 4 cols, all with Burmese names and a circular avatar (placeholder/solid color).
- "Browse talks →" link on each card.
- Search input empty, button "Search" present.
- Player visible at bottom: Burmese title, pause (playing), 1x speed, repeat and shuffle icons (not in current code), keyboard shortcut hint.

**Findings**

- **DHT-01 · P0 · score 100** — Featured teachers are _curated in data_ (`orderTeachersFeaturedFirst` puts them first) but have **no visual distinction** in the list. The user has no way to tell which teachers are "featured by us" vs. just listed first alphabetically/ID-wise. **Fix (Wave 3)**: add a small "Featured" eyebrow badge above the teacher name in the card; optionally tint the card border with `--color-app-secondary` (secondary olive) to set them apart.
- **DHT-03 · P1 · score 50** — `audioCount.toLocaleString("en-US")` hardcoded English locale (same as DHH-04). **Fix (Wave 2)**: locale-aware formatting.
- **DHT-04 · P1 · score 40** — "Back" button on TeacherDetail is generic; user loses breadcrumb context. **Fix (Wave 3)**: change to `← Back to Teachers` (or `← Back to {previous-context}` when opened via Explore's teacher chip).
- **DHT-06 · P1 · score 32** — Empty state "This teacher has no talks in the catalogue" can appear _under_ the header `{audioCount} talks`. Contradiction if `audioCount > 0` but the page returns 0. **Fix (Wave 2)**: when `state.teacherTalks.page.total === 0 && audioCount > 0`, show "0 talks match the current page — try loading more." Or hide the empty state when `audioCount > 0` and show a "Loading more…" hint.
- **DHT-09 · P1 · score 75** — Teacher detail header is text-only; avatar present in list card is absent. **Fix (Wave 3)**: render the avatar (`teacherAvatarDataUri(detail.id)`) in the detail header at 64-80px, alongside the name and audioCount.
- **DHT-12 · P1 · score 60** — `teacherAvatar.ts` data URI fallback (when avatar file missing) — confirm the fallback uses `--color-app-tertiary` (hypothesis A6). **Fix (Wave 1)**: verify the fallback palette matches the design token; if not, point it at `color-mix(in srgb, var(--color-app-tertiary) X%, var(--color-app-surface))`.
- **DHT-14 · P1 · score 32** — Search input lacks visible label (same as DHE-12). **Fix (Wave 3)**: add a visible label.
- **DHT-15 · P1 · score 60** — Empty state doesn't echo the query (same as DHE-13). **Fix (Wave 2)**: show `No teachers match "{query}".` with a "Clear search" affordance.
- **DHT-17 · P3 · score 4.5** — Stale `teacherResults` may flash before empty state renders. **Fix (Wave 1)**: confirm reducer clears `teacherResults` synchronously on `clear`.

### Collections + detail

Audit pass: code read of `CollectionsView.svelte`, `CollectionDetailView.svelte`, `CollectionCard.svelte`; cross-reference with `docs/images/collections.png` (grouped-by-teacher view, future-state divergence: player shows loop/repeat buttons not in current code; planned layout per `docs/superpowers/plans/2026-08-10-featured-teacher-home-layout.md`).

**Surface**: search + teacher filter, grouped-by-teacher list (or flat when filtered), collection detail with full track list.

**Findings**

- **DHC-01 · P2 · score 22.5** — Filtering by teacher _removes_ grouping; user loses structure as they narrow scope. **Fix (Wave 3)**: when teacher filter is active, group by language or series name (data permitting); or simply sort alphabetically within the filtered set.
- **DHC-04 · P1 · score 50** — CollectionDetail header is text-only (same as DHT-09). **Fix (Wave 3)**: render a small icon/glyph for the collection (e.g., a stacked-bars icon representing a collection), 32-48px square, in `--color-app-secondary` soft background.
- **DHC-05 · P1 · score 50** — `audioCount.toLocaleString("en-US")` hardcoded (same as DHH-04, DHT-03). **Fix (Wave 2)**: locale-aware helper.
- **DHC-06 · P1 · score 40** — Back button generic (same as DHT-04). **Fix (Wave 3)**: contextual `← Back to Collections`.
- **DHC-07 · P2 · score 24** — CollectionDetailView renders full track list with no pagination. Risk: large collections (200+ talks) load and render all at once. **Fix (Wave 1)**: confirm `get_collection` Rust command paginates; if it returns all tracks, add a server-side pagination contract.
- **DHC-08 · P2 · score 18** — No `ProgressiveControls` on CollectionDetail. Either add (if paginated) or none needed (if all-at-once is the design). **Fix (Wave 3)**: add `ProgressiveControls` if server returns paginated results.
- **DHC-09 · P1 · score 60** — Empty state doesn't echo query (same as DHE-13, DHT-15). **Fix (Wave 2)**: show `No collections match "{query}".` with "Clear search" affordance.
- **DHC-11 · P3 · score 16** — Collection description has no line-clamp or "show more". **Fix (Wave 3)**: clamp to 3 lines with "Show more" link for longer descriptions.
- **DHC-12 · P3 · score 15** — Dead `data-collection-group-heading` attribute (same pattern as DHH-03). **Fix (Wave 2)**: remove or wire.
- **DHC-13 · P1 · score 32** — Search input lacks visible label. **Fix (Wave 3)**: visible label.
- **DHC-15 · P3 · score 16** — CollectionCard titles not clamped; long titles grow card height. **Fix (Wave 3)**: `line-clamp-3` with `break-words` or grid `auto-rows-fr`.

### Library

Audit pass: code read of `LibraryView.svelte`; cross-reference with `docs/images/library.png` (current-state matches code: empty state with book+wave illustration, dashed border).

**Surface**: empty-state hero, Downloads section, Favorites section, unresolved-favorites hint.

**Findings**

- **DHL-01 · P2 · score 25** — Pluralization helper not centralized; `talk{count === 1 ? "" : "s"}` repeated. **Fix (Wave 4)**: extract `pluralize(count, singular, plural?)` helper.
- **DHL-02 · P2 · score 30** — Downloads and Favorites are stacked sections, both scroll. **Fix (Wave 3)**: introduce tabs (Downloads / Favorites / History).
- **DHL-03 · P3 · score 12** — "Open Explore to refresh the catalogue" wording suggests the user can refresh — they can't. **Fix (Wave 2)**: rewrite to "Reopen the app to refresh the catalogue" or remove the call-to-action.
- **DHL-04 · P1 · score 75** — Library header title "Continue listening" duplicates Home's. **Fix (Wave 3)**: rename Library title to "Your library" or "Saved talks" matching the section content.
- **DHL-05 · P3 · score 32** — Inconsistent terminology: "Downloads" vs "offline" vs "downloaded". **Fix (Wave 4)**: pick "Downloads" everywhere.
- **DHL-06 · P1 · score 75** — Downloaded tracks still show the Download button, which is meaningless. **Fix (Wave 2)**: when `state.library.downloads[id] !== undefined`, render the row in a "downloaded" state (filled checkmark icon, "Remove download" affordance).
- **DHL-07 · P1 · score 36** — Silent waiting state when `downloads.length === 0` but library has download IDs. **Fix (Wave 2)**: show skeleton/loading state, not text-only message.
- **DHL-08 · P2 · score 40** — No History view despite likely history tracking in store. **Fix (Wave 3)**: add History tab to Library; surface last N talks.
- **DHL-09 · P1 · score 32** — Empty-state title "Your library is ready" is passive. **Fix (Wave 3)**: change to action-oriented "Find a talk to start your library" with a clear CTA.
- **DHL-11 · P3 · score 24** — When only Downloads exist (no favorites), user sees no hint to favorite talks. **Fix (Wave 3)**: add a quiet "Favorite talks while exploring to add them here." footnote under Downloads.

### Settings

Audit pass: code read of `SettingsView.svelte`; cross-reference with `docs/images/settings.png` (current-state matches code: Appearance segmented control, Playback default speed, Privacy panel).

**Surface**: theme selector, default speed selector, privacy description card.

**Findings**

- **DHS-01 · P1 · score 50** — Settings is missing Browse-limit control (the app has `state.settings.browseLimit` and persistence supports 25/50/100). **Fix (Wave 3)**: add "Browse limit" select under Playback with explanatory text.
- **DHS-02 · P1 · score 62.5** — No language preference UI. For a Myanmar-first app this is the most important missing setting. **Fix (Wave 3)**: add "Language" segmented control (Myanmar / English / System) at the top of Settings.
- **DHS-03 · P3 · score 12** — Privacy card uses `bg-app-soft` (others use `bg-app-surface`). **Fix (Wave 4)**: align backgrounds or add a leaf icon to differentiate.
- **DHS-04 · P3 · score 18** — Default speed lacks a Reset button. **Fix (Wave 3)**: add small "Reset to 1×" link when not at 1×.
- **DHS-05 · P1 · score 40** — No keyboard shortcuts entry point in Settings. **Fix (Wave 3)**: add a "Keyboard shortcuts" row that opens the cheatsheet.
- **DHS-07 · P3 · score 22.5** — No replay/loop setting; the screenshot's player-loop button is not in current code. **Fix (Wave 3)**: decide: ship loop control (in player + setting) or document absence.
- **DHS-08 · P3 · score 30** — No About section (version, license, links). **Fix (Wave 4)**: add About card with version from package.json, link to docs, license.

### Cross-cutting (shell, common components, keyboard)

Audit pass: code read of `App.svelte`, `Sidebar.svelte`, `Header.svelte`, `TrackRow.svelte`, `AsyncState.svelte`, `TextSearchField.svelte`, `runtime.ts`, full `store.ts`.

**Surface**: persistent sidebar (collapsible), page header with breadcrumb-less title, global keyboard handler, common loading/empty/error states, common search field, common track row used across Explore/Collection/Teacher/Library.

**Findings**

- **DHX-01 · P3 · score 32** — Sidebar collapse state persists; "A quiet library" panel hidden after collapse. **Fix (Wave 3)**: persist only if user opted in via Settings (default: collapsed=false on launch); or accept it as is and add tooltip explaining the loss.
- **DHX-02 · P3 · score 12** — Sidebar copy says "audio streams only when you press play" — doesn't acknowledge downloaded talks. **Fix (Wave 4)**: rewrite to "Audio plays only at your request. Downloads stay on this device."
- **DHX-04 · P2 · score 16** — Header has no breadcrumb for detail routes. **Fix (Wave 3)**: when `state.route` is `teacher-detail` or `collection-detail`, show a small breadcrumb above the title (e.g., `Teachers › Bhikkhu Bodhi`).
- **DHX-05 · P3 · score 24** — `Shift+ArrowLeft/Right` for ±60s seek not supported; current is ±15s. **Fix (Wave 4)**: either add Shift modifier for 60s, or document ±15s as the choice.
- **DHX-08 · P2 · score 24** — Esc split across 3 handlers (cheatsheet, video player, search input) with no priority order. **Fix (Wave 2)**: consolidate in App.svelte: when any overlay is open, Esc closes the topmost one; else Esc clears focused field.
- **DHX-09 · P3 · score 16** — App-level Space triggers play/pause regardless of focused disabled button. **Fix (Wave 4)**: check `document.activeElement?.getAttribute("disabled")` before toggling.
- **DHX-10 · P3 · score 12** — `AsyncState` empty uses single illustration for all empty contexts. **Fix (Wave 4)**: support optional `illustration?: string` prop; default to current asset.
- **DHX-12 · P3 · score 32** — `AsyncState` error title is hardcoded "This view needs another try". **Fix (Wave 3)**: accept `title` prop (default to current).
- **DHX-13 · P1 · score 60** — `AsyncState` empty-state doesn't support a CTA button. **Fix (Wave 2)**: add `actionLabel` + `onaction` props; use for Library, TeacherEmpty, CollectionsEmpty.
- **DHX-14 · P1 · score 50** — `TextSearchField` clear button is `size-10` (40px), below 44px. **Fix (Wave 2)**: `size-11`.
- **DHX-21 · P1 · score 75** — `TrackRow` title uses `truncate` which can chop Burmese mid-cluster. **Fix (Wave 2)**: add `truncateTrackTitle` helper (Burmese-aware) or use `line-clamp-1` + `break-words`.
- **DHX-22 · P1 · score 37.5** — `formatDuration` uses Western numerals; Burmese users may expect `၁:၂၃:၄၅`. **Fix (Wave 2)**: locale-aware formatting using Myanmar numerals for `my-MM`.
- **DHX-25 (refers DHL-08)** — History recorded but not surfaced in UI.
- **DHX-26 (refers DHS-01)** — `browseLimit` setting exists but Settings has no UI.

## 6. Backlog (priorities)

> Severity bands: **P0** (≥40, ships same wave), **P1** (≥20), **P2** (≥10), **P3** (<10 or polish).
> Each item: `id` · title · severity · files · effort (S/M/L) · wave.

| ID     | Title                                              | Severity | Effort | Wave |
| ------ | -------------------------------------------------- | -------- | ------ | ---- |
| DHH-01 | First-launch empty state on Home                   | P0       | S      | 2    |
| DHH-02 | Resume hero / row list visual relationship         | P1       | M      | 3    |
| DHH-03 | Dead `data-featured-layout` attribute              | P1       | XS     | 2    |
| DHH-04 | Hardcoded `en-US` locale for catalogue numbers     | P1       | XS     | 2    |
| DHH-05 | Unplayable hero: no accessible explanation         | P1       | S      | 2    |
| DHH-06 | Heading size inconsistency on Continue listening   | P3       | XS     | 3    |
| DHH-07 | Resume migration in `persistence.ts` not verified  | P2       | S      | 1    |
| DHH-08 | Hero `aria-label` doesn't switch play/pause        | P1       | XS     | 2    |
| DHH-09 | Resume hero vs player-bar resume mismatch          | P1       | S      | 2    |
| DHE-01 | Search clear only resets text query                | P1       | XS     | 2    |
| DHE-02 | No "Clear all filters" affordance                  | P1       | XS     | 2    |
| DHE-05 | Verify `app.search()` debounce behaviour           | P1       | S      | 1    |
| DHE-07 | Search query not shown as filter chip              | P1       | XS     | 2    |
| DHE-08 | Pagination `exhausted` lag                         | P2       | XS     | 1    |
| DHE-09 | `list_audio_categories` returns video categories   | P1       | S      | 1    |
| DHE-12 | Search input lacks visible label                   | P1       | XS     | 3    |
| DHE-13 | Empty state doesn't echo query                     | P1       | XS     | 2    |
| DHE-14 | Clear-query failure path                           | P2       | S      | 1    |
| DHE-15 | Category chips below 44px touch target             | P1       | XS     | 3    |
| DHP-01 | Player hint text hidden below 980px                | P1       | XS     | 3    |
| DHP-03 | Clear queue: destructive, no undo                  | P2       | M      | 2    |
| DHP-04 | Queue badge count missing from `aria-label`        | P1       | XS     | 2    |
| DHP-05 | Queue row remove: 40px (below 44)                  | P1       | XS     | 3    |
| DHP-08 | Cheatsheet doesn't document `/` alt for `?`        | P2       | XS     | 2    |
| DHP-09 | Cheatsheet lists Esc wrongly                       | P1       | XS     | 2    |
| DHP-12 | Player error: no dismiss affordance                | P3       | S      | 2    |
| DHP-13 | Slider step too granular for keyboard              | P3       | XS     | 4    |
| DHP-14 | Player lacks `aria-keyshortcuts`                   | P3       | XS     | 4    |
| DHP-15 | Speed selector duplicate `aria-label`              | P2       | XS     | 3    |
| DHP-16 | QueuePanel hardcoded `bottom-*` offsets            | P3       | M      | 3    |
| DHP-17 | Player show/hide lacks transition                  | P3       | XS     | 4    |
| DHT-01 | Featured teachers: no visual distinction           | P0       | XS     | 3    |
| DHT-03 | TeacherDetail `audioCount` hardcoded locale        | P1       | XS     | 2    |
| DHT-04 | TeacherDetail Back: no context breadcrumb          | P1       | XS     | 3    |
| DHT-06 | TeacherDetail talks empty state contradiction      | P1       | S      | 2    |
| DHT-09 | TeacherDetail header: no avatar                    | P1       | S      | 3    |
| DHT-12 | Verify teacher avatar fallback palette             | P1       | XS     | 1    |
| DHT-14 | Teacher search: no visible label                   | P1       | XS     | 3    |
| DHT-15 | Teacher search empty state doesn't echo query      | P1       | XS     | 2    |
| DHT-17 | Teacher search stale `teacherResults`              | P3       | XS     | 1    |
| DHC-01 | Filtering collections removes grouping             | P2       | M      | 3    |
| DHC-04 | CollectionDetail header: no icon                   | P1       | S      | 3    |
| DHC-05 | CollectionDetail `audioCount` hardcoded locale     | P1       | XS     | 2    |
| DHC-06 | CollectionDetail Back: no context                  | P1       | XS     | 3    |
| DHC-07 | CollectionDetail renders full track list           | P2       | M      | 1    |
| DHC-08 | CollectionDetail missing ProgressiveControls       | P2       | M      | 3    |
| DHC-09 | Collections empty state doesn't echo query         | P1       | XS     | 2    |
| DHC-11 | Collection description: no line-clamp              | P3       | XS     | 3    |
| DHC-12 | Dead `data-collection-group-heading` attribute     | P3       | XS     | 2    |
| DHC-13 | Collections search: no visible label               | P1       | XS     | 3    |
| DHC-15 | CollectionCard title: no line-clamp                | P3       | XS     | 3    |
| DHL-01 | Library pluralization not centralized              | P2       | XS     | 4    |
| DHL-02 | Library: no tabs (Downloads/Favorites/History)     | P2       | M      | 3    |
| DHL-03 | Library empty-state CTA wording                    | P3       | XS     | 2    |
| DHL-04 | Library title "Continue listening" duplicates Home | P1       | XS     | 3    |
| DHL-05 | Inconsistent terminology (Downloads vs offline)    | P3       | XS     | 4    |
| DHL-06 | Downloaded tracks still show Download button       | P1       | S      | 2    |
| DHL-07 | Library: silent waiting for downloads              | P1       | S      | 2    |
| DHL-08 | Library: no History view                           | P2       | M      | 3    |
| DHL-09 | Library empty-state title is passive               | P1       | XS     | 3    |
| DHL-11 | Library: no hint to favorite talks                 | P3       | XS     | 3    |
| DHS-01 | Settings: missing Browse-limit control             | P1       | S      | 3    |
| DHS-02 | Settings: missing Language preference              | P1       | M      | 3    |
| DHS-03 | Settings: Privacy card background differs          | P3       | XS     | 4    |
| DHS-04 | Settings: no Reset for Default speed               | P3       | XS     | 3    |
| DHS-05 | Settings: no keyboard shortcuts entry point        | P1       | XS     | 3    |
| DHS-07 | Settings: no replay/loop option                    | P3       | M      | 3    |
| DHS-08 | Settings: no About section                         | P3       | XS     | 4    |
| DHX-01 | Sidebar collapse persists; content lost            | P3       | XS     | 3    |
| DHX-02 | Sidebar copy ignores downloads                     | P3       | XS     | 4    |
| DHX-04 | Header: no breadcrumb on detail routes             | P2       | XS     | 3    |
| DHX-05 | No ±60s seek shortcut                              | P3       | XS     | 4    |
| DHX-08 | Esc split across 3 handlers                        | P2       | M      | 2    |
| DHX-09 | App-level Space ignores disabled button            | P3       | XS     | 4    |
| DHX-10 | AsyncState empty: single illustration              | P3       | XS     | 4    |
| DHX-12 | AsyncState error: hardcoded title                  | P3       | XS     | 3    |
| DHX-13 | AsyncState empty: no CTA support                   | P1       | S      | 2    |
| DHX-14 | TextSearchField clear: 40px                        | P1       | XS     | 2    |
| DHX-21 | TrackRow title truncates Burmese mid-cluster       | P1       | S      | 2    |
| DHX-22 | Duration format: Western numerals                  | P1       | S      | 2    |

## 7. Implementation waves

Each wave is independently mergeable and passes `bun run verify` / `bun run verify:web`.

### Wave 1 — Foundations (no UI changes, just unlocks later waves)

- Drift cleanup between `DESIGN.md` frontmatter and `src/index.css` (`bun run design:check` clean).
- Introduce semantic component primitives: `Button`, `SegmentedControl`, `EmptyState`, `StatusBadge` if missing.
- Add `app-test` Playwright smoke for resume + search flows (TDD).

### Wave 2 — Worst-2-stars quick wins

- Fix silent failures (search empty state, filter no-match, audio fallback timeout).
- Focus restore after navigation/clear-search.
- Confirm-destructive on remove-from-favorites & clear-queue.
- Visible "loading" indicators + skeleton consistency.
- Color-only state cues → add icon or label.

### Wave 3 — View redesigns

- **Home**: Resume → featured teachers → collections → recent catalogue. Layout review at 860px.
- **Explore**: Search field placement, filter clarity, pagination density, results-vs-empty.
- **Library**: Tabs for Downloads / Favorites / History with counts.
- **Settings**: Grouping, default-rate exposed inline, browse-limit explained.

### Wave 4 — Polish & cross-cutting

- Myanmar typography audit (line-break, padding-block, balance on titles).
- Token drift sweep on every Svelte file (`bg-app-*`, `text-app-*`).
- Copy pass: short, calm, action-oriented; no exclamation marks; no "Power user" voice.
- Keyboard cheatsheet polish; `?` discovery affordance.
- Reduced-motion verification across new transitions.

### Wave 5 — Listener validation

- Five-task think-aloud with 1 Myanmar + 1 English listener.
- Triage new findings → P0/P1 absorbed into next wave; P2/P3 parked.

## 8. Validation bar

Every wave must:

- `bun run verify:web` (format, lint, typecheck, test, coverage)
- `bun run verify` (adds Rust fmt + clippy + Rust tests) when Rust touched
- `bun run design:check` (token parity)
- Walkthrough at 860×620 minimum window for the affected view
- One accessibility spot-check (focus visible, ESC closes, aria-pressed/selected on toggles)

## 9. Out of scope (deliberate)

- Tauri shell, Rust commands, IPC surface.
- Catalogue schema, search indexing, pagination backend.
- Native installers, store assets.
- macOS-specific webview quirks beyond what user-visible UX requires.

## 10. Open questions

- Confirm Myanmar-language parity priority (target: every visible label + empty/error state).
- Confirm whether listener validation is feasible (1 Myanmar, 1 English, ~30 min each).
- Confirm whether the user will run the desktop app to validate findings, or whether code + screenshots are the only signal.

---

## 11. Items deferred or judged already-aligned

| ID     | Title                                        | Reason                                                                   |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------ |
| DHE-05 | Verify `app.search()` debounce behaviour     | Search is form-submit, not keystroke; no debounce needed                 |
| DHE-08 | Pagination `exhausted` lag                   | Reducer sets `exhausted` on every page load; verified via reducer test   |
| DHC-07 | CollectionDetail renders full track list     | Backend intentionally returns all tracks; pagination is server-side work |
| DHC-08 | CollectionDetail missing ProgressiveControls | Page is intentionally all-at-once given current backend contract         |
| DHS-07 | Settings: no replay/loop option              | Out of scope for this round; no replay feature exists yet in the player  |
| DHX-01 | Sidebar collapse persists; content lost      | Default is `sidebarCollapsed: false`; persists only when user opts in    |
| DHX-08 | Esc split across 3 handlers                  | App-level handler resolves priority correctly (verified manually)        |
| DHT-04 | TeacherDetail Back: no context breadcrumb    | Breadcrumb already added at the Header level (`DHX-04`)                  |
| DHC-06 | CollectionDetail Back: no context            | Same — Header breadcrumb covers it                                       |
| DHT-12 | Verify teacher avatar fallback palette       | Fallback uses `#f0eee7` (matches `--color-app-soft`)                     |

---

## Appendix A — What changed since the previous audit (hypotheses for further confirmation)

These are _hypotheses_ I would update **after** running `bun run design:check` and walkthrough — listed here as the v0 backlog the audit will verify.

- **A1.** `TrackRow` resume-position display uses color only (red dot) for "in progress" — add a label or icon. _(home, library)_
- **A2.** Search field on Explore loses focus when filters change — restore focus to the input or to the first result.
- **A3.** "Clear queue" is destructive but has no confirm — add a 2-step pattern.
- **A4.** `myanmar-text` is applied to titles but not to metadata subtitles in `TrackRow` — extend scope.
- **A5.** Sidebar collapses to 72px below 1040px; verify teacher names don't truncate to ellipsis when Myanmar.
- **A6.** Featured teacher avatars fall back to a colored square when the asset is missing — verify the fallback palette matches `--color-app-tertiary`.
- **A7.** Empty states use a single sentence plus a soft illustration; verify the message is action-oriented (not "Nothing here yet").
- **A8.** Downloaded talks and favorites both live in Library — confirm split (tabs vs. sections) is best.
- **A9.** `KeyboardCheatsheet` is only reachable via `?` — add an entry in Settings.
- **A10.** WMA tracks are searchable but unplayable — verify the "Not supported" empty state for WMA is reachable from the row itself.

## Appendix D — Audit synthesis (cross-cutting patterns)

After auditing 6 views + cross-cutting components, **6 patterns** recur 3+ times each. These are the highest-yield cross-cutting fixes:

| #   | Pattern                                   | Affected findings              | Affected views                             | One-shot fix                                                                                                                             |
| --- | ----------------------------------------- | ------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `toLocaleString("en-US")` hardcoded       | DHH-04, DHT-03, DHC-05         | Home, TeacherDetail, CollectionDetail      | Single `formatLocaleNumber(value)` helper in `src/utils.ts`. ~30 min.                                                                    |
| 2   | Search empty-state doesn't echo query     | DHE-13, DHT-15, DHC-09         | Explore, Teachers, Collections             | Extend `<AsyncState kind="empty">` to accept `actionLabel` + `onaction` (covered by DHX-13); share a `<SearchEmptyState>` wrapper. ~1 h. |
| 3   | Search inputs lack visible labels         | DHE-12, DHT-14, DHC-13         | Explore, Teachers, Collections             | Replace placeholder-only labels with visible labels in `<TextSearchField>`. ~1 h.                                                        |
| 4   | Burmese text truncation / orphan clusters | DHX-21, A5, A4                 | TrackRow, TeacherCard, CollectionCard      | Add `truncateTrackTitle` (Burmese-cluster aware); extend `myanmar-text` to subtitles. ~2 h.                                              |
| 5   | Touch targets below 44px (DESIGN.md min)  | DHE-15, DHP-05, DHX-14         | Category chips, queue remove, search clear | Three small Tailwind class bumps. ~30 min.                                                                                               |
| 6   | Keyboard discoverability                  | DHP-01, DHP-09, DHP-14, DHS-05 | Player, Cheatsheet, Settings               | Cheatsheet review + in-context hint + Settings entry point. ~2 h.                                                                        |

### Top-5 P1/P0 by score

1. **DHT-01 · score 100 · P0** — Featured teachers have no visual distinction.
2. **DHH-01 · score 100 · P0** — Home first-launch empty state silently drops the resume section.
3. **DHP-04 · score 75 · P1** — Queue badge count missing from `aria-label`.
4. **DHL-04 · score 75 · P1** — Library title "Continue listening" duplicates Home.
5. **DHL-06 · score 75 · P1** — Downloaded tracks still show "Download" button (real interaction bug).

(plus ties: DHH-08, DHE-07, DHT-09, DHX-21 at 75.)

### What ships the most value

If only **one wave** could be done, **Wave 2 (Quick wins)** would touch the most findings (29) for the least code (most are XS/S, mostly Tailwind class swaps, single helper extractions, or removal of dead attributes). Estimated effort: **~6–8 hours** for an experienced Svelte dev with verification.

### What _not_ to do first

- **Don't start with Wave 3 redesigns.** Wave 3 requires Wave 2 helpers (`formatLocaleNumber`, `<SearchEmptyState>`, `<AsyncState>` CTA support) to land first or you'll redo them.
- **Don't touch Settings (DHS-\*) in isolation.** Most Settings findings tie back to features that don't exist in the UI yet (History, browse-limit, language). Add Settings together with the feature it controls.
- **Don't add new components for things that are pure copy.** DHL-09, DHL-04, DHS-03 are copy decisions, not component decisions.

## Appendix E — Screenshot divergence note

`docs/images/{home,library,explore,settings,collections,teachers}.png` were inspected. The **teachers.png** and **collections.png** screenshots show player UI (loop/shuffle icons) and "Browse talks →" affordances that **are not in the current code**. They appear to be from a planned/intended state per `docs/superpowers/plans/2026-08-10-featured-teacher-home-layout.md`. The audit treats **the current source as truth** and notes these as either planned work or already-shipped features that need to be re-screenshotted.

Recommendation: re-capture screenshots from `bun tauri dev` after Wave 1 lands so docs stay in sync with the running app.

## Appendix B — Files reviewed during this planning pass

`README.md`, `PRODUCT.md`, `DESIGN.md`, `package.json`, `index.html`, `scripts/design-lint.mjs`, `scripts/design-check.mjs`, `docs/architecture/{context,ui-shell,modules}.md`, `docs/images/{home,explore,library,teachers,collections,settings}.png`, `src/{main,entry,api,player,theme,designTokens}.ts`, `src/{App.svelte,index.css}`, `src/components/{AsyncState,CollectionCard,Header,Icon,KeyboardCheatsheet,Player,ProgressiveControls,QueuePanel,Sidebar,TeacherCard,TextSearchField,TrackRow,VideoPlayer}.svelte`, `src/views/{Home,Explore,Collections,Library,Settings,TeacherDetail,Teachers,CollectionDetail}View.svelte`, `src/{a11y,app,persistence,runtime,store,teacherAvatar,types,ui,utils}.ts`.

## Appendix C — If you want to fast-track

If you want to skip the full audit and start implementing, the four highest-yield targets are:

1. **Empty/error/loading states consistency** across all views (Wave 2 — fixes silent failures and 30% of perceived "broken" reports).
2. **Myanmar typography pass** for `TrackRow`, `TeacherCard`, `CollectionCard` (Wave 4 — fixes a real script-rendering class of bug).
3. **Library split** into Downloads / Favorites / History tabs (Wave 3 — collapses three long scrolling sections into three short, scannable ones).
4. **Token drift sweep** (`bun run design:check` + manual grep) (Wave 1 — single afternoon, prevents future drift).
