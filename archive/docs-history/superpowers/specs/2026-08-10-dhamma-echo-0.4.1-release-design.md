# Dhamma Echo 0.4.1 Release Design

## Goal

Release the code-quality and CI follow-up as patch version `0.4.1`, publish the tagged GitHub release with the existing native artifact workflow, and update the Homebrew tap cask to point at the new macOS DMGs.

## Scope

- Update `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` from `0.4.0` to `0.4.1`.
- Add a `0.4.1` entry to `CHANGELOG.md` based on the diff from `v0.4.0`.
- Run release-relevant web quality checks, commit the release metadata, and push tag `v0.4.1`.
- Confirm the GitHub release contains both macOS architecture DMGs.
- Update `homebrew-tap/Casks/dhamma-echo.rb` to version `0.4.1` with the released DMG SHA256 values, then commit and push the tap.

## Release Semantics

This is a patch release because the changes remove dead code, narrow internal exports, standardize quality tooling, improve lockfile/CI determinism, and document verification without adding a user-facing feature or breaking public behavior.

## Verification

- Validate version consistency across the three project version sources.
- Run `bun install --frozen-lockfile --ignore-scripts`.
- Run `bun run ci`.
- Verify the tag and GitHub release assets before changing the Homebrew cask.
- Run Homebrew style validation on the updated cask where available.

## Ordering and Safety

The project release must be published before the tap is changed, because the cask hashes are derived from the final GitHub DMG assets. Existing unrelated worktree changes in either repository must not be overwritten.
