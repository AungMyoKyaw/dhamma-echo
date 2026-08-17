# Dhamma Echo Design System

## Register

Quiet editorial listening room. The design serves the listening task: content hierarchy and playback feedback come first; visual personality comes from calm spacing, local typography, and the rust/olive palette.

## Principles

- Make the next listening action obvious.
- Prefer a clear list or compact control to a decorative card.
- Use color for action, selection, and state—not ornament.
- Keep catalogue density comfortable without making rows feel like a data dashboard.
- Preserve familiar desktop behavior and visible keyboard focus.

## Color roles

The existing palette is the source of truth and remains intentionally warm:

- `app-bg`: `#fcf9f2` light / `#181714` dark — application canvas.
- `app-surface`: `#ffffff` light / `#23211d` dark — content surfaces.
- `app-soft`: `#f0eee7` light / `#2e2b25` dark — secondary panels and selected-muted states.
- `app`: `#2e2e2a` light / `#eee9df` dark — primary text.
- `app-muted`: `#565550` light / `#b8b0a4` dark — supporting text.
- `app-primary`: `#8c3f08` light / `#d8894d` dark — primary action and current selection.
- `app-secondary`: `#485b37` light / `#9bab82` dark — privacy/library reassurance.
- `error` and `error-soft`: theme-aware failure states.

## Geometry and elevation

- Cards and grouped list surfaces use the `card` radius: 14px.
- Inputs, navigation items, and primary buttons use the `control` radius: 10px.
- Full pills are reserved for filters, badges, and compact status labels.
- Use a 1px border or a small elevation treatment; do not combine a border with a large decorative shadow.
- Current items use a full-surface tint and inset emphasis, never a colored side stripe.

## Typography

Use the existing local-first sans stack: Inter, installed Myanmar fonts, then system UI. Keep one family across product UI, use a compact fixed scale, balance headings, and give Myanmar text its existing generous line height and no-break behavior.

## Shell and responsive behavior

- Persistent sidebar: 256px normal, 224px compact, 72px collapsed.
- Main content: bounded at 1520px with container-aware grids.
- Audio player: three zones at normal width, two rows at compact width.
- Video player: bottom panel with a responsive stage/details split and fullscreen escape.
- Minimum supported window remains 860×620; required controls remain visible there.

## Component states

Every interactive control needs default, hover, focus-visible, active, disabled, and loading behavior where applicable. Async surfaces use skeleton, empty, and error states. Error copy must use theme tokens. Motion communicates state and honors `prefers-reduced-motion`.

## Accessibility

Use semantic buttons, labels, selects, fieldsets, and live regions. Keep critical targets around 40–44px, preserve `lang="my"` for Myanmar content, keep information available without color alone, and never hide content behind a reveal animation.
