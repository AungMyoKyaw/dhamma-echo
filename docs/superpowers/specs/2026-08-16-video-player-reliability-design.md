# Video Player Reliability and Focused UI Design

## Goal

Make video playback behave like one reliable, focused player in the existing Dhamma Echo shell:

- Pause must pause the live video element, including while an initial play request is still settling.
- Close must stop playback, clear the active video, and remove the player instead of hiding a still-playing element.
- A selected video must use one shared player surface rather than creating a player per catalogue item.
- The player must expose an explicit fullscreen action.
- Audio playback, catalogue discovery, persistence, and the existing trusted-media URL boundary remain unchanged.

## Evidence and root cause

The current implementation uses `videoPlayerDismissed` as a visibility flag. `dismiss-video-player` only changes that flag; it does not pause the `MediaEngine`, clear the `<video>` source, or clear `player.current`. The current app test deliberately asserts that dismissing hides the card while playback continues.

The video element is also mounted only while the visible card is open. That creates an avoidable registration/reload race: a video can begin through the audio fallback before the live `<video>` element is available, then be reloaded when the card mounts. The replacement keeps one `<video>` element mounted inside one `VideoPlayer` component and changes only its presentation, so the engine always has a stable video target.

## Approaches considered

### Keep the existing overlay and add a stop call

This is the smallest code diff, but it keeps the full-window backdrop, click-outside dismissal, conditional element mount, and visibility state that caused the lifecycle confusion. It fixes the symptom without improving the interaction model.

### Navigate to a dedicated video route

This gives video a large focused surface, but it changes navigation semantics and makes a video selection feel unlike the persistent audio workflow. It also requires restoring route context and adds a second player-page layout to maintain.

### Use one shared docked video player (selected)

Keep a single `VideoPlayer.svelte` mounted at the app shell. Catalogue rows only select or toggle the current track; they never own video markup. The player appears as a non-modal dock anchored to the content area, with no click-outside dismissal. Its close control calls an application-level stop/clear operation. This keeps browsing visible, removes the hidden-playing-media failure mode, and preserves the current catalogue and audio-player architecture.

## Interaction design

### Selecting and switching videos

- Clicking a playable video row selects it and starts it in the shared dock.
- Clicking the current video row toggles play/pause, just like an audio row.
- Selecting another video stops the previous media engine through the existing engine replacement path, loads the new track into the same live `<video>` element, and reopens the dock for the new current track.
- There is never more than one `<video>` element or one video transport surface.

### Pause, progress, and keyboard controls

- The central transport button reflects the actual media state from `play` and `pause` events.
- The engine tracks an in-flight `play()` request. If the user presses pause before that promise settles, the pending attempt is invalidated and the element is paused instead of issuing a second `play()` request.
- Existing seek, skip-15, playback-rate, queue, resume, history, and keyboard shortcuts remain available.

### Close behavior

- Close and Escape call `DhammaApp.closeVideoPlayer()`.
- The app persists the current resume position, stops and clears the engine's media element, then dispatches a `close-video-player` action that sets the current track to `null`, status to `idle`, and progress/error fields to their empty values.
- The player is removed from the UI. Reopening a row creates a new active player surface and uses the existing saved resume position if one exists.
- There is no click-outside-to-dismiss behavior and no `videoPlayerDismissed` state.

### Fullscreen

- A fullscreen button sits in the player controls and calls `HTMLVideoElement.requestFullscreen()` for the live video element.
- The button label and icon switch to “Exit fullscreen” while the element is the active document fullscreen element.
- `fullscreenchange` keeps the button state synchronized when the user exits through the system UI or Escape. A rejected browser fullscreen request leaves the player usable and does not change playback state.

## UI structure

- A single non-modal dock spans the content column above the app edge, with a clear surface boundary and restrained shadow consistent with the audio footer.
- The dock uses a stable 16:9 video stage, a compact metadata strip for title/teacher/status, and one transport row for skip, play/pause, seek, speed, queue, fullscreen, and close.
- The player uses the existing app colors, `Icon` component, Myanmar typography helpers, spacing tokens, and focus-visible treatment.
- On narrow windows the dock becomes full-width within the content area, keeps the 16:9 stage, and wraps controls without horizontal overflow.
- The catalogue remains visible underneath/around the dock; selecting an item never creates an inline player inside its row.

## Architecture and data flow

1. `VideoPlayer.svelte` mounts once and registers its live `<video>` element with `DhammaApp`.
2. `DhammaApp.playTrack(video)` dispatches the normal `play-track` state transition and sends the track to `MediaEngine` using the registered video element.
3. `MediaEngine` owns media event listeners and candidate fallback. Its `stop()` operation invalidates pending attempts, pauses, clears the source, and resets the element without destroying the reusable engine.
4. `DhammaApp.closeVideoPlayer()` persists resume, calls `stop()`, and dispatches `close-video-player`.
5. Svelte derives visibility solely from `player.current?.mediaType === "video"`; there is no separate hidden-playing flag.

No Tauri command, CSP host, dependency, database query, or persistence schema changes are required.

## Error handling

- Existing trusted-source and unsupported-format errors remain unchanged.
- Fullscreen API failures are ignored after leaving the transport usable; no error is shown for a browser capability denial.
- Stale play promises, fallback timers, and media events cannot restore a closed video because `MediaEngine.stop()` invalidates the active attempt before state is cleared.
- Closing while loading follows the same stop path and cannot leave a background network/play request driving the hidden element.

## Testing

- Update app tests so closing a video pauses and clears the video element, clears `player.current`, and allows a later selection to register/play again.
- Add an engine test proving a pending `play()` request can be cancelled by the user toggle without a second play attempt or a later unexpected `playing` state.
- Keep existing engine tests for candidate fallback, progress, resume, errors, and audio behavior green.
- Add reducer coverage for `close-video-player` resetting the player state.
- Run Svelte typecheck, lint, unit tests, production build, and rendered smoke checks at desktop and narrow widths. Verify the flow: select video → pause → resume → fullscreen → exit fullscreen → close → select another video.

## Acceptance criteria

- Closing a playing or loading video stops it and clears its source; no audio/video continues in the background.
- The pause button changes the actual `<video>.paused` state and remains usable during a pending initial play request.
- Fullscreen enters and exits through the visible control and stays synchronized with system Escape.
- Only one shared video player surface exists, with no modal backdrop or per-row player instances.
- Audio playback behavior and trusted URL handling remain unchanged.
- Existing automated checks pass with no focused or skipped tests.
