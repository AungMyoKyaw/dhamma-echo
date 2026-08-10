# Svelte Frontend Migration Design

## Goal

Rewrite only Dhamma Echo's desktop webview presentation layer in Svelte 5 while preserving Tauri 2, the existing TypeScript application controller, reducer/store, API contracts, persistence, player engine, database behavior, and visual identity.

## Architecture

`src/main.ts` creates `DhammaApp` and a Svelte writable store. The existing controller remains the canonical state/behavior owner; its `render` callback publishes each new immutable `AppState` into the Svelte store. `src/App.svelte` subscribes to that store and routes to focused Svelte views. UI events call typed `DhammaApp` methods or dispatch existing reducer actions directly.

No SvelteKit server/runtime is added. Vite is used as the standalone SPA toolchain because this frontend is embedded in Tauri and needs only a static `dist/` output.

## Design system

Preserve the existing warm light product language rather than redesigning the app. The Design.md palette uses the existing keys: primary `#8c3f08`, secondary `#485b37`, tertiary `#6e5014`, and background `#fcf9f2`. Existing CSS-first Tailwind tokens, system Myanmar font fallbacks, focus rings, minimum Tauri window size, responsive player layout, loading/empty/error states, and motion behavior remain.

## Security

Svelte text interpolation replaces manual HTML escaping for catalogue strings. No `{@html}` is used. The existing Rust IPC boundary, read-only SQLite access, media URL allowlist, local-storage validation, and Tauri CSP are unchanged.

## Testing

Keep existing behavior tests for API/controller/store/persistence/player/utils. Replace renderer-specific HTML-string tests with tests for pure Svelte-boundary helpers (`src/runtime.ts`, `src/ui.ts`). Run `svelte-check`, ESLint's Svelte rules, Vite build, and web smoke checks when dependencies are available. The Node core coverage report is explicitly not treated as project-wide Svelte statement coverage.

## Dependency changes

Add Svelte, the official Svelte Vite plugin, Vite, `svelte-check`, Prettier's Svelte plugin, ESLint's Svelte plugin, and Tailwind's official Vite plugin. Remove the custom web build/dev scripts and `@tailwindcss/cli`. These dependencies are development/build dependencies; no new runtime network dependency is introduced.
