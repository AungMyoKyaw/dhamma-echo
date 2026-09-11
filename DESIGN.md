---
version: alpha
name: Dhamma Echo
description: A quiet desktop listening room for Dhamma talks — editorial paperback discipline on a warm oat canvas, with a single terracotta-leaning rust as the only interactive accent.
colors:
  canvas: "#f7f3ea"
  surface: "#ffffff"
  soft: "#efece4"
  ink: "#2e2e2a"
  ink-muted: "#565550"
  border: "#d5d1c8"
  primary: "#7a3508"
  primary-strong: "#5e2904"
  on-primary: "#ffffff"
  secondary: "#3d4d30"
  tertiary: "#634a16"
  error: "#8d3531"
  error-soft: "#f9e8e6"
  canvas-dark: "#181714"
  surface-dark: "#23211d"
  soft-dark: "#2e2b25"
  ink-dark: "#eee9df"
  ink-muted-dark: "#b8b0a4"
  border-dark: "#464138"
  primary-dark: "#d8894d"
  primary-strong-dark: "#b87440"
  on-primary-dark: "#181714"
  secondary-dark: "#9bab82"
  tertiary-dark: "#c9a45e"
  error-dark: "#e2938c"
  error-soft-dark: "#35201f"
typography:
  display:
    fontFamily: "'Source Serif 4', 'Source Serif Pro', Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "'Source Serif 4', 'Source Serif Pro', Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Inter, 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: 10px
  card: 14px
  pill: 9999px
spacing:
  page-max: 1520px
  sidebar: 256px
  sidebar-compact: 224px
  sidebar-collapsed: 72px
  player-height: 84px
  player-height-compact: 132px
  min-window: "860x620"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input-field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  card-muted:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.card}"
  pill-filter:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  pill-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  pill-warning:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  track-row-current:
    backgroundColor: "color-mix(in srgb, {colors.primary} 5%, transparent)"
    rounded: "{rounded.control}"
  player-play:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  error-card:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    rounded: "{rounded.card}"
    padding: "16px"
  sidebar-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
  border-hairline:
    backgroundColor: "{colors.border}"
    rounded: "{rounded.control}"
  hover-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
  hover-primary-dark:
    backgroundColor: "{colors.primary-strong-dark}"
    textColor: "{colors.on-primary-dark}"
    rounded: "{rounded.control}"
  dark-canvas:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.ink-dark}"
  dark-surface:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
  dark-soft:
    backgroundColor: "{colors.soft-dark}"
    textColor: "{colors.ink-muted-dark}"
  dark-border:
    backgroundColor: "{colors.border-dark}"
    textColor: "{colors.ink-dark}"
  dark-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
  dark-secondary:
    backgroundColor: "{colors.secondary-dark}"
    textColor: "{colors.canvas-dark}"
  dark-tertiary:
    backgroundColor: "{colors.tertiary-dark}"
    textColor: "{colors.canvas-dark}"
  dark-error:
    backgroundColor: "{colors.error-dark}"
    textColor: "{colors.error-soft-dark}"
---

## Overview

The interface reads like a 1970s Burmese monastery library shelf, rendered in editorial Penguin paperback discipline: warm oat parchment, single accent color for the one action that matters, and a two-voice typography (display serif, body sans) that handles English and Burmese without changing personality. Everything in the layout earns its place by serving listening — content hierarchy and playback feedback come first; visual personality comes from generous spacing, a small radius grammar, and the discipline of _one accent, one rhythm_. The catalogue is the hero. There is no hero moment.

## Colors

The palette is a quiet editorial scheme with two accents and a single error signal. The rust is terracotta-leaning — deeper than the bright rust typical of editorial design, with a warmth that sits naturally on the oat ground rather than fighting it.

**Canvas and surfaces**

