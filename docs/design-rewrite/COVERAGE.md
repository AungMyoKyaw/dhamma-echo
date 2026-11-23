# Coverage audit and native design system

The single editable source is [dhamma-echo-review.figcraft](dhamma-echo-review.figcraft). It now has **54 boards on three pages**:

| Native page              | Boards | Purpose                                                                  |
| ------------------------ | -----: | ------------------------------------------------------------------------ |
| Screens — Core           |     27 | Previously reviewed screens, retained without rendered changes           |
| Screens — Missing states |     21 | Missing workflow and recovery coverage found against the app source      |
| Design system            |      6 | Foundations, native components/variants, accessibility and handoff rules |

Browse [all-page PDF](dhamma-echo-review.pdf), [design-system PDF](design-system.pdf), [system overview](design-system.png), [state PNGs](screens/states/), or [system PNGs](screens/design-system/).

## Gaps found and added

These are state studies of existing product jobs, not 21 new application routes.

| Added board                         | Evidence in the app                            | Covered behavior                                                                   |
| ----------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| 17 · Track actions menu             | `src/components/TrackRow.svelte`               | Save/remove favorite, download, enqueue; open menu and keyboard-focused item       |
| 18 · Filters expanded               | `src/views/ExploreView.svelte`, `src/types.ts` | Language, source format, teacher, collection, category and clear action            |
| 19 · Catalogue loading              | `ExploreView.svelte`, `AsyncState.svelte`      | Initial row skeletons without deleting search or disrupting playback               |
| 20 · Load more recovery             | `ProgressiveControls.svelte`                   | Existing rows retained, append failure named, retry available                      |
| 21 · Favorites empty                | `LibraryView.svelte`                           | Empty favorites without implying downloads/history are empty                       |
| 22 · History empty                  | `LibraryView.svelte`                           | No listening history; browse teachers to begin                                     |
| 23 · Downloads recovery             | `TrackRow.svelte`, `types.ts`                  | Missing local file, unverified file, failed download; no false offline-ready claim |
| 24 · Teacher recordings unavailable | `TeacherDetailView.svelte`                     | Loaded teacher context plus retryable recording-list error                         |
| 25 · Collection unavailable         | `CollectionDetailView.svelte`                  | Detail failure with retry and a retained route back                                |
| 26 · Settings light and language    | `SettingsView.svelte`                          | Light/Dark/System and English/Myanmar options; anchored open selector              |
| 27 · Paused and speed options       | `Player.svelte`, `SettingsView.svelte`         | Paused transport and six supported rates, 0.75× through 2×                         |
| 28 · Privacy and source             | `SettingsView.svelte`, README                  | Local personal state, direct media source and expanded About content               |
| 29 · Compact explore                | Minimum-window contract, `ExploreView.svelte`  | Search, selected filters, readable rows and full player at 860×620                 |
| 30 · Compact queue dark             | Minimum-window contract, `QueuePanel.svelte`   | Reflowed queue, remove controls and unobscured compact transport                   |
| 31 · Video loading                  | `VideoPlayer.svelte`                           | Loading remains until media data is ready; no fabricated poster                    |
| 32 · Video source error             | `VideoPlayer.svelte`                           | Retryable source failure distinct from paused and loading states                   |
| 33 · Teacher search empty           | `TeachersView.svelte`                          | Query retained; clear-search recovery scoped to teachers                           |
| 34 · Collection search empty        | `CollectionsView.svelte`                       | Query retained; clear-search recovery scoped to collections                        |
| 35 · Playback preferences           | `SettingsView.svelte`                          | Rate reset, initial browse-size choices (25/50/100), progressive loading context   |
| 36 · Saved references unresolved    | `LibraryView.svelte`                           | Favorites remain saved when catalogue records cannot be resolved                   |
| 37 · Teacher recordings pending     | `TeacherDetailView.svelte`                     | Index-availability state distinct from search emptiness and load failure           |

The last two were found during the final source cross-check and were added rather than silently folded into an incorrect empty/error state.

## Six system boards

