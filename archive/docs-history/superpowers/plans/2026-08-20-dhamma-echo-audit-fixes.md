# Dhamma Echo Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the audited accessibility, contrast, responsive-shell, media-error, and catalogue-density defects without changing Dhamma Echo's catalogue or playback architecture.

**Architecture:** Keep the existing Svelte 5 route shell, TypeScript state model, and Tauri media engine. Add one small pure focus-cycling helper, expose a theme-safe primary foreground token, derive shell offsets from one CSS variable, and keep media accessibility behavior inside the existing overlay/player components. Caption tracks remain blocked until the catalogue exposes caption assets; no guessed URL fallback will be added.

**Tech Stack:** Svelte 5, TypeScript, Tailwind CSS v4, Vite, Tauri 2, Node test runner, Chromium/axe verification.

**Spec:** `PRODUCT.md`, `DESIGN.md`, and the approved audit findings from the current task.

## Global Constraints

- Preserve the existing Svelte 5, TypeScript, Rust, Tauri, CSP, and playback architecture.
- Do not add runtime dependencies, remote fonts, telemetry, accounts, or catalogue behavior changes.
- Keep the minimum supported window at 860×620.
- Preserve Myanmar `lang="my"`, keyboard shortcuts, reduced-motion behavior, and local-first state.
- Use the existing rust/olive palette and semantic tokens; do not introduce gradients or side-stripe accents.
- Add tests before production changes for new pure behavior and media error copy.

---

### Task 1: Establish failing regression tests

**Files:**

- Modify: `tests/player.test.mjs`
- Modify: `tests/ui.test.mjs`

**Interfaces:**

- Produces the expected media-specific error contract and focus-wrap helper contract used by later tasks.

- [ ] **Step 1: Add the failing video error assertion**

Import `videoTrack` from `tests/test-data.mjs` and add a test that makes `FakeAudio.play()` fail for `videoTrack`, then asserts the final error is `The video is unavailable from Dhamma Download.`.

- [ ] **Step 2: Run the player test suite and confirm the expected failure**

Run: `bun run test`
Expected: the new video error assertion fails because `MediaEngine` currently always emits the audio-specific message.

- [ ] **Step 3: Add the failing focus-wrap assertions**

Import the future `focusTrapIndex` helper from `.test-build/src/a11y.js` and assert first/last wrapping, interior no-op behavior, and zero-count no-op behavior.

- [ ] **Step 4: Run the test suite and confirm the expected missing-module failure**

Run: `bun run test`
Expected: the focus helper import fails because `src/a11y.ts` does not exist yet.

---

### Task 2: Fix theme contrast and shell offset drift

**Files:**

- Modify: `src/index.css`
- Modify: `src/App.svelte`
- Modify: `src/components/Player.svelte`
- Modify: `src/components/VideoPlayer.svelte`
- Modify: `src/components/Sidebar.svelte`
- Modify: primary-action classes in `src/components/AsyncState.svelte`, `src/components/ProgressiveControls.svelte`, `src/components/TrackRow.svelte`, `src/views/HomeView.svelte`, `src/views/ExploreView.svelte`, `src/views/CollectionsView.svelte`, `src/views/TeachersView.svelte`, and `src/views/TeacherDetailView.svelte`

**Interfaces:**

- `app-shell` exposes `--sidebar-offset` to all descendants.
- `--color-app-primary-ink` is the semantic foreground for every primary surface.

- [ ] **Step 1: Add the semantic primary foreground token and shell offset variables**

Define the light token as white and the dark token as the existing dark ink. Add an `.app-shell` offset variable with expanded, compact, and collapsed states. Keep the collapsed override after the compact media rule.

- [ ] **Step 2: Replace primary-surface `text-white` usage**

Use `text-app-primary-ink` for active navigation, primary buttons, category chips, play controls, queue badges, and state actions. Keep white text only for deliberate black video/fullscreen overlays.

- [ ] **Step 3: Bind the shell state to the shared offset variable**

Add `data-sidebar-collapsed` to the root shell, replace App's derived margin-left class with `ml-[var(--sidebar-offset)]`, and make Player/VideoPlayer use `left-[var(--sidebar-offset)]`.

- [ ] **Step 4: Run typecheck and the accessibility browser check**

Run: `bun run typecheck`
Run: `bun run build:web`
Then run the preview in Chromium at 1440×900 in dark mode and run axe. Expected: no primary text contrast violation.

---

### Task 3: Add tested focus management and overlay isolation

**Files:**

- Create: `src/a11y.ts`
- Modify: `src/components/KeyboardCheatsheet.svelte`
- Modify: `src/components/VideoPlayer.svelte`
- Modify: `src/App.svelte`
- Test: `tests/ui.test.mjs`

**Interfaces:**

- `focusTrapIndex(currentIndex: number, count: number, reverse: boolean): number | null` wraps focus only at the ends of a focusable set.
- Keyboard help and video player restore the trigger focus after close.

- [ ] **Step 1: Implement the pure focus-wrap helper**

Add `focusTrapIndex` with explicit zero-count and interior no-op behavior so the test from Task 1 can compile and pass.

- [ ] **Step 2: Run the tests and confirm the helper passes**

Run: `bun run test`
Expected: all tests pass, including the new focus-wrap assertions.

- [ ] **Step 3: Add focus entry and trapping to KeyboardCheatsheet**

