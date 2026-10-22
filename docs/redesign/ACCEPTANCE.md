# Dhamma Echo — Testable Redesign Acceptance Matrix

**Version:** 1.0 | **Date:** 2026-10-22 | **Status:** Approved acceptance requirements; verification evidence in [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md)
**Authority:** All recommended A options for Q01–Q80.
**Companion specification:** [REDESIGN_PRD.md](REDESIGN_PRD.md)

## 1. How to use this matrix

- **AC-01 through AC-80** map one-to-one to the approved decision IDs Q01 through Q80. These tests are normative for implementation readiness.
- Methods: **D** = documentation/design inspection; **U** = unit or deterministic module test; **I** = app/browser interaction/integration test; **N** = native desktop inspection; **V** = rendered visual/contrast inspection; **S** = repository security/CI/build check.
- Phase notation: **P0** concept/baseline; **P1** design system/shell; **P2** discovery; **P3** player/media; **P4** library/a11y; **P5** release prep.
- Priority: **B** blocking for release, **H** high, **M** normal. All items must receive a recorded result; B/H must be PASS to call release ready. M exceptions need a documented disposition. BLOCKED is never PASS.
- Each result record must name platform, app revision, scenario fixture, method, evidence path and owner/reviewer.
- Static regex-based Impeccable detect success alone is insufficient evidence of visual accessibility.

## 2. Product and mission — Q01–Q10

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                                                     |
| ----- | --- | ----- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Q01 | P5    | B   | S/I    | UI is redesigned on all existing routes; Rust catalog, media and persistence interfaces remain behaviorally compatible, with a reviewed diff inventory. |
| AC-02 | Q02 | P1    | B   | D/V    | All app/package/site identity still reads Dhamma Echo; refined identity remains recognizable and assets share same branding.                            |
| AC-03 | Q03 | P4    | B   | I/V    | Both Myanmar and English interface journeys work end-to-end; Myanmar text is not treated as broken/secondary content.                                   |
| AC-04 | Q04 | P2    | B   | I      | Returning Home clearly prioritizes resume and takes exactly one activation to start the latest valid resumable talk.                                    |
| AC-05 | Q05 | P0    | H   | D/V    | Design scoring evaluates usability, calmness and visual refinement; a choice cannot win purely by graphic novelty.                                      |
| AC-06 | Q06 | P5    | B   | I/S    | Existing routes, filters, queue, favorites, downloads, player, video and settings have passing regression scenarios.                                    |
| AC-07 | Q07 | P5    | B   | S/D    | New changes remain limited to visual/UX improvement; no unapproved feature module, runtime service or dependency creep.                                 |
| AC-08 | Q08 | P5    | B   | S/I    | No accounts, analytics, ads, telemetry or cloud sync introduced; private app state remains local.                                                       |
| AC-09 | Q09 | P5    | H   | N/S    | macOS UX passes native QA; available Windows/Linux CI/native smoke checks pass or report explicit blockers.                                             |
| AC-10 | Q10 | P2    | H   | I      | Guided test cases cover immediate resume and title/teacher search with clear, low-friction paths and no misleading states.                              |

