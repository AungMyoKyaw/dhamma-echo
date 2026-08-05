# Ralph Loop — GitHub Pages Product Website

## Goal

Create a polished, lightweight Dhamma Echo product website inside the repository, include the supplied `docs/images/dhamma-echo-demo.png` screenshot, and deploy the validated `docs/` directory through GitHub Pages.

## Current state

- The repository documents the product but has no product website entry point under `docs/`.
- The supplied application screenshot already exists at the required path.
- The repository owner and final GitHub URL are absent from the Git bundle, so links must not be invented.
- Existing CI validates the desktop app but does not publish GitHub Pages.
- The execution environment has Node.js but does not provide Bun, Rust, Cargo, Prettier, or ESLint.

## Acceptance criteria

- `docs/index.html` presents the product goal, screenshot, core features, privacy model, architecture, and open-source path.
- The supplied screenshot is referenced directly and retains its native 3248×2122 aspect ratio.
- HTML, CSS, logo, and browser JavaScript are local, dependency-free, responsive, and individually below 100 KiB.
- The page has semantic landmarks, one `h1`, logical headings, skip navigation, visible focus, 44px primary targets, meaningful image text, and reduced-motion handling.
- No analytics, trackers, external fonts, remote runtime scripts/styles/images, local machine paths, unresolved templates, duplicate IDs, or path traversal exist.
- GitHub repository and release links are derived only on standard project Pages URLs and fail safely elsewhere.
- Node site tests, 100% site JavaScript coverage, and smoke checks pass.
- GitHub Pages workflow validates first, uploads only `docs/`, uses least-privilege permissions, and deploys through the `github-pages` environment.
- Existing desktop source, database, and Tauri build inputs remain unchanged.
- The final Git bundle verifies, clones, and repeats site verification from the clean clone.

## Validation commands

```bash
node --test tests/site.test.mjs tests/site-links.test.mjs
node scripts/site-smoke.mjs
npm run site:coverage
npm run site:verify
git diff --check
python3 -m http.server 4173 --directory docs
chromium --headless --screenshot # desktop and mobile visual inspection
bun run format:check
bun run lint
bun run typecheck
bun run test:coverage
bun run build:web
bun run smoke:web
bun run icons:check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
git bundle create /mnt/data/dhamma-echo-product-site.bundle --all
git bundle verify /mnt/data/dhamma-echo-product-site.bundle
git clone /mnt/data/dhamma-echo-product-site.bundle /mnt/data/dhamma-echo-product-site-clone
```

## Known risks

- GitHub Pages cannot be published from the local sandbox; workflow structure and artifact contents can be validated, while the live deployment requires repository Actions to run.
- A custom domain cannot be mapped safely to a repository URL without configuration, so source/release buttons retain in-page fallbacks there.
- The screenshot is intentionally large because the user required the existing asset; duplicating or replacing it is outside scope.
- Bun, Rust/Cargo, Prettier, ESLint, dependency audit, and native packaging may remain unavailable and must not be claimed as passed.

## Exit conditions

All locally achievable site tests, smoke checks, workflow/documentation validation, browser visual checks, security review, and clean-clone verification pass. Toolchain and live-deployment blockers are recorded explicitly. The final Git bundle contains complete history and the feature branch.
