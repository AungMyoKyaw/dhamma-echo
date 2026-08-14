# CLAUDE.md

Project guidance for Claude Code working on Dhamma Echo.

## What this project is

A quiet Tauri 2 desktop audio player for Dhamma talks. Svelte 5 + strict TypeScript webview, Rust 2024 backend with `rusqlite`, dependency-free static product website in `docs/`. Bundled read-only SQLite catalogue; no accounts, analytics, or telemetry.

Read [README.md](README.md) first for the product overview. Architecture details live under [docs/architecture/](docs/architecture/).

## Tooling preferences

### Use Bun, not npm

- The repo's `packageManager` is pinned: `bun@1.4.0-canary.1`. Always run package scripts through `bun run <script>`.
- For installs, prefer `bun install --frozen-lockfile --ignore-scripts`. If dependencies change, run `bun install`, review the diff against `bun.lock`, and commit only the expected changes.
- Do not introduce `package-lock.json` or `yarn.lock`. `bun.lock` is authoritative.
- GitHub Actions follows the Bun canary channel so it can read the version 2 lockfile — keep that in mind when updating CI.

### Rust toolchain

- `Cargo.lock` is authoritative for Rust dependencies — commit it.
- Tauri 2 + Rust 2024 + `rusqlite` with bundled SQLite.
- Format Rust with `cargo fmt --manifest-path src-tauri/Cargo.toml`; clippy with `-D warnings` (matches `bun run verify`).

### Node test runner

- Tests run through Node's built-in test runner (`node --test`), not Jest/Vitest. Don't add a new test framework.
- Coverage is enforced at 100% lines/branches/functions for core TypeScript modules via `bun run test:coverage`.

## Git workflow

- Conventional commits: `type(scope): description`. Mirror the style of recent commits in `git log`.
- Always create a new commit — never amend unless explicitly asked.
- Stage files by name; avoid `git add -A` / `git add .`.
- Never skip hooks (`--no-verify`) or bypass signing.
- For destructive ops (`reset --hard`, force push, branch -D), confirm with the user first.

## Architecture boundaries

The webview can call only six purpose-built Tauri commands. Keep that surface tight.

- Rust validates every request, runs parameterized read-only SQLite queries, normalizes catalogue text, and returns typed data.
- Playback state, favorites, queue, history, settings, and resume positions all live in the webview (browser local storage).
- Never expose arbitrary shell, filesystem, SQL, or network commands to the webview.
- The CSP permits media only from `https://dhammadownload.com` and `https://www.dhammadownload.com`. Don't widen it without a deliberate design change.
- SQLite opens read-only with parameterized queries — never string-concatenate SQL.

## Frontend conventions

- Svelte 5 runes with strict TypeScript. `svelte-check` must pass (`bun run typecheck`).
- Tailwind CSS v4 through the official Vite plugin, CSS-first design tokens in `src/index.css`. Don't introduce a config-file Tailwind setup.
- ESLint runs with `--max-warnings 0`. No warnings tolerated.
- Prettier for web sources; the `bun run format` script also runs `cargo fmt`.
- Use `<Icon>` for iconography rather than ad-hoc SVGs.

## Allowed URLs

- Only approved MP3 hosts (`dhammadownload.com` / `www.dhammadownload.com`) — see [docs/architecture/data-flow.md](docs/architecture/data-flow.md).
- Upgrade HTTP to HTTPS; strip credentials, ports, and fragments; encode paths before playback.
- WMA records stay searchable but are unplayable in the macOS webview — keep them in the catalogue, gate playback.

## Testing and verification

Before considering a change done, run the matching gate:

| Change scope      | Command               |
| ----------------- | --------------------- |
| Web only          | `bun run verify:web`  |
| Full (incl. Rust) | `bun run verify`      |
| Product website   | `bun run site:verify` |
| Icons             | `bun run icons:check` |
| Native installers | `bun run package`     |

- `bun run test:policy` rejects focused/skipped required tests — don't disable tests to make them pass.
- 100% line/branch/function coverage is required for core TypeScript modules; the tool doesn't measure statements or Svelte component executable code, so don't claim full statement/component coverage unless a real measurement says so.
- Rust tests cover normalization, validation, query filtering, pagination, error paths, URL classification, and in-memory SQLite integration.

## Security

- No accounts, analytics, ads, telemetry. Local prefs never leave the device.
- Validate, parameterize, and read-only everything that touches the catalogue or the webview boundary.
- Report security issues via [SECURITY.md](SECURITY.md) — don't file them in public issues.

## Product website

- The `docs/` site is dependency-free static HTML/CSS. Don't add a bundler or framework to it.
- Validate locally with `python3 -m http.server 4173 --directory docs` then `bun run site:verify`.
- Site architecture: [docs/architecture/product-site.md](docs/architecture/product-site.md).

## When unsure

- Architecture questions → read [docs/architecture/](docs/architecture/) and the linked design specs under [docs/superpowers/specs/](docs/superpowers/specs/).
- Recent intent → `git log` and the active diff. Recent commits describe the current direction better than any summary.
- Release process → [README.md § Release process](README.md) and [docs/architecture/release.md](docs/architecture/release.md).