## 3. Visual identity — Q11–Q24

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                                  |
| ----- | --- | ----- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| AC-11 | Q11 | P0/P1 | B   | D/V    | Selected visual referent is contemporary Buddhist listening library, not the old alpine herbarium; DESIGN.md and UI agree.           |
| AC-12 | Q12 | P0/P1 | H   | V      | Chosen comps and shipped UI use quiet/warm composition and restrained hierarchy in light/dark without ornament competing with talks. |
| AC-13 | Q13 | P1    | H   | V      | Branding carries spiritual neutrality; teacher content stays factual; no UI requires a user's religious affiliation.                 |
| AC-14 | Q14 | P1    | H   | V/S    | Lotus remains recognizable in vector, app icons and website; no broken raster dimensions, names or package identifiers.              |
| AC-15 | Q15 | P1    | H   | V/S    | Any Buddhist reference is abstract/subtle; no stock religious imagery, fabricated teacher portrait or new remote asset fetch.        |
| AC-16 | Q16 | P1    | H   | D/V    | Approved ivory/forest/bronze palette is consistently tokenized; primary actionable green and passive bronze are distinguished.       |
| AC-17 | Q17 | P1    | B   | V      | All core routes have measured accessible warm light surfaces and readable hierarchy; no bright white flash in transitions.           |
| AC-18 | Q18 | P1    | B   | V/I    | All core routes have deliberate charcoal/olive dark palette; manual Dark and System-follow both render correctly.                    |
| AC-19 | Q19 | P1    | H   | V      | Editorial serif appears on major Latin headings; UI/body labels remain readable sans; no remote font load.                           |
| AC-20 | Q20 | P4    | B   | I/V    | Burmese titles, teacher names and mixed scripts wrap/shape without broken clusters or vertical clipping across all routes.           |
| AC-21 | Q21 | P1    | M   | D/V    | Shared components use intentional 8px controls/12px cards/pills, with documented justified exceptions only.                          |
| AC-22 | Q22 | P1/P2 | H   | V      | At 860 and 1440 widths, pages are readable without dense clutter or excessive unused space hiding useful content.                    |
| AC-23 | Q23 | P1    | M   | V      | Surfaces remain predominantly flat, with restrained borders/elevation; no unapproved glassmorphism or heavy shadows.                 |
| AC-24 | Q24 | P4    | H   | I/V    | Motion communicates action without decorative continuous animation; reduced-motion removes nonessential motion.                      |

## 4. Window, navigation, context — Q25–Q35

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                                  |
| ----- | --- | ----- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| AC-25 | Q25 | P1    | H   | V/I    | Shell has navigation/content plus optional contextual area without persistent unused right rail or another navigation model.         |
| AC-26 | Q26 | P1    | H   | I      | Left sidebar exists, can collapse/expand via pointer and shortcut, and active destinations remain accessible in both states.         |
| AC-27 | Q27 | P1    | H   | V/I    | Sidebar width adapts/collapses at 860x620, 1024x768, 1280x820 and wider without clipping app content.                                |
| AC-28 | Q28 | P1/P4 | M   | V/I    | Verbose privacy callout no longer occupies everyday sidebar space; privacy is findable in Settings/About.                            |
| AC-29 | Q29 | P1    | B   | N      | macOS window renders native traffic lights and correct drag area in both appearances and at minimum width.                           |
| AC-30 | Q30 | P1    | B   | N      | At no supported platform is there a duplicated set of native and custom close/minimize/maximize controls.                            |
| AC-31 | Q31 | P1    | H   | I      | Home/Explore/Collections/Teachers/My Library plus separated Settings are accessible, correctly highlighted and localized.            |
| AC-32 | Q32 | P1/P2 | B   | I      | One global search entry and Cmd/Ctrl+F navigate/focus the canonical Explore query field, without independent competing search state. |
| AC-33 | Q33 | P2    | H   | I      | Teacher/collection detail back behavior and normal route return preserve relevant filter, query and browse context.                  |
| AC-34 | Q34 | P1    | B   | N/V    | Entire app operates at 860x620 with no body horizontal scrolling, clipped essential controls, or inaccessible player/drawer.         |
| AC-35 | Q35 | P3    | H   | N/I    | Standard fullscreen works correctly; no forced alternate fullscreen-only navigation paradigm.                                        |

