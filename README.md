# Dhamma Echo

**A quiet desktop library for Dhamma talks.**

Dhamma Echo is a lightweight Tauri 2 desktop audio player built around the supplied read-only SQLite catalogue. It provides fast search, teacher browsing, queue management, favorites, listening history, resume positions, playback speed controls, and light/dark themes without accounts, analytics, or background services.

![Dhamma Echo home screen](docs/images/dhamma-echo-home.png)

## Features

- Browse 21,402 audio talks from 212 teachers.
- Search by talk title or teacher.
- Filter by Myanmar/English and MP3/WMA.
- Play secure HTTPS audio with seek, volume, speed, queue, and next-track controls.
- Store favorites, history, queue, settings, and resume positions locally.
- Display legacy HTTP records without weakening the Content Security Policy; those tracks are clearly blocked from playback.
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
- npm 10 or newer
- Rust 1.85 or newer with Cargo and rustfmt
- Platform prerequisites required by Tauri 2

Linux development additionally needs WebKitGTK 4.1 and the standard Tauri Linux build packages.

## Install

Clone or extract the repository, then run:

```bash
cd dhamma-echo
npm install
cargo generate-lockfile --manifest-path src-tauri/Cargo.toml
```

The source snapshot intentionally contains no generated lockfiles because the build sandbox could not reach npm or crates.io. Commit the generated `package-lock.json` and `Cargo.lock` before publishing a production release.

## Run

Desktop development:

```bash
npm run tauri:dev
```

Browser preview with deterministic mock catalogue data:

```bash
npm run dev:web
```

Then open `http://127.0.0.1:1420`.

## Commands

| Command                 | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run dev:web`       | Build and serve the browser preview                                   |
| `npm run tauri:dev`     | Run the Tauri desktop application                                     |
| `npm run format`        | Format web and Rust sources                                           |
| `npm run format:check`  | Verify formatting                                                     |
| `npm run lint`          | Run strict ESLint with zero warnings                                  |
| `npm run lint:offline`  | Run dependency-free whitespace checks                                 |
| `npm run typecheck`     | Run strict TypeScript checking                                        |
| `npm test`              | Run 36 core TypeScript tests                                          |
| `npm run test:coverage` | Enforce 100% line/branch/function coverage on core TypeScript modules |
| `npm run build:web`     | Produce the web assets in `dist/`                                     |
| `npm run smoke:web`     | Validate required production web assets                               |
| `npm run verify:web`    | Run all locally available web quality gates                           |
| `npm run verify`        | Run full frontend and Rust quality gates                              |
| `npm run tauri:build`   | Build native installers for the current platform                      |
| `npm run clean`         | Remove generated web and coverage output                              |

## Testing and coverage

The core TypeScript modules are covered by 36 behavior-focused tests. The coverage command enforces 100% lines, branches, and functions. Node's built-in coverage reporter does not expose a separate statement metric. `src/main.ts` is a browser/Tauri bootstrap boundary and is explicitly excluded from the core metric; the production build and static browser render smoke-test that boundary.

Rust tests cover normalization, request validation, query filtering, pagination, error paths, secure URL classification, and in-memory SQLite integration. Run them with:

```bash
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

The most recent local evidence is recorded in [docs/verification/2026-08-04-results.md](docs/verification/2026-08-04-results.md).

## Build and package

```bash
npm run tauri:build
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
- The CSP permits media only from `https://dhammadownload.com`.
- Local preferences never leave the device.
- Report security issues using [SECURITY.md](SECURITY.md).

## Data and licensing

Source code and original visual assets are licensed under MIT. The bundled `dhamma.db`, catalogue metadata, remote audio, teacher names, and teachings are **not relicensed by this repository**. See [DATA_LICENSE.md](DATA_LICENSE.md) before public redistribution.

## Troubleshooting

### A track is visible but will not play

The record may use legacy HTTP. Dhamma Echo keeps the record searchable but blocks insecure playback. It does not silently downgrade the CSP.

### Myanmar text uses an unexpected font

Install or enable a Unicode Myanmar font such as Noto Sans Myanmar, Myanmar Text, or Pyidaungsu. The application deliberately does not bundle font files.

### Native build fails on Linux

Install Tauri's WebKitGTK 4.1 development dependencies and `patchelf`, then rerun `npm run tauri:build`.

### Registry installation fails

Confirm npm and Cargo can reach their configured registries. This repository does not vendor third-party packages.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and run `npm run verify` before opening a pull request.

## Release process

1. Generate and commit current lockfiles.
2. Run `npm run verify` on a supported development machine.
3. Test native packages on macOS, Windows, and Linux.
4. Update [CHANGELOG.md](CHANGELOG.md) and version fields.
5. Tag `vX.Y.Z`; the release workflow builds platform artifacts.
6. Review and sign the generated installers before publishing the release.

## License

MIT for the source code and original project assets. See [LICENSE](LICENSE) and [DATA_LICENSE.md](DATA_LICENSE.md).