1. **Foundations:** paired Light/Dark role swatches, Latin/Myanmar hierarchy, spacing scale, Lucide grid.
2. **Actions and navigation:** Primary/Secondary/Ghost × Default/Hover/Focus/Pressed/Disabled/Loading; selected and focused navigation.
3. **Inputs and filters:** search states, selected/removable chips, select geometry and focus treatment.
4. **Recording rows and feedback:** current/default/unavailable rows, named feedback states, determinate versus unknown-total download progress.
5. **Player and responsive behavior:** playing/paused/loading/failed transport, player anatomy and genuine inherited Dark-mode component instances.
6. **Accessibility and localization:** keyboard/focus contract, long Myanmar and teacher text, target/contrast/motion requirements.

## It is a native library, not just a specimen sheet

| Family     |            Native variants | Editable properties   |
| ---------- | -------------------------: | --------------------- |
| Button     |                         18 | Kind, State, Label    |
| Navigation |                          3 | State, Label          |
| Search     |                          4 | State, Value          |
| Chip       |                          3 | State, Label          |
| Recording  |                          3 | State, Title, Teacher |
| Feedback   |                          3 | State, Message        |
| Transport  |                          4 | State                 |
| **Total**  | **38 in 7 component sets** | **16 real instances** |

The added screens reuse button, recording-row and navigation components. The system page also contains inherited Dark-mode button/transport instances. Existing core layouts are intentionally retained; this is not a claim that every legacy flat layer was migrated to an instance.

To reuse: open the **Design system** page or Assets panel, create an instance, choose the component’s variant properties, and change its exposed text. Edit the main component to update its instances. A temporary-copy test changed one button background’s opacity and confirmed propagation to all seven instances of that main component.

## Tokens and modes

- **Semantic colors:** 14 color variables, each with explicit **Light** and **Dark** values.
- **Geometry and type:** 15 numeric variables and two font-family strings.
- **31 variables total**, with **4,777 native node-property bindings**, plus semantic bindings on shared paint styles.
- Typography, colors, radii and control heights are bound where appropriate. Spacing primitives are available for further composition; absolute layout coordinates are not represented as responsive constraints.
- Exports: [tokens.json](tokens.json) is FigCraft’s native variable exchange format; [tokens.css](tokens.css) is its CSS custom-property export. Dark mode uses `[data-semantic-colors="Dark"]`. These are handoff references, not imports into the running Svelte app.

A temporary-copy test changed the Light primary token and confirmed the Dark value remained unchanged. A live Dark-mode sample proves that component instances inherit their container’s mode.

## Verification

Run:

```sh
python3 docs/design-rewrite/verify-master.py
```

The dependency-free validator checks the archive, all 54 PNG dimensions, native library counts, valid component/variable references, every visible layer’s frame bounds, Lucide provenance, and inherited-mode flat-surface text contrast.

Observed results:

- 54 boards; 3,576 nodes; 57 styles; 38 main components; 7 sets; 16 instances; 31 variables.
- **0 off-frame layers**.
- **1,465 text contrast checks**; minimum **4.98:1**.
- All 27 core renders unchanged after binding.
- Native component edit and Light/Dark isolation probes pass in temporary copies.
- Native font report: Avenir Next and Noto Sans Myanmar available, 0 missing fonts on this machine.
- 54-page master PDF and six-page system PDF regenerated.

## Scope and remaining implementation work

This is a design artifact. Playback positions, queued/saved items, failures and download progress are illustrative fixtures, not personal data or claims about current source availability. The source-derived teacher in the pending example is not a claim that their actual catalogue is empty.

Repeated loading/error patterns share the documented system rather than producing every route × theme × language combination. Accounts, mobile layouts, social features, notifications, cloud sync and payments were not added because they are not product capabilities.

Keyboard behavior, screen-reader semantics, zoom, reduced motion, actual hitboxes, menus, responsive reflow and runtime token/component integration still require implementation testing. Avenir Next and Noto Sans Myanmar must be available on the reviewing machine.

The native master retains the complete library. Experimental FIG export omits plugin metadata and resolves conflicting per-variant property defaults to the first variant’s default. Native Figma import has not been verified; use the `.figcraft` master for editing.
