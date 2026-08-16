# Video Player Reliability and Focused UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hidden-but-playing video overlay with one reliable docked player whose pause, close, and fullscreen controls operate on the live media element.

**Architecture:** Keep one `VideoPlayer.svelte` mounted at the application shell so `DhammaApp` always has a stable `<video>` target. Remove `videoPlayerDismissed`; the player is visible only while `player.current` is a video. Add a `MediaEngine.stop()` lifecycle operation and pending-play cancellation, then make `DhammaApp.closeVideoPlayer()` stop the engine, persist resume, and clear player state before the UI disappears.

**Tech Stack:** Svelte 5 runes, strict TypeScript, Tailwind CSS v4, native HTML video/fullscreen APIs, Node built-in tests, Bun scripts, Vite.

---

## File map

- Modify `src/types.ts`: remove the visibility-only `videoPlayerDismissed` field and keep the player state contract focused on active media.
- Modify `src/store.ts`: replace `dismiss-video-player` with `close-video-player`, resetting the active player to its idle/empty state.
- Modify `tests/store.test.mjs`: prove the close transition clears a video player and that selecting a new track starts from a clean active state.
- Modify `src/player.ts`: add stop/clear behavior, invalidate stale attempts, and allow a pending play request to be cancelled by the user toggle.
- Modify `tests/player.test.mjs`: test stop/clear and pending-play cancellation with the existing fake media element.
- Modify `src/app.ts`: add `closeVideoPlayer()`, ensure engine teardown stops the old media element, and remove all dismissed-card assumptions.
- Modify `tests/app.test.mjs`: replace the test that asserts background playback with tests for stop/clear, close while loading, and reopen.
- Modify `src/components/VideoPlayer.svelte`: keep one live video element mounted, remove the modal backdrop/click-outside dismissal, add the dock layout, fullscreen state, and close action.
- Modify `src/components/Icon.svelte`: add production-quality fullscreen and exit-fullscreen glyphs to the existing icon family.
- Modify `src/App.svelte`: route Escape to `closeVideoPlayer()` and reserve bottom space for the dock without referencing removed state.
- Modify `src/index.css` only if the rendered narrow-window control wrap needs a shared utility; prefer existing Tailwind tokens first.

## Task 1: Write failing state-transition tests

**Files:** `tests/store.test.mjs`, `tests/app.test.mjs`

- [ ] **Step 1: Replace the old store assertion with the desired close transition.**

Add this behavior to the existing player reducer test after selecting a video-shaped track:

```js
const video = { ...tracks[0], id: 7, format: "mp4", mediaType: "video" };
state = reduce(state, { type: "play-track", track: video });
state = reduce(state, { type: "player-progress", currentTime: 42, duration: 120 });
state = reduce(state, { type: "close-video-player" });
assert.equal(state.player.current, null);
assert.equal(state.player.status, "idle");
assert.equal(state.player.currentTime, 0);
assert.equal(state.player.duration, 0);
assert.equal(state.player.error, "");
```

Delete the old `videoPlayerDismissed` assertions and the `dismiss-video-player` action from the test. This test must fail because the reducer does not yet recognize `close-video-player`.

- [ ] **Step 2: Replace the app test that currently blesses background playback.**

Rename it to `DhammaApp closes a video by pausing, clearing, and resetting the player`, then use the real app method:

```js
await app.playTrack(videoTrack);
assert.equal(video.paused, false);
assert.match(video.src, /walkthrough\.mp4$/);

app.closeVideoPlayer();

assert.equal(video.paused, true);
assert.equal(video.src, "");
assert.equal(app.state.player.current, null);
assert.equal(app.state.player.status, "idle");
```

Add a second assertion in the same test that `await app.playTrack(videoTrack)` after close attaches the source again and returns a video current track. This must fail because `closeVideoPlayer()` does not exist yet.

- [ ] **Step 3: Run the focused tests and verify the failures are about the missing behavior.**

Run:

```bash
bun run test
```

Expected: the reducer test leaves the current track active and the app test throws because `closeVideoPlayer` is not defined. Do not change production code until those failures are observed.

## Task 2: Implement the clean player state transition

**Files:** `src/types.ts`, `src/store.ts`, `tests/store.test.mjs`

- [ ] **Step 1: Remove `videoPlayerDismissed` from the player state type and initial state.**

Delete the field/comment from `PlayerState` and delete `videoPlayerDismissed: false` from `createInitialState()`. Remove the reset assignments from the `play-track` and `play-next` reducer cases.

- [ ] **Step 2: Replace the action and add a complete close transition.**

