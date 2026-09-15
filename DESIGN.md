---
version: alpha
name: Dhamma Echo
description: A quiet desktop listening room for Dhamma talks — the discipline of a 19th-century alpine herbarium, opened to a pressed specimen in late afternoon light, with lichen-green as the only interactive accent.
colors:
  substrate: "#ece6d4"
  page: "#f4efde"
  panel: "#e3dcc4"
  ink: "#1f2024"
  ink-quiet: "#5a5b55"
  rule: "#cbc5b0"
  primary: "#3f6b3a"
  primary-strong: "#2c4d28"
  on-primary: "#f4efde"
  marker: "#7a5a1e"
  error: "#8d3a2c"
  error-quiet: "#efd6cc"
  substrate-dark: "#16180f"
  page-dark: "#1d1f15"
  panel-dark: "#252820"
  ink-dark: "#e6e3d3"
  ink-quiet-dark: "#9e9d8a"
  rule-dark: "#3a3b32"
  primary-dark: "#7fa572"
  primary-strong-dark: "#a4c69b"
  on-primary-dark: "#16180f"
  marker-dark: "#9c7d4d"
  error-dark: "#d68b7a"
  error-quiet-dark: "#2d1813"
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
  label:
    fontFamily: "Inter, 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.04em"
rounded:
  control: 8px
  card: 12px
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
  button-quiet:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink-quiet}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink-quiet}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input-field:
    backgroundColor: "{colors.substrate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card-surface:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.card}"
  card-muted:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.card}"
  card-flat:
    backgroundColor: "transparent"
    rounded: "{rounded.card}"
  pill-filter:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-quiet}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  pill-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  pill-warning:
    backgroundColor: "{colors.error-quiet}"
    textColor: "{colors.error}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  track-row-current:
    backgroundColor: "color-mix(in srgb, {colors.primary} 6%, transparent)"
    rounded: "{rounded.control}"
  player-play:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  player-surface:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.card}"
  error-card:
    backgroundColor: "{colors.error-quiet}"
    textColor: "{colors.error}"
    rounded: "{rounded.card}"
    padding: "16px"
  sidebar-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
  border-hairline:
    backgroundColor: "{colors.rule}"
    rounded: "{rounded.control}"
  hover-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
  hover-primary-dark:
    backgroundColor: "{colors.primary-strong-dark}"
    textColor: "{colors.on-primary-dark}"
    rounded: "{rounded.control}"
  icon-tile:
    backgroundColor: "color-mix(in srgb, {colors.marker} 15%, transparent)"
    textColor: "{colors.marker}"
    rounded: "{rounded.control}"
  dark-substrate:
    backgroundColor: "{colors.substrate-dark}"
    textColor: "{colors.ink-dark}"
  dark-page:
    backgroundColor: "{colors.page-dark}"
    textColor: "{colors.ink-dark}"
  dark-panel:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.ink-quiet-dark}"
  dark-rule:
    backgroundColor: "{colors.rule-dark}"
    textColor: "{colors.ink-dark}"
  dark-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
  dark-marker:
    backgroundColor: "{colors.marker-dark}"
    textColor: "{colors.substrate-dark}"
  dark-error:
    backgroundColor: "{colors.error-dark}"
    textColor: "{colors.error-quiet-dark}"
---

## Overview

The interface reads like the page of a 19th-century alpine herbarium opened to a pressed specimen in late afternoon light: aged paper ground, a single lichen-green specimen mount, a small bronze label, generous margin, and the discipline of a study done carefully. There is no hero moment on any route — the catalogue is the specimen, and the chrome recedes so the catalogue can be studied. Color is reserved for one job at a time; warmth comes from the substrate, not from accents. Two voices carry the interface: a sturdy book serif for the page and section titles, and a humanist sans for everything else, including Burmese. The reference is a real object, and the constraints it carries — no gradients, no glow, no glass, no neon, no italic, no pill-shaped primary buttons — arrive with the reference and are not listed separately.

**Platform.** The product is a macOS desktop application delivered through the Tauri 2 webview (WKWebView), with Windows and Linux installers built from the same webview code. macOS is the design target: traffic-light window chrome, the macOS focus ring, native trackpad scroll momentum, `Cmd` as the application modifier, and a system-appearance option that mirrors `prefers-color-scheme`. Windows and Linux follow the same tokens but adopt their platform's modifier key (Ctrl) and window-drag conventions automatically — never both at once.

## Colors

