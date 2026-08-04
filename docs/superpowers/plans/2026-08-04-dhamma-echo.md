# Dhamma Echo Implementation Plan

> **For agentic workers:** This plan was executed inline with the Superpowers executing-plans and test-driven-development workflows. Checkboxes record the implemented state; blocked native commands are documented in the verification report.

**Goal:** Build a lightweight Tauri 2 desktop audio player that safely queries the supplied Dhamma SQLite catalogue and provides local playback/library features.

**Architecture:** A framework-free TypeScript webview uses a deterministic store, escaped string renderer, HTML audio adapter, and validated local persistence. Six narrow Tauri commands call a read-only `rusqlite` repository; no generic SQL, shell, filesystem, or arbitrary network command crosses the trust boundary.

**Tech stack:** Tauri 2, Rust 2024, rusqlite, strict TypeScript, Tailwind CSS v4, Node test runner, GitHub Actions.

## Global constraints

- Keep the supplied SQLite catalogue immutable.
- Permit media playback only from HTTPS `dhammadownload.com` URLs.
- Keep runtime frontend dependencies at zero.
- Use Tailwind CSS v4 CSS-first tokens.
- Enforce strict TypeScript and zero-warning ESLint.
- Require 100% line, branch, and function coverage for core TypeScript modules.
- Document native verification blockers instead of fabricating results.
- License code/assets under MIT without relicensing supplied data or remote media.

---

### Task 1: Inspect source data and lock product scope

**Files:**

- Create: `docs/superpowers/specs/2026-08-04-dhamma-echo-design.md`
- Create: `docs/ralph-loop.md`

**Produces:** Verified schema/counts, security constraints, app name, design tokens, acceptance gates, and loop exit conditions.

- [x] Inspect every SQLite table and count media by type, language, format, and URL scheme.
- [x] Record missing duration and size metadata and design duration discovery at playback time.
- [x] Select the name **Dhamma Echo** and tagline **A quiet desktop library for Dhamma talks.**
- [x] Define version-one scope and explicit exclusions.
- [x] Define project-specific Ralph Loop validation commands and risks.
- [x] Commit the design and plan before implementation.

### Task 2: Build the test harness and pure application core

**Files:**

- Create: `src/types.ts`, `src/utils.ts`, `src/persistence.ts`, `src/store.ts`, `src/api.ts`, `src/player.ts`, `src/app.ts`, `src/mock-data.ts`
- Create: `tests/*.test.mjs`, `tests/test-data.mjs`
- Create: `scripts/test.mjs`

**Interfaces:**

- Produces: `CatalogueApi`, `DhammaApp`, `AudioEngine`, deterministic reducer actions, validated storage functions, and secure URL utilities.

- [x] Write failing behavior tests before each core module.
- [x] Verify each test fails for the intended missing behavior.
- [x] Implement the minimum production code to pass.
- [x] Add corruption, error, boundary, queue, playback, filter, and unsafe URL paths.
- [x] Enforce 100% line, branch, and function thresholds on core compiled modules.
- [x] Save a machine-readable coverage summary.

### Task 3: Build the accessible Tailwind interface

**Files:**

- Create: `src/view.ts`, `src/main.ts`, `src/index.css`, `index.html`
- Create: `public/logo.svg`, `public/empty-library.svg`
- Create: `scripts/build.mjs`, `scripts/dev-server.mjs`, `scripts/smoke.mjs`

**Interfaces:**

- Consumes: `DhammaApp`, state types, API client, and mock invoke adapter.
- Produces: Home, Explore, Teachers, Library, Settings, queue, and persistent player UI.

- [x] Write renderer tests for every route and loading/empty/error/player state.
- [x] Escape all catalogue-controlled text.
- [x] Add semantic controls, keyboard shortcuts, visible focus, and reduced-motion rules.
- [x] Integrate Tailwind CSS v4 CSS-first design tokens and light/dark/system themes.
- [x] Add browser mock mode and a dependency-free development server.
- [x] Build production assets and validate required files with a smoke script.
- [x] Produce and inspect a static Chromium screenshot.

### Task 4: Implement the read-only Tauri database boundary

**Files:**

- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/*.rs`
- Create: `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- Copy: `src-tauri/resources/dhamma.db`

**Interfaces:**

- Produces commands: `get_catalogue_summary`, `list_featured_teachers`, `search_teachers`, `get_teacher`, `search_audio`, `get_audio_track`.

- [x] Open SQLite with read-only flags, query-only pragma, and bounded busy timeout.
- [x] Validate identifiers, page limits, formats, languages, and teacher filters.
- [x] Use parameterized values for all user-supplied query data.
- [x] Normalize scraped whitespace and classify only allowlisted HTTPS URLs as playable.
- [x] Add in-memory SQLite integration tests and stable command errors.
- [x] Restrict the main webview to Tauri core IPC and a strict CSP.
- [ ] Compile, format, clippy-check, and run Rust tests locally; blocked because this sandbox has no Rust toolchain and cannot reach crates.io.

### Task 5: Add original platform assets and packaging configuration

**Files:**

- Create: `src-tauri/icons/*`
- Modify: `src-tauri/tauri.conf.json`

- [x] Create an original saffron/leaf identity consistent with the design specification.
- [x] Generate PNG, ICO, and ICNS platform variants.
- [x] Reference every packaged icon and the bundled database in Tauri configuration.
- [x] Validate image signatures and dimensions.
- [ ] Produce native installers locally; blocked by unavailable Rust/Tauri dependencies.

### Task 6: Make the repository public-ready

**Files:**

- Create: `README.md`, `LICENSE`, `DATA_LICENSE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `.env.example`
- Create: `docs/architecture/*.md`, `docs/images/dhamma-echo-home.png`
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/codeql.yml`

- [x] Document installation, development, commands, testing, packaging, security, troubleshooting, contribution, and release procedures.
- [x] Add Mermaid context, module, sequence, and release diagrams.
- [x] Separate MIT source/assets rights from unverified catalogue/media redistribution rights.
- [x] Add least-privilege CI, security scanning, audits, and native release matrix.
- [x] Record actual local verification evidence and external blockers.

### Task 7: Final Ralph Loop proof and delivery

**Files:**

- Create: `docs/verification/2026-08-04-results.md`
- Generate outside repository: `dhamma-echo.bundle`, source archive, coverage summary, UI preview.

- [x] Run offline lint, strict typecheck, 36 tests, core coverage, production web build, and web smoke checks.
- [x] Validate JSON/TOML, database counts/hash, asset formats, and documentation links.
- [x] Attempt standard formatter, ESLint, Rust, package, and audit commands and record exact blockers.
- [x] Commit focused implementation/documentation changes.
- [x] Create and verify a complete Git bundle.
- [x] Clone the bundle into a temporary directory and rerun available web verification from the clone.
