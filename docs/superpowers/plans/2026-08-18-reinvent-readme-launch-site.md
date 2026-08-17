# Dhamma Echo README and Launch Site Reinvention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the README and dependency-free GitHub Pages site into one distinctive, accurate launch surface for Dhamma Echo's audio-and-video desktop library.

**Architecture:** Preserve the static `docs/` boundary and existing GitHub Pages link-upgrade script. Replace only the marketing HTML/CSS and README content, reusing existing local screenshots and keeping the current CSP, privacy page, and deployment model intact.

**Tech Stack:** Static HTML/CSS/ES modules, Node built-in test runner and coverage, GitHub Markdown.

## Global Constraints

- Keep the product site dependency-free under `docs/`.
- Keep all runtime assets local and preserve the restrictive CSP.
- Do not add or bundle fonts.
- Do not change desktop application behavior.
- Do not claim Dhamma Echo hosts source media; state that it catalogs Dhamma Download records and streams compatible media from the source.
- Preserve accurate catalogue facts: 30,563 audio talks, 14,474 video records, 257 teachers, and 429 audio collections.
- Keep the existing 100 KiB per-text-asset smoke budget.
- Preserve keyboard focus, reduced-motion support, minimum 44px primary targets, and horizontal-overflow protection.

---

### Task 1: Lock the new launch-site contract with tests

**Files:**

- Modify: `tests/site.test.mjs`

**Interfaces:**

- Consumes: `docs/index.html`, `docs/assets/site.css`, existing screenshot files.
- Produces: static-content and accessibility contracts that the redesigned site must satisfy.

- [ ] **Step 1: Replace the old landing-page assertions with the new product contract**

Require the new page title, hero copy, Home hero image, all six existing screenshots, audio/video catalogue facts, Homebrew command, source attribution, privacy language, GitHub hooks, focus/reduced-motion rules, and 44px target/overflow guarantees.

- [ ] **Step 2: Run the focused tests and verify they fail against the old site**

Run:

```bash
node --test tests/site.test.mjs tests/site-links.test.mjs
```

Expected: at least one product-page assertion fails because the old site does not contain the new hero/title/audio-video contract.

### Task 2: Rebuild the launch-site HTML and visual system

**Files:**

- Modify: `docs/index.html`
- Modify: `docs/assets/site.css`
- Preserve: `docs/assets/site.js`
- Preserve: `docs/assets/site-bootstrap.js`

**Interfaces:**

- Consumes: `docs/images/home.png`, `explore.png`, `collections.png`, `teachers.png`, `library.png`, `settings.png`, `docs/assets/logo.svg`, existing `data-github-link` behavior.
- Produces: a single responsive static product page with the new information architecture.

- [ ] **Step 1: Replace the HTML with the high-fidelity listening-room narrative**

Use semantic header/main/footer markup, one `h1`, real screenshots, the Homebrew command, source attribution, privacy link, and repository/release hooks. Keep all assets local.

- [ ] **Step 2: Replace the CSS with the committed graphite/rust/olive visual system**

Use CSS custom properties, fluid type/spacing, an asymmetric screenshot-led hero, sparse echo rings, alternating product-story sections, strong focus states, responsive behavior, and reduced-motion handling. Do not use gradient text, decorative grids, repeated card grids, side-stripe accents, or oversized radii.

- [ ] **Step 3: Run the focused site tests**

Run:

```bash
node --test tests/site.test.mjs tests/site-links.test.mjs
```

Expected: all tests pass.

### Task 3: Reinvent the README around launch and adoption

**Files:**

- Modify: `README.md`

**Interfaces:**

- Consumes: product facts and architecture already documented in `PRODUCT.md`, `DESIGN.md`, and `docs/architecture/`.
- Produces: GitHub-native product documentation with fast install, product proof, screenshots, media/source disclosure, architecture, development, verification, and contributor links.

- [ ] **Step 1: Replace the badge-heavy opening with a product-first README**

Lead with the product promise, Home screenshot, Homebrew install, and release option. Keep only a compact badge row.

- [ ] **Step 2: Reorganize technical documentation behind user-facing value**

Document audio/video catalogue facts, playback compatibility, local privacy state, Dhamma Download source relationship, architecture boundaries, development commands, verification, and contribution/security/data-license links without duplicative claims.

- [ ] **Step 3: Verify every README-local link and image path resolves**

Run a small Node or shell path check against relative Markdown links and image references; correct any broken paths before committing.

### Task 4: Final product-site and design verification

**Files:**

- Modify only if verification finds a defect: `docs/index.html`, `docs/assets/site.css`, `tests/site.test.mjs`, `README.md`

**Interfaces:**

- Consumes: completed redesign.
- Produces: verified static site and reviewable final diff.

- [ ] **Step 1: Run dependency-free site behavior tests**

```bash
node --test tests/site.test.mjs tests/site-links.test.mjs
```

- [ ] **Step 2: Run the site.js coverage gate**

```bash
node --experimental-test-coverage \
  --test-coverage-include='docs/assets/site.js' \
  --test-coverage-include='docs/assets/site-bootstrap.js' \
  --test-coverage-lines=100 \
  --test-coverage-functions=100 \
  --test-coverage-branches=100 \
  --test tests/site-links.test.mjs
```

- [ ] **Step 3: Run the static smoke gate**

```bash
node scripts/site-smoke.mjs
```

- [ ] **Step 4: Run Impeccable static detection if available**

Use the installed Impeccable detector against `docs/index.html` and `docs/assets/site.css`. Fix actionable contrast, hierarchy, responsive, or anti-pattern findings. If the detector executable is not mounted in the container, document that limitation instead of claiming it ran.

- [ ] **Step 5: Inspect the final diff and commit**

Stage only the spec, plan, README, site HTML/CSS, and tests. Use conventional commits and leave the feature branch clean.