## 5. Home and catalogue discovery — Q36–Q50

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                              |
| ----- | --- | ----- | --- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| AC-36 | Q36 | P2    | B   | I/V    | Returning Home order is Continue Listening → Recent → Discover → Teachers with a clear current-talk action.                      |
| AC-37 | Q37 | P2    | H   | I/V    | First-run Home has an actionable Explore and Teachers invitation, no oversized empty hero or mandatory onboarding.               |
| AC-38 | Q38 | P2    | B   | I      | Continue Listening displays accurate title/teacher/progress and starts stored talk at valid saved position after metadata.       |
| AC-39 | Q39 | P2    | H   | U/I    | Featured teachers/content come only from curated IDs and real catalogue data; no fabricated title/teacher recommendations.       |
| AC-40 | Q40 | P2    | B   | I      | Canonical Explore query can search title/teacher and refine within existing allowed catalogue fields.                            |
| AC-41 | Q41 | P2    | B   | U/I    | Query entry debounces appropriately and communicates pending/ready/error; clear/submit never displays stale results as new ones. |
| AC-42 | Q42 | P2    | H   | I/V    | Essential filters visible and advanced filters expandable; selected values survive expand/collapse.                              |
| AC-43 | Q43 | P2    | H   | V/I    | Category labels/counts are legible, accessible and fit compact viewport without overlapping/indefinite horizontal overflow.      |
| AC-44 | Q44 | P2    | H   | V      | Results use readable, consistent scan-friendly rows, not oversized image-heavy cards.                                            |
| AC-45 | Q45 | P2    | B   | U/I    | Track metadata, duration, format, playback availability and counts never display inferred or invented values.                    |
| AC-46 | Q46 | P2    | H   | U/D    | Sorting added only if supported by reliable metadata and verified stable ordering; otherwise documented as not exposed.          |
| AC-47 | Q47 | P2    | H   | I      | Zero results shows clear explanation and recovery/reset; data failure offers retry and preserves meaningful state.               |
| AC-48 | Q48 | P2    | H   | I/V    | Teachers are searchable; cards preserve accurate teacher names and counts with robust Burmese wrapping.                          |
| AC-49 | Q49 | P2    | H   | I      | Teacher Detail organizes verified metadata, collections and talks with working play/back navigation.                             |
| AC-50 | Q50 | P2    | H   | I      | Collections are semantically grouped, browsable and ordered with working detail/track navigation.                                |

## 6. Library, audio, queue, video — Q51–Q61

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                                        |
| ----- | --- | ----- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-51 | Q51 | P4    | B   | I      | Downloads/Favorites/History are usable, labeled keyboard-accessible tabs; History remains available with zero downloads/favorites.         |
| AC-52 | Q52 | P4    | B   | I      | Favorite toggles in one activation, updates visible state immediately and persists across app restart.                                     |
| AC-53 | Q53 | P3/P4 | M   | S/I    | Existing queue and favorites are retained; no unapproved playlist subsystem introduced.                                                    |
| AC-54 | Q54 | P4    | B   | I/S    | Download status/removal and saved file path behavior remain compatible; missing file is not falsely shown available offline.               |
| AC-55 | Q55 | P3    | B   | I/V    | Active audio has persistent bottom player while browsing; no content overlap and no phantom player when idle.                              |
| AC-56 | Q56 | P3    | H   | I      | Focused listening presentation shares active track/time/queue/player instance with compact player.                                         |
| AC-57 | Q57 | P3    | B   | I      | Play/pause, ±15s, seek, speed and queue function via keyboard/pointer at all supported sizes; secondary actions progressively disclosed.   |
| AC-58 | Q58 | P3    | B   | U/I    | Progress slider and elapsed/total time update correctly; no duration is claimed until metadata; stored resume applied only after metadata. |
| AC-59 | Q59 | P3    | H   | I/V    | Queue drawer stays on-screen, keyboard navigable, labels/removal/clear/undo work and focus returns on close.                               |
| AC-60 | Q60 | P3    | B   | N/I    | MP4 opens dedicated video presentation and fullscreen; active audio footer and video cannot stream concurrently.                           |
| AC-61 | Q61 | P2/P3 | B   | U/I    | WMA/WMV stay searchable and clearly unavailable; disabled Play never attempts unsupported media.                                           |