- **canvas** (`#f7f3ea`) is the warm oat parchment the application lives on. Use it for the page background, for inputs, and for empty regions of a card. Never paint a button or a strong text color with it.
- **surface** (`#ffffff`) is the slightly lifted paper that holds list rows, cards, and the audio player. Reserve it for grouped content; do not stack surfaces on top of surfaces.
- **soft** (`#efece4`) is the secondary panel — sidebar privacy callouts, mute filter pills, and skeleton placeholders. It is the only "muted selection" surface, used for non-current state emphasis.

**Ink**

- **ink** (`#2e2e2a`) is the primary text color. It is warm enough to sit on the canvas without contrast fighting. Do not introduce pure black anywhere.
- **ink-muted** (`#565550`) carries supporting text — captions, teacher names under titles, helper copy. It must never be the only carrier of meaning; weight and size must also convey the hierarchy.
- **border** (`#d5d1c8`) is the only border tone. Borders are 1px. There is no second border color and no decorative outline.

**Accents**

- **primary** (`#7a3508`) is terracotta rust — the single accent that drives interaction. It paints the sidebar's active route, the play button, the current track row's tint and ring, and primary submit buttons. It never paints a passive surface, never paints text on canvas or surface, and never appears as decoration (no underlines, no eyebrows, no glows, no gradients). It is also the only color that wears a shadow.
- **primary-strong** (`#5e2904`) is the hover state of primary. Use it only on `:hover` / `:active` of a primary button, never as a standalone token.
- **on-primary** (`#ffffff`) is the ink that sits on primary surfaces. Use it only on top of `primary` or `primary-strong`.
- **secondary** (`#3d4d30`) is forest-moss olive — the privacy and library reassurance color. It appears once, inside a small leaf-icon callout in the sidebar, and on nothing else. It is not a second brand color.
- **tertiary** (`#634a16`) is cooled bronze brass, reserved for occasional eyebrow text or status badges where olive is wrong and rust would shout. Use sparingly.

**Error**

- **error** (`#8d3531`) and **error-soft** (`#f9e8e6`) are the only failure colors. Error copy in the player, error states on async surfaces, and the inline "Retry" pill all use them. Never pair error with rust — the user needs to read the difference.

**Dark mode** mirrors the same roles onto a deep charcoal canvas (`#181714`) with a brighter, warmer rust (`#d8894d`) so it reads on the darker ground. The dark `ink` lifts to `#eee9df`; `ink-muted` to `#b8b0a4`; `border` to `#464138`. Roles do not change — only the values do.

## Typography

The product uses two voices: a display serif for editorial weight, and a single sans-serif for body, UI, and Burmese script.

**Required fonts.** The downstream app rewrite must bundle or load these; this file assumes they are present.

- **Source Serif 4** — display only. Never appears in body, UI, labels, or buttons.
- **Inter** — body, h3, UI labels, captions, and English headings.
- **Noto Sans Myanmar**, **Myanmar Text**, **Pyidaungsu** — Burmese mirrors. Expected to be installed on the device; the body does not reflow noticeably when they engage.

**Stack.** Display and headings use `'Source Serif 4', 'Source Serif Pro', Georgia, serif`. Everything else uses `Inter, 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', system-ui, sans-serif`. The system stack is fallback, not a second voice.

**Roles.** Four text roles carry the interface.

- **display** (h1 — page title) — Source Serif 4 at 600 weight, tight tracking (`-0.01em`), balanced wrap. Default 30px; drops to 28px below the 1040px breakpoint. One per route, lives in the Header component.
- **heading** (h2 — section title) — Source Serif 4 at 600 weight, default 24px. "Continue listening," "Featured teachers," the live catalogue heading. Never used inline.
- **body** (default reading text, h3, UI labels) — Inter 14px / 400. h3 escalates to 18px / 600 for track titles and teacher names on detail pages. Captions under titles use Inter at 12px / 600.