Bind the dialog and close button, focus the close button after mount, trap Tab/Shift+Tab within dialog controls, use a labelled heading, and restore the previously focused element on unmount.

- [ ] **Step 4: Isolate the app content while VideoPlayer is open**

Wrap the sidebar/main/audio content in an inert, `aria-hidden` content shell when a video is active. Keep VideoPlayer outside that shell.

- [ ] **Step 5: Add video dialog semantics and focus trapping**

Give the video panel a labelled dialog role, focus Close on open, trap focus within the panel, restore the video trigger on close, and preserve Escape/fullscreen behavior.

- [ ] **Step 6: Run typecheck and browser keyboard verification**

Run: `bun run typecheck`
In Chromium, open keyboard help and verify focus enters Close, Tab cycles inside, and Escape restores the trigger. Open video playback and verify the same behavior.

---

### Task 4: Harden responsive shell and asynchronous semantics

**Files:**

- Modify: `src/components/Sidebar.svelte`
- Modify: `src/components/VideoPlayer.svelte`
- Modify: `src/components/TrackRow.svelte`
- Modify: `src/components/AsyncState.svelte`

**Interfaces:**

- Sidebar lower controls remain reachable at 860×620.
- Video panel fits within the minimum viewport without clipping its stage.
- Download progress exposes determinate or indeterminate progressbar semantics.

- [ ] **Step 1: Add compact sidebar spacing and overflow safety**

Use compact top/bottom padding, a smaller lower-group gap, compact privacy-panel padding, and vertical overflow fallback. Keep control targets at or above 40px.

- [ ] **Step 2: Reduce compact video stage height**

Use a 2:1 compact stage ratio under the existing 1040px breakpoint so the stage plus details fit within 620px while retaining readable controls.

- [ ] **Step 3: Expose download progress semantics**

Change the visual progress wrapper to `role="progressbar"`, add `aria-valuemin`, `aria-valuemax`, `aria-valuenow` when determinate, and retain an indeterminate label when total size is unknown.

- [ ] **Step 4: Announce loading skeleton state**

Give the loading wrapper status semantics and a concise accessible label without changing the visual skeleton.

- [ ] **Step 5: Verify responsive geometry**

At 860×620, verify the sidebar collapse button is fully inside the viewport, the video panel top is non-negative, and body width equals viewport width. At 1440×900 collapsed, verify the audio footer begins at 72px.

---

### Task 5: Simplify track actions and browse-card density

**Files:**

- Modify: `src/components/TrackRow.svelte`
- Modify: `src/components/TeacherCard.svelte`
- Modify: `src/components/CollectionCard.svelte`

**Interfaces:**

- Each track exposes one accessible Play/Pause action while preserving a 44px primary target and separate favorite/download/queue actions.
- Teacher carousel cards retain their current presentation; browse-grid cards become compact row-like cards.

- [ ] **Step 1: Combine the track icon and title into one play button**

Change the row grid to a flexible content column plus action column. Put the play icon, title, metadata, and resume text in one button. Keep disabled/loading/current labels and `aria-pressed` behavior.

- [ ] **Step 2: Compact non-carousel teacher cards**

Use a horizontal avatar/content/action arrangement for the Teachers route while keeping the Home carousel card variant intact.

- [ ] **Step 3: Reduce collection card minimum height and padding**

Keep title, teacher, and talk count but remove the large empty vertical treatment.

- [ ] **Step 4: Verify accessibility tree and visual density**

Confirm one Play button per track in Chromium and inspect Teachers/Collections at 1440×900 and 860×620 for no overflow or clipped Myanmar text.

---

### Task 6: Make media errors truthful

**Files:**

- Modify: `src/player.ts`
- Modify: `tests/player.test.mjs`

**Interfaces:**

- `MediaEngine.setTrack()` stores the active `mediaType` and emits audio/video-specific terminal errors.

- [ ] **Step 1: Store active media type in MediaEngine**

Set the active type before candidate validation and use it in `emitFinalError()`.

- [ ] **Step 2: Run the player tests and confirm the new error test passes**

Run: `bun run test`
Expected: both audio and video terminal-error assertions pass.

- [ ] **Step 3: Verify the preview copy**

Trigger the MP4 fixture in Chromium and confirm the panel says the video is unavailable rather than referring to an audio stream.

---

### Task 7: Final verification and review

**Files:**

- Modify: any implementation files required by verification findings

- [ ] **Step 1: Run the complete code checks**

Run: `bun run lint`
Run: `bun run typecheck`
Run: `bun run test`
Run: `bun run build:web`
Run: `bun run smoke:web`

- [ ] **Step 2: Run the design detector**

Run: `node /Users/aungmyokyaw/.claude/plugins/cache/impeccable/impeccable/3.9.1/skills/impeccable/scripts/detect.mjs --json src`

- [ ] **Step 3: Exercise the real preview surface**

Start `bun run dev:web`, inspect Home, Explore, Teachers, Collections, Settings, audio player, video player, keyboard help, light theme, dark theme, 1440×900, and 860×620 in Chromium. Run axe on the light and dark surfaces.

- [ ] **Step 4: Request code review**

Review the final diff for accessibility, responsive regressions, token drift, and unsupported caption assumptions. Resolve all critical and important findings before delivery.

- [ ] **Step 5: Run the complete checks again after review fixes**

Repeat the code checks and the browser smoke paths after any review changes. Report the caption-data prerequisite explicitly if the catalogue still exposes no caption asset field.
