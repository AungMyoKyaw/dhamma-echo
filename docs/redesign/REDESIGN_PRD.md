# Dhamma Echo — Redesign Product Requirements & Architecture

**Version:** 1.0 | **Date:** 2026-10-22 | **Status:** APPROVED REQUIREMENTS; IMPLEMENTATION RECORDED IN [REPORT](IMPLEMENTATION_REPORT.md)
**Decision source:** User approval of recommended A options for Q01–Q80, no exceptions.
**Repository:** /Users/aungmyokyaw/Code/mcp-workspace/projects/dhamma-echo
**Companion:** [Acceptance matrix](ACCEPTANCE.md)

> This document records the original approved requirements. Implementation began after a separate explicit user request. For completed work, test evidence, release artifacts and outstanding checks, read [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md).

## 1. Vision and goals

**Tagline:** Dhamma, without the noise.

**Product vision:** A premium, private, contemplative desktop listening library for Dhamma audio and video in Myanmar and English. More like a dependable quiet listening desk than a recommendation feed, social product or flashy audio service.

**Primary outcome:** Make it immediately clear what the listener was listening to, how to resume it, and how to find and listen to another teaching. Redesign all visible app experiences while preserving the domain, catalogue, media engine and data.

### Measurable product outcomes

- A returning user resumes the prominently displayed current/recent teaching in **one activation** from Home, at the saved valid offset after metadata is ready.
- Global search is keyboard discoverable; an English or Burmese title/teacher query and supported filters produce accurate, clearly labeled results without losing browse context.
- Playback remains uninterrupted during normal route changes; volume/seek/rate/queue and error states remain usable at 860x620.
- Users can find a saved, downloaded, or recent talk directly through Library tabs; state persists across restarts and visual redesign.
- First-run Home offers an immediate Explore/Teachers action without an empty giant marketing hero.
- English and Myanmar, light and dark appearance, keyboard and reduced-motion behavior are equally complete.

### Hard non-goals

No account/login, cloud sync, telemetry, ads, social/recommendation feed, meditation tracking, automatic AI suggestions, third-party fonts, new production dependencies, custom playlists, content rehosting, catalogue rewrite, broad Tauri APIs, bulk schema migrations or new media backend. Do not change user files or local persisted listening data.

## 2. Verified current baseline

- App version on inspection: 0.5.10. Desktop Tauri 2; Rust 2024; bundled read-only SQLite; Svelte 5, strict TypeScript, Tailwind CSS 4.3.3, Vite, Bun. macOS primary; builds also target Windows and Linux.
- Reference window: 1280x820; minimum 860x620. macOS uses an overlay titlebar and native traffic lights. Windows and Linux use platform-specific custom controls in the current TitleBar.
- Existing pages: Home, Explore, Teachers and Teacher Detail, Collections and Collection Detail, Library, Settings. Shared compact audio player, queue, video player and shortcut dialog.
- README catalogue snapshot: 30,563 audio talks, 14,474 video records, 257 teachers, 429 audio collections. Do not treat these as guaranteed runtime counts; show the real returned count.
- Existing code already has English/Myanmar translations, debounced search, Library tabs (Downloads/Favorites/History), featured teachers, queue undo, dark/system theme, shortcuts, loading/error patterns. This project is a refinement and redesign, not an excuse to duplicate functioning features.
- Media allowlist: dhammadownload.com and www.dhammadownload.com. Supported playable MP3/MP4; preserve WMA/WMV catalogue records as unavailable where unsupported. Media runs through existing MediaEngine and media URL guard.
- Persistence: localStorage library/settings/UI with validated schema v2 and v1 compatibility. Downloads reside under app data. Maintain storage keys, saved values and file paths; no destructive migration.
- Current assets and screenshots: docs/images/\*.png. They are visual starting evidence only; inspect the live app before claiming final behavior.
- Existing PRODUCT.md and DESIGN.md are incumbent documents. The existing 19th-century herbarium metaphor is superseded for the new design only AFTER Phase P0 selects a composition and Phase P1 safely rewrites DESIGN.md.

## 3. Locked product decisions

### Product scope (Q01–Q10)

Full app UI redesign without engine rewrite. Keep Dhamma Echo name. Myanmar-speaking listeners first with English fully supported. Listening/resumption first. Calmness, usability and refinement together. Preserve functionality and privacy, allow small UX improvements rather than new features, macOS first but portable. Success is low-friction resume and discovery.

### Aesthetic (Q11–Q24)

