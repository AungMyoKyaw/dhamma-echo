# Ralph Loop — Player Reliability Repair

## Goal

Make Dhamma Echo playback reliable in the Tauri webview, stop the fixed player from covering the catalogue, and repair adjacent interaction defects without adding a heavy dependency.

## Initial state

- Playback trusted only one exact hostname and did not retry the alternate approved host.
- Legacy same-host HTTP MP3 records were classified as unavailable even though they can be upgraded safely to HTTPS.
- Resume time was assigned before media metadata was available.
- Finished talks saved their end position, causing later replay to resume at the end.
- The Tauri CSP allowed only the bare media hostname.
- The player relied on a complex arbitrary Tailwind grid class that was absent from the production CSS, so the footer stacked vertically and covered catalogue rows.
- Main content used a runtime-built padding class, which was also absent from the production CSS.
- Teacher cards emitted `data-value`, while the event controller read `data-id`.
- Every `timeupdate` caused a full render and local-storage write.

## Acceptance criteria

- Approved MP3 URLs produce encoded HTTPS candidates for both `www.dhammadownload.com` and `dhammadownload.com`.
- Approved HTTP records are upgraded to HTTPS; foreign hosts, credentials, custom ports, and WMA records remain blocked.
- Resume is applied after metadata and bounded by the media duration.
- A failed candidate retries the alternate approved hostname once, then exposes one stable error and retry action.
- Finished talks reset their saved position to zero.
- Generated CSS contains a responsive three-column player grid, explicit player-clearance padding, and accessible error tokens.
- The footer remains compact at the supported minimum window width and does not cover catalogue content.
- Teacher selection uses the correct identifier.
- Core TypeScript coverage remains 100% lines, branches, and functions.
- The complete Git bundle verifies, clones, and repeats all locally achievable web checks.

## Validation commands

```bash
node scripts/lint-offline.mjs
tsc --noEmit -p tsconfig.json
node scripts/test.mjs --coverage
node scripts/build.mjs
node scripts/smoke.mjs
bun run format:check
bun run lint
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
cargo build --manifest-path src-tauri/Cargo.toml --release
cargo audit --file src-tauri/Cargo.lock
git bundle create dhamma-echo-player-fixed.bundle --all
git bundle verify dhamma-echo-player-fixed.bundle
git clone dhamma-echo-player-fixed.bundle /tmp/dhamma-echo-player-fixed-check
```

## Passes completed

1. **Research and reproduction:** inspected the bundle, traced player state and media URL flow, confirmed the missing CSS/layout behavior, and created failing regression tests.
2. **Media repair:** added strict URL normalization, HTTPS upgrade, path encoding, metadata-safe resume, approved-host fallback, stable errors, and manual retry.
3. **State hardening:** throttled progress persistence, ignored no-track controls, persisted pause state, and reset completed talks to the beginning.
4. **UI repair:** added a static responsive player grid, explicit content clearance, loading/error/retry states, accessible error colors, and the teacher identifier fix.
5. **Native alignment and proof:** aligned Rust classification and CSP, updated architecture/docs, restored 100% core coverage, built and smoke-tested production assets, and visually inspected a 1440×900 compiled preview.

## Known external risks

- The remote service can still remove, block, rate-limit, or temporarily fail a media file.
- WebKit does not reliably support WMA, so WMA remains visible but unavailable.
- This sandbox has no Bun, Prettier, ESLint, Rust, Cargo, or native Tauri packaging toolchain.
- Direct remote media probing from the container is blocked by network/DNS restrictions.

## Exit condition

All checks achievable in this sandbox must pass. Unavailable standard frontend, Rust, security-audit, and native packaging checks must be recorded as blockers. The final bundle must verify and clone successfully, and the clean clone must repeat the available web verification.