The palette is a quiet study palette with one accent, one quiet marker, and one error signal. Every color earns its name from the herbarium reference.

**Substrate and surfaces**

- **substrate** (`#ece6d4`) is the aged paper ground the application lives on. Slightly cooler and quieter than fresh oat — it has been in a drawer. It paints the page background, inputs, and the empty regions of cards. It never paints a button, a strong text color, or a card surface.
- **page** (`#f4efde`) is the slightly lifted specimen sheet — a hair brighter than the substrate, so cards and list wrappers read as paper laid on paper. It is reserved for grouped content; surfaces are not stacked on surfaces.
- **panel** (`#e3dcc4`) is the secondary paper — the muted wash used for non-current sidebar callouts, mute filter pills, skeleton placeholders, and the panel behind the privacy reassurance. It is the only "muted selection" surface.

**Ink**

- **ink** (`#1f2024`) is the primary text. Deep and slightly cool, the color of iron-gall ink on aged paper. Never pure black. Never used to paint a surface.
- **ink-quiet** (`#5a5b55`) carries supporting text — captions, teacher names under titles, helper copy, secondary button labels. It must never be the only carrier of meaning; weight and size carry the hierarchy with it.
- **rule** (`#cbc5b0`) is the only border tone. 1px hairlines. There is no second border color and no decorative outline anywhere.

**Accent**

- **primary** (`#3f6b3a`) is lichen green — the single interactive accent. It paints the sidebar's active route, the play button, the current track row's tint and inset ring, and primary submit buttons. It never paints a passive surface, never paints text on substrate or page, never appears as decoration (no underlines, no eyebrows, no glows, no gradients, no tinted badges). It is the only color that wears a shadow.
- **primary-strong** (`#2c4d28`) is the hover/active state of primary. Use only on `:hover` and `:active` of a primary surface, never as a standalone token.
- **on-primary** (`#f4efde`) is the ink that sits on primary surfaces. It is the substrate-tinted off-white — never pure white. Use only on top of `primary` or `primary-strong`.

**Marker**

- **marker** (`#7a5a1e`) is the bronze of an old specimen pin / handwritten label. It appears at low opacity on collection detail icon containers and the rare ornamental moment where a quiet warm neutral is needed without the lichen accent. The marker is not a second brand color and never drives interaction. Featured teachers are conveyed by ordering — they lead every list — not by chrome.

**Error**

- **error** (`#8d3a2c`) and **error-quiet** (`#efd6cc`) are the only failure colors — faded madder red, the traditional manuscript correction-ink red. Error copy in the player, error states on async surfaces, and the inline "Retry" pill all use them. Error never shares a surface with the marker bronze; the user needs to read the difference at a glance.

**Dark mode** mirrors the same roles onto a deep lichen-night ground (`#16180f`). The substrate lifts slightly to `#1d1f15` for the page surface and `#252820` for the panel. Ink lifts to `#e6e3d3`, ink-quiet to `#9e9d8a`, rule to `#3a3b32`. Primary lifts to `#7fa572` and primary-strong to `#a4c69b` — the brighter lichen reads as the same plant under different light. Marker lifts to `#9c7d4d` and error to `#d68b7a`. The marker is desaturated relative to its light-mode hue so it still reads as a bronze label under lamplight rather than gilding into gold — the hue is the same, the chroma is the difference. Roles do not change — only the values do.

## Typography

Two voices carry the interface. There is no third.

**Required fonts.** The downstream app rewrite must bundle or load these; this file assumes they are present.

- **Source Serif 4** — display and headings only. Reads here as a sturdy scientific-journal serif (the Linnean Society, the alpine botanical monograph), not as Penguin paperback editorial.
- **Inter** — body, h3, UI labels, captions, and English headings below h2.
- **Noto Sans Myanmar**, **Myanmar Text**, **Pyidaungsu** — Burmese mirrors. Expected to be installed on the device; the body does not reflow noticeably when they engage.

**Stack.** Display and headings use `'Source Serif 4', 'Source Serif Pro', Georgia, serif`. Everything else uses `Inter, 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', system-ui, sans-serif`. The system stack is fallback, not a second voice.

**Roles.** Four text roles carry the interface.

