# Ralph Loop — Code Quality Release

## Goal

Ship a behavior-preserving cleanup of Dhamma Echo that removes dead post-migration code, narrows internal module surfaces, removes obsolete tooling, and makes release verification deterministic without changing the Svelte UI, product behavior, package manager, or production dependencies.

## Current state

- The desktop application uses Svelte 5 + Vite for presentation, a TypeScript application core, and a Tauri 2/Rust catalogue backend.
- The repository uses Bun with `bun.lock` and Rust with the committed `src-tauri/Cargo.lock`.
- TypeScript already enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, and `noUnusedParameters`.
- ESLint is configured with zero-warning tolerance and type-aware TypeScript rules.
- Core TypeScript behavior is covered by the Node test runner with 100% line, branch, and function thresholds; Svelte components are validated separately by `svelte-check`, the production build, and smoke verification.
- This release has no intended user-facing UI change, so visual verification is `NOT APPLICABLE` unless an implementation change touches rendered behavior.

## Acceptance criteria

- No known production-dead helpers remain from the pre-Svelte renderer/runtime.
- Internal-only implementation types and constants are not exported as public module API.
- No obsolete fallback lint/config files remain.
- JavaScript tooling consistently uses Bun at the repository command layer.
- CI validates the committed Rust lockfile and never regenerates it as part of normal verification.
- No new production dependency is introduced.
- Formatter, lint, type checking, required tests, coverage, builds, smoke checks, audits, Rust gates, and Git bundle validation are run when the execution environment supports them.
- Required tests contain zero skipped, disabled, focused-only, or quarantined cases.
- Final completion evidence uses only `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE`.

## Fast inner Ralph Loop

Use the smallest relevant subset after each code-quality slice:

```bash
git diff --check
tsc -p tsconfig.test.json
node --test tests/runtime.test.mjs tests/utils.test.mjs
node --test tests/api.test.mjs tests/ui.test.mjs
```

When the Bun dependency stack is available, also run:

```bash
bun run format:web:check
bun run lint
bun run typecheck
```

For Rust changes, also run:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml --all-features
```

## Full release Ralph Loop

```bash
bun install --frozen-lockfile --ignore-scripts
bun run format:check
bun run lint
bun run typecheck
bun run test:coverage
bun run build:web
bun run smoke:web
bun run icons:check
bun run site:verify
bun audit --audit-level=high
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml --all-features
cargo build --locked --manifest-path src-tauri/Cargo.toml --release
cargo audit --file src-tauri/Cargo.lock
git diff --check
git bundle create /mnt/data/dhamma-echo-code-quality.bundle --all
git bundle verify /mnt/data/dhamma-echo-code-quality.bundle
git clone /mnt/data/dhamma-echo-code-quality.bundle /mnt/data/dhamma-echo-code-quality-clone
```

## Known risks

- Bun, Cargo, or their registries may be unavailable in a restricted execution environment. A missing toolchain or unreachable dependency registry is reported as `BLOCKED`, never converted to `PASS` from source inspection.
- The Node fallback TypeScript compiler available in some sandboxes may be older than the repository's TypeScript 6 dependency; it can provide focused evidence but does not replace the pinned release type-check gate.
- Historical design/verification documents intentionally remain as project history even when they mention commands removed by later releases.

## Exit conditions

- Requested cleanup is implemented without user-visible behavior changes.
- Focused tests for changed TypeScript behavior pass.
- Full available release gates have final evidence.
- Dead-code and skipped-test scans find no in-scope violations.
- Dependency and lockfile diffs contain no unintended change.
- Documentation reflects the current verification path.
- The final Git bundle is created, verified, and clone-tested.