**Myanmar treatment.** Whenever content contains Burmese characters (the regex `[\u1000-\u109F]` in `src/ui.ts`), the text gets `lang="my"` and a `.myanmar-text` class that increases line-height to 1.8, prevents intra-word breaks (`word-break: keep-all`, `overflow-wrap: normal`), applies `line-break: auto`, and balances the wrap. This is not decoration; Burmese typography breaks badly under Latin defaults. The class is the only place that touches `line-break`, `overflow-wrap`, or `word-break`.

**What does not exist.**

- No italics anywhere — emphasis comes from weight, color, and size, not slant.
- No serif in body, UI, labels, captions, or buttons. The display serif appears only in h1 and h2.
- No monospace body.
- No all-caps body. The `tabular-nums` Tailwind utility appears only on player timestamps and talk counts (so columns of numbers align); it is never a typographic style choice.
- Headings and long titles use `text-wrap: balance` so they do not break on a single awkward word.

**Focus.** All interactive elements show a 3px outline at `color-mix(in srgb, var(--color-app-primary) 55%, transparent)` with a 3px offset on `:focus-visible`. There is no other focus style.

## Layout

The shell is a three-region desktop layout: a fixed left sidebar, a centered main column, and a fixed bottom audio player that floats over the main column.

**Sidebar.** 256px wide at full width, 224px between 1040px and 1180px, and 72px when the user collapses it. It holds the wordmark at the top, six primary routes as full-height buttons, and at the bottom a quiet olive-leaf privacy callout followed by the Collapse control. The collapse button is a textual "Collapse" / icon-only state; the icon-only collapsed state shows tooltips on hover. The sidebar scrolls internally with `scrollbar-gutter: stable` and `overscroll-contain` so scrolling inside it never bleeds into the page.

**Main column.** Bounded at `max-w-[1520px]` and centered. Below the 1040px breakpoint the outer padding drops from 40px to 24px and the header padding tightens. The Header sits inside this column with the route title and a one-line description; the view content sits below it with 32px of vertical breathing room.

**Audio player.** Fixed to the bottom, anchored to the right edge of the sidebar (`left-(--sidebar-offset)`). 84px tall at full width, 132px when the columns collapse below 1040px. Three zones at full width — track info, transport + scrubber, speed + queue — that reorganize into two rows at compact width (controls row, then the scrubber row, then track info squeezed beside the transport). The player sits on top of `surface` with a single 1px top border and a single soft drop shadow; it is the only element with persistent elevation.

**Video player.** When the current track is a video, the main column swaps to a 16:9 stage on the left and a track-detail panel on the right, with fullscreen escaping into the webview's native fullscreen. The stage always preserves aspect ratio.

**Density.** Catalogue pages use `auto-fit` grids with a `280px` minimum, so teacher cards and collection cards flow from one to many columns without breakpoints. List pages render rows inside a single bordered card with no inner padding between rows; the card itself holds the border. There is no "card per row" pattern — rows inside a card, cards only for grouped or featured content.

**Minimum window.** 860×620. The shell, sidebar collapse, header, and a usable player are guaranteed to remain visible and operable at that size. Below it the app does not attempt to render; above it, nothing in the layout changes until the next breakpoint.

**Breakpoints.** Two breakpoints matter: 1040px (header padding, sidebar width, player height, control sizing) and 1180px (player column ratios and gaps). Anything more granular is handled by `auto-fit` grids, not by media queries.

## Elevation & Depth

The product is almost flat. Depth is used in three places, and only those three.

**The audio player** has a soft upward shadow (`0 -4px 12px rgb(46 46 42 / 0.08)`) so it reads as floating above the catalogue. This is the only persistent elevation.

**The primary play button** has a small colored shadow at 25% primary alpha that lifts it 5px; on hover it lifts to 7px at 30%. The shadow is the same hue as the button — it reads as the button pushing toward you, not as a generic drop shadow. No other button has a shadow.

