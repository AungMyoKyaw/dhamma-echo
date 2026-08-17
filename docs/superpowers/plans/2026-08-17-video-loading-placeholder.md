# Video Loading Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the video player’s empty black loading stage with the approved A1 centered activity signal.

**Architecture:** Keep the loading state local to `src/components/VideoPlayer.svelte`; no player-state or media-engine changes are needed. Replace the existing “Connecting…” pill with a centered status composition: a warm pulsing dot inside a quiet ring, a clear loading label, and a short reassurance line. Keep that signal visible until the video element emits `loadeddata`, so an optimistic `playing` status cannot reveal an empty stage. Use existing app tokens and Tailwind utilities, with `motion-reduce:animate-none` for reduced-motion users.

**Tech Stack:** Svelte 5, Tailwind CSS v4, Node’s built-in test runner, Prettier, svelte-check, Vite.

---

### Task 1: Lock the loading-state contract with a failing regression test

**Files:**

- Modify: `tests/site.test.mjs`
- Test: `src/components/VideoPlayer.svelte` source contract

- [x] **Step 1: Add a focused test**

Add a test that reads `VideoPlayer.svelte` and requires the A1 copy, semantic status label, app accent, and reduced-motion fallback while rejecting the old “Connecting…” treatment.

- [x] **Step 2: Run the focused test and verify it fails**

Run: `bun test tests/site.test.mjs`

Expected: FAIL because the current component still contains `Connecting…` and does not contain the A1 loading copy.

### Task 2: Implement the centered activity signal

**Files:**

- Modify: `src/components/VideoPlayer.svelte:159-168`

- [x] **Step 1: Replace the loading overlay**

Use the stage condition `{#if videoVisible && !videoReady && !appState.player.error}` and render a centered, non-interactive status overlay containing:

```svelte
<div
  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-6 text-center"
  role="status"
  aria-label="Preparing video"
>
  <span
    class="flex size-16 items-center justify-center rounded-full border border-app-primary/45 bg-app-soft/65 shadow-[0_0_0_10px_color-mix(in_srgb,var(--color-app-primary)_12%,transparent)]"
  >
    <span class="size-3 animate-pulse rounded-full bg-app-primary motion-reduce:animate-none"
    ></span>
  </span>
  <span class="mt-5 text-xs font-bold text-white">Preparing the video</span>
  <span class="mt-1 text-[0.7rem] text-white/65">A moment of quiet before playback</span>
</div>
```

- [x] **Step 2: Run the focused test and verify it passes**

Run: `bun test tests/site.test.mjs`

Expected: PASS.

### Task 3: Run project verification for the touched surface

**Files:**

- Verify: `src/components/VideoPlayer.svelte`
- Verify: `tests/site.test.mjs`

- [x] **Step 1: Format the touched files**

Run: `bunx prettier --write src/components/VideoPlayer.svelte tests/site.test.mjs`

- [x] **Step 2: Run static checks and tests**

Run: `bun run typecheck && bun run lint && bun run test:coverage && bun run build:web && bun run smoke:web`

Expected: all commands exit successfully.

- [x] **Step 3: Review the diff**

Run: `git diff -- src/components/VideoPlayer.svelte tests/site.test.mjs docs/superpowers/plans/2026-08-17-video-loading-placeholder.md`

Confirm the diff only adds the A1 loading treatment, its regression contract, and this implementation plan.

### Follow-up: Keep the signal until the first video data is ready

The live screenshot exposed a timing gap: the browser can emit `play` and move the app to `playing` before the `<video>` element has painted its first frame. The stage now owns a local `videoReady` flag, resets it on `loadstart`, `emptied`, and media errors, and sets it on `loadeddata`. The A1 overlay remains visible while the video has no first data and the player has no error, regardless of the optimistic `playing` status.

- [x] Add a regression contract for the `videoReady` flag and media lifecycle listeners.
- [x] Gate the A1 overlay on `!videoReady` and clear the flag when the video closes.
- [x] Re-run typecheck, lint, coverage, production build, and web smoke checks.
