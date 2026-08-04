# Dhamma Echo Ralph Loop

## Goal

Build and prove a lightweight Tauri 2 + TypeScript + Tailwind CSS v4 desktop audio player using the supplied read-only Dhamma SQLite database.

## Current state

- Supplied SQLite database exists and has been inspected.
- No application source repository exists.
- Product and technical design are defined.
- Current documentation research confirms Tauri 2 capability controls, Tailwind v4 Vite/CSS-first setup, and Vitest v4 coverage configuration.

## Acceptance gates

1. Database is bundled and opened read-only.
2. Catalogue summary, teacher browsing, and audio search are implemented.
3. Player, queue, favorites, history, resume position, settings, and keyboard controls are implemented.
4. UI follows the Dhamma Echo design specification and works in light and dark themes.
5. Formatter checks pass.
6. ESLint has zero warnings/errors.
7. TypeScript type checking passes.
8. Frontend tests pass at 100% statements, branches, functions, and lines for included project-owned code.
9. Rust tests pass and project-owned Rust logic is covered by tests; coverage tooling availability is recorded.
10. Frontend production build passes.
11. Tauri compilation/package checks pass where the current Linux environment supports them.
12. Dependency/security checks complete without unresolved high-severity findings.
13. README, diagrams, OSS governance files, CI/CD, and release workflow exist.
14. Git bundle is created, verified, clone-tested, and key checks run from the clone.

## Validation commands

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
cargo build --manifest-path src-tauri/Cargo.toml
npm audit --audit-level=high
cargo audit
npm run verify
git bundle create dhamma-echo.bundle --all
git bundle verify dhamma-echo.bundle
git clone dhamma-echo.bundle /tmp/dhamma-echo-bundle-check
```

## Known risks

- Remote catalogue URLs can be unavailable or reject streaming.
- Legacy HTTP media cannot be played safely under a strict CSP.
- Linux Tauri packaging may require OS packages absent from the environment.
- macOS and Windows installers cannot be produced natively on Linux.
- Rust source coverage requires `cargo-llvm-cov`, which may not be installed.
- The database includes inconsistent whitespace in scraped titles and teacher names.

## Loop stages

### R — Research

- Verify current official stack documentation.
- Inspect database schema, volume, formats, languages, URL hosts, and missing metadata.
- Confirm design tokens and Myanmar typography strategy.

### A — Architect

- Use narrow Rust commands and read-only `rusqlite`.
- Keep frontend state local and dependency-light.
- Define database, player, persistence, UI, and release boundaries.
- Create Mermaid architecture and sequence diagrams.

### L — Lay down implementation

- Scaffold Tauri/React/Tailwind v4.
- Implement and test pure logic first.
- Implement Rust repository and commands.
- Implement shell, views, player, and persistent library state.
- Add assets, documentation, and workflows.

### P — Prove

- Run every validation command supported by the environment.
- Capture actual pass/fail output.
- Compare coverage reports against the 100% gate.
- Build and package where possible.

### H — Harden

- Review input limits, CSP, URL safety, local-storage corruption, player failures, accessibility, and resource usage.
- Fix confirmed gaps.
- Repeat all quality gates.

## Exit conditions

The loop exits when every achievable gate passes and remaining failures are solely external platform/tooling limitations documented with exact command output.