New contemporary Buddhist listening-room identity: warm, quiet, spiritually neutral rather than religiously ornate. Refine existing lotus logo. Abstract subtle Buddhist identity, no stock temples or invented teacher portraits. Warm ivory/forest green/bronze palette, deliberate charcoal/olive dark theme, serif Latin headings and sans UI. Myanmar-specific typography. Restrained radii (8/12px), comfortable data density, flat/light elevation and purposeful motion.

### Shell (Q25–Q35)

Single modern desktop shell with collapsible compact sidebar, scrollable main pane and optional contextual third region where useful; NEVER a separate mobile nav. Move verbose privacy callout to Settings/About. Respect native macOS traffic lights, avoid duplicated custom controls. Main destinations Home/Explore/Collections/Teachers/My Library and separate Settings. One global search entry; retain navigation context; min 860x620; normal fullscreen behavior.

### Discovery (Q36–Q50)

Returning Home emphasizes Continue Listening → Recent → Discover → Featured Teachers. First-run welcome is actionable. Real curated content rather than invented recommendations. Search uses existing typed query model, responsive/debounced behavior, progressive filters and concise category counts. Text-first results with truthful metadata. Sort only on supported fields, clear empty/retry states, searchable teacher directory and editorial teacher details, structured collection grouping.

### Personal library and media (Q51–Q61)

Keep Downloads/Favorites/History tabs, one-click favorites, existing queue/download mechanisms (no custom playlists). Audio player remains pinned at bottom when active. Add focused listening presentation using SAME controller. Prioritize play/pause, ±15-second seeking, speed, progress, time, queue; progressively disclose secondary actions. Queue is an accessible side drawer. Video has dedicated existing presentation without audio overlap. Unsupported WMA/WMV remain searchable with clear disabled playback.

### Language/accessibility (Q62–Q70)

Complete English and Myanmar UI. Respect saved language and theme; first-launch default can remain current fallback. Unicode-first, grapheme-safe clipping/wrapping, accurate Buddhist terminology. Target WCAG 2.2 AA for applicable contrast and interaction. Retain existing shortcuts, visible focus, system reduced motion, useful loading/empty/error/retry affordances.

### Implementation (Q71–Q80)

Rebuild design tokens and DESIGN.md cohesively; stay with existing icon/component stack and Tauri/media architecture. Preserve personal data. Use Impeccable concept→build→critique workflow; compare three distinct compositions before selecting. Implement in verified phases, automate regression checks plus human visual/native QA, update product website after app completion, deliver release-ready packages without automatically publishing.

## 4. Functional requirements and interaction details

### FR-SHELL: shell, window, navigation, global search

- Render one coordinated sidebar, content scroller, optional contextual surface and active player; no content hidden beneath fixed chrome.
- Sidebar expands/collapses smoothly and remembers setting via existing UI persistence. Settings separate from daily actions. Active and keyboard focus distinguishable without color alone.
- Keep macOS traffic lights native; Windows/Linux controls appear only on their platforms. Top strip remains reliably draggable and title text/buttons do not prevent expected input.
- Global search entry navigates/focuses existing Explore search and preserves ONE source of query/filter state. Cmd/Ctrl+F works even outside Explore; avoid redundant independent search fields.
- Back/context navigation retains relevant scroll, filter and route state without spawning another router or rewriting state management.
- Maintain minimum 860x620, large and compact screen behavior; visible queue, dialogs, video and keyboard help never extend irretrievably beyond viewport.

### FR-HOME: return and first visit

- Returning Home leads with a single high-emphasis Continue Listening item showing actual title/teacher/progress and a clear resume action.
- The continued track plays at saved position only after media metadata is available; progress missing/invalid safely starts from beginning.
- Recent listening list follows, then a limited Discover block and real Featured Teachers. No oversized decorative hero, empty mock statistics, or fabricated suggestions.
- Empty history first-run state offers direct Explore and Teachers actions, accurate catalogue introduction, and practical privacy assurance elsewhere.

### FR-EXPLORE: catalogue

- Clear query, submit, debounce, clear and keyboard focus; no stale-result presentation after filtering. Existing server-side paging/filter semantics preserved.
- Default toolbar includes a small set of useful controls; advanced controls (language, format, teacher, category, collection) can expand without losing selections.
- Category names/counts remain legible in English/Myanmar and narrow windows. Use wrapping/overflow affordance, not hundreds of permanently visible long pills.
- Result rows prioritize title, teacher and verified metadata; clearly show saved/in-progress, playable/video and unavailable file indicators as appropriate.
- Search results support loading, zero matches, failure, retry, clear filters, paging/load more; display actual result count. Reliable sorting is conditional on database metadata and verified UX value, not added blindly.
- Unsupported WMA/WMV records retained, flagged and gated; unknown titles or teachers use existing truthful fallbacks.