In `AppAction`, replace:

```ts
| { type: "dismiss-video-player" }
```

with:

```ts
| { type: "close-video-player" }
```

Use this reducer case:

```ts
case "close-video-player":
  return {
    ...state,
    player: {
      ...state.player,
      current: null,
      status: "idle",
      currentTime: 0,
      duration: 0,
      error: "",
      queueOpen: false
    }
  };
```

- [ ] **Step 3: Run the state tests and the typecheck.**

Run:

```bash
bun run test
bun run typecheck
```

Expected: the new reducer test passes. Existing references to the removed field/action may still fail typecheck; fix only those references in the app/UI tasks below.

## Task 3: Make `MediaEngine` stoppable and pause-safe

**Files:** `tests/player.test.mjs`, `src/player.ts`

- [ ] **Step 1: Add a failing stop/clear test.**

After loading a track in `tests/player.test.mjs`, add:

```js
test("MediaEngine stops and clears the active media source", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  await engine.setTrack(tracks[0]);

  engine.stop();

  assert.equal(audio.paused, true);
  assert.equal(audio.src, "");
  assert.equal(audio.currentTime, 0);
  assert.equal(events.at(-1), { type: "status", status: "paused" });
});
```

Run `bun run test`; it must fail because `stop()` is missing.

- [ ] **Step 2: Add a failing pending-play cancellation test.**

Use a deferred `play()` in a focused test. The fake media object must count calls and expose a resolver:

```js
test("MediaEngine cancels a pending play request when toggled", async () => {
  const audio = new FakeAudio();
  let resolvePlay;
  let playPromise;
  audio.play = () => {
    audio.playCalls += 1;
    playPromise ??= new Promise((resolve) => (resolvePlay = resolve));
    return playPromise;
  };
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  const loading = engine.setTrack(tracks[0]);

  await new Promise((resolve) => setTimeout(resolve, 0));
  const toggling = engine.toggle();
  resolvePlay();
  await toggling;
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(audio.playCalls, 1);
  assert.equal(audio.paused, true);
  assert.equal(events.at(-1), { type: "status", status: "paused" });
  await loading;
});
```

Run `bun run test`; it must fail until pending attempts are tracked and invalidated.

- [ ] **Step 3: Implement minimal lifecycle helpers.**

Add `playPending = false` to `MediaEngine`. Set it before calling `audio.play()` and clear it in both promise branches. Add:

```ts
stop(): void {
  this.activeAttempt += 1;
  this.candidates = [];
  this.candidateIndex = -1;
  this.startedAttempt = 0;
  this.playPending = false;
  this.resumeAt = 0;
  this.audio.pause();
  this.audio.currentTime = 0;
  this.audio.src = "";
  this.audio.load();
}
```

Update `toggle()` so a pending request is cancelled instead of calling `play()` again:

```ts
async toggle(): Promise<void> {
  if (this.playPending) {
    this.activeAttempt += 1;
    this.startedAttempt = 0;
    this.playPending = false;
    this.audio.pause();
    this.emit({ type: "status", status: "paused" });
    return;
  }
  if (this.audio.paused) {
    try {
      await this.audio.play();
    } catch {
      this.emit({ type: "error", message: "The audio stream could not start." });
    }
  } else {
    this.audio.pause();
  }
}
```

Make `destroy()` call `stop()` before detaching listeners so switching from video to audio cannot leave the old video streaming. Keep the existing listener cleanup assertions green.

- [ ] **Step 4: Run the engine tests and inspect the result.**

Run:

```bash
bun run test
```

Expected: all existing engine cases plus the new stop/cancel cases pass. If a stale fallback timer keeps the test process alive, make its target mismatch resolve path harmless without changing candidate fallback behavior.

## Task 4: Connect app-level close and engine ownership

**Files:** `src/app.ts`, `tests/app.test.mjs`

- [ ] **Step 1: Add the app close method.**

Implement:

```ts
closeVideoPlayer(): void {
  const track = this.state.player.current;
  if (track === null || track.mediaType !== "video") return;
  this.persistCurrentResume(true);
  this.engine.stop();
  this.dispatch({ type: "close-video-player" });
}
```

The engine stop occurs before the reducer transition so the live element is paused and cleared before Svelte hides the dock. The existing `destroy()` path remains responsible for persisting resume and releasing listeners.

- [ ] **Step 2: Make video-element registration lifecycle-safe.**

Keep `registerVideoElement` able to reload an already-current video when the element is first registered, but do not attach a second engine to a changing hidden element. When `element === null` and the current track is video, call `this.engine.stop()` before clearing `this.videoElement`.

