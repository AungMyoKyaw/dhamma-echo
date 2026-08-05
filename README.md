# Dhamma Echo

**A quiet desktop library for Dhamma talks.**

Dhamma Echo is a lightweight Tauri 2 desktop audio player built around the supplied read-only SQLite catalogue. It provides fast search, teacher browsing, queue management, favorites, listening history, resume positions, playback speed controls, and light/dark themes without accounts, analytics, or background services.

![Dhamma Echo home screen](docs/images/dhamma-echo-home.png)

![Dhamma Echo compact player](docs/images/dhamma-echo-player-fixed.png)

## Features

- Browse 21,402 audio talks from 212 teachers.
- Search by talk title or teacher.
- Filter by Myanmar/English and MP3/WMA.
- Play approved MP3 audio through HTTPS with seek, volume, speed, queue, and next-track controls.
- Normalize and encode catalogue URLs, then retry across the approved `www` and bare Dhamma Download hosts.
- Store favorites, history, queue, settings, and resume positions locally.
- Upgrade approved same-host HTTP MP3 records to HTTPS before playback; WMA records remain searchable but unavailable in the macOS webview.
- Use the supplied SQLite database as an immutable bundled resource.
- Run a dependency-free TypeScript web UI inside a small Tauri shell.
- Render Myanmar text through system fonts; no font files are bundled.

## Architecture

The webview can call only six purpose-built Tauri commands. Rust validates each request, executes parameterized read-only SQLite queries, normalizes catalogue text, and returns typed data. Playback and personal library state remain in the webview and local storage.

- [System context](docs/architecture/context.md)
- [Modules and trust boundaries](docs/architecture/modules.md)
- [Catalogue and playback data flow](docs/architecture/data-flow.md)
- [Build and release flow](docs/architecture/release.md)
- [Product and technical design](docs/superpowers/specs/2026-08-04-dhamma-echo-design.md)
- [Ralph Loop](docs/ralph-loop.md)

## Technology stack

- Tauri 2 desktop shell
- Rust 2024 edition
- `rusqlite` with bundled SQLite
- Framework-free strict TypeScript
- Tailwind CSS v4 with CSS-first design tokens
- Native HTML audio element
- Node's built-in test runner and V8 coverage

## Requirements

- Node.js 22.13 or newer
- Bun 1.4 or newer
- Rust 1.85 or newer with Cargo and rustfmt
- Platform prerequisites required by Tauri 2

Linux development additionally needs WebKitGTK 4.1 and the standard Tauri Linux build packages.

## Install

Clone or extract the repository, then run:

```bash
cd dhamma-echo
bun install --frozen-lockfile
```

The repository includes `bun.lock` and `src-tauri/Cargo.lock` for deterministic installs.

## Run

Desktop development:

```bash
bun run tauri:dev
```

Browser preview with deterministic mock catalogue data:

```bash
bun run dev:web
```

Then open `http://127.0.0.1:1420`.

## Commands

| Command                 | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `bun run dev:web`       | Build and serve the browser preview                                   |
| `bun run tauri:dev`     | Run the Tauri desktop application                                     |
| `bun run format`        | Format web and Rust sources                                           |
| `bun run format:check`  | Verify formatting                                                     |
| `bun run lint`          | Run strict ESLint with zero warnings                                  |
| `bun run lint:offline`  | Run dependency-free whitespace checks                                 |
| `bun run typecheck`     | Run strict TypeScript checking                                        |
| `bun run test`          | Run 41 core TypeScript tests                                          |
| `bun run test:coverage` | Enforce 100% line/branch/function coverage on core TypeScript modules |
| `bun run build:web`     | Produce the web assets in `dist/`                                     |
| `bun run smoke:web`     | Validate required production web assets                               |
| `bun run verify:web`    | Run all locally available web quality gates                           |
| `bun run verify`        | Run full frontend and Rust quality gates                              |
| `bun run tauri:build`   | Build native installers for the current platform                      |
| `bun run clean`         | Remove generated web and coverage output                              |

## Testing and coverage

The core TypeScript modules are covered by 41 behavior-focused tests. The coverage command enforces 100% lines, branches, and functions. Node's built-in coverage reporter does not expose a separate statement metric. `src/main.ts` is a browser/Tauri bootstrap boundary and is explicitly excluded from the core metric; the production build and artifact smoke checks verify that boundary.

Rust tests cover normalization, request validation, query filtering, pagination, error paths, secure URL classification, and in-memory SQLite integration. Run them with:

```bash
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

The most recent local evidence is recorded in [docs/verification/2026-08-05-player-repair.md](docs/verification/2026-08-05-player-repair.md).

## Build and package

```bash
bun run tauri:build
```

Tauri creates platform-native bundles under `src-tauri/target/release/bundle/`. Build and sign each platform on its native CI runner. Signing credentials must be provided only through protected GitHub Actions secrets.

## Configuration

No environment variables are required for development. The application uses:

- `src-tauri/resources/dhamma.db` as the bundled catalogue.
- `src-tauri/capabilities/default.json` for the minimum webview capability.
- `src-tauri/tauri.conf.json` for CSP, window, resources, and packaging.
- Browser local storage for personal settings and listening state.

## Security and privacy

- No accounts, analytics, advertisements, or telemetry.
- No arbitrary shell, filesystem, SQL, or network command is exposed to the webview.
- SQLite opens read-only and uses parameterized queries.
- The CSP permits media only from `https://dhammadownload.com` and `https://www.dhammadownload.com`.
- The frontend accepts only approved MP3 URLs, removes credentials/ports/fragments, upgrades HTTP to HTTPS, and encodes paths before playback.
- Local preferences never leave the device.
- Report security issues using [SECURITY.md](SECURITY.md).

## Data and licensing

Source code and original visual assets are licensed under MIT. The bundled `dhamma.db`, catalogue metadata, remote audio, teacher names, and teachings are **not relicensed by this repository**. See [DATA_LICENSE.md](DATA_LICENSE.md) before public redistribution.

## Troubleshooting

### A track is visible but will not play

WMA records are kept searchable but are not supported by the macOS webview player. For MP3 records, use the in-player **Retry** action; Dhamma Echo retries both approved HTTPS hostnames, but it cannot recover a file removed or blocked by the remote service.

### Myanmar text uses an unexpected font

Install or enable a Unicode Myanmar font such as Noto Sans Myanmar, Myanmar Text, or Pyidaungsu. The application deliberately does not bundle font files.

### Native build fails on Linux

Install Tauri's WebKitGTK 4.1 development dependencies and `patchelf`, then rerun `bun run tauri:build`.

### Registry installation fails

Confirm Bun and Cargo can reach their configured registries. This repository does not vendor third-party packages.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and run `bun run verify` before opening a pull request.

## Release process

1. Refresh and commit lockfiles when dependencies change.
2. Run `bun run verify` on a supported development machine.
3. Test native packages on macOS, Windows, and Linux.
4. Update [CHANGELOG.md](CHANGELOG.md) and version fields.
5. Tag `vX.Y.Z`; the release workflow builds platform artifacts.
6. Review and sign the generated installers before publishing the release.

## License

MIT for the source code and original project assets. See [LICENSE](LICENSE) and [DATA_LICENSE.md](DATA_LICENSE.md).