### FR-TEACHER/COLLECTION

- Searchable Teachers with curated highlighted entries, consistently sized icon/avatar fallback, counts and language-aware names.
- Teacher Detail shows only actual metadata plus collections and talks; never invent portraits, biographies or unsupported religious classifications.
- Collections show actual teacher grouping, item totals and semantic hierarchy; detail preserves track order and content links. Navigation back restores context.
- Shared TrackRow/TeacherCard/CollectionCard components handle long script, missing data, and current playback consistently.

### FR-PLAYER

- Existing audio player remains persistent during browsing and responsive in compact layout; height accounted for in content padding.
- Accessible main controls: play/pause, 15s back/forward, seek slider with bounded range, elapsed/duration or remaining time, rate and queue. Current media identity prominent and readable.
- Missing duration is unknown, not zero or guessed. Continue/resume after metadata. Completion resets position consistent with existing behavior.
- Playback errors offer localized reason/retry/dismiss; retain host fallback and URL validation; no duplicate media elements simultaneously streaming.
- Expanded/focused audio presentation is optional view state of same MediaEngine, not a second player service.
- Queue is keyboard accessible and visually anchored; allows remove, clear and current undo; safe focus restore and no off-window placements.
- MP4 uses existing VideoPlayer behavior, fullscreen, Escape navigation, and no persistent audio player clash. Unsupported media never advertises usable Play control.

### FR-LIBRARY/SETTINGS

- Reuse Downloads/Favorites/History tabs and actions, with consistent counts, empty states, accessible tab semantics and sensible default tab when data exists.
- Important regression: History must remain reachable if favorites and downloads are empty but listening history is present.
- Download UI reflects actual progress/state; missing local file paths cannot silently be presented as playable offline.
- No background upload/sync. Local-only state remains validated on load with existing storage schema and keys.
- Settings: language (English/မြန်မာ), Light/Dark/System, default rate, browse limit, shortcut help, privacy/info. User changes visibly propagate across shell, dialogs, player and video and survive restart.

### FR-I18N/A11Y

- Keep src/i18n.ts authoritative for localized strings; do not scatter untranslated labels. Test system numbers/durations appropriate to locale.
- Burmese strings use language-aware fonts, line heights, wrapping and grapheme-safe truncation; never force caps/tracking intended for Latin labels.
- Correct buttons, dialog/tabpanel semantics, aria labels, keyboard traversal, focus return from overlays, visible focus rings, meaningful disabled reasons. No mouse-only critical action.
- Use actual measured contrast (normal text ≥4.5:1, large text ≥3:1, meaningful control outlines/icons ≥3:1 where applicable). Motion respects prefers-reduced-motion. Aim for 44px hit targets.

## 5. Impeccable design direction

### 5.1 North star — The Quiet Listening Desk

A modern, carefully arranged reading-and-listening desk at a meditation study center: high-quality materials, readable pages, orderly indexes, restrained green action, matte warm surfaces and deliberate whitespace. Translate its _discipline and geometry_ into UI rather than literal desk/temple photos. Buddhist context is respected through content and restraint, not ornamental clichés.

**Avoid:** SaaS dashboard, Spotify imitation, generic admin cards, pseudo-religious decoration, oversized hero banners, gradients/glows, translucent glass, stock Buddhist photography, floating controls fighting the native frame, excessive whitespace and fake content.

### 5.2 Three distinct composition candidates (evaluate before final selection)

| Concept                                              | Structure                                                                                                      | Benefit                         | Risk                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------ |
| C1 — Quiet Listening Desk (recommended initial lead) | Compact navigation, immediately dominant continue section, spacious scannable index, optional contextual queue | Strong return-to-listen journey | Don't bury discovery     |
| C2 — Scholarly Index                                 | Denser hierarchical catalogue, restrained typographic toolbar, persistent player                               | Power search/teacher study      | May feel overly academic |
| C3 — Editorial Reading Room                          | Calm editorial chapters, featured teacher and collection progression, quieter current-talk region              | First-time browsing             | May delay resume action  |

