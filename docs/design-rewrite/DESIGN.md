---
version: alpha
name: Dhamma Echo master design proposal
description: "Content-first desktop listening library with one coherent shell, Lucide vectors and complete script-aware layouts."
colors:
  page: "#fcfaf5"
  rail: "#f0eee6"
  panel: "#ede8dd"
  ink: "#202620"
  quiet: "#5a645a"
  rule: "#d6d8ce"
  primary: "#28563c"
  selected: "#e6ede5"
  error: "#a63a2d"
  error-surface: "#f9e2de"
  page-dark: "#141c18"
  rail-dark: "#1e2721"
  panel-dark: "#27312a"
  ink-dark: "#ebeee6"
  quiet-dark: "#b8c2b6"
  rule-dark: "#3b473f"
  primary-dark: "#98c5a8"
  selected-dark: "#273c2f"
  on-primary: "#fcfaf5"
  on-primary-dark: "#141c18"
  primary-strong: "#1f4631"
  primary-strong-dark: "#bed9c6"
  error-dark: "#ef9f8f"
  error-surface-dark: "#351e1a"
typography:
  display:
    fontFamily: "Avenir Next"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.45
  heading:
    fontFamily: "Avenir Next"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "Avenir Next"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  myanmar:
    fontFamily: "Noto Sans Myanmar"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  control: "8px"
  teaching: "12px"
  transport: "22px"
spacing:
  rail: "224px"
  compact-rail: "72px"
  content-inset: "40px"
  player: "96px"
  compact-player: "132px"
components:
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.page}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  selected-navigation:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
---

## Overview

**Creative North Star: "The teaching gets the room."**

This specification applies only to the editable FigCraft proposal in this directory. It does not replace the running app’s root `DESIGN.md` or assert that the proposal has been implemented.

A familiar desktop library, not a media dashboard or a grid of marketing cards. The signature is a compact, clearly zoned full-width player beneath a content-first work area. A single sans-serif voice gives navigation, titles and metadata a shared rhythm. The existing lotus stays; functional pictograms use Lucide.

## Colors

Forest is reserved for actions, selection and playback. Warm neutral surfaces distinguish navigation, content and the current teaching. Dark mode has its own foreground and surface roles. Error color belongs only to a recoverable failure, never decorative emphasis.

**The State Is Named Rule.** Do not ask color alone to communicate selected, downloading, connecting, failed or unavailable.

## Typography

Avenir Next carries the Latin interface. Page titles use Demi Bold; secondary text uses Regular. Metadata is 12–14px, row titles 15–16px, section titles 18–23px, page titles 28–32px, and the focused teaching title 42px.

Myanmar uses Noto Sans Myanmar explicitly, with 1.8× line-height or roomier fixed leading. The Myanmar frame translates navigation, search, player, queue, elapsed time and the main content. Brand name and keyboard keycaps remain unchanged. No Myanmar letter spacing or forced glyph-shaped substitutions.

## Layout

Standard screen frames are 1280×820. Design-system boards are 1440×1040 for readable component matrices. A 224px rail and 40px content inset leave a 976px work area. The player spans the full window and reserves 96px. With the queue open, the work area is deliberately reduced to 552px; the 424px queue does not obscure underlying rows or player controls.

The explicit 860×620 adaptation uses a 72px icon rail and a two-row, 132px player. It is a designed small-window state, not a claim that the static file implements responsive reflow.

## Elevation & Depth

Flat opaque surfaces, 1px separators, no blur, gradients or decorative shadows. Tone and spacing define depth. Lists share a continuous work surface; a border is not wrapped around every recording.

## Shapes

Controls use an 8px radius and a 44px button layout. The resume surface uses a 12px radius. The primary player control is circular. Lucide uses its original 24px coordinate grid, 1.75px strokes and round caps/joins. The drawings specify target spacing; actual accessible hitboxes belong to implementation.

## Components

The master contains a **Design system** page with six visible boards and a native asset library: **38 component variants in seven sets**, **16 real instances**, and **31 variables** across Semantic colors (Light/Dark modes) and Geometry and type. See [COVERAGE.md](COVERAGE.md) for the property API, state matrix, source evidence and validation command. [tokens.json](tokens.json) and [tokens.css](tokens.css) are generated handoff exports; they are not wired into the running app.

The native Button family exposes Kind/State/Label; Search exposes State/Value; recording rows expose State/Title/Teacher. Main-component edits propagate to instances. Shared paint styles and node properties use semantic variables. Primitive comparison swatches deliberately retain fixed values so the two palettes can be compared on one board.

- **Navigation:** same routes and ordering across screens. Settings and collapse stay above the player. Selected routes have a tonal fill and colored label/icon.
- **Search:** one real input per browsing route. Other routes use a search launcher, not a duplicate input. Focus and removable active filters are explicitly drawn.
- **Recording row:** title and teacher first, play at the start and overflow at the end. Catalogue filename clutter is cleaned for display; original source titles remain in native layer metadata.
- **Player:** identity/title, transport, elapsed/duration state and secondary actions occupy separate zones. Unknown duration has no invented percentage or seek thumb. Volume remains with the operating system.
- **Queue:** contextual reflow with removal and reorder affordances; empty instructions explain the overflow-menu action. Clearing the queue leaves the current recording playing and offers Undo.
- **Settings:** visually separate appearance choices with a selected check; recognizable language/rate selectors; keyboard help is a full readable page rather than an unnecessary modal.
- **States:** connecting has a loader and Cancel; failure has retry and dismissal; unavailable WMA has a non-playable symbol, explanation and Details.

## Do's and Don'ts

- **Do** keep one master `.figcraft` file and regenerate its PNG/PDF/FIG derivatives.
- **Do** use the exact official Lucide geometry. Preserve independent SVG subpath origins when combining editable vectors.
- **Do** distinguish local catalogue failures from remote media failures.
- **Do** preserve real titles, teachers, collections and format constraints.
- **Don't** invent durations, completion percentages, portraits or biographies.
- **Don't** show a play triangle on an unavailable recording.
- **Don't** treat a static preview as proof of keyboard, screen-reader or playback behavior.
- **Don't** promote this proposal’s typography/layout into the running app without a separate implementation task.
