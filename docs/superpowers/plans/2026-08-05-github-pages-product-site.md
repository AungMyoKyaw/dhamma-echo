# GitHub Pages Product Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished, dependency-free Dhamma Echo product website to the repository and deploy the validated `docs/` directory to GitHub Pages.

**Architecture:** Keep the Tauri application and its webview build unchanged. Add a semantic static site under `docs/`, one pure ES module plus a tiny browser bootstrap for GitHub Pages link derivation, Node built-in regression tests, a dependency-free site smoke checker, and a least-privilege GitHub Pages workflow that uploads `docs/` as the deployment artifact.

**Tech Stack:** HTML5, modern CSS, browser ES modules, Node.js built-in test runner, GitHub Actions, GitHub Pages.

## Global Constraints

- Reuse `docs/images/dhamma-echo-demo.png`; do not duplicate or replace the supplied screenshot.
- Keep all runtime assets local; do not add fonts, analytics, trackers, UI frameworks, or third-party browser scripts.
- Keep the existing Tauri application behavior, build inputs, and security boundary unchanged.
- Use the Design.md palette and the approved warm ivory, saffron brown, leaf green, and ochre visual direction.
- Preserve keyboard access, reduced-motion behavior, semantic landmarks, and WCAG AA contrast.
- Do not invent a GitHub owner or repository URL; derive standard GitHub Pages links at runtime and fail safely elsewhere.
- Add CI verification and GitHub Pages deployment with least-privilege permissions.
- Produce and validate an updated complete Git bundle.

---

### Task 1: Add failing product-site regression tests

**Files:**

- Create: `tests/site.test.mjs`
- Create: `tests/site-links.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: future `docs/index.html`, `docs/assets/site.css`, `docs/assets/site.js`.
- Produces: `site:test` command and failing assertions for page semantics, required copy, screenshot integration, asset safety, GitHub Pages URL derivation, and repository-link upgrades.

- [x] **Step 1: Write the failing HTML and CSS tests**

Create `tests/site.test.mjs` with Node's `node:test`, `node:assert/strict`, and filesystem reads. Assert:

```js
assert.match(html, /<title>Dhamma Echo — A quiet desktop library<\/title>/);
assert.match(html, /<main id="main-content">/);
assert.match(html, /<h1[^>]*>[^<]*Dhamma talks[^<]*<\/h1>/);
assert.match(html, /images\/dhamma-echo-demo\.png/);
assert.match(html, /width="3248" height="2122"/);
assert.match(html, /data-github-link="repository"/);
assert.match(html, /data-github-link="releases"/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /:focus-visible/);
```

Also assert that the page contains the four approved product themes: discovery, playback, local library, and privacy.

- [x] **Step 2: Write the failing link-derivation tests**

Create `tests/site-links.test.mjs` importing `deriveGitHubLinks` and `upgradeGitHubLinks` from `docs/assets/site.js`. Cover:

```js
assert.deepEqual(
  deriveGitHubLinks("https://aungmyokyaw.github.io/dhamma-echo/"),
  {
    repository: "https://github.com/aungmyokyaw/dhamma-echo",
    releases: "https://github.com/aungmyokyaw/dhamma-echo/releases/latest"
  }
);
assert.equal(deriveGitHubLinks("https://example.com/"), null);
assert.equal(deriveGitHubLinks("not a url"), null);
```

Use a small fake document object to prove `upgradeGitHubLinks` changes only matching `data-github-link` anchors and leaves unsupported environments unchanged.

- [x] **Step 3: Add the site test command**

Add to `package.json`:

```json
"site:test": "node --test tests/site.test.mjs tests/site-links.test.mjs"
```

- [x] **Step 4: Run the tests and confirm the expected failure**

Run:

```bash
node --test tests/site.test.mjs tests/site-links.test.mjs
```

Expected: failure because `docs/index.html`, `docs/assets/site.css`, and `docs/assets/site.js` do not exist.

- [x] **Step 5: Commit the failing tests**

```bash
git add tests/site.test.mjs tests/site-links.test.mjs package.json
git commit -m "test: define product site acceptance gates"
```

### Task 2: Build the semantic product page and local assets

**Files:**

- Create: `docs/index.html`
- Create: `docs/assets/site.css`
- Create: `docs/assets/site.js`
- Create: `docs/assets/site-bootstrap.js`
- Create: `docs/assets/logo.svg`
- Test: `tests/site.test.mjs`
- Test: `tests/site-links.test.mjs`

**Interfaces:**

- `deriveGitHubLinks(input: string): { repository: string; releases: string } | null` accepts an absolute URL.
- `upgradeGitHubLinks(documentLike: { querySelectorAll(selector: string): Iterable<AnchorLike> }, locationHref: string): boolean` updates anchors whose `dataset.githubLink` is `repository` or `releases` and returns whether an upgrade occurred.
- The HTML uses `data-github-link="repository"` and `data-github-link="releases"` hooks with safe `#open-source` fallbacks.