Use Impeccable to create/read/critique three representative comps with identical real fixture data, at 1280x820 and 860x620, both English/Myanmar long strings, at least light/dark. Score each on resume speed (30%), discovery clarity (25%), long-script readability (20%), keyboard/a11y (15%) and implementation simplicity (10%). Choose the top qualified design, checking against visual coherence and no catastrophic tradeoff. Evaluation—not the lead's designation—locks the final layout. Record reason in the Phase P0 decision log.

### 5.3 Preliminary seed tokens (NOT final until measured and selected)

| Token role        | Light candidate          | Dark candidate              |
| ----------------- | ------------------------ | --------------------------- |
| Canvas            | #F5F2E9 warm ivory       | #141C18 near-charcoal green |
| Surface           | #FCFAF5 creamy paper     | #1E2721 dark surface        |
| Secondary surface | #EDE8DD restrained sand  | #27312A softened olive      |
| Main text         | #202620 deep ink         | #EBEEE6 warm off-white      |
| Secondary text    | #5A645A muted gray-green | #B8C2B6 pale sage           |
| Primary action    | #28563C deep forest      | #98C5A8 soft sage           |
| Bronze accent     | #83683F muted bronze     | #BDA47D light bronze        |
| Divider           | #D6D8CE warm neutral     | #3B473F olive-gray          |

Values are candidate inputs. Do not call them contrast-compliant until tested. Represent all values as semantic CSS-first Tailwind tokens, with a single data-theme/system mode strategy; no scattered hardcoded colors.

**Typography:** Existing bundled Source Serif 4 for prominent Latin headings; readable sans for body and controls; Myanmar fallback fonts and dedicated metrics for mixed-script content. No remote fonts. **Rhythm:** 4/8px spacing scale; control radius 8px, card radius 12px; iconography via existing Icon component; one subtle player elevation allowed. **Motion:** 120–200ms-style restrained interaction where useful, instant when reduced-motion is enabled. Exact motion values are design-system decisions subject to visible testing.

### 5.4 Required design artifacts before Phase P1

- Three comparable visual composition studies and scorecard.
- Selected direction brief explaining the referent, hierarchy, distinctive decisions and anti-patterns.
- Updated DESIGN.md in a controlled P1 change with full semantics/token mapping.
- Screen/region inventory for Home, Explore, Teacher + Detail, Collection + Detail, Library, Settings, Audio Player, Queue, Video, Help.
- Light/dark and English/Myanmar variants, with long/empty/error/loading/playable/unplayable states.
- Interactive behavior specification: pointer, keyboard, focus, reduced motion, scroll, active playback and native window control.

## 6. Architecture and implementation contracts

### 6.1 Logical boundaries

```text
Tauri native shell / window chrome
  └── Svelte AppShell (src/App.svelte)
       ├── Sidebar / TitleBar / Header / GlobalSearchEntry
       ├── Route Views: Home, Explore, Teachers, Collections, Library, Settings
       ├── Detail Views: TeacherDetail, CollectionDetail
       ├── Audio Player / Focused Listening / Queue / VideoPlayer / Help
       └── Visual primitives + DESIGN.md + CSS-first Tailwind + i18n
                  │ typed user interactions / state
                  ▼
       src/app.ts DhammaApp + src/store.ts reducer
         ├── src/api.ts typed Tauri IPC ──► Rust commands ──► read-only SQLite
         ├── src/player.ts MediaEngine ───► URL guard ──► allowed HTTPS media
         └── src/persistence.ts ─────────► localStorage v2 + app data downloads
```

### 6.2 Protected contracts

- UI owns rendering/interaction, NOT SQL, filesystem or arbitrary network.
- Preserve existing typed API commands, DTOs, validation and category alias. The current Rust code exposes multiple named catalogue and download commands; do not inaccurately assume it literally has six.
- Strict read-only parameterized SQLite operations; no catalogue-data rewrites. No widening Tauri CSP, allowed media hosts or asset protocol.
- Catalogue strings remain escaped text nodes; never unsafe HTML or remote images/fonts.
- DhammaApp remains one authoritative player/search/queue state owner. Reuse existing MediaEngine and URL fallback logic; no second audio instance.
- Persisted data keys and v2 schema stay compatible with v1 data. Keep settings, library, download paths and sidebar preference.
- Avoid breaking changes to src-tauri/src, src/app.ts, src/store.ts, src/player.ts, src/persistence.ts and src/api.ts unless a documented acceptance failure cannot be repaired in presentation, with targeted tests.
- New visual primitives must use typed Svelte 5 props/runes, existing Icon conventions, Tailwind CSS 4 Vite integration and shared semantic tokens. Favor composition over dependency additions.