**The current track row** has no shadow at all. Current state is shown by a full-surface tint (`color-mix(in srgb, primary 5%, transparent)`) and an inset 1px ring (`color-mix(in srgb, primary 20%, transparent)`). Depth is replaced by saturation.

**Flat everywhere else.** Cards, list rows, the sidebar, modals, dropdowns, the keyboard cheatsheet, the queue panel — all flat. They may have a 1px border; they do not have a shadow. The cheat sheet opens as an inset surface within the shell, not as a floating panel.

## Shapes

A small, disciplined radius grammar. Three radii, no exceptions.

- **control** (10px) — inputs, navigation buttons in the sidebar, primary buttons, the playback rate select. Anything the user clicks or types into.
- **card** (14px) — group surfaces: teacher cards, collection cards, the catalogue list wrapper, the track-row card on Home, the privacy callout. Cards hold groups, not single items.
- **pill** (full round) — filters, badges, the "Video" / "WMA unavailable" chips on rows, the playback speed pill, the inline "Retry" pill, the "Connecting…" indicator, the queue-count dot on the player button.

The grammar is enforced: never use `rounded-card` on a control, never use `rounded-control` on a card. Pills are for status and selection chips, not for buttons that drive primary actions. The primary play button is a pill, but that is a special case — it is both a status indicator ("play" vs "pause") and a control.

There is no square corner anywhere. There are no squircles, no asymmetric radii. The one structural exception is a stage flush-joined to a sibling panel below it — the video player renders its top corners with `rounded-t-card` and `border-b-0` because the bottom edge is owned by the controls panel directly underneath. The two surfaces compose into one continuous shape; treating them as one composite surface is more honest than rounding all four corners and then covering two of them.

## Components

**Sidebar navigation item.** 48px tall (`h-12`, also `min-h-12`). Icon on the left, label on the right when expanded; icon-only and centered when collapsed. Inactive: `text-ink-muted` on the sidebar surface, hovers to a `bg-soft` wash and `text-ink`. Active: `bg-primary text-on-primary shadow-sm`. Active state uses a full-surface tint, never a colored side stripe.

**Track row.** Two-column grid — clickable title block on the left, action cluster on the right. Inside a card, rows are separated by 1px borders (`border-b border-b-border last:border-b-0`), with 12px vertical padding and 16px horizontal padding. The play disc is a 44px circle that gains primary color and a small lift on hover; on the current row it sits on `primary` permanently. Action buttons are 44px round icon buttons (favorite, download, enqueue) plus a small text "Queue" pill.

**Teacher card.** Three-column grid — avatar (48px), name and count, optional chevron. 112px minimum height, full card padding (16px). Hover lifts the border to `primary/50` and the background to `soft/35%` — no shadow.

**Search field.** 48px tall, full-width inside its row, with a 20px leading icon and an inline clear button (40px round) when the field has content. The field itself uses the canvas color (so it sits a half-step below the surface around it) with a 1px border. On focus the border becomes primary; the outline shows on top.

**Filter pill.** 40px tall, padded horizontally, fully rounded. Inactive: `bg-soft text-ink-muted`. Active: `bg-primary text-on-primary`. Hover on inactive darkens the border toward primary at 45%. Pills sit in a wrapping row inside the search card; there is no scroll, no horizontal overflow.

**Async surfaces.** Three states: loading (a skeleton block with a single muted pulse on `soft`, `motion-reduce:animate-none`), empty (a soft-bordered card with a short title and one short line of helper copy), error (an `error-soft` background with an `error` border mixed 35% with `border`, an inline error message, and a "Try again" button). Empty and error states sit in the same place the content would, with the same outer dimensions.

**Player.** Fixed bottom footer. The three zones are aligned to a single baseline at full width and re-stack at compact width. The scrubber is a range input with `accent-primary`. The play button uses the only persistent colored shadow. Error states replace the inline "Space / ← / → / ?" hint at the bottom of the track-info zone with the error message plus an inline "Retry" pill; loading replaces it with a small pulsing primary dot and "Connecting…". The queue toggle button shows a primary count badge when the queue is non-empty.

