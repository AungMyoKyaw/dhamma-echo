# Dhamma Echo — Impeccable concept decision

**2026-10-22 · Phase P0 · Status: Chosen for implementation**

The user approved A defaults for all Q01–Q80, approved the initial recommended direction, and explicitly requested implementation. The existing screenshots and source confirm the primary opportunity is better listening-first hierarchy and content density, not new catalogue/backend functionality.

## Three distinct concepts evaluated

| Candidate                   | Core arrangement                                                                                | Resume clarity (30) | Discovery (25) | Burmese readability (20) | Accessibility (15) | Simplicity (10) |  Total |
| --------------------------- | ----------------------------------------------------------------------------------------------- | ------------------: | -------------: | -----------------------: | -----------------: | --------------: | -----: |
| C1 — Quiet Listening Desk   | Narrow library navigation + dominant continue region + scannable talk index + persistent player |                  29 |             23 |                       19 |                 14 |               9 | **94** |
| C2 — Scholarly Index        | Denser query-and-filter-first catalogue, current player pinned                                  |                  20 |             25 |                       19 |                 14 |               8 | **86** |
| C3 — Editorial Reading Room | Discovery editorial sections, teacher-led cards and secondary current-track region              |                  18 |             20 |                       18 |                 13 |               8 | **77** |

Scores are design review judgments, **not empirical listener test metrics**. C1 is chosen consistent with the approved A default and the explicit request to proceed.

## C1 region map

```text
┌─────────┬────────────────────────────────────────────────────────────────┐
│ Logo    │ Home / current page title              Search/Explore shortcut  │
│ Home    ├────────────────────────────────────────────────────────────────┤
│ Explore │ Continue Listening (when history exists)                       │
│ Collect │ Selected track, teacher, position and one prominent action      │
│ Teachers├────────────────────────────────────────────────────────────────┤
│ Library │ Recent talks / Discover / Featured Teachers                   │
│         │ Accessible compact rows and purposeful cards                  │
│         │                                                                │
│ Settings├────────────────────────────────────────────────────────────────┤
│ Collapse│ Persistent media identity / transport / progress / queue       │
└─────────┴────────────────────────────────────────────────────────────────┘
```

At 860x620, sidebar reduces and content/player adapt without another navigation model. Library tabs, video view, and queue share existing application/controller state.

## Visual world

A contemporary, contemplative listening desk: warm ivory matte surfaces, deep forest interactive accents, subtle bronze metadata, editorial serif titles with a readable sans UI, generous but purposeful internal spacing, and language-aware Burmese line-height. Dark mode mirrors the hierarchy in charcoal, pale sage and warm light type. Refine existing lotus identity. Avoid banners, gradients, ornamental temples, glass and generic metric dashboards.

## Guardrails

No UI redesign permission to modify SQLite, broaden Rust APIs, replace MediaEngine, clear localStorage, introduce dependencies or change media CSP. Compare critical surfaces at 860x620 and 1280x820 in both themes and locales with long Burmese names and active playback. See REDESIGN_PRD.md and ACCEPTANCE.md for full traceability.