- [x] **Step 1: Implement the link module minimally**

Create `docs/assets/site.js` as an ES module. Parse the input with `new URL`, require a hostname ending in `.github.io`, take the owner from the hostname, take the first non-empty path segment as the repository, reject user-site roots without a repository segment, encode both path parts, and return the repository and latest-release URLs. Export both functions. Create `docs/assets/site-bootstrap.js` to import `upgradeGitHubLinks` and initialize it with browser globals, keeping the pure module directly testable.

- [x] **Step 2: Add the branded local logo**

Copy the existing original Dhamma Echo mark from `public/logo.svg` into `docs/assets/logo.svg`. Keep its title, description, viewBox, local gradient, and current brand colors.

- [x] **Step 3: Implement the semantic HTML**

Create `docs/index.html` with:

- UTF-8, viewport, description, theme color, canonical-safe metadata, and restrictive static CSP.
- Skip link, sticky header, semantic navigation, `main`, named sections, and footer.
- Hero copy centered on “A quiet desktop library for Dhamma talks.”
- Primary action scrolling to the product screenshot and secondary actions using repository/release data hooks.
- The exact supplied screenshot path `images/dhamma-echo-demo.png` with `width="3248"`, `height="2122"`, `loading="eager"`, and meaningful alt text.
- Four feature cards: explore 21,402 talks, focused native playback, private local library, and no accounts/analytics.
- A technical section naming Tauri 2, Rust, SQLite, strict TypeScript, and the six-command trust boundary.
- No claims beyond facts already documented by the repository.

- [x] **Step 4: Implement the responsive CSS**

Create `docs/assets/site.css` with root tokens from the approved Design.md scheme, system-font stack, desktop/tablet/mobile layout rules, visible focus states, a 44px action target, screenshot frame, feature grid, technical cards, no horizontal overflow, and reduced-motion overrides. Keep the CSS dependency-free and under 30 KiB.

- [x] **Step 5: Run focused tests until green**

Run:

```bash
node --test tests/site.test.mjs tests/site-links.test.mjs
```

Expected: all tests pass.

- [x] **Step 6: Commit the product site**

```bash
git add docs/index.html docs/assets tests/site.test.mjs tests/site-links.test.mjs
git commit -m "feat: add Dhamma Echo product website"
```

### Task 3: Add dependency-free site smoke validation

**Files:**

- Create: `scripts/site-smoke.mjs`
- Modify: `package.json`
- Modify: `tests/site.test.mjs`

**Interfaces:**

- Produces `site:smoke` and `site:verify` commands.
- The smoke checker reads `docs/index.html`, resolves local `href` and `src` values, rejects missing assets, absolute filesystem paths, remote scripts/styles/fonts, duplicate IDs, unsafe placeholder URLs, and a missing screenshot.

- [x] **Step 1: Add a failing smoke integration test**

Extend `tests/site.test.mjs` to spawn `node scripts/site-smoke.mjs` and assert exit status `0` plus a summary containing `Product site smoke checks passed`.

- [x] **Step 2: Run the focused test and confirm failure**

Run:

```bash
node --test tests/site.test.mjs
```

Expected: failure because `scripts/site-smoke.mjs` does not exist.

- [x] **Step 3: Implement the smoke checker**

Create `scripts/site-smoke.mjs` using only Node built-ins. Check:

- all local `src` and stylesheet/module `href` assets exist under `docs/`;
- no referenced path escapes `docs/`;
- no `file://`, `/Users/`, `/home/`, `/mnt/`, or unresolved `{{...}}` values exist;
- no remote `<script>`, stylesheet, font, iframe, or image is present;
- every HTML `id` is unique;
- `docs/images/dhamma-echo-demo.png` exists and is larger than 100 KiB;
- HTML, CSS, and JavaScript stay under 100 KiB each.

Print the number of validated assets and total static asset size.

- [x] **Step 4: Add aggregate commands**

Add to `package.json`:

```json
"site:smoke": "node scripts/site-smoke.mjs",
"site:coverage": "node --experimental-test-coverage --test-coverage-include='docs/assets/site.js' --test-coverage-include='docs/assets/site-bootstrap.js' --test-coverage-lines=100 --test-coverage-functions=100 --test-coverage-branches=100 --test tests/site-links.test.mjs",
"site:verify": "npm run site:test && npm run site:coverage && npm run site:smoke"
```

- [x] **Step 5: Run the site verification**

Run:

```bash
npm run site:verify
```

Expected: tests and smoke validation pass.

