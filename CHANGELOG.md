# Changelog

All notable changes to this project are documented here.

## [Unreleased]

## [0.5.6] - 2026-08-21

### Added

- Added GitHub Actions MSIX packaging for Microsoft Store submission without a customer code-signing certificate.
- Published each tagged Windows x64 installer to GitHub Pages as a direct, versioned package URL for Microsoft Partner Center.

### Changed

- Increased interactive control targets to 44px for more reliable desktop pointer and touch interaction.
- Replaced the custom keyboard-shortcuts focus trap with a native modal dialog.
- Simplified the home catalogue summary into a single sentence that includes live talk and teacher totals.

### Fixed

- Restored viewport-bounded catalogue scrolling, including wheel input over the docked video player and compact layouts.

## [0.5.5] - 2026-08-17

### Added

- Added semantic audio and video categories with unified catalogue filtering.
- Added MP4 and WMV format visibility plus reliable video playback, route lifecycle, and fullscreen behavior.
- Added progressively growing load-more batches for large catalogue views.

### Changed

- Refined the listening-room interface, layout hierarchy, compact player spacing, loading/error states, and control treatments.

## [0.5.4] - 2026-08-13

### Added

- Added a machine-verifiable required-test policy check that rejects focused or skipped tests.
- Added a UI shell architecture diagram covering normal and compact desktop layouts.

### Changed

- Refined the desktop shell, route headers, search forms, card grids, track actions, async states, and persistent player for clearer hierarchy and better behavior at the 860×620 minimum window.
- Made the compact player a deliberate two-row layout while preserving seek, progress, speed, retry, and queue controls.
- Removed application volume controls so playback loudness follows the operating system exclusively.
- Increased critical navigation/playback action targets and made current-track emphasis visible through both structure and color.
- Standardized local tooling on Bun 1.4.0-canary.1 and GitHub workflows on the Bun canary channel so CI can read the committed lockfile.
- Updated GitHub workflow checkout steps to the current `actions/checkout@v7` major.
- Raised measured core TypeScript branch coverage from the previous 99% exception to a strict 100% threshold.

## [0.5.1] - 2026-08-11

### Fixed

- Restored the release CI gate with coverage for offline downloads, progress state, local playback, and library selectors.
- Added regression coverage for settings, persistence, and defensive runtime paths.
- Kept release verification strict for formatting, linting, type checking, builds, smoke checks, and security audits.

## [0.5.0] - 2026-08-11

### Added

- Offline MP3 downloads with persisted local files, progress indicators, and offline playback from My Library.
- A unified My Library view for downloaded talks, favorites, and listening history.
- User-selectable Light and Dark themes, with Light as the default and the choice stored locally.
- Configurable 25, 50, or 100-row Load more pagination across talks, collections, and teacher pages.

### Changed

- Refined the desktop navigation, rounded controls, filter chips, badges, and hover/focus states for consistent alignment.
- Improved Myanmar typography and vertical spacing across track rows, cards, player metadata, and library views.
- Added stronger favorite-state contrast with a filled active heart and clearer download states.

### Fixed

- Prevented duplicate favorite/download entries in library sections.
- Fixed oversized active-filter close icons and blank pagination row selectors.
- Fixed clipped Myanmar glyphs and inconsistent pill/badge vertical alignment.
- Added download URL validation, progress event handling, and safer local asset playback.

## [0.4.1] - 2026-08-10

### Changed

- Removed dead frontend helpers and obsolete TypeScript tooling after the Svelte migration.
- Narrowed internal module exports and standardized the project quality commands.
- Made CI deterministic around the committed Rust lockfile and Bun lockfile v2.
- Updated CI and release workflows to use the Bun 1.4 canary required by the lockfile.
- Expanded release verification documentation and refreshed project architecture guidance.

## [0.4.0] - 2026-08-10

### Added

- Rebuilt the desktop interface with Svelte 5 components and a Vite frontend pipeline.
- Added focused component, runtime, and UI tests for the Svelte frontend.
- Added Svelte-aware formatting, linting, type checking, build, and smoke-test tooling.

### Changed

- Replaced the HTML-string/DOM-delegation desktop frontend with Svelte 5 components while preserving Tauri 2, Tailwind CSS v4, and the existing application controller/state modules.
- Switched frontend development and production builds to Vite.
- Kept playback updates local to the affected controls and corrected scroll-jitter behavior.
- Updated CI quality gates for the Svelte frontend and Vite build.