### 6.3 Suggested visual component responsibilities

| Component family                        | Ownership                                                            |
| --------------------------------------- | -------------------------------------------------------------------- |
| AppShell / Sidebar / TitleBar           | Chrome, navigation, responsive regions, drag controls, global search |
| Header / Section / Surface / EmptyState | Context, typography, content grouping, consistent async states       |
| SearchField / FilterControls            | Existing unified search actions, clear, loading and advanced filters |
| TrackRow / TeacherCard / CollectionCard | Reusable accurate metadata and action controls                       |
| Player / QueuePanel / VideoPlayer       | Presentation of the single media controller, never separate playback |
| Settings / LibraryTabs                  | Existing persisted preferences and state presentation                |

Avoid building a broad component framework before actual screens demonstrate reuse.

### 6.4 Responsive matrix

| Size      | Required result                                                                         |
| --------- | --------------------------------------------------------------------------------------- |
| 860x620   | Functional minimum; sidebar collapses, controls never clip, player and queue accessible |
| 1024x768  | Compact notebook with progressively disclosed filters/player secondary actions          |
| 1280x820  | Canonical composition target                                                            |
| 1440x900  | Deliberate use of desktop space, not giant empty columns                                |
| 1728x1117 | Reading line-length limits and disciplined information density                          |

Main content reserves space for fixed active audio footer; overlays stay inside window bounds. Keep a single responsive navigation model, and base component overflow on real content width.

### 6.5 Nonfunctional goals

- **Privacy:** zero tracking/network endpoints except explicitly played or downloaded allowlisted media.
- **Reliability:** route changes, theme changes and sidebar collapse do not reset or multiply playback.
- **Performance:** record Phase P0 baseline for cold render, search input response, result rendering and memory; no material regression in p95. Don't invent unmeasured absolute timings.
- **Portability:** macOS native visual smoke; Windows/Linux command-modifier and window-control smoke in available native/CI environment.
- **Security:** unchanged host checks, CSP and no HTML injection.
- **Maintainability:** single design-token source, no hidden duplicated search/player state, CI-green tests and documented decisions.

## 7. Phased implementation and gates

**This section is an execution plan, not a request to begin code changes.**

### P0 — Research, baseline and concept selection

Audit running app and all existing states, freeze test fixtures, capture baseline screenshot/performance notes; use Impeccable context/playbook and Context7 for version-sensitive API details. Create/compare C1/C2/C3 and choose based on scorecard. Confirm design direction and visual component map.

**Gate:** all existing features inventoried, no important ambiguous data shape, three comps and rationale exist, selected world documented. Application source remains unchanged in this phase.

### P1 — Visual system and desktop shell

Replace DESIGN.md intentionally; implement Tailwind @theme tokens, light/dark/system typography, button/form/section primitives, lotus refinement, native-safe TitleBar, collapsible Sidebar, Header and global search focus. Preserve existing routes/controller.

**Gate:** shell, 860x620/1280x820, no duplicate window controls, focus and theme checks pass.

### P2 — Home and catalogue

Design first-run/returning Home; Explore filters and rows; Teacher/TeacherDetail; Collections/CollectionDetail. Reuse existing queries and curated teachers; avoid new sorts without approved stable metadata.

**Gate:** resume/first-run, search, filtering, context restore, unknown metadata and unsupported formats pass.

### P3 — Player, queue and video

Refactor only presentation and needed ephemeral view state. Implement compact/focused states, accessible progress, clear queue drawer and video experience using same MediaEngine. Preserve URL fallback and download rules.

**Gate:** uninterrupted playback, offset resume, error/retry, queue undo, video open/close and no simultaneous playback pass.

### P4 — Library, Settings, localization and a11y

Refresh tabs, downloads/history/favorites, preferences, localized dialogs, help, focus, reduced-motion, long Myanmar strings, all empty/error/loading states.

**Gate:** persisted state unchanged, keyboard and screen reader walkthrough, contrast measurements, EN/MY both themes pass.

### P5 — Hardening, website and release prep

Run full automated gates, real Tauri native/window/browser visual suite, compare screenshots and fix substantive defects in bounded Impeccable pass, refresh docs website/screenshots, changelog and build artifacts.

**Gate:** all high/critical ACs PASS, zero unresolved P0/P1 defects, release-ready artifacts and screenshots. Public publishing/store upload requires a separate explicit operational action.

### Execution method

