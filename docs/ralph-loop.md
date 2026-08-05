# Ralph Loop — macOS UI and Icon Polish

## Goal

Make Dhamma Echo feel correctly proportioned on macOS by fixing the oversized Dock icon, rebuilding the audio transport controls, and preserving usability at the 860×620 minimum window size.

## Current state

- The 1024px icon artwork occupies almost the full canvas and includes a pre-rounded mask, so it appears oversized in the Dock.
- Player controls use inconsistent visible sizes and glyph weights.
- The footer has only a tiny next control beside the large play button.
- The play glyph is optically unbalanced.
- Compact width hides volume without a speaker affordance and crowds track, speed, and queue controls.
- Track-row play buttons dominate adjacent actions.

## Acceptance criteria

- A verified 1024×1024 master icon has an outer optical margin and generates all configured variants.
- The Dock artwork is visibly smaller and balanced at 16px, 32px, 128px, and 256px previews.
- The player exposes back 15 seconds, play/pause, and forward 15 seconds with consistent visual weight.
- Icon-only controls have labels, titles, focus, hover, active, loading, and disabled states.
- The footer remains one coherent row with no horizontal overflow at 860×620.
- Volume remains understandable at compact width.
- Catalogue row play controls are visually secondary to the track title.
- Existing playback, queue, favorites, search, and resume behavior remains intact.
- Core TypeScript coverage remains 100% lines, branches, and functions.
- Production web build and smoke checks pass.
- The complete Git bundle verifies, clones, and repeats locally achievable checks.

## Validation commands

```bash
node scripts/lint-offline.mjs
tsc --noEmit -p tsconfig.json
node scripts/test.mjs --coverage
node scripts/build.mjs
node scripts/smoke.mjs
node scripts/verify-icons.mjs
python3 scripts/generate-icons.py --check
bun run format:check
bun run lint
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
cargo build --manifest-path src-tauri/Cargo.toml --release
git bundle create dhamma-echo-macos-ui-polished.bundle --all
git bundle verify dhamma-echo-macos-ui-polished.bundle
git clone dhamma-echo-macos-ui-polished.bundle /tmp/dhamma-echo-macos-ui-polished-check
```

## Known risks

- The sandbox does not provide a macOS Dock or native Tauri packaging environment, so Dock scale is validated through the icon canvas, generated `.icns` contents, and multi-size previews rather than a live Dock screenshot.
- Bun, Rust, Cargo, Prettier, and ESLint may be unavailable; every unavailable gate must be recorded honestly.
- Remote audio availability is external and unchanged by this UI pass.

## Exit conditions

All locally achievable acceptance gates pass, visual screenshots at regular and compact widths are inspected, generated icon assets verify, documentation is updated, and the final Git bundle verifies and clone-tests. External toolchain blockers are explicitly documented.

## Completed passes

1. Reproduced the oversized icon, unbalanced player, and compact-width filter collapse through source inspection and baseline screenshots.
2. Added failing regression tests for transport actions, loading/paused states, responsive search structure, and icon geometry.
3. Implemented and tested the back-15/play-pause/forward-15 player, compact row controls, grouped session controls, and responsive filter layout.
4. Generated and verified the padded 1024px master plus PNG, ICNS, and ICO variants.
5. Rebuilt production assets, reached 100% configured core line/branch/function coverage, and visually inspected 1280×820 and 860×620 outputs.
6. Updated CI, README, changelog, architecture, screenshots, and verification evidence.

## Final exit status

All locally achievable acceptance criteria pass. Prettier, ESLint, Bun, Rust/Cargo, dependency audit, native Tauri packaging, and live macOS Dock inspection remain external toolchain blockers and are not claimed as passed.
