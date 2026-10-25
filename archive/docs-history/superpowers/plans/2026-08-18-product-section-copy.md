# Product Section Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the product-section intro concrete and visually connected to the Explore proof below it.

**Architecture:** Keep the existing static HTML/CSS launch-site system. Change only the section copy and its intro rhythm; preserve the screenshot, responsive stacking, palette, typography, and all product claims.

**Tech Stack:** Static HTML/CSS, Node built-in test runner, Playwright MCP, Impeccable detector.

---

### Task 1: Lock the intended copy and rhythm with a failing test

**Files:**

- Modify: `tests/site.test.mjs`
- Read: `docs/index.html`, `docs/assets/site.css`

- [ ] Add assertions for the concrete headline/body, absence of the awkward “pick up” and non-literal “follow” wording, and the tighter intro-to-row spacing token.
- [ ] Run `node --test tests/site.test.mjs` and confirm it fails against the current copy/spacing.

### Task 2: Implement the minimum launch-site change

**Files:**

- Modify: `docs/index.html:142-146`
- Modify: `docs/assets/site.css:483-510`

- [ ] Replace the abstract intro with “One library. Start wherever you are.” and a concrete search/browse/resume sentence.
- [ ] Reduce only the desktop intro bottom margin from the broad `clamp(72px, 9vw, 120px)` treatment to a tighter `clamp(56px, 7vw, 88px)` rhythm.
- [ ] Preserve the mobile section spacing and all existing responsive behavior.

### Task 3: Verify behavior and visual composition

**Files:**

- Verify: `docs/index.html`, `docs/assets/site.css`

- [ ] Run `node --test tests/site.test.mjs tests/site-links.test.mjs`.
- [ ] Run `node scripts/site-smoke.mjs`.
- [ ] Run `node /Users/aungmyokyaw/dotfiles/agents/.agents/skills/impeccable/scripts/detect.mjs --json docs/index.html`.
- [ ] Inspect the product section in Playwright at desktop and mobile widths; confirm the intro reads as setup for the Explore row and has no horizontal overflow.
