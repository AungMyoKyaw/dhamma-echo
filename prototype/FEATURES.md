# Application comparison

Inspected the production views, `src/app.ts`, `src/store.ts`, `src/persistence.ts`, `src/App.svelte`, player/queue/track components, and the running Svelte browser preview. The browser preview uses mock catalogue dependencies; this inspection does not claim a native SQLite/download test.

The earlier prototype covered six route shells, a small search/filter demo, favorites, queue count, and simulated audio transport. It omitted the workflows below. They are now represented without changing production code.

| Application capability                                       | Prototype implementation                                                   | Production source                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Teacher detail, collections, talks, teacher-filtered Explore | Navigable detail pages and contextual Back                                 | `src/views/TeacherDetailView.svelte`                         |
| Collection detail and tracks                                 | Detail page and nested Back                                                | `src/views/CollectionDetailView.svelte`                      |
| Query/language/format/category/teacher/collection filters    | Combinable sample filters and removable active chips                       | `src/views/ExploreView.svelte`, `src/app.ts`                 |
| Collection search and teacher grouping/filtering             | Sample search, teacher groups and filter                                   | `src/views/CollectionsView.svelte`                           |
| Teacher search                                               | Live sample name filtering                                                 | `src/views/TeachersView.svelte`                              |
| Progressive catalogue loading                                | Initial browse limit, Load more, shown/total count                         | `src/components/ProgressiveControls.svelte`, `src/store.ts`  |
| Downloads, Favorites, History, resume                        | Three library sections and isolated persisted sample state                 | `src/views/LibraryView.svelte`, `src/persistence.ts`         |
| Download progress/removal/errors                             | Clearly simulated progress and saved badges; no files                      | `src/components/TrackRow.svelte`, `src/app.ts`               |
| Queue play/remove/clear/undo/next                            | Working session queue; six-second undo                                     | `src/components/QueuePanel.svelte`, `src/store.ts`           |
| Video playback and fullscreen                                | Rebuilt Watch page, native local sample, inline queue, compact browse dock | `src/components/VideoPlayer.svelte`                          |
| Locale/theme/rate/browse limit/help/About                    | Working controls and local sample persistence                              | `src/views/SettingsView.svelte`, `src/i18n.ts`               |
| Keyboard shortcuts and input guards                          | Search/settings modifiers, transport, help, collapse; video F/M            | `src/App.svelte`, `src/components/KeyboardCheatsheet.svelte` |
| Loading/empty/error/retry                                    | Development preview states and recoverable media errors                    | `src/components/AsyncState.svelte`, detail/list views        |

## Intentional differences and remaining native-only work

- **Video UX is intentionally redesigned**, not copied from the production fixed split-panel overlay. Native product parity supplies the capabilities, not the rejected composition.
- The sample MP4 is 24 seconds and silent. It is an authored interface demonstration, not teacher footage or a remote talk stream. Audio playback remains simulated.
- No bundled SQLite, Tauri commands, trusted-source normalization, actual download files, native window controls, OS fullscreen bridge, or production media-engine integration is present.
- Browser local storage is isolated from production. Download badges are illustrative browser state, never evidence that a file exists.
- The sample catalogue has three teachers, six collections, and 72 illustrative records. It does not reproduce catalogue scale, teacher biographies, unavailable saved records, or every backend failure mode. The collection fixture fits within every browse limit; progressive loading is demonstrated on talks.
- Developer controls can demonstrate first launch and failures. They are not proposed production controls.
- The prototype reaches phone widths for review. Production currently guarantees a minimum 860×620 desktop window.