- [x] **Step 6: Commit site verification tooling**

```bash
git add scripts/site-smoke.mjs tests/site.test.mjs package.json
git commit -m "test: add product site smoke validation"
```

### Task 4: Add GitHub Pages CI/CD and architecture documentation

**Files:**

- Create: `.github/workflows/pages.yml`
- Create: `docs/architecture/product-site.md`
- Modify: `docs/architecture/release.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/ralph-loop.md`

**Interfaces:**

- Pages workflow consumes `docs/` after `npm run site:verify`.
- Deployment uses `actions/checkout@v6`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`.
- Workflow permissions are `contents: read`, `pages: write`, and `id-token: write`; deployment uses the `github-pages` environment.

- [x] **Step 1: Add the Pages workflow**

Create `.github/workflows/pages.yml` triggered by pushes to `master` and manual dispatch. Use one validation/upload job and one dependent deploy job. Configure deployment concurrency as `pages` with `cancel-in-progress: false`. Upload only `docs/`.

- [x] **Step 2: Document the product-site architecture**

Create `docs/architecture/product-site.md` with Mermaid diagrams for the browser asset flow and GitHub Pages deployment flow. Explain the static trust boundary, runtime link derivation, performance budget, and why the desktop app build is separate.

- [x] **Step 3: Update release and contributor documentation**

Update:

- `README.md` with a Product website section, local preview command `python3 -m http.server 4173 --directory docs`, and `npm run site:verify`.
- `docs/architecture/release.md` with the Pages build/deploy path.
- `CHANGELOG.md` with the new product site and Pages workflow.
- `docs/ralph-loop.md` with project-specific site acceptance gates and commands.

- [x] **Step 4: Validate workflow and documentation references**

Run a Node or Python structural parse for package JSON, parse all workflow YAML conservatively for required action/version strings and permissions, and check every changed Markdown relative link exists.

- [x] **Step 5: Run site verification again**

Run:

```bash
npm run site:verify
```

Expected: pass.

- [x] **Step 6: Commit deployment and documentation**

```bash
git add .github/workflows/pages.yml docs/architecture/product-site.md docs/architecture/release.md README.md CHANGELOG.md docs/ralph-loop.md
git commit -m "ci: deploy product site to GitHub Pages"
```

### Task 5: Prove, harden, and package the repository

**Files:**

- Create: `docs/verification/2026-08-05-github-pages-product-site.md`
- Modify: `docs/superpowers/plans/2026-08-05-github-pages-product-site.md`
- Output outside repository: `/mnt/data/dhamma-echo-product-site.bundle`

**Interfaces:**

- Produces verified source history, a clean clone, and the complete Git bundle.

- [x] **Step 1: Run clean site checks**

Run:

```bash
rm -rf dist coverage
npm run site:verify
git diff --check
```

Record exact output, asset counts, and sizes.

- [x] **Step 2: Run all available existing project gates**

Attempt the repository's formatter, lint, typecheck, tests, coverage, web build, smoke, icon, Rust, audit, and package commands. Where Bun, Rust, registry access, or native packaging is unavailable, record the exact blocker and run the dependency-free underlying checks that are available without presenting them as substitutes.

- [x] **Step 3: Harden the product site**

Inspect for:

- external runtime requests;
- unsafe HTML, target-blank links without `rel`;
- inaccessible focus or heading order;
- duplicate IDs;
- local machine paths and secrets;
- broken local references;
- oversized static assets other than the supplied screenshot;
- accidental changes to `src/`, `src-tauri/`, the database, or the desktop app build.

Fix every confirmed issue and rerun `npm run site:verify`.

- [x] **Step 4: Write verification evidence**

Create `docs/verification/2026-08-05-github-pages-product-site.md` with Ralph Loop passes, actual command results, coverage status, build/toolchain blockers, workflow validation, asset sizes, and known limitations.

- [x] **Step 5: Mark the implementation plan complete and commit**

Change completed plan checkboxes to `[x]`, then commit:

```bash
git add docs/verification/2026-08-05-github-pages-product-site.md docs/superpowers/plans/2026-08-05-github-pages-product-site.md
git commit -m "docs: record product site verification"
```

- [x] **Step 6: Create and verify the final Git bundle**

Run:

```bash
git bundle create /mnt/data/dhamma-echo-product-site.bundle --all
git bundle verify /mnt/data/dhamma-echo-product-site.bundle
rm -rf /mnt/data/dhamma-echo-product-site-clone
git clone /mnt/data/dhamma-echo-product-site.bundle /mnt/data/dhamma-echo-product-site-clone
cd /mnt/data/dhamma-echo-product-site-clone
npm run site:verify
git status --short
```

Expected: bundle verification succeeds, clean clone succeeds, site verification passes, and clone status is clean.
