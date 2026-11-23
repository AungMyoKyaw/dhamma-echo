# Dhamma Echo — master visual rebuild

## Open this file

**Editable master: [dhamma-echo-review.figcraft](dhamma-echo-review.figcraft).** It is the only `.figcraft` source in the repository. The original 27 boards were rebuilt with `figcraft-cli run`. The coverage extension adds 21 missing-state boards and six native design-system boards: **54 boards across three pages**, in this same master.

- [PDF review deck](dhamma-echo-review.pdf)
- [PNG screens](screens/) and [added states](screens/states/)
- [Native system coverage](COVERAGE.md), [system PDF](design-system.pdf) and [system overview](design-system.png)
- [Contact sheet 1](contact-sheet-1.png), [2](contact-sheet-2.png), [3](contact-sheet-3.png), [4](contact-sheet-4.png)
- [Home preview](preview.png)
- [Design specification](DESIGN.md) and [direction contract](BRIEF.md)

The matching `.fig` is an experimental interchange export, not a second master. Historical `detailed`, `rethought` and `ui` exports are not current design authority.

## What changed

A content-first desktop library replaces the green-card-heavy composition. Avenir Next carries the Latin hierarchy; Noto Sans Myanmar has explicit script-aware leading. Navigation, action spacing, rows, search, player and state treatments now share one grammar.

All functional icons are official **Lucide** paths. The unchanged core retains its 504 editable vector instances across 36 icon types; the state and system extension uses the same library. They use a 24px grid and 1.75px round strokes. The existing lotus silhouette from `public/logo.svg` is retained as identity, not repurposed as a control. Attribution is in [LUCIDE-LICENSE.txt](LUCIDE-LICENSE.txt).

The full-width player separates metadata, transport, elapsed/duration state, favorite, rate, queue and expand. Volume is left to the operating system. Queue states reduce the work area's width instead of covering rows. No artificial seek percentage or thumb is shown when duration is unknown.

## Screen-by-screen visual review

Every incumbent frame was opened at readable size before the rebuild, and each rebuilt export was inspected after correction. This table records the original 27-board rebuild. Every added state/system board was also opened at readable size; its source evidence, coverage and verification are recorded in [COVERAGE.md](COVERAGE.md).

| Frame                         | Incumbent problem                                                                        | Rebuilt result                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Home · playing                | Oversized green resume card, nested position panel, scattered controls                   | Compact neutral teaching surface, one Open player action, separate saved-position context, cleaner recent rows             |
| Explore · results             | Duplicate search fields, repeated metadata/actions, crowded bottom row                   | One canonical input, clear media filters, 4 readable rows and reserved player space                                        |
| Teachers · directory          | Large generic cards and monogram tiles competed with names                               | Text-first two-column directory, consistent chevrons, room for long names                                                  |
| Library · history             | Undifferentiated row stack and ambiguous clear action                                    | Date grouping, stable tabs, explicit clear-history trash action                                                            |
| Settings · dark               | Appearance was a text string masquerading as a control                                   | Three distinct choices, selected Dark check, real selector affordances, selected Settings route                            |
| Queue · dark                  | Panel obscured content, count did not match visible queue                                | Reflowed 552px work area, 3 visible items matching the count, remove/reorder controls, player unobstructed                 |
| Focused listening · playing   | Fake artwork and progress with unknown duration; weak transport contrast                 | Teaching title leads, original mark is secondary, no invented progress, clear central pause and labeled 15-second controls |
| Library · empty               | Isolated study omitted the real desktop shell                                            | Same navigation and tabs as populated Library, one specific explanation and Explore action                                 |
| Search · error and no results | Mutually exclusive states mixed together; connection advice contradicted local catalogue | Single local-catalogue failure state, preserved query, retry and restart guidance; no-results remains in screen 03         |
| Identity · lotus and wordmark | Incomplete relationship between identity and interface icons                             | Existing lotus in two treatments, coherent editable Lucide icon inventory and typography                                   |
| Compact · 860 × 620           | Unicode navigation and weak player organization                                          | Real Lucide rail, all 5 destinations, readable resume/recent content and two-row 132px player                              |
| 01 · First launch             | Repeated discovery cards and oversized blank hero                                        | Direct Explore/Browse teachers entry, visible keyboard focus and concise local-first explanation; no idle player           |
| 02 · Explore filters          | Selected filters looked like ordinary controls                                           | Explicit active/removable filters, canonical focused search, clear reset action and readable result rows                   |
| 03 · Search no results        | Artificial query and weak recovery hierarchy                                             | Preserved search/filter context, plainly named empty state, one clear recovery action                                      |
| 04 · Teacher detail           | Large avatar/header container duplicated the next action                                 | Teacher name leads, a useful collection row, directly accessible teaching list and clear back navigation                   |
| 05 · Collections directory    | Every collection floated in its own card                                                 | Continuous text-first list, original collection/teacher names, consistent open affordances                                 |
| 06 · Collection detail        | Header used too much height and lacked an obvious starting action                        | Long title wraps intentionally, original ordering remains, explicit Play from beginning action                             |
| 07 · Library downloads        | Download state competed with unrelated row actions                                       | Consistent status column, fixture progress line and a single Cancel icon on the active download                            |
| 08 · Favorites                | Saved rows did not visually look selected                                                | Filled Lucide hearts distinguish saved status; other row and tab rules match Library                                       |
| 09 · Playback loading         | Play icon suggested readiness while connecting                                           | Loader transport, named connecting state, Cancel and preserved browsing area                                               |
| 10 · Playback error           | Failed playback looked almost like paused playback                                       | Named failure, source-oriented explanation, retry/dismiss and distinct failed-player state                                 |
| 11 · Queue empty              | Drawer covered the underlying list                                                       | Reflowed content, stable player, explicit Add to queue instructions and an Explore action                                  |
| 12 · Video player             | Weak control hierarchy and invented preview treatment                                    | Truthful paused 16:9 viewport, separated metadata/queue, clear playback/rate/fullscreen controls, no fake video still      |
| 13 · Keyboard shortcuts       | Unnecessary modal interrupted Settings                                                   | Readable full page, consistent keycaps, back action and typing-suppression note                                            |
| 14 · Myanmar home             | English shell/player around translated content                                           | Myanmar navigation, search, controls, metadata, numerals, queue label and duration state; protected script leading         |
| 15 · Queue cleared undo       | Undo lacked consequence context                                                          | Queue-cleared toast explicitly says the current teaching keeps playing; visible Undo inside the panel                      |
| 16 · Unavailable recording    | Unsupported recording still offered a play triangle                                      | Non-playable Lucide symbol, format explanation, Details and a separate compatible recording                                |

