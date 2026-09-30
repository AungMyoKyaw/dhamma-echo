# Dhamma Echo UI prototype

This standalone HTML prototype explores the application UI before changes are ported into Svelte. Catalogue records, durations, listening history, and playback are illustrative. It does not stream audio or persist personal state.

## Preview

Serve the repository root so the local font and logo remain available:

```bash
python3 -m http.server 4175 --bind 127.0.0.1 --directory .
```

Open `http://127.0.0.1:4175/prototype/`.

## Playback interaction

- Each talk has a visible 44×44px circular playback control beside its title.
- Idle controls use a neutral surface. The current talk gets a green control, a restrained row tint, and explicit Playing or Paused text.
- Either the control or the title starts another talk, or toggles the current talk. Title, row control, resume control, and footer stay synchronized.
- Save and queue are separate actions. Saved hearts use a filled glyph without a competing colored background.
- Controls remain available on narrow screens, including queue actions. Enter and Space work through native buttons; playback changes preserve DOM focus and search text.
- Legacy WMA records remain visible, but playback and queue actions are disabled.
- The scrubber and 15-second controls update the simulated position using the current talk's illustrative duration.

The established palette and typography remain unchanged. This decision replaces the small floating row triangle, not the application identity.

## Alignment

- Navigation, collapse, and search share 20px icon frames and 20px label line-height. Icons receive a 1px upward optical correction beside single-line text.
- Icon-only buttons remain geometrically centered, with native button padding removed. Multi-line teacher and collection entries retain block centering instead of inheriting the single-line correction.
- Icon frames do not shrink. Collapsed sidebar styles stay scoped to the sidebar and survive route changes without hiding mobile navigation labels.
- Responsive widths override the collapsed state so narrowing the window never leaves a sidebar-sized blank margin.

## Regression checks

```bash
node --test tests/prototype-playback.test.mjs
bun run verify:web
```

The prototype tests exercise control markup, alignment rules, collapsed navigation, playback synchronization, pause/resume, focus-preserving updates, unsupported formats, and duration-aware seeking. Browser checks also cover title activation, save/queue isolation, search retention, measured icon centers across all six routes, and layout at 1440×900, 860×620, and 390×844 in light and dark themes.