- **display** (h1 — page title) — Source Serif 4 at 600 weight, tight tracking (`-0.01em`), balanced wrap. Default 30px; drops to 28px below the 1040px breakpoint. One per route, lives in the Header component.
- **heading** (h2 — section title) — Source Serif 4 at 600 weight, default 24px. "Continue listening," "Featured teachers," the live catalogue heading. Never used inline.
- **body** (default reading text, h3, UI labels) — Inter 14px / 400. h3 escalates to 18px / 600 for track titles and teacher names on detail pages.
- **label** (small caps metadata, eyebrows, badge text) — Inter 12px / 600, tracking `0.04em`. Used for specimen-style eyebrows and quiet status text. The only place letter-spacing widens beyond the heading tight tracking. Caps never appear in Burmese — the class suppresses them via `text-transform: none` when `lang="my"`.

**Myanmar treatment.** Whenever content contains Burmese characters (the regex `[\u1000-\u109F]` in `src/ui.ts`), the text gets `lang="my"` and a `.myanmar-text` class that increases line-height to 1.8, prevents intra-word breaks (`word-break: keep-all`, `overflow-wrap: normal`), applies `line-break: auto`, and balances the wrap. This is not decoration; Burmese typography breaks badly under Latin defaults. The class is the only place that touches `line-break`, `overflow-wrap`, or `word-break`. Caps are suppressed inside the same class because all-caps Burmese reads as shouty without conveying hierarchy.

**What does not exist.**

- No italics anywhere — emphasis comes from weight, color, and size, not slant.
- No serif in body, UI, labels, captions, or buttons. The display serif appears only in h1 and h2.
- No monospace body.
- No all-caps body. The `tabular-nums` Tailwind utility appears only on player timestamps and talk counts (so columns of numbers align); it is never a typographic style choice.
- Headings and long titles use `text-wrap: balance` so they do not break on a single awkward word.

**Focus.** All interactive elements show a 3px outline at `color-mix(in srgb, var(--color-app-primary) 55%, transparent)` with a 3px offset on `:focus-visible`. There is no other focus style.

## Layout

The shell is a three-region desktop layout: a fixed left sidebar, a centered main column, and a fixed bottom audio player that floats over the main column.

**Sidebar.** 256px wide at full width, 224px between 1040px and 1180px, and 72px when the user collapses it. It holds the wordmark at the top, six primary routes as full-height buttons, and at the bottom a quiet privacy callout followed by the Collapse control. The collapse button is a textual "Collapse" / icon-only state; the icon-only collapsed state shows tooltips on hover. The sidebar scrolls internally with `scrollbar-gutter: stable` and `overscroll-contain` so scrolling inside it never bleeds into the page.

**Main column.** Bounded at `max-w-[1520px]` and centered. Below the 1040px breakpoint the outer padding drops from 40px to 24px and the header padding tightens. The Header sits inside this column with the route title and a one-line description; the view content sits below it with 32px of vertical breathing room.

