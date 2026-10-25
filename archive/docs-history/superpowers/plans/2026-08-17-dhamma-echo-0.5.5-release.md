# Dhamma Echo 0.5.5 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Dhamma Echo `v0.5.5`, then update and verify the matching Homebrew cask from the official macOS release artifacts.

**Architecture:** Keep the application repository as the version/changelog source of truth and use its existing tag-triggered GitHub Actions workflow for native installers. Update the Homebrew tap only after the release exposes both DMGs and their official SHA-256 digests.

**Tech Stack:** Git, GitHub CLI, Bun, Tauri 2, Rust/Cargo, Homebrew casks.

---

### Task 1: Establish a clean release baseline

**Files:**

- Read: `/Users/aungmyokyaw/projects/life/dhamma-echo`

- [ ] **Step 1: Confirm the release checkout and toolchain**

Run:

```bash
git status --short --branch
git tag --list 'v0.5.5'
command -v bun
command -v cargo
command -v gh
command -v brew
```

Expected: the app checkout is on `master`, `v0.5.5` does not exist, Bun/Cargo/GitHub CLI/Homebrew are available, and the only local commit ahead of `origin/master` is the approved release design.

- [ ] **Step 2: Run the existing core test baseline**

Run:

```bash
bun run test
```

Expected: exit code `0` with the repository's current test count and zero failures.

### Task 2: Write the changelog first and synchronize version metadata

**Files:**

- Modify: `/Users/aungmyokyaw/projects/life/dhamma-echo/CHANGELOG.md`
- Modify: `/Users/aungmyokyaw/projects/life/dhamma-echo/package.json`
- Modify: `/Users/aungmyokyaw/projects/life/dhamma-echo/src-tauri/tauri.conf.json`
- Modify: `/Users/aungmyokyaw/projects/life/dhamma-echo/src-tauri/Cargo.toml`
- Modify: `/Users/aungmyokyaw/projects/life/dhamma-echo/src-tauri/Cargo.lock:561-562`

- [ ] **Step 1: Add the `0.5.5` changelog entry before other release metadata**

Insert immediately below `## [Unreleased]` in `CHANGELOG.md`:

```markdown
## [0.5.5] - 2026-08-17

### Added

- Added semantic audio and video categories with unified catalogue filtering.
- Added MP4 and WMV format visibility plus reliable video playback, route lifecycle, and fullscreen behavior.
- Added progressively growing load-more batches for large catalogue views.

### Changed

- Refined the listening-room interface, layout hierarchy, compact player spacing, loading/error states, and control treatments.
```

- [ ] **Step 2: Change every application version field to `0.5.5`**

The resulting values must be:

```text
/Users/aungmyokyaw/projects/life/dhamma-echo/package.json:version                  = 0.5.5
/Users/aungmyokyaw/projects/life/dhamma-echo/src-tauri/tauri.conf.json:version     = 0.5.5
/Users/aungmyokyaw/projects/life/dhamma-echo/src-tauri/Cargo.toml:[package].version = 0.5.5
/Users/aungmyokyaw/projects/life/dhamma-echo/src-tauri/Cargo.lock:dhamma-echo.version = 0.5.5
```

- [ ] **Step 3: Check the release-preparation diff**

Run:

```bash
git diff --check
git diff -- CHANGELOG.md package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock
test "$(node -p "require('./package.json').version")" = "0.5.5"
test "$(node -e "console.log(JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json')).version)")" = "0.5.5"
rg -n -A2 '^name = "dhamma-echo"$' src-tauri/Cargo.lock
```

Expected: only the changelog and four version locations change, the diff has no whitespace errors, and every reported version is `0.5.5`.

- [ ] **Step 4: Commit the changelog and synchronized version metadata**

Run:

```bash
git add CHANGELOG.md package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "release: prepare dhamma echo v0.5.5"
```

### Task 3: Run release gates and publish the version tag

**Files:**

- Verify: the application repository

- [ ] **Step 1: Run the complete project verification command**

Run:

```bash
bun run verify
```

Expected: exit code `0` and all format, policy, lint, typecheck, coverage, build, smoke, site, audit, Clippy, Rust test, and Rust release-build gates pass. If a required toolchain or registry is unavailable, record the exact blocked command and stop before tagging.

- [ ] **Step 2: Confirm the commit is tag-ready**

Run:

```bash
git diff HEAD^ --check
git status --short --branch
git log -2 --oneline --decorate
```

Expected: the working tree is clean and the latest commit is `release: prepare dhamma echo v0.5.5`.

