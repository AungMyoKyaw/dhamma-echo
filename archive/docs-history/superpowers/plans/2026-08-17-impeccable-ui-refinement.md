# Quiet Listening Room UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dhamma Echo’s existing desktop interface calmer, more coherent, and clearer without changing its Svelte/Tauri architecture or catalogue behavior.

**Architecture:** Preserve the current route shell, local-first state, playback engine, and data APIs. Capture the product/design context, then refine shared tokens and the core Home → Explore → Player surfaces so the improvement propagates across the existing views.

**Tech Stack:** Svelte 5, TypeScript, Tailwind CSS v4, Vite, Tauri 2, Node test runner.

## Files

- Create: `PRODUCT.md` and `DESIGN.md` for the missing product and visual context.
- Modify: `src/index.css`, `src/ui.ts`, `src/App.svelte`, `src/components/Header.svelte`, `src/components/Sidebar.svelte`, `src/components/Player.svelte`, `src/components/TrackRow.svelte`, `src/components/TeacherCard.svelte`, `src/components/CollectionCard.svelte`, `src/components/TextSearchField.svelte`, `src/components/AsyncState.svelte`, `src/components/ProgressiveControls.svelte`, `src/components/VideoPlayer.svelte`.
- Modify: `src/views/HomeView.svelte`, `src/views/ExploreView.svelte`, `src/views/CollectionsView.svelte`, `src/views/TeachersView.svelte`, `src/views/SettingsView.svelte`, `src/views/TeacherDetailView.svelte`, `src/views/CollectionDetailView.svelte`.
- Test: `tests/ui.test.mjs` for the Explore route copy contract.

### Task 1: Capture the product and design context

- [ ] Create `PRODUCT.md` describing Dhamma Echo as a private desktop listening library, its core journeys, platform, constraints, and non-goals.
- [ ] Create `DESIGN.md` documenting the quiet editorial listening-room register, existing rust/olive palette, typography, radius/elevation rules, shell geometry, and accessibility states.

### Task 2: Make route copy and shared primitives coherent

- [ ] Add a failing `tests/ui.test.mjs` assertion that Explore’s eyebrow no longer claims the catalogue is audio-only.
- [ ] Run the targeted UI test and confirm that it fails for the old copy.
- [ ] Change `src/ui.ts` to use neutral Explore copy while preserving the existing route-label shape for compatibility.
- [ ] Remove the repeated header eyebrow from `Header.svelte`, add balanced heading wrapping, and reduce shell bottom padding around the compact player.
- [ ] Add card/control radius tokens and reduce the unused player shadow token.
- [ ] Run the targeted UI test and confirm it passes.

### Task 3: Distill Home and discovery surfaces

- [ ] Replace Home’s repeated uppercase section kickers and large metric cards with direct headings, a compact summary band, and a clear first-listen CTA.
- [ ] Remove side-stripe decoration from the resume card and current track rows; use full-surface state treatment instead.
- [ ] Remove redundant Featured badges and large hover shadows from teacher/collection cards while preserving their semantic button behavior.
- [ ] Apply the control radius token to search fields, selects, navigation buttons, and primary actions.
- [ ] Use a semantic fieldset for Explore content-category chips and preserve existing filter behavior.

### Task 4: Harden states and persistent playback UI

- [ ] Replace the light-only pagination error color with the existing theme-aware error token and expose it as an alert.
- [ ] Keep loading/empty/error states calm and explanatory without changing data behavior.
- [ ] Reduce the audio/video player’s decorative shadow/blur, retain the normal and compact layouts, and keep every playback/queue/fullscreen control and accessible label.
- [ ] Keep critical controls at desktop-friendly target sizes and preserve reduced-motion behavior.

### Task 5: Verify the refactor

- [ ] Run the targeted UI test after the red-green cycle.
- [ ] Run `bun run format:web:check`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build:web`, and `bun run smoke:web`.
- [ ] Run Impeccable’s detector against `src public`, inspect the final diff, and report any unavailable visual/runtime verification honestly.
