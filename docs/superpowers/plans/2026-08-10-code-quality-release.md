# Code Quality Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a behavior-preserving quality release with no known dead production code, a smaller public/internal surface, deterministic quality gates, and verified release artifacts.

**Architecture:** Keep the existing Svelte 5 presentation layer, TypeScript application core, and Tauri 2/Rust catalogue backend unchanged. Remove artifacts left by the pre-Svelte renderer and obsolete fallback tooling, narrow internal types so only real module boundaries are exported, and strengthen deterministic lockfile/verification behavior without adding production dependencies.

**Tech Stack:** Svelte 5.56.8, TypeScript 6, Vite 8.1.5, ESLint 10.7.0, Tauri 2.11.5, Rust 2024 edition, Bun lockfile/package manager.

## Global Constraints

- Preserve all user-visible behavior and the current light UI.
- Do not add production dependencies.
- Preserve Bun and `bun.lock`; preserve `src-tauri/Cargo.lock`.
- Remove production code that has no production caller.
- Narrow exports that exist only because declarations were historically public.
- Keep formatter/lint/typecheck/test/build commands strict; warnings remain errors where configured.
- Keep zero skipped/disabled/focused required tests.
- Keep the existing 100% core TypeScript coverage gate and report any broader instrumentation limitation explicitly.
- Update CI so it validates, rather than regenerates, the committed Rust lockfile.
- No unrelated redesign, feature work, framework migration, or dependency upgrade.

---

### Task 1: Remove dead post-migration code

**Files:**
- Modify: `src/runtime.ts`
- Modify: `src/utils.ts`
- Modify: `tests/runtime.test.mjs`
- Modify: `tests/utils.test.mjs`

**Interfaces:**
- Consumes: existing Svelte keyboard/runtime helpers and audio URL normalization.
- Produces: the same production runtime behavior with only production-reachable helpers remaining.

- [ ] Remove `isRoute`; no production module imports it after delegated DOM routing was removed.
- [ ] Remove `isPlayableUrl`; playback uses `mediaUrlCandidates` directly.
- [ ] Remove `escapeHtml`; Svelte escapes interpolated text and the old HTML-string renderer no longer exists.
- [ ] Remove tests whose only purpose was keeping those dead helpers alive.
- [ ] Run the focused runtime/utils tests and TypeScript compile.
- [ ] Commit the slice.

### Task 2: Narrow unnecessary module API surface

**Files:**
- Modify: `src/api.ts`
- Modify: `src/app.ts`
- Modify: `src/types.ts`
- Modify: `src/ui.ts`
- Modify: `tests/api.test.mjs`
- Modify: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: `CatalogueApi`, `DhammaApp`, `AppState`, and UI helper functions used across modules.
- Produces: only symbols that cross a module boundary remain exported; internal implementation types/constants become private.

- [ ] Make `CatalogueError` private and keep the public rejection contract test focused on stable `name`, `code`, and `message` behavior.
- [ ] Make `CatalogueClient` private to `app.ts`.
- [ ] Make internal state-shape helper interfaces/types private in `types.ts` while keeping externally imported domain types exported.
- [ ] Make `CURATED_FEATURED_TEACHER_IDS` and `CollectionGroup` private to `ui.ts`; test behavior instead of internal constants.
- [ ] Run focused API/UI tests and compile/type checks.
- [ ] Commit the slice.

### Task 3: Remove obsolete and duplicate quality tooling

**Files:**
- Delete: `tsconfig.app.json`
- Delete: `scripts/lint-offline.mjs`
- Modify: `package.json`
- Modify: `docs/ralph-loop.md`

**Interfaces:**
- Consumes: the existing Bun, ESLint, Prettier, Svelte Check, Node test, Vite, and Cargo commands.
- Produces: one canonical command per quality concern with no legacy fallback path.

- [ ] Remove the unused `tsconfig.app.json`.
- [ ] Remove dependency-free offline lint now that the release path requires the real ESLint stack.
- [ ] Remove unused Svelte-only formatter aliases; keep canonical repository formatter commands.
- [ ] Make site verification use Bun consistently instead of invoking npm from a Bun-managed project.
- [ ] Add `--locked` to Rust verification commands where Cargo supports it.
- [ ] Rewrite `docs/ralph-loop.md` for this code-quality release and its exact gates.
- [ ] Run package/config checks and commit the slice.

### Task 4: Make CI deterministic around the committed Rust lockfile

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml` only if required for equivalent lockfile discipline.

**Interfaces:**
- Consumes: committed `src-tauri/Cargo.lock` and existing CI/release jobs.
- Produces: CI that fails on lockfile drift instead of silently regenerating dependencies.

- [ ] Remove `cargo generate-lockfile` from CI.
- [ ] Use `--locked` for Cargo lint/test/build checks.
- [ ] Preserve existing pinned workflow/toolchain versions and permissions.
- [ ] Inspect workflow diffs for unrelated changes.
- [ ] Commit the slice.

### Task 5: Full release verification and artifact handoff

**Files:**
- Create: `docs/verification/2026-08-10-code-quality-release.md`
- Create: final Git bundle in `/mnt/data`.

**Interfaces:**
- Consumes: all repository quality commands and the finalized branch.
- Produces: evidence for formatter, lint, typecheck, tests, skipped-test scan, coverage, build, security/audit, Rust gates, UI-impact classification, lightweight measurements, and Git bundle verification/clone test.

- [ ] Install the exact Bun/Rust toolchains needed by the repository in the execution environment without changing project dependency manifests.
- [ ] Run clean/frozen dependency installation.
- [ ] Run formatter check, ESLint, Svelte typecheck, full tests, coverage, production web build, smoke, icon validation, site verification, and dependency audit.
- [ ] Scan for skipped/disabled/focused tests and suppressions.
- [ ] Run Rust format, clippy, tests, release build, and dependency audit when the toolchain/environment permits.
- [ ] Record production web artifact sizes before/after where a baseline can be reconstructed from the input bundle.
- [ ] Classify UI visual verification as `NOT APPLICABLE` if no user-facing code changed; otherwise perform the required runtime visual verification.
- [ ] Record exact PASS/FAIL/BLOCKED/NOT APPLICABLE evidence in the verification document.
- [ ] Create a meaningful final commit.
- [ ] Create the Git bundle with `--all`, verify it, clone it into a temporary directory, and run key verification commands from the clone when practical.
