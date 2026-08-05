# Changelog

All notable changes to this project are documented here.

## [Unreleased]

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
