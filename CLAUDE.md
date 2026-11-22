# CLAUDE.md

## Product

**Dhamma Echo** is a cross-platform native desktop library and player for Myanmar Dhamma talks, built in pure Rust with GPUI (`gpui 0.2.2`) for macOS, Linux, and Windows.

## Commands

| Task | Command |
|---|---|
| Run app | `make dev` (`cargo run --locked`) |
| Full verify | `make verify` (`cargo fmt -- --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked`) |
| Build release | `make build` (`cargo build --release --locked`) |
| Package macOS | `make package-macos` (`bash scripts/package-macos.sh`) |
| Package Linux | `make package-linux` (`bash scripts/package-linux.sh`) |
| Package Windows | `pwsh -File scripts/package-windows.ps1` |
| Self-test | `cargo run --release --locked -- --self-test` |

## Architecture

- `Cargo.toml` / `Cargo.lock` — pure-Rust GPUI 0.2.2 desktop app (`dhamma-echo-native`). Keep `Cargo.lock` authoritative and always pass `--locked`.
- `resources/dhamma.db` — bundled read-only SQLite catalogue (tracked via Git LFS, opened with `PRAGMA query_only = true` and parameterized queries).
- `src/library.rs` — read-only SQLite queries (`search_audio`, `search_collections`, `get_collection`, `get_teacher`, `teachers`, `categories`, `get_track`, `get_tracks_by_ids`), natural sorting, and `dhammadownload.com` MP3/MP4 URL candidates.
- `src/state.rs` — per-user SQLite state (`state.sqlite`: favorites, history, per-talk resume, downloads, queue, settings, UI state) plus WAL-safe read-only one-time migration from legacy Tauri `user.db`, WebKit `localstorage.sqlite3`, and `favorite-*.mp3` files.
- `src/playback/` — native playback backends:
  - `macos.rs`: AVFoundation + `AVPlayerItemVideoOutput` (`420f` `CVPixelBuffer` -> `gpui::surface`).
  - `portable.rs`: Windows & Linux pure-Rust `rodio` + `symphonia-mp3` audio, plus `ffmpeg`-backed BGRA `gpui::RenderImage` + streaming `s16le` PCM video.
- `src/downloads.rs` — HTTPS MP3 downloader restricted to approved `dhammadownload.com` hosts, atomic rename, and safe file removal.
- `src/platform.rs` — platform-native data dirs, migration sources, bundled catalogue discovery, and shortcut modifier labels.
- `src/views.rs`, `src/main.rs`, `src/input.rs`, `src/assets.rs`, `src/i18n.rs`, `src/normalize.rs` — GPUI UI shell, 8 routes, English/Myanmar (`en-US` / `my-MM`) localization, and Myanmar text normalization.

## Non-Negotiable Constraints

- Keep `resources/dhamma.db` strictly read-only (`PRAGMA query_only = true`); never write to it and never interpolate SQL strings.
- Restrict all remote media/downloads to HTTPS on approved `dhammadownload.com` hosts.
- Keep legacy Tauri migration strictly read-only via snapshot copies (never touch `user.db`, `user.db-wal`, or `user.db-shm`).
- `Cargo.lock` is pinned for cross-platform builds (including `libc 0.2.189` / `mio 1.2.2` for Linux `xattr 0.2.3` compatibility); verify with `--locked`.