Per phase: inspect → select one coherent slice → edit minimal files → focused tests → build → one batched visual inspection/fix → confirmation → record evidence. Parallelize independent views only; serialize src/App.svelte, src/index.css, DESIGN.md, i18n and controller edits to avoid conflicts. Preserve git history; avoid destructive resets and unrelated cleanup.

## 8. Verification policy and testing

Use existing Bun, Node test runner and Rust infrastructure, with no new JS test framework. Run the relevant focused tests and ultimately:

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test:coverage
bun run design:lint
bun run design:check
bun run design:assets:check
bun run build:web
bun run smoke:web
bun run verify:web
bun run site:verify
bun run verify
```

Full verify also performs Rust/clippy/audit/build checks defined in package.json. Core TS line/branch/function coverage is enforced at 100% but does NOT imply Svelte component or visual coverage. Run real rendered app checks; an Impeccable regex-only source scan of .svelte cannot detect element contrast or window chrome defects. Capture actual macOS native frame separately from web preview.

**Fixtures:** empty library, returning recent user, queued content, long mixed Burmese title, missing teacher, WMA/WMV, MP3/MP4, failed media, slow remote response, missing downloaded file, no duration, system dark, reduced motion. **Capture matrix:** 860x620 and 1280x820 minimum, 2 themes + system-follow check, English + Myanmar, all route families, player/queue/video, focus and overflow.

Evidence per acceptance item: status PASS/FAIL/BLOCKED, command or walkthrough, fixture, screenshot/log/test file, affected commit. A blocked platform smoke remains BLOCKED, never claimed to pass.

## 9. Risk register

| Risk                                                  | Severity | Mitigation                                                              |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| Playback interrupted or doubled by new player UI      | Critical | Preserve single engine; lifecycle tests and real play smoke             |
| Personal favorites/history/resume/downloads lost      | Critical | Compare v1/v2 storage fixtures, restart regression, no schema migration |
| Widening CSP or arbitrary filesystem/database access  | Critical | Contract/config diff checks, negative URL tests                         |
| Myanmar text clipping/shaping                         | High     | Long/mixed-script fixtures in native WKWebView, grapheme tests          |
| Duplicate titlebar controls and broken dragging       | High     | Native macOS/Windows/Linux conditional checks                           |
| Small-window overflow (player/filters/queue)          | High     | 860x620 screenshots and keyboard/scroll tests                           |
| Offline status false because downloaded path vanished | High     | Missing-file fixture and accurate fallback                              |
| Comp visual novelty supersedes listening usability    | Medium   | Three-composition scoring tied to jobs                                  |
| Stale screenshot/site/release metadata                | Medium   | Update after app acceptance, verify site and build matrix               |
| Existing capability reimplemented in a parallel path  | High     | Source ownership map, preserve controller and shared components         |

## 10. Definition of done and change control

Complete means acceptance matrix passes (with explicit disposition for any environment blockers); every existing route, locale, theme, media state and personal library action is regression tested; website and packaging are aligned; release notes and evidence are written. No green status based solely on the static Impeccable scan or screenshot appearance.

Anything involving new accounts, third-party APIs, AI recommendation logic, telemetry, schema migrations, new network origins, backend redesign, dependency additions or remote media rights is out of scope and requires separate approval. Sorting and expanded player mechanisms are implementation details conditioned on real capabilities—not permission to change protected contracts.

**Still to decide within approved workflow:** exact C1/C2/C3 selected comp after evaluation; final measured tokens; optional stable sorting data suitability; exact presentation state for focused listening; available Windows/Linux testing environments; release version and publication timing. These are phase gates, not reopened Q01–Q80 answers.

## 11. Decision traceability index

| IDs     | Scope                                           | Acceptance coverage |
| ------- | ----------------------------------------------- | ------------------- |
| Q01–Q10 | Product, audience, boundaries                   | AC-01–AC-09         |
| Q11–Q24 | Visual world, tokens, typography, motion        | AC-10–AC-17         |
| Q25–Q35 | Shell, chrome, navigation, responsive           | AC-18–AC-26         |
| Q36–Q50 | Home, search, teachers, collections             | AC-27–AC-40         |
| Q51–Q61 | Library, player, queue, video                   | AC-41–AC-56         |
| Q62–Q70 | Languages, accessibility, state surfaces        | AC-57–AC-66         |
| Q71–Q80 | Architecture, delivery, tests, website, release | AC-67–AC-80         |

Every approved Q01–Q80 default is represented above by its question group and the normative AC table in ACCEPTANCE.md. Do not silently replace an A approval with a B/C implementation.