- [ ] **Step 3: Push the release preparation commit**

Run:

```bash
git push origin master
```

Expected: `origin/master` advances to the verified release-preparation commit.

- [ ] **Step 4: Create and push the annotated release tag**

Run:

```bash
git tag -a v0.5.5 -m "Release Dhamma Echo v0.5.5"
git push origin v0.5.5
```

Expected: the remote accepts `v0.5.5`, which starts `.github/workflows/release.yml`.

- [ ] **Step 5: Wait for the tag-triggered release workflow**

Run:

```bash
release_run_id="$(gh run list --repo AungMyoKyaw/dhamma-echo --workflow release.yml --event push --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run watch "$release_run_id" --repo AungMyoKyaw/dhamma-echo --interval 30 --exit-status
```

Expected: the release workflow exits `0` and publishes the `v0.5.5` GitHub release with macOS arm64, macOS Intel, Windows, and Linux artifacts.

### Task 4: Read the official macOS artifacts

**Files:**

- Read: GitHub release `AungMyoKyaw/dhamma-echo:v0.5.5`

- [ ] **Step 1: Confirm both DMGs and their official digests**

Run:

```bash
gh release view v0.5.5 --repo AungMyoKyaw/dhamma-echo --json isDraft,publishedAt,assets,url --jq '.assets[] | select(.name | endswith(".dmg")) | [.name, .digest] | @tsv'
```

Expected: non-empty `sha256:` values followed by 64 hexadecimal characters for exactly:

```text
Dhamma.Echo_0.5.5_aarch64.dmg
Dhamma.Echo_0.5.5_x64.dmg
```

Do not edit the Homebrew cask if either artifact or digest is missing.

### Task 5: Update and publish the Homebrew cask

**Files:**

- Modify: `/Users/aungmyokyaw/projects/life/homebrew-tap/Casks/dhamma-echo.rb`

- [ ] **Step 1: Update only the release version and two DMG digests**

In `Casks/dhamma-echo.rb`, preserve the existing `arch arm: "aarch64", intel: "x64"` mapping and URL, change `version "0.5.4"` to `version "0.5.5"`, and replace the `arm` and `intel` SHA-256 strings with the official digests read from Task 4.

- [ ] **Step 2: Validate the cask source**

Run from `/Users/aungmyokyaw/projects/life/homebrew-tap`:

```bash
git diff --check
brew style Casks/dhamma-echo.rb
brew audit --cask Casks/dhamma-echo.rb
```

Expected: no whitespace errors, Homebrew style passes, and cask audit reports no errors.

- [ ] **Step 3: Commit and push the tap update**

Run:

```bash
git add Casks/dhamma-echo.rb
git commit -m "chore: update Dhamma Echo cask to 0.5.5"
git push origin master
```

Expected: the Homebrew tap remote contains the cask update and the tap README remains unchanged because its Dhamma Echo entry already exists.

### Task 6: Test that Homebrew resolves the new cask

**Files:**

- Verify: `/Users/aungmyokyaw/projects/life/homebrew-tap/Casks/dhamma-echo.rb`

- [ ] **Step 1: Refresh the tap and inspect resolved cask metadata**

Run:

```bash
brew update
brew info --cask AungMyoKyaw/homebrew-tap/dhamma-echo
brew cat AungMyoKyaw/homebrew-tap/dhamma-echo | rg -n 'version|sha256|releases/download|arch '
```

Expected: Homebrew reports version `0.5.5`, the release URL contains `/v0.5.5/`, and both new architecture-specific hashes are present.

- [ ] **Step 2: Fetch the cask artifacts through Homebrew**

Run:

```bash
brew fetch --cask --force AungMyoKyaw/homebrew-tap/dhamma-echo
```

Expected: Homebrew downloads/verifies the `0.5.5` DMG for the current Mac architecture without a checksum mismatch.

- [ ] **Step 3: Confirm both repositories are clean and aligned**

Run:

```bash
git -C /Users/aungmyokyaw/projects/life/dhamma-echo status --short --branch
git -C /Users/aungmyokyaw/projects/life/homebrew-tap status --short --branch
git -C /Users/aungmyokyaw/projects/life/dhamma-echo describe --tags --exact-match HEAD
git -C /Users/aungmyokyaw/projects/life/homebrew-tap show --stat --oneline HEAD
```

Expected: both worktrees are clean, the app `HEAD` is exactly tagged `v0.5.5`, and the tap `HEAD` is the cask update commit.
