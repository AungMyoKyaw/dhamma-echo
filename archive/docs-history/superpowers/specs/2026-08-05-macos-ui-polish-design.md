# Dhamma Echo — macOS UI Polish Design

Date: 2026-08-05
Status: Approved by direct implementation request

## Goal

Make Dhamma Echo feel proportioned and familiar on macOS, with a correctly scaled Dock icon and a compact, coherent audio player that remains usable at the supported 860×620 minimum window size.

## Evidence from inspection

- The 1024×1024 source icon uses almost the entire canvas and includes its own rounded mask. In a Dock context this creates a visually oversized tile and compounds system masking.
- The player mixes 36px, 48px, and tiny glyph controls without a consistent visual weight.
- The only transport control beside play/pause is a small “next” glyph, which reads as accidental rather than a complete transport group.
- The play triangle is mathematically centered in its SVG viewBox but not optically centered inside the circular button.
- At 860px width the footer compresses track metadata, transport, speed, and queue into a crowded line; volume disappears without leaving a clear volume affordance.
- Track-row play buttons are heavier than adjacent row actions and dominate the catalogue.

## Selected approach

Retain the framework-free Tauri/TypeScript architecture and make a targeted presentation-layer repair. Use one reusable icon renderer, explicit player control classes, static responsive CSS, and generated icon variants from one corrected 1024px master asset. No UI framework or player dependency is added.

## macOS design rules

- Use a square 1024×1024 source asset and let the system provide the final platform mask.
- Keep the meaningful lotus artwork inside a conservative optical safe area and avoid edge-to-edge foreground detail.
- Use 28–36px secondary macOS controls and a 44px primary transport control, with larger invisible hit regions where needed.
- Keep transport controls consistent in stroke/fill weight, spacing, hover state, pressed state, disabled state, focus state, and tooltip text.
- Use familiar media controls: jump back 15 seconds, play/pause, jump forward 15 seconds.
- Keep the progress slider and time labels visually tied to transport controls.
- Show volume with a speaker glyph and preserve it at compact widths when practical.
- Keep the queue control separate from playback speed and volume.

## Player layout

### Regular width

Three regions:

1. Track metadata: title, teacher, status/error.
2. Transport and timeline: back 15, play/pause, forward 15, current time, progress, duration.
3. Session controls: speed, volume with icon, queue.

The bar uses a 76–84px visual height, a subtle top separator, and a lighter shadow than the current implementation.

### Compact width

- Track metadata gets a fixed minimum width and truncates cleanly.
- Transport remains complete and centered.
- Volume slider collapses before the volume glyph does.
- Speed becomes a compact pop-up style select.
- Queue remains a 32px target with count badge.
- No horizontal overflow at 860px.

## Catalogue rows

- Use a 36px primary row play button with a 16px glyph.
- Add visible pressed state and current-track state.
- Keep favorite and queue actions secondary.
- Prevent nested row click handling from double-triggering controls.

## App icon

Create `src-tauri/icons/app-icon.png` as the 1024px master:

- transparent outer margin for legacy flat `.icns` rendering;
- one warm rounded-square tile inside the canvas;
- lotus/sound-wave mark scaled down and optically centered;
- no text;
- crisp edges at 16px and 32px tests.

Generate all configured Tauri icon variants from the master. The app icon remains lightweight and original.

## Accessibility

- Every icon-only control has an `aria-label` and `title`.
- Focus rings remain visible in light and dark themes.
- Controls expose pressed/loading/disabled state where applicable.
- Minimum visible target is 28px on macOS; primary playback remains 44px.
- Reduced-motion preference disables nonessential transitions.

## Testing

- View tests assert the new transport actions, control labels, sizes/classes, and compact player structure.
- App tests verify 15-second backward/forward seek actions clamp through the existing audio engine.
- Smoke tests confirm generated CSS contains player layout and control classes.
- Asset tests validate source icon dimensions, transparency/margins, generated variants, and configured paths.
- Static screenshots are generated at 1280×820 and 860×620 for visual comparison.

## Non-goals

- No full visual rewrite.
- No new frontend framework.
- No expanded album-art player.
- No media-session integration in this pass.
- No change to the bundled catalogue or network trust boundary.