## Impeccable finish pass

An independent subagent tool was unavailable; the finish-reviewer and documenter roles were performed in-thread.

- **Disposition: ship — static design artifact only.**
- **Persistence:** one editable master; scoped product record, direction contract, token-bearing design specification and sidecar.
- **Fidelity:** all 27 named core boards retained with unchanged renders; 21 evidence-backed state boards and six native system boards added; original lotus, catalogue content and platform constraints preserved. The user requested a fresh visual rethink, not fidelity to the discarded composition.
- **Type / material / ground:** coherent Avenir Next + script-aware Myanmar; editable vectors and matte surfaces; explicit light/dark semantic colors. No fabricated artwork or physical texture.
- **Material fixes resolved:** SVG subpath origins, incorrect catalogue-network guidance, search placeholder state, overlapping download actions, saved-heart state, missing Settings selection, ambiguous active-track Resume, and the collection start action.
- **Keep:** content hierarchy, consistent Lucide geometry, context-safe queue, and truthful duration/format states.

## Verification

- `figcraft-cli info`: **54 boards, 3,576 nodes, 57 styles, 31 variables, 0 raster images**.
- Native library: **38 main-component variants, 7 sets, 16 instances**, exposed text/variant properties, and two variable collections.
- `figcraft-cli export`: **54** PNGs exported; 54-page master PDF, six-page system PDF and experimental FIG refreshed.
- Original-core comparison: all **27** rendered images unchanged after variable binding and library extraction.
- Temporary-copy probes: main-component opacity changes propagate to all seven instances of the tested button; Light-token changes leave the Dark token unchanged.
- Parsed source: **0 off-frame layers**, all functional icons have Lucide provenance, original X geometry preserved, and no play affordance on the unavailable WMA row.
- **1,465 inherited-mode text color/background checks** passed; the minimum measured ratio was **4.98:1**. This checks source colors on flat drawn backgrounds, not an application-wide accessibility certification.
- `file.fontReport`: Avenir Next and Noto Sans Myanmar available; **0 missing fonts**.
- Native archive integrity: `unzip -t` passes. PDF contains **54 pages**. Experimental FIG export omits plugin metadata and uses the first variant’s default when variant property defaults differ. Native Figma import is not verified.
- The Impeccable mechanical detector could not scan the native binary (it reported ENOENT despite the file being present). Its empty JSON is not a passing scan; native CLI, parsed-source validation and individual PNG inspection are the evidence for this artifact.

Catalogue titles are cleaned for display; original filename-style titles remain in native layer metadata. Positions, history, favorites, queue and the 45% download are illustrative fixtures, not personal data. No catalogue duration is invented.

Static drawings do not validate functional playback, hover behavior, focus traversal, screen readers, responsive implementation or native Figma import. The FIG exporter omits plugin metadata; use the native master to retain provenance. The application source and root design-token contract were intentionally left unchanged.
