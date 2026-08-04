# Contributing

## Development setup

1. Install Node.js 22+, npm, Rust 1.85+, and the Tauri platform prerequisites.
2. Run `npm install`.
3. Run `cargo generate-lockfile --manifest-path src-tauri/Cargo.toml` when `Cargo.lock` is absent.
4. Start the desktop app with `npm run tauri:dev` or the mock browser preview with `npm run dev:web`.

## Required checks

Run before every pull request:

```bash
npm run verify
```

A change is not ready when formatting, ESLint, TypeScript, tests, coverage, Rust clippy, Rust tests, or the production build fails.

## Design and architecture

- Keep the SQLite catalogue read-only.
- Expose narrow typed commands instead of generic SQL or filesystem access.
- Prefer platform and browser APIs over runtime dependencies.
- Preserve CSP restrictions and the secure-media allowlist.
- Keep user-visible states accessible: loading, empty, error, focus, and reduced motion.
- Add a regression test before changing behavior.

## Commits and pull requests

Use focused commits with imperative messages, for example `feat: add teacher filter`. Pull requests should explain behavior, tests, security impact, and screenshots for UI changes.

## Data changes

Do not commit a replacement catalogue unless its provenance and redistribution rights are documented. Never add private user data, secrets, credentials, or local machine paths.