## 7. Language, accessibility and feedback — Q62–Q70

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                           |
| ----- | --- | ----- | --- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| AC-62 | Q62 | P4    | B   | I/V    | All routes, dialogs, player, queue, errors and help are readable and correctly localized in English and Myanmar.              |
| AC-63 | Q63 | P4    | H   | U/I    | Saved locale is applied on restart; default fallback is deterministic and remains valid if no saved locale exists.            |
| AC-64 | Q64 | P4    | B   | U/N    | Unicode Burmese graphemes remain intact under truncation/wrapping, with correct locale formatting on native macOS WKWebView.  |
| AC-65 | Q65 | P4    | H   | D/I    | Centralized terminology glossary/check ensures respectful consistent Buddhist names and controls, no misleading translations. |
| AC-66 | Q66 | P4    | B   | V/I    | Rendered WCAG AA-level text/nontext contrast measured; semantic keyboard/focus/screen-reader checks cover critical journeys.  |
| AC-67 | Q67 | P4    | H   | I      | Existing shortcuts remain documented and operational, respecting editable inputs and correct macOS/Windows modifier.          |
| AC-68 | Q68 | P4    | B   | I/V    | Every control has visible focus, logical tab order and meaningful focus return after modal/popover close.                     |
| AC-69 | Q69 | P4    | H   | I/V    | prefers-reduced-motion disables optional transitions/animations; no critical content depends on animation.                    |
| AC-70 | Q70 | P2/P4 | B   | I      | All route families have localized, meaningful loading/empty/error/retry behavior; no stale old results disguised as current.  |

## 8. System, development and release — Q71–Q80

| ID    | Q   | Phase | Pri | Method | Testable acceptance                                                                                                                               |
| ----- | --- | ----- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-71 | Q71 | P1    | B   | D/S    | Updated DESIGN.md and CSS-first Tailwind @theme tokens form a coherent documented single visual system; existing design validation passes.        |
| AC-72 | Q72 | P5    | B   | S      | No new production component library/runtime dependency; existing Icon and Bun lock policies are preserved.                                        |
| AC-73 | Q73 | P5    | B   | S/U    | Typed Tauri commands, read-only SQL, CSP/media URL allowlist and MediaEngine behavior remain unchanged or compatibly proven.                      |
| AC-74 | Q74 | P4    | B   | U/I    | v1/v2 persisted fixtures preserve favorites, history, resume, settings, sidebar preference and downloads across redesign.                         |
| AC-75 | Q75 | P5    | H   | D/S    | Phase evidence shows research → concepts → documented selection → implementation → bounded Impeccable critique → verification.                    |
| AC-76 | Q76 | P0    | B   | D/V    | Three materially different composition comps are evaluated against same realistic bilingual fixtures; a reasoned selection is recorded before P1. |
| AC-77 | Q77 | P5    | B   | S/D    | Each implementation phase has an explicit verified exit; no code merged/released as complete without its applicable gate.                         |
| AC-78 | Q78 | P5    | B   | S/N/V  | Existing automated tests and focused visual/keyboard/localization checks pass; actual native UI checked rather than screenshots alone.            |
| AC-79 | Q79 | P5    | H   | S/V    | Product site and all public screenshots agree with final app and pass site test/smoke, updated only after product approval.                       |
| AC-80 | Q80 | P5    | B   | S/N    | Release-ready build artifacts, version/changelog and packaging evidence exist; no public push/store submission without explicit approval.         |

## 9. Critical scripted regression journeys

These are separate end-to-end proofs; satisfying the one-to-one AC table does not waive any required relevant journey.

