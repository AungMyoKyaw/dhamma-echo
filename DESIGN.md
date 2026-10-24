---
version: alpha
name: Dhamma Echo
description: "A contemporary Buddhist listening desk with warm ivory, forest green, charcoal, editorial typography, and truthful catalogue content."
colors:
  substrate: "#f5f2e9"
  page: "#fcfaf5"
  panel: "#ede8dd"
  ink: "#202620"
  ink-quiet: "#5a645a"
  rule: "#d6d8ce"
  primary: "#28563c"
  primary-strong: "#1f4631"
  on-primary: "#fcfaf5"
  marker: "#83683f"
  error: "#a63a2d"
  error-quiet: "#f9e2de"
  substrate-dark: "#141c18"
  page-dark: "#1e2721"
  panel-dark: "#27312a"
  ink-dark: "#ebeee6"
  ink-quiet-dark: "#b8c2b6"
  rule-dark: "#3b473f"
  primary-dark: "#98c5a8"
  primary-strong-dark: "#bed9c6"
  on-primary-dark: "#141c18"
  marker-dark: "#bda47d"
  error-dark: "#ef9f8f"
  error-quiet-dark: "#351e1a"
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
    fontFamily: "'Avenir Next', 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Avenir Next', 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', system-ui, sans-serif"
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

Dhamma Echo is a quiet, contemporary Buddhist **listening desk**. A warm, confident reading surface holds an extensive teaching catalogue; a small forest-green action begins or resumes the current teaching; the interface stays respectfully out of the listener's way. This redesign replaces the incumbent 19th-century herbarium referent, but keeps the valuable disciplines of careful typography, modest color, native desktop behavior, and no spectacle. The catalogue and the teacher's words are the focus—not marketing art, metrics, large graphics, pseudo-religious ornament or excessive chrome.

The selected composition is **C1 — Quiet Listening Desk** from docs/redesign/CONCEPT_DECISION.md. Home prioritizes a single Continue Listening action for returning listeners, followed by recent talks, discovery and teachers. A compact left sidebar, scannable content and persistent bottom player form one stable desktop shell. An optional queue or detail panel appears only when useful. Screens stay compact and accessible at 860×620. No duplicate window controls on macOS.

## Colors

The restrained palette is warm ivory canvas, cream surfaces, forest-green controls, bronze passive markers, and deep neutral ink. Green indicates meaningful interactive actions and current selection; bronze never competes for primary action. Dark mode is independently drawn in charcoal, warm off-white and pale sage, not an inverted sepia effect. Every token in frontmatter maps to a CSS custom property in src/index.css. Use the same semantic tokens everywhere rather than component-level copied colors. Verify 4.5:1 body text, 3:1 large text and 3:1 meaningful controls before claiming WCAG AA-level contrast.

## Typography

Major Latin titles use the bundled Source Serif 4, while navigation, buttons, labels, metadata and body use Avenir Next with readable platform sans-serif fallbacks. Burmese and mixed-script titles use explicit Myanmar font fallback, appropriate natural line-height, word-break protection and lang=my. Avoid squeezed Burmese text, tracked all-caps Burmese, forced single-line clipping, or invented glyph shapes. Maintain tight headline-to-summary grouping and purposeful whitespace between sections. Use proper duration and number formatting for selected locale.

## Layout

One desktop shell with narrow collapsible sidebar, a flexible scannable main content area and persistent audio player when active. Details and queue use contextual, on-demand surfaces; do not reserve a permanent empty third column. Maximum viewport support includes 860×620. Use intrinsic responsive grids and flex layouts driven by real content sizes. Reserve the audio player's height in main scroll padding. One global search entry leads to the canonical Explore input; it does not introduce a second search model. Browsing and audio playback remain independent.

## Elevation & Depth

Mostly opaque matte surfaces, small border separations and selective 1px hairlines. One soft player elevation may separate it from scroll content; list rows live in a shared grouped surface instead of stacked individual floating cards. Avoid glass blur, halos, deep drop-shadows, bevels, gradient stickers, oversized privacy banners and bouncing widgets. Spacing should communicate information hierarchy rather than synthetic decoration.

## Shapes

Use the frontmatter radius grammar: 8px controls, 12px cards, rounded filter pills. Keep controls 44px high/targeted where practical. The existing lotus remains recognizable. Reuse src/components/Icon.svelte for coherent symbolic actions. A focus-visible ring and text labels convey actions; color alone never conveys a state.

## Components

- Sidebar: compact route buttons, separately placed Settings and Collapse, no repeated privacy text; native window behavior stays intact.
- Page header: strong editorial title and concise explanation, no generic uppercase eyebrow line; globally accessible search.
- Home: first-run actionable welcome; returning listener sees prominent resume control and accurate position. No empty hero.
- Explore: a canonical search field, concise filters, readable rows and trustworthy availability/empty/loading/retry states. Unsupported WMA/WMV remain in the catalogue with disabled playback.
- Teacher/Collection: text-first cards, language-safe names and accurate counts; details give relevant groups and track lists.
- Player/Queue/Video: one MediaEngine, consistent progress/rate/seek/queue controls, accessible drawer, stable full-screen video and no competing audio streams.
- Library: Downloads/Favorites/History tabs remain available even if the other tabs are empty. Settings uses clear local-first preferences and a discoverable privacy explanation.

## Do's and Don'ts

**Do:** Make resume effortless; retain all working audio, queue, favorites, downloads, history and settings behavior; use actual catalogue metadata; write new UI copy in centralized English/Myanmar dictionaries; use semantic buttons and focus-visible states; test small windows and native macOS traffic lights; support both themes and system appearance; honor reduced motion; use CSS-first Tailwind 4 design tokens.

**Don't:** Invent teacher portraits, biographies, durations or recommendations; add marketing hero imagery, irrelevant cards, thick colored sidebars, new runtime dependencies, remote fonts, accounts, telemetry, gradients, glassmorphism, novelty sacred symbols, additional media services or destructive state migration; show custom macOS controls alongside native ones; restart or duplicate playback to change a theme or route.

For source and acceptance traceability see docs/redesign/REDESIGN_PRD.md and docs/redesign/ACCEPTANCE.md. The approved Q01–Q48 Evergreen Editorial refinement, semantic light/dark HEX palette, 256/224/72px sidebar contract, accessible 12px badges, and keyboard skip-navigation requirement are recorded in docs/redesign/Q01_Q48_DELIVERY.md.