**Sidebar privacy callout.** A 1px-bordered `soft` card, leaf icon in a `secondary/15` disc, a 14px bold "A quiet library" line, and two lines of 12px muted copy: "Your catalogue remains on this device. Audio streams only when you press play." It disappears when the sidebar is collapsed.

**Keyboard cheatsheet.** A single modal panel listing the four shortcuts — Space (play/pause), ←/→ (seek 15s), N (next in queue), ? (this help) — plus Esc to clear search and `/` to focus the active search field. Title row, shortcut row, kbd-styled keycap. Opens centered, closes on Esc or backdrop click.

## Do's and Don'ts

**Do**

- Use rust for the one thing the user needs to do right now — play, search, the active route, the current row. Keep it single-purpose.
- Reserve Source Serif 4 for h1 and h2 only. It never appears in body, UI labels, captions, or buttons.
- Reach for the muted ink and the soft surface before reaching for a second color. The palette is two accents, not five.
- Switch the typography voice with `lang="my"` and the `.myanmar-text` class the moment Burmese characters appear. Never let Burmese fall onto Latin defaults.
- Keep list rows inside a single card with shared borders. Do not give each row its own card.
- Use `auto-fit` grids with a `280px` minimum for catalogue tiles. Avoid column-count breakpoints.
- Apply the focus ring (`color-mix` primary at 55%, 3px, 3px offset) to every interactive element on `:focus-visible`. It is the only focus style.
- Show loading, empty, and error states in the same place content would sit, using the `AsyncState` component. Never let the catalogue silently stay on the previous result.
- Honor `prefers-reduced-motion`: collapse the skeleton pulse, the button press scale, and the hover lift into instant transitions.
- Verify dark-mode contrast for every new light-mode pairing. The dark palette is a mirror, not an afterthought.
- Treat the catalogue as the hero. There is no hero moment on any route.
- When in doubt, reach for `ink-muted` and `soft` before reaching for `tertiary` brass or `secondary` olive. Brass and olive are not for general use.
- Trust the radius grammar. 10 for controls, 14 for cards, full for pills. No exceptions.

**Don't**

- Don't add a hero moment to the title page, the route header, or any section. The catalogue is the hero.
- Don't use gradients anywhere — not on text, not on buttons, not on cards, not on the player, not on backgrounds.
- Don't use glassmorphism, blur, or translucency on the sidebar, header, cards, or the player. Surfaces are opaque.
- Don't paint text, eyebrows, or section labels in rust. Rust is for action and selection only. Use weight and ink-muted for hierarchy.
- Don't add drop shadows to cards, teacher cards, collection cards, or list rows. Cards are flat. The only shadows are the player's upward lift and the primary play button's colored lift.
- Don't use a colored side stripe to indicate the active sidebar item, the current track, or any selected state. Use full-surface tint and inset ring.
- Don't introduce italics, display serifs in body, or monospace body text. Emphasis comes from weight and color, not from a second voice.
- Don't widen the radius grammar. Three radii (10px control, 14px card, full pill) — no others. No square corners, no asymmetric radii.
- Don't animate decorative motion. The only animation in the interface is the loading pulse, the hover/active state changes, and the range scrubber's filled portion.
- Don't reorder the catalogue silently to surface featured content. Featured teachers live in their own labelled section; the grid itself sorts by an intrinsic signal.
- Don't break the layout below 860px. The shell, sidebar, header, and a usable player must remain operable at the minimum supported window.
- Don't widen the CSP or introduce a second domain to the trusted media allowlist without an explicit design decision.
- Don't introduce grain, paper-fiber, or any decorative surface texture on canvas, surface, or soft. The interface is untextured.
- Don't use Source Serif 4 (or any serif) for UI labels, captions, buttons, or any role below h2. Serif is editorial weight, not UI voice.
