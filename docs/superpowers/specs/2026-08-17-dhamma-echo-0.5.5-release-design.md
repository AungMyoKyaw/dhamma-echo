# Dhamma Echo 0.5.5 Release Design

**Goal:** Publish Dhamma Echo `v0.5.5` with an accurate changelog and synchronized application metadata, then update and verify the matching Homebrew cask from the official macOS release artifacts.

**Scope:** This release packages the changes committed after `v0.5.4`, including unified audio/video catalogue categories and filters, video playback lifecycle and fullscreen fixes, progressive load-more batches, and the quiet listening-room UI refinement. It does not introduce new application behavior.

## Release architecture

The application repository is the source of truth for the release version and changelog. The existing tag-triggered GitHub Actions workflow builds the native installers for macOS arm64, macOS Intel, Windows, and Linux and publishes the GitHub release. The Homebrew tap is updated only after the official release exposes both macOS DMGs, because the cask must contain their exact SHA-256 digests.

The version must remain synchronized in:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- the root package entry for `dhamma-echo` in `src-tauri/Cargo.lock`

`CHANGELOG.md` receives the `0.5.5` entry before the version/tag release commit. The existing release workflow remains unchanged; it is activated by pushing tag `v0.5.5`.

## Changelog content

The new entry will summarize user-visible work since `v0.5.4`:

- Added semantic audio/video categories and unified category filtering.
- Added MP4/WMV catalogue visibility and video playback route/player reliability improvements, including fullscreen behavior.
- Added progressively growing load-more batches for large catalogue views.
- Refined the listening-room interface, layout hierarchy, compact player spacing, loading/error states, and control treatments.

Only behavior supported by the commits and current product documentation will be listed; internal design-only commits will not be presented as shipped features.

## Verification and failure handling

Before tagging, run the repository's release-relevant checks available in the workspace, including formatting, policy checks, linting, type checking, core tests with coverage, web build/smoke checks, site verification, Rust formatting/tests/clippy/build, and the full `bun run verify` command where toolchains permit. Any unavailable dependency or native toolchain is reported as blocked rather than treated as passing.

After the tag is pushed, inspect the GitHub release until both `Dhamma.Echo_0.5.5_aarch64.dmg` and `Dhamma.Echo_0.5.5_x64.dmg` exist. Read their official SHA-256 digests, update `Casks/dhamma-echo.rb` to version `0.5.5`, and preserve the cask's existing URL, architecture, app, dependency, postflight, and zap behavior. Validate the cask with Homebrew style/audit and verify that the tap resolves the new version and both architecture-specific URLs. If the release workflow or an artifact is missing, stop before changing the cask hashes.

## Repository changes

Application repository:

- Create: `docs/superpowers/specs/2026-08-17-dhamma-echo-0.5.5-release-design.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`

Homebrew tap repository:

- Modify: `Casks/dhamma-echo.rb`
- Update only if needed: `README.md` (the cask already has an entry, so no README change is expected)

## Delivery sequence

1. Commit this approved design document.
2. Write the `0.5.5` changelog entry first, synchronize version metadata, and commit the release preparation.
3. Verify the release preparation, create tag `v0.5.5`, and push the branch and tag.
4. Inspect the published GitHub release and retrieve the official macOS DMG digests.
5. Update, validate, commit, and push the Homebrew cask.
6. Re-fetch Homebrew metadata and confirm the installed/tap cask reports `0.5.5` with the new artifact URLs and hashes.