Update comments to refer to `VideoPlayer`, not the removed `VideoView`.

- [ ] **Step 3: Remove all `videoPlayerDismissed` and `dismiss-video-player` references.**

Use `rg -n "videoPlayerDismissed|dismiss-video-player" src tests` and leave no matches.

- [ ] **Step 4: Run focused app tests.**

Run:

```bash
bun run test
```

Expected: video close pauses/clears and resets state; selecting video after close works; audio playback tests remain green.

## Task 5: Replace the modal overlay with one docked player and fullscreen controls

**Files:** `src/components/VideoPlayer.svelte`, `src/components/Icon.svelte`, `src/App.svelte`

- [ ] **Step 1: Keep one video element mounted.**

In `VideoPlayer.svelte`, bind `videoEl` in the component root outside the visibility branch. Register it once with `$effect` and unregister it on component teardown. Derive:

```ts
let track = $derived(appState.player.current);
let videoVisible = $derived(track !== null && track.mediaType === "video");
```

Render the dock with `class:hidden={!videoVisible}`. Do not use a full-window `fixed inset-0` backdrop, click-outside handler, `role="dialog"`, or a separate per-row `<video>`.

- [ ] **Step 2: Wire close and Escape to the app lifecycle.**

Use `app.closeVideoPlayer()` for the visible Close button. In `App.svelte`, change the Escape branch to:

```ts
if (event.key === "Escape" && appState.player.current?.mediaType === "video") {
  event.preventDefault();
  app.closeVideoPlayer();
  return;
}
```

Remove `videoCardOpen` and compute bottom padding from `videoVisible` only. Preserve the audio footer padding when an audio track is active.

- [ ] **Step 3: Add fullscreen state and behavior.**

Add a `fullscreen` state and a `fullscreenchange` listener. The handler must set `fullscreen = document.fullscreenElement === videoEl`. The button should call:

```ts
async function toggleFullscreen(): Promise<void> {
  if (videoEl === undefined) return;
  try {
    if (document.fullscreenElement === videoEl) await document.exitFullscreen();
    else await videoEl.requestFullscreen();
  } catch {
    fullscreen = false;
  }
}
```

Use `Icon name="fullscreen"` / `Icon name="exit-fullscreen"`, with accessible labels `Enter fullscreen` and `Exit fullscreen`.

- [ ] **Step 4: Add the icon paths.**

Extend `IconName` and the SVG branches with four-corner expand/collapse paths using the existing 24×24 viewBox, currentColor, 1.8 stroke, round caps, and round joins. Do not use text glyphs for fullscreen.

- [ ] **Step 5: Implement the dock layout.**

Keep the existing app surface tokens and build a single fixed/stable dock spanning the content column. The dock must contain:

1. A 16:9 video stage.
2. A compact title/teacher/status strip.
3. A transport row with back-15, pause/play, forward-15, range scrubber, playback speed, queue, fullscreen, and close.

Use responsive Tailwind grid/flex rules so controls wrap on narrow windows. Do not add inline players to `TrackRow.svelte`.

- [ ] **Step 6: Run the frontend gates before browser work.**

Run:

```bash
bun run typecheck
bun run lint
bun run build:web
```

Expected: zero Svelte diagnostics/warnings, zero ESLint warnings, and a successful Vite build.

## Task 6: Rendered verification and regression check

**Files:** no committed test artifact; screenshots/scripts must live outside the repository.

- [ ] **Step 1: Start the local web app.**

Run:

```bash
bun run dev:web
```

Use the exact host `http://127.0.0.1:5173`.

- [ ] **Step 2: Verify the target flow in a browser-capable test path.**

The flow under test is: app loads → select a video row → pause → resume → enter fullscreen → exit fullscreen with Escape → close → select another video.

Capture page identity, a meaningful DOM snapshot, console warnings/errors, and screenshots at a desktop viewport and a narrow mobile-sized viewport. If the Browser plugin is unavailable, use the repository’s available Playwright fallback and record that reason.

- [ ] **Step 3: Run the repository verification commands.**

Run:

```bash
bun run test:policy
bun run test
bun run smoke:web
```

Expected: no focused/skipped tests, all unit tests pass, and the built web assets pass smoke checks.

- [ ] **Step 4: Inspect the final diff and preserve unrelated staged work.**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Confirm only the video-player implementation/tests/docs plan are newly changed beyond the user’s existing staged work. Do not reset, amend, or discard the existing staged changes.
