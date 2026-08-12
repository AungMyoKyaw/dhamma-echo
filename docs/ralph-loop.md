# Production UI Hardening Ralph Loop

## Goal

Ship a production-ready Dhamma Echo desktop build with materially improved UI/UX, compact-window behavior, accessibility, reproducible tooling, and evidence-backed quality gates while preserving the existing product architecture and behavior.

## Current state

- Svelte 5 + TypeScript + Vite + Tailwind CSS v4 frontend in Tauri 2.
- Bun lockfile and Rust lockfile are committed.
- Strict TypeScript and ESLint are already configured.
- Open-source README/policies, CI/release workflows, and architecture diagrams already exist.
- UI recently migrated to Tailwind utilities but still contains viewport/layout assumptions that crowd the 860px minimum window.
- CI/release workflows currently use Bun `canary` or `latest` instead of one reproducible stable version.
- Coverage currently permits 99% branches and covers core TypeScript modules, not Svelte component source.

## Acceptance criteria

- Existing routes, catalogue behavior, playback, queue, downloads, favorites, persistence, and settings remain compatible.
- Main shell, grids, search controls, cards, async states, and player remain usable at 860×620 and 1280×820.
- Light/dark themes and keyboard focus are coherent.
- No new production dependency.
- Bun stable 1.3.14 is pinned consistently.
- Zero required focused/skipped tests are machine-checked.
- Measured line/branch/function coverage threshold is 100%; no 99% exception remains.
- No false claim is made about statement/component coverage if the available coverage tooling cannot measure it.
- README and architecture documentation match final commands and UI architecture.
- Git bundle verifies and clone-tests successfully.

## Fast Inner Ralph Loop

For each coherent slice:

1. **R — Research**
   - Re-read the affected requirement.
   - Inspect the component/module and its tests.
   - Use already-scoped Svelte/Tailwind/Tauri docs; expand Context7 only if a new version-sensitive API is touched.
   - Check Design.md tokens for user-facing visual changes.
2. **A — Architect**
   - Choose the smallest change that preserves existing boundaries.
   - State local acceptance criteria and failure states.
   - Avoid new production dependencies.
3. **L — Lay down**
   - Add/adjust a regression or pure-helper test first when behavior changes.
   - Implement the smallest UI/quality change.
   - Update directly affected docs/scripts only.
4. **P — Prove**
   - `prettier --check <changed web files>` when local dependencies are available.
   - `eslint <affected files> --max-warnings 0` when available.
   - `svelte-check --tsconfig ./tsconfig.json --threshold warning` for UI slices when available.
   - Targeted Node tests for changed pure TypeScript modules.
   - `bun run build:web` plus focused browser smoke for UI slices when available.
   - If repository dependencies cannot be installed, run only valid environment-independent checks and mark dependency-backed checks blocked; do not substitute an incompatible toolchain and call it PASS.
5. **H — Harden**
   - Inspect focus, keyboard behavior, overflow, text wrapping, dark mode, reduced motion, semantic controls, error paths, CSP/capabilities, and dependency impact.
   - Fix confirmed in-scope defects and repeat the loop.

### Fast-loop exit

A slice exits only when its targeted acceptance criteria have evidence and no known in-scope failure remains.

## Full Release Ralph Loop

Run from the final repository state:

1. `git status --short` and dependency/lockfile diff inspection.
2. Reproducible install: `bun install --frozen-lockfile`.
3. `bun run clean`.
4. `bun run format:check`.
5. `bun run lint`.
6. `bun run typecheck`.
7. Zero focused/skipped test scan command added by this release.
8. `bun run test`.
9. `bun run test:coverage`; inspect actual percentages and report scope.
10. `bun run build:web`.
11. `bun run smoke:web`.
12. `bun audit --audit-level=high`.
13. `cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check`.
14. `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings`.
15. `cargo test --manifest-path src-tauri/Cargo.toml --all-features`.
16. `cargo build --manifest-path src-tauri/Cargo.toml --locked`.
17. `cargo audit --deny warnings --file src-tauri/Cargo.lock` when `cargo-audit` is available.
18. `bun run package` on a supported desktop packaging host.
19. Measure built web artifact size and package size when produced; compare with the recorded baseline when a baseline can be built.
20. Browser/Tauri visual verification at 1280×820 and 860×620 plus dark mode and keyboard focus.
21. Validate referenced SVG/icon assets and docs links.
22. Inspect Mermaid architecture sources and README references.
23. Inspect GitHub workflow diffs and syntax/structure; run available local validation.
24. `git bundle create <bundle> --all`.
25. `git bundle verify <bundle>`.
26. `git clone <bundle> <temp-dir>` and inspect branches/files/history.
27. Run key environment-supported verification from the clone.

## Known risks

- The current execution container may not have Bun/Rust or working package-registry DNS. Dependency-backed JS/Rust/build/package/visual gates are `BLOCKED` if the exact required toolchain cannot be installed.
- Node built-in coverage does not provide a distinct statement metric and current coverage compilation excludes Svelte components. This cannot be represented as four-metric whole-project 100% coverage without additional real instrumentation.
- Tauri packaging/signing is platform dependent; macOS notarization/signing requires external Apple credentials and cannot be fabricated.

## Exit conditions

The loop ends when all in-scope code/documentation work is complete and every applicable gate has final evidence classified exactly as `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE`. No failed or unexecuted gate is relabeled as passing.