## [0.3.0] - 2026-08-10

### Added

- Full audio catalogue browsing backed by the bundled SQLite database.
- Load-more pagination for catalogue, collection, and teacher-talk lists.
- Curated featured teachers with badges and consistent ordering.
- Clear buttons for all text search fields.

### Changed

- Sort teacher collections by teacher, then naturally by collection name and disc number.
- Group and naturally sort collections on the collections page, with compact search controls.
- Preserve Burmese text clusters when titles wrap.
- Reduce the bundled database by removing crawler-only tables while preserving the catalogue.
- Fetch Git LFS database assets explicitly in CI and release builds.

### Fixed

- Prevent featured teacher cards from being clipped during hover interactions.

## [0.2.4] - 2026-08-09

### Changed

- Show curated featured teachers first on the default Teachers page while preserving the existing order of all other teachers.
- Add a `Featured` badge to curated teacher cards without changing teacher-search result ordering.

## [0.2.3] - 2026-08-09

### Changed

- Match the desktop Home featured-teacher list and exact card order to the curated Expo mobile selection.
- Keep featured-teacher curation frontend-only while preserving live catalogue names and talk counts.

## [0.2.2] - 2026-08-09

### Added

- Privacy policy page for the published product site.

### Fixed

- Preserve each teacher's original catalogue order so repeated numbered teaching series remain together across pages.
- Stop treating Burmese date prefixes as track sequence numbers, which could make expected talks appear missing after pagination.

## [0.2.1] - 2026-08-07

### Added

- Continue-listening section on home screen from recent history.
- `homeRecent` store slice for continue-listening data.
- `getAudioTrack` API for single-track lookup.
- Featured teachers curated to top 30 (then narrowed to 6 hand-picked).

### Changed

- Home header simplified to "Home — Discover the Dhamma".
- Catalogue stats shown only when listening history exists.
- Limit continue-listening rows for compact display.

### Fixed

- Player resume tracks from home recent list.
- Dev server file race condition.

### Security

- Dev server file race fix (Tauri permission boundary).

## [0.2.0] - 2026-08-05

### Added

- `bun run ci` script consolidating format, lint, web quality gates, and dependency audit; the CI web job runs it as a single step.
- Ad-hoc signing for macOS release builds and LF line-ending enforcement for Windows checkouts.

### Fixed

- Rescaled the macOS application icon inside a verified optical safe area and regenerated PNG, ICNS, and ICO variants.
- Rebuilt the player transport around balanced back-15, play/pause, and forward-15 controls with optically centered glyphs.
- Reduced catalogue-row play controls, grouped speed/volume/queue actions, and preserved the complete player at the 860×620 minimum window size.
- Reflowed search filters at compact widths so the search field remains usable instead of collapsing to an icon-only box.
- Repaired MP3 playback by normalizing catalogue URLs, upgrading approved HTTP records to HTTPS, encoding paths, and retrying the approved `www` and bare hosts.
- Applied resume positions after media metadata loads and reset completed talks to the beginning.
- Added stable loading, failure, and retry states to the player.
- Rebuilt the fixed footer as a compact responsive three-column layout with explicit content clearance so it no longer covers catalogue rows.
- Fixed teacher-card selection identifiers and reduced redundant progress renders and local-storage writes.
- Aligned Rust playability classification and the Tauri media CSP with both approved Dhamma Download hostnames while keeping WMA unavailable.

### Added

- Dependency-free Dhamma Echo product website under `docs/` with the supplied explore/player screenshot, responsive design, local assets, accessibility states, and GitHub Pages-safe repository links.
- Product-site behavior tests, static asset smoke checks, architecture diagrams, and a least-privilege GitHub Pages deployment workflow.
- Deterministic app-icon generation and dependency-free icon geometry/configuration verification.
- Initial Dhamma Echo Tauri 2 application.
- Read-only SQLite catalogue commands for summaries, teachers, and audio search.
- Search, language/format/teacher filters, pagination, favorites, history, resume positions, queue, playback speed, and theme settings.
- Tailwind CSS v4 design system with light and dark themes.
- Strict CSP and secure-media URL enforcement.
- TypeScript core test suite with 100% line, branch, and function coverage.
- Architecture diagrams, CI/release workflows, open-source governance files, and original application assets.