**Window chrome.** The Tauri window is opaque on every platform — no vibrancy, no transparency, no hidden-inset title bar. The substrate (`#ece6d4` light, `#16180f` dark) extends edge to edge. A fixed drag strip sits at the top of the webview (`TitleBar.svelte`); its height is `--titlebar-height` (36px on every platform). A 1px hairline border (`rule`) sits at the bottom of the strip so the chrome-to-content boundary is visible even when the strip itself is invisible on macOS. Double-clicking the strip toggles maximize; the user drags the strip (and on every platform also the sidebar's wordmark area) to move the window via `dragWindow` action that calls `startDragging()` on the native window bridge.

On **macOS** the Tauri window keeps `titleBarStyle: "Overlay"` and `hiddenTitle: true` so the native traffic lights sit at the macOS default (top-left, ~12px inset, vertically centered on the 36px row). The strip's interior is the substrate colour and matches the substrate below the hairline; the hairline is the only visible distinction on macOS. The sidebar adds a 36px top padding so the wordmark sits 8px below the bottom of the traffic-light row.

On **Windows and Linux** native decorations are stripped at runtime (see `setup` in `lib.rs`) so the webview owns the entire frame. The drag strip is the substrate colour and renders three custom buttons on the right edge: minimize, toggle-maximize, close. Minimize is a single horizontal stroke; maximize is an empty square; restore (shown when the window is maximized) is two overlapping squares. Close is the existing `close` glyph. Inactive buttons use `text-ink-quiet` on the substrate and hover to a `bg-panel` wash and `text-ink`; close hovers to `bg-error-quiet` and `text-error` to telegraph destructive intent. Buttons are 36px round controls and inherit the global focus ring. The window polls `isMaximized()` every 100ms while the strip is mounted so the maximize / restore icon stays in sync with the window state.

The sidebar and the main column both consume `--titlebar-height` as their top padding so the wordmark and the route header always start below the strip on every platform. The minimum window 860×620 is enforced via Tauri's window constraints and is the same on every platform.

**Audio player.** Fixed to the bottom, anchored to the right edge of the sidebar (`left-(--sidebar-offset)`). 84px tall at full width, exactly 132px when the columns collapse below 1040px. Three zones at full width — track info, transport + scrubber, speed + queue — reorganize into two shell rows at compact width: track title (or error actions) shares the first row with speed + queue; transport spans the full second row and owns a 44px controls row above its scrubber. Compact mode hides the teacher line and reduces the keyboard hint to one plain line so content cannot expand the footer beyond 132px. On error, the title yields to a truncated error message plus Retry and Dismiss controls; both remain visible at the 860px minimum. The player sits on `page` with a single 1px top border and a single soft drop shadow; it is the only persistent elevation.

**Video player.** When the current track is a video, the main column swaps to a 16:9 stage on the left and a track-detail panel on the right, with fullscreen escaping into the webview's native fullscreen. The stage always preserves aspect ratio.

**Density.** Catalogue pages use `auto-fit` grids with a `280px` minimum, so teacher cards and collection cards flow from one to many columns without breakpoints. List pages render rows inside a single bordered card with no inner padding between rows; the card itself holds the border. There is no "card per row" pattern — rows inside a card, cards only for grouped or featured content.

**Minimum window.** 860×620. The shell, sidebar collapse, header, and a usable player are guaranteed to remain visible and operable at that size. Below it the app does not attempt to render; above it, nothing in the layout changes until the next breakpoint.

**Breakpoints.** Two breakpoints matter: 1040px (header padding, sidebar width, player height, control sizing) and 1180px (player column ratios and gaps). Anything more granular is handled by `auto-fit` grids, not by media queries.

## Elevation & Depth

The product is almost flat. Depth is used in two places, and only those two.

**The audio player** has a soft upward shadow (`0 -4px 12px rgb(31 32 36 / 0.08)`) so it reads as floating above the catalogue. This is the only persistent elevation.

**The primary play button** has a small colored shadow at 25% primary alpha that lifts it 4px; on hover it lifts to 6px at 30%. The shadow is the same hue as the button — it reads as the button pushing toward you, not as a generic drop shadow. No other button has a shadow.

**Flat everywhere else.** Cards, list rows, the sidebar, modals, dropdowns, the keyboard cheatsheet, the queue panel — all flat. They may have a 1px hairline; they do not have a shadow. The current track row uses no shadow either: current state is shown by a full-surface tint (`color-mix(in srgb, primary 6%, transparent)`) and an inset 1px ring (`color-mix(in srgb, primary 22%, transparent)`). Depth is replaced by saturation. The cheatsheet opens as an inset surface within the shell, not as a floating panel.

## Shapes

A small, disciplined radius grammar. Three radii, no exceptions.

- **control** (8px) — inputs, navigation buttons in the sidebar, primary buttons, the playback rate select. Anything the user clicks or types into.
- **card** (12px) — group surfaces: teacher cards, collection cards, the catalogue list wrapper, the track-row card on Home, the privacy callout. Cards hold groups, not single items.
- **pill** (full round) — filters, badges, the "Video" / "WMA unavailable" chips on rows, the playback speed pill, the inline "Retry" pill, the "Connecting…" indicator, the queue-count dot on the player button.

The grammar is enforced: never use `card` on a control, never use `control` on a card. Pills are for status and selection chips, not for buttons that drive primary actions. The primary play button is a pill, but that is a special case — it is both a status indicator ("play" vs "pause") and a control.

There is no square corner anywhere. There are no squircles, no asymmetric radii. The one structural exception is a stage flush-joined to a sibling panel below it — the video player renders its top corners with `rounded-t-card` and `border-b-0` because the bottom edge is owned by the controls panel directly underneath. The two surfaces compose into one continuous shape; treating them as one composite surface is more honest than rounding all four corners and then covering two of them.

## Components

**App icon and sidebar wordmark.** The lotus-and-sound-wave mark is a flat botanical glyph on the `page` specimen sheet: petals and upper wave in `primary` / `primary-strong`, lower wave in `marker`, and a 1px `rule` outline around the tile. It is not an illustration and never carries a gradient, glow, texture, or drop shadow. The macOS Dock master uses the same flat geometry inside the platform's optical safe area; Windows and Linux icon sizes are deterministic resizes of that master. The sidebar wordmark pairs the 44px mark with the sans product name and quiet tagline — the wordmark itself never uses the display serif.

**Sidebar navigation item.** 48px tall (`h-12`, also `min-h-12`). Icon on the left, label on the right when expanded; icon-only and centered when collapsed. Inactive: `text-ink-quiet` on the substrate surface, hovers to a `bg-panel` wash and `text-ink`. Active: `bg-primary text-on-primary`. Active state uses a full-surface tint, never a colored side stripe or shadow.

**Track row.** Two-column grid — clickable title block on the left, action cluster on the right. Inside a card, rows are separated by 1px borders (`border-b border-b-rule last:border-b-0`), with 12px vertical padding and 16px horizontal padding. The play disc is a 44px circle that gains primary color and a small lift on hover; on the current row it sits on `primary` permanently. Action buttons are 44px round icon buttons (favorite, download, enqueue) plus a small text "Queue" pill. The current row is the only row that gets an inset ring + tint; other rows are flush with the card.

**Teacher card.** Three-column grid — avatar (48px), name and count, optional chevron. 112px minimum height, full card padding (16px). Hover lifts the border to `primary/45` and the background to `panel/40%` — no shadow.

**Search field.** 48px tall, full-width inside its row, with a 20px leading icon and an inline clear button (40px round) when the field has content. The field itself uses the substrate color (so it sits a half-step below the page surface around it) with a 1px border. On focus the border becomes primary; the outline shows on top.

**Filter pill.** 40px tall, padded horizontally, fully rounded. Inactive: `bg-panel text-ink-quiet`. Active: `bg-primary text-on-primary`. Hover on inactive darkens the border toward primary at 45%. Pills sit in a wrapping row inside the search card; there is no scroll, no horizontal overflow.

**Async surfaces.** Three states: loading (a skeleton block with a single muted pulse on `panel`, `motion-reduce:animate-none`), empty (a panel-bordered card with a short title and one short line of helper copy), error (an `error-quiet` background with an `error` border mixed 35% with `rule`, an inline error message, and a "Try again" button). Empty and error states sit in the same place the content would, with the same outer dimensions.

**Player.** Fixed bottom footer. The three zones are aligned to a single baseline at full width and re-stack at compact width. The scrubber is a range input with `accent-primary`. The play button uses the only persistent colored shadow. Error states replace the inline "Space / ← / → / ?" hint at the bottom of the track-info zone with the error message plus an inline "Retry" pill; loading replaces it with a small pulsing primary dot and "Connecting…". The queue toggle button shows a primary count badge when the queue is non-empty.

**Sidebar privacy callout.** A 1px-bordered `panel` card, leaf icon in a `primary/12` disc, a 14px bold "A quiet library" line, and two lines of 12px quiet copy: "Your catalogue remains on this device. Audio streams only when you press play." It disappears when the sidebar is collapsed.

**Keyboard cheatsheet.** A single modal panel listing the shortcuts — Space (play/pause), ←/→ (seek 15s), N (next in queue), ? (this help), Esc (clear search / close dialog), `/` and `Cmd+F` (focus the active search field), `Cmd+,` (open Settings — the macOS-native preference shortcut). Application shortcuts use `Cmd` on macOS; the same shortcut bindings map to `Ctrl` on Windows and Linux automatically. Title row, shortcut row, kbd-styled keycap showing the platform-correct modifier (`⌘` on macOS, `Ctrl` elsewhere). Opens centered, closes on Esc or backdrop click.

## Do's and Don'ts

**Do**

- Use lichen green for the one thing the user needs to do right now — play, search, the active route, the current row. Keep it single-purpose.
- Reserve Source Serif 4 for h1 and h2 only. It never appears in body, UI labels, captions, or buttons.
- Reach for the quiet ink and the panel surface before reaching for a second color. The palette is one accent, one marker, one error — not five.
- Use the marker bronze only for specimen-style eyebrows and quiet status badges. It is not a second brand color and never drives interaction.
- Switch the typography voice with `lang="my"` and the `.myanmar-text` class the moment Burmese characters appear. Never let Burmese fall onto Latin defaults. Suppress all-caps inside the same class.
- Keep list rows inside a single card with shared hairlines. Do not give each row its own card.
- Use `auto-fit` grids with a `280px` minimum for catalogue tiles. Avoid column-count breakpoints.
- Apply the focus ring (`color-mix` primary at 55%, 3px, 3px offset) to every interactive element on `:focus-visible`. It is the only focus style.
- Show loading, empty, and error states in the same place content would sit, using the `AsyncState` component. Never let the catalogue silently stay on the previous result.
- Honor `prefers-reduced-motion`: collapse the skeleton pulse, the button press scale, and the hover lift into instant transitions.
- Verify dark-mode contrast for every new light-mode pairing. The dark palette is a mirror, not an afterthought.
- Treat the catalogue as the hero. There is no hero moment on any route.
- Trust the radius grammar. 8 for controls, 12 for cards, full for pills. No exceptions.
- Reach for `panel` and `ink-quiet` before reaching for the marker. The marker is ornamental; it does not carry meaning.
- Use `Cmd` as the macOS modifier for app-level shortcuts (search, settings, quit). Map the same shortcut to `Ctrl` on Windows and Linux. Single keys (`Space`, `←`/`→`, `N`, `?`, `Esc`, `/`) stay unbound to any modifier on every platform.
- Honor the macOS system appearance when the user has chosen `system` theme by listening to `prefers-color-scheme`. When the user has chosen `light` or `dark` explicitly, follow that choice and ignore the system signal.
- Keep the Tauri window opaque. Do not enable vibrancy or window transparency. The overlay title bar is the deliberate macOS exception: it exposes the same opaque webview substrate beneath the native traffic lights so the herbarium paper is continuous from chrome to chrome. On Windows and Linux native decorations are stripped and the substrate owns the frame; the custom chrome lives in the top drag strip.
- Respect native macOS behavior where it is already correct: trackpad scroll momentum, text selection inside the catalogue, the standard context menu, the standard close/minimize/maximize controls. Override only when the platform default fails an accessibility or design constraint, and document the override.

**Don't**

- Don't add a hero moment to the title page, the route header, or any section. The catalogue is the hero.
- Don't use gradients anywhere — not on text, not on buttons, not on cards, not on the player, not on backgrounds.
- Don't use glassmorphism, blur, or translucency on the sidebar, header, cards, or the player. Surfaces are opaque.
- Don't paint text, eyebrows, or section labels in lichen green. Green is for action and selection only. Use weight and `ink-quiet` for hierarchy.
- Don't add drop shadows to cards, teacher cards, collection cards, or list rows. Cards are flat. The only shadows are the player's upward lift and the primary play button's colored lift.
- Don't use a colored side stripe to indicate the active sidebar item, the current track, or any selected state. Use full-surface tint and inset ring.
- Don't introduce italics, display serifs in body, or monospace body text. Emphasis comes from weight and color, not from a second voice.
- Don't widen the radius grammar. Three radii (8px control, 12px card, full pill) — no others. No square corners, no asymmetric radii.
- Don't animate decorative motion. The only animation in the interface is the loading pulse, the hover/active state changes, and the range scrubber's filled portion.
- Don't reorder the catalogue silently to surface featured content. Featured teachers live in their own labelled section; the grid itself sorts by an intrinsic signal.
- Don't break the layout below 860px. The shell, sidebar, header, and a usable player must remain operable at the minimum supported window.
- Don't widen the CSP or introduce a second domain to the trusted media allowlist without an explicit design decision.
- Don't introduce grain, paper-fiber, or any decorative surface texture on substrate, page, or panel. The herbarium pages are smooth paper, not parchment.
- Don't use Source Serif 4 (or any serif) for UI labels, captions, buttons, or any role below h2. Serif is editorial weight, not UI voice.
- Don't use the marker bronze for state, for errors, or for interactive accents. The marker is quiet ornament only.
- Don't bind app-level shortcuts to `Ctrl` on macOS. macOS users expect `Cmd`. The shortcut handler maps the same binding to `Ctrl` on Windows and Linux automatically — never show both at once.
- Don't enable window vibrancy or transparency. The overlay title bar is allowed on macOS because it keeps the native traffic lights while exposing the same opaque substrate; on Windows and Linux the window is frameless and the substrate owns the frame.
- Don't override the macOS system context menu or the standard text-selection color without a documented reason. Selection inside the catalogue should read on the substrate without becoming a design statement.
- Don't hide or move the macOS traffic lights. They live where macOS puts them. Custom window controls live only on Windows and Linux, where there is no native chrome.
- Don't let the sidebar wordmark collide with the chrome strip. The top padding derived from `--titlebar-height` is mandatory.
- Don't use Ctrl-click as a custom binding for the right-click affordance on macOS. Two-finger trackpad tap and `Ctrl`+click both produce a context event natively — let the platform handle it.
