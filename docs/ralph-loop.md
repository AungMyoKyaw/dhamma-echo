# Ralph Loop — Svelte Frontend Migration

## Goal

Replace Dhamma Echo's HTML-string/DOM-delegation frontend with Svelte 5 + Vite while preserving Tauri, catalogue behavior, playback behavior, local data, public website, and the existing light visual identity.

## Baseline state

- Tauri 2 loaded a custom TypeScript renderer from `dist/` on `127.0.0.1:1420` in development.
- `src/view.ts` rendered complete HTML strings and `src/main.ts` delegated DOM events from `#app`.
- `DhammaApp`, reducer/state, API, persistence, and player modules already isolated product behavior from rendering and remain intact.
- Tailwind CSS v4 and the warm light design tokens already existed.

## Acceptance criteria

- Svelte 5 components render every desktop route and player/queue surface.
- No catalogue content is rendered through HTML strings or `{@html}`.
- Direct Svelte handlers replace `data-action` event delegation.
- Navigation, searches/filters, progressive loading, favorites, queue, player controls, retries, keyboard shortcuts, and local settings remain wired to `DhammaApp`.
- Vite serves `127.0.0.1:1420` and emits production assets to `dist/` for Tauri.
- Tailwind v4 runs through `@tailwindcss/vite`.
- Prettier, ESLint, `svelte-check`, tests/coverage, build, smoke, icons, audit, and Rust gates are run when the environment supports them.
- Architecture docs and README describe the Svelte frontend.
- The final Git bundle verifies and clone-tests successfully.

## Fast inner loop

```bash
git diff --check
node scripts/lint-offline.mjs
tsc -p tsconfig.test.json
node --test tests/runtime.test.mjs tests/ui.test.mjs
bun run typecheck
bun run lint
bun run build:web
bun run smoke:web
```

## Full release loop

```bash
bun install --frozen-lockfile --ignore-scripts
bun run format:web:check
bun run lint
bun run typecheck
bun run test:coverage
bun run build:web
bun run smoke:web
bun run icons:check
bun audit --audit-level=high
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
git diff --check
git bundle create /mnt/data/dhamma-echo-svelte.bundle --all
git bundle verify /mnt/data/dhamma-echo-svelte.bundle
git clone /mnt/data/dhamma-echo-svelte.bundle /mnt/data/dhamma-echo-svelte-clone
```

## Known risks

- The execution sandbox has Node.js but not Bun or Cargo, and its configured npm mirror does not contain Svelte. Dependency-backed Svelte and native gates may therefore be blocked locally.
- Svelte must remain a presentation layer; business state stays canonical in `DhammaApp` and `src/store.ts`.
- Vite emits hashed asset filenames, so smoke checks discover built JS/CSS from `dist/assets/`.
- Existing Tauri CSP must remain compatible with Vite production output; no remote runtime frontend dependencies are introduced.

## Exit conditions

The source migration is complete, no old renderer/delegated-action implementation remains, all locally runnable gates have evidence, external blockers are recorded, documentation/CI reflect the Svelte pipeline, and the final Git bundle verifies and clones.