| Test                   | Fixture/setup                             | Procedure                                                          | Pass evidence                                                                       |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| JR-01 Resume           | Saved MP3 offset > 0, previous history    | Open app, Home resume, wait for media metadata, navigate away/back | Correct track, valid remembered position, same uninterrupted playback               |
| JR-02 First run        | Empty local saved library                 | Launch, Home, choose Explore or Teachers                           | Clear CTA, no crash and no irrelevant resume block                                  |
| JR-03 Search           | Known EN and MY titles/teachers           | Global search via Cmd+F / Ctrl+F, type, filter, clear              | Correct query ownership, clear/fast results, no stale mix, no unintended focus loss |
| JR-04 Collections      | Teacher with ordered collection           | Search, open detail, select track, return                          | Correct title/group/order and context restoration                                   |
| JR-05 Offline download | Valid downloaded MP3                      | Use Library/Downloads, play without network, remove                | Accurate local file state, no deletion beyond selected action                       |
| JR-06 Missing download | Storage points to absent local file       | Open Library, attempt play                                         | Accurate unavailable/fallback state, recoverable UI                                 |
| JR-07 Unsupported      | WMA and WMV entries                       | Find by search and inspect actions                                 | Records visible, correctly labeled, cannot attempt unsupported play                 |
| JR-08 Queue            | Multiple queued talks                     | Open queue, remove item, clear, undo, close                        | Correct order and undo with focus restored                                          |
| JR-09 Video            | Valid remote MP4 fixture                  | Play video, fullscreen, seek/pause, Esc close                      | Correct video and no concurrent hidden audio                                        |
| JR-10 Network failure  | Allowed media host unavailable            | Start compatible media, trigger error and retry                    | Localized error, no infinite loading, effective retry                               |
| JR-11 Persistence      | Existing v1 and v2 fixture snapshots      | Boot, change theme/rate/favorite, restart                          | All previous data and new preference survive, no silent data loss                   |
| JR-12 Bilingual        | Mixed-script long names                   | Switch locale, inspect all views and player                        | No clipped clusters/missing labels; accurate counts/durations                       |
| JR-13 Window           | 860x620, 1024x768, 1280x820, wide         | Resize with active player and open queue                           | No clipped controls, duplicate chrome, horizontal page overflow                     |
| JR-14 Keyboard         | Keyboard only, screen reader run          | Browse routes/tabs, search, play, queue, help, dialogs             | Focus visible, correct announcements, no traps, shortcut respect                    |
| JR-15 Theme/motion     | Light/dark/system and OS reduced motion   | Switch modes, theme change while playing                           | Correct palette, measured contrast, stable playback, motion honored                 |
| JR-16 Security         | Host, protocol and HTML-negative fixtures | Attempt invalid media URLs and untrusted content                   | Safe refusal, no remote font/telemetry, no unsafe HTML                              |

## 10. Test data and measurement rules

Required data fixtures: first run; populated library; recent with resumable offset; ended talk; empty and large queue; MP3, MP4, WMA, WMV; unknown metadata; missing downloaded file; invalid URL; failed host; no known duration; long Myanmar grapheme clusters; mixed Myanmar-English and Latin teacher names; both locales; light/dark/system; reduced motion.

Visual captures must include viewport (860x620, 1024x768, 1280x820, 1440x900, 1728x1117 where available), locale and theme in filename/metadata, with first-run/returning, active player, open queue, video and representative error state. Use reproducible fixed fixtures rather than user's private state for evidence.

Contrast: normal text >=4.5:1, large text >=3:1, meaningful non-text UI indicators >=3:1 where applicable. Color alone cannot convey selected/unsupported states. Time slider must support keyboard and assistive labels. Test real rendering, not just token hex pairs. Any performance target is baseline-relative; collect P0 baselines before setting thresholds rather than fabricating latency measurements.

## 11. Build and release gates

Project scripts currently include these exact checks:

```bash
bun run format:check
bun run verify:web
bun run site:verify
bun run verify
```

The verify:web command executes policy, lint, typecheck, core TS 100% line/branch/function coverage, design lint/check/assets, web build/smoke and icon checks. Full verify includes formatting, site, Bun audit and Rust Clippy/tests/release build. Do not claim 100% Svelte UI visual coverage because core TypeScript coverage reaches 100%.

Impeccable should read project context once per session, assess the selected design playbook, and inspect actual browser/native UI. Source-only detection of .svelte/.css is insufficient. Final QA is bounded: one combined multi-state defect capture, one consolidated correction pass and at most one confirmation pass; then report evidence.

**Go/no-go:** AC-01–AC-80 dispositions complete; all blocking and high acceptance PASS; any normal-priority exceptions explicitly documented; regression JR-01–JR-16 pass or environment-blocked tests prominently disclosed; build/site/native evidence attached; no private data or external host changes. Public releases require an additional explicit publish action.

## 12. Result log template

| ID    | Phase | Platform   | Fixture  | Status (PASS/FAIL/BLOCKED) | Evidence path or command | Reviewer |
| ----- | ----- | ---------- | -------- | -------------------------- | ------------------------ | -------- |
| AC-01 | P5    | macOS / CI | Baseline | NOT RUN                    | —                        | —        |

No tests are claimed as executed by creating this planning document.
