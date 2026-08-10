# Full Audio Catalogue Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bundled SQLite catalogue with the supplied full database and add audio category, collection, and teacher-detail discovery without hiding playable rows that lack metadata.

**Architecture:** Keep Rust and read-only SQLite as the catalogue trust boundary, expose narrowly typed Tauri commands, and mirror those contracts in a deterministic TypeScript state machine. Add Collections and detail routes while reusing the existing track rendering and secure player; crawler tables and non-audio media stay inaccessible.

**Tech Stack:** Rust 2024, rusqlite, Tauri 2, strict TypeScript, Node test runner, Tailwind CSS 4, SQLite, Git LFS.

---

## File Structure

- `src-tauri/resources/dhamma.db`: exact byte-for-byte copy of the supplied source catalogue.
- `src-tauri/src/models.rs`: Rust request/response contracts for categories, collections, teachers, and audio pages.
- `src-tauri/src/db.rs`: validation, parameterized catalogue queries, row normalization, and database integration tests.
- `src-tauri/src/commands.rs`: narrow Tauri command adapters over `Database`.
- `src-tauri/src/lib.rs`: command registration only.
- `src/types.ts`: TypeScript mirror of Rust contracts and application state.
- `src/api.ts`: typed command client.
- `src/store.ts`: deterministic navigation, filtering, list, and detail state transitions.
- `src/app.ts`: asynchronous category, collection, teacher-detail, and search orchestration.
- `src/view.ts`: pure HTML rendering for filters, collection lists, and detail views.
- `src/main.ts`: delegated DOM event/form wiring.
- `src/mock-data.ts`: browser-preview responses for every new command.
- `tests/test-data.mjs`: shared category, collection, teacher-detail, and incomplete-track fixtures.
- `tests/api.test.mjs`, `tests/store.test.mjs`, `tests/app.test.mjs`, `tests/view.test.mjs`, `tests/mock-data.test.mjs`: focused frontend behavior tests.
- `README.md`, `docs/architecture/data-flow.md`, `docs/index.html`, `tests/site.test.mjs`: current product behavior and database totals.

### Task 1: Replace and verify the bundled database

**Files:**

- Modify: `src-tauri/resources/dhamma.db`

- [ ] **Step 1: Record the source facts before copying**

Run:

```bash
sqlite3 /Users/aungmyokyaw/projects/life/dhammadownload-db/dhamma.db "PRAGMA integrity_check; PRAGMA foreign_key_check; SELECT COUNT(*) FROM media WHERE type='audio'; SELECT COUNT(*) FROM teachers; SELECT COUNT(DISTINCT c.id) FROM collections c JOIN media_collections mc ON mc.collection_id=c.id JOIN media m ON m.id=mc.media_id WHERE m.type='audio';"
shasum -a 256 /Users/aungmyokyaw/projects/life/dhammadownload-db/dhamma.db
```

Expected: `ok`, no foreign-key rows, then `30563`, `257`, `429`, and source SHA-256 `c9570e8605ac70d376079267a68cd7a402f22dc863f62ff4f67456a16a236df9`.

- [ ] **Step 2: Copy the exact database authorized by the user**

Run:

```bash
cp /Users/aungmyokyaw/projects/life/dhammadownload-db/dhamma.db src-tauri/resources/dhamma.db
```

- [ ] **Step 3: Verify byte identity and required tables**

Run:

```bash
shasum -a 256 /Users/aungmyokyaw/projects/life/dhammadownload-db/dhamma.db src-tauri/resources/dhamma.db
sqlite3 src-tauri/resources/dhamma.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Expected: identical hashes; tables include `categories`, `collections`, `media`, `media_collections`, and `teachers` as well as crawler/provenance tables.

- [ ] **Step 4: Commit the catalogue replacement**

```bash
git add src-tauri/resources/dhamma.db
git commit -m "data: restore full Dhamma catalogue"
```

### Task 2: Define and test the Rust catalogue contracts

**Files:**

- Modify: `src-tauri/src/models.rs`
- Modify: `src-tauri/src/db.rs`

- [ ] **Step 1: Write failing fixture tests for category and collection behavior**

Extend the in-memory fixture in `src-tauri/src/db.rs` with `categories`, `collections`, and `media_collections`. Add tests that require:

```rust
#[test]
fn lists_only_meaningful_audio_categories() {
    let categories = fixture().audio_categories().expect("categories");
    assert_eq!(categories.iter().map(|item| item.id).collect::<Vec<_>>(), vec![1, 4, 5, 7]);
}

#[test]
fn collection_tracks_use_track_number_then_media_id() {
    let detail = fixture().collection(10).expect("collection");
    assert_eq!(detail.tracks.iter().map(|track| track.id).collect::<Vec<_>>(), vec![2, 1, 4]);
}

#[test]
fn playable_rows_survive_incomplete_metadata() {
    let track = fixture().audio_track(4).expect("incomplete playable track");
    assert_eq!(track.title, "Untitled talk");
    assert_eq!(track.teacher_name, "Unknown teacher");
    assert!(track.playable);
}
```

- [ ] **Step 2: Run the focused Rust tests and verify RED**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml lists_only_meaningful_audio_categories collection_tracks_use_track_number_then_media_id playable_rows_survive_incomplete_metadata
```

Expected: compilation fails because the category/collection methods and contracts do not exist.

- [ ] **Step 3: Add exact Rust contracts**

Add these serde camelCase structures to `src-tauri/src/models.rs`:

```rust
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AudioCategory {
    pub id: i64,
    pub name: String,
    pub language: String,
    pub audio_count: i64,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CollectionSearchRequest {
    #[serde(default)]
    pub query: String,
    pub teacher_id: Option<i64>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CollectionSummary {
    pub id: i64,
    pub name: String,
    pub teacher_id: Option<i64>,
    pub teacher_name: String,
    pub audio_count: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CollectionSearchPage {
    pub items: Vec<CollectionSummary>,
    pub total: i64,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CollectionDetail {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub teacher_id: Option<i64>,
    pub teacher_name: String,
    pub audio_count: i64,
    pub tracks: Vec<AudioTrack>,
}
```

Extend `AudioSearchRequest` with `category_id: Option<i64>` and `collection_id: Option<i64>`. Extend `TeacherDetail` with `collections: Vec<CollectionSummary>`; teacher talks stay paginated through `search_audio` rather than embedding an unbounded list.

- [ ] **Step 4: Implement normalized fallback mapping**

In `src-tauri/src/db.rs`, make `map_audio_track` accept nullable/blank titles and teacher names:

```rust
fn normalized_or(value: Option<String>, fallback: &str) -> String {
    optional_normalized(value).unwrap_or_else(|| fallback.to_string())
}

fn map_audio_track(row: &Row<'_>) -> rusqlite::Result<AudioTrack> {
    let url: String = row.get(4)?;
    let format = normalize_text(&row.get::<_, String>(2)?).to_lowercase();
    Ok(AudioTrack {
        id: row.get(0)?,
        title: normalized_or(row.get(1)?, "Untitled talk"),
        format: format.clone(),
        language: normalize_text(&row.get::<_, String>(3)?).to_lowercase(),
        playable: is_webview_playable(&format, &url),
        url,
        date_recorded: optional_normalized(row.get(5)?),
        location: optional_normalized(row.get(6)?),
        teacher_id: row.get(7)?,
        teacher_name: normalized_or(row.get(8)?, "Unknown teacher"),
    })
}
```

Change every track SELECT to return nullable title/teacher columns without requiring an inner join.

- [ ] **Step 5: Implement category and collection queries**

Add `audio_categories`, `search_collections`, and `collection` methods. Category eligibility must use `c.type IN ('audio', 'abhidhamma')`, join only `m.type = 'audio'`, and use `HAVING COUNT(m.id) > 0`. Collection listing must count only audio memberships and distinguish duplicate IDs. Collection detail must select tracks with:

```sql
ORDER BY mc.track_number IS NULL,
         mc.track_number,
         m.id
```

Use `validate_id`, `validate_limit`, and `offset.max(0)` consistently. Return `AppError::NotFound` for a missing collection.

- [ ] **Step 6: Extend audio filtering with EXISTS clauses**

When `category_id` is present, add `m.category_id = ?`. When `collection_id` is present, add:

```sql
EXISTS (
  SELECT 1 FROM media_collections filter_mc
  WHERE filter_mc.media_id = m.id AND filter_mc.collection_id = ?
)
```

Validate both IDs before building SQL. Preserve `m.type = 'audio'` in every count and page query.

- [ ] **Step 7: Run Rust tests and verify GREEN**

Run:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Expected: all Rust tests pass.

- [ ] **Step 8: Commit the Rust data layer**

```bash
git add src-tauri/src/models.rs src-tauri/src/db.rs
git commit -m "feat: query audio categories and collections"
```

### Task 3: Expose the new database operations through Tauri

**Files:**

- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add command-level compile expectations**

Import the new models and write adapters with these exact signatures in `commands.rs`:

```rust
#[tauri::command]
pub fn list_audio_categories(database: State<'_, Database>) -> Result<Vec<AudioCategory>, CommandError>;

#[tauri::command]
pub fn search_collections(database: State<'_, Database>, request: CollectionSearchRequest) -> Result<CollectionSearchPage, CommandError>;

#[tauri::command]
pub fn get_collection(database: State<'_, Database>, id: i64) -> Result<CollectionDetail, CommandError>;
```

- [ ] **Step 2: Run `cargo check` and verify RED**

Run `cargo check --manifest-path src-tauri/Cargo.toml`.

Expected: the declaration-only functions fail to compile.

- [ ] **Step 3: Implement adapters and register commands**

Each adapter delegates once to the matching `Database` method and maps `CommandError::from`. Import and add all three names to `tauri::generate_handler!` in `src-tauri/src/lib.rs`.

- [ ] **Step 4: Verify and commit**

Run:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml --all-features
git add src-tauri/src/commands.rs src-tauri/src/lib.rs
git commit -m "feat: expose audio discovery commands"
```

Expected: checks pass and the commit contains only command-boundary changes.

### Task 4: Mirror the new contracts in TypeScript

**Files:**

- Modify: `src/types.ts`
- Modify: `src/api.ts`
- Modify: `tests/api.test.mjs`
- Modify: `tests/test-data.mjs`

- [ ] **Step 1: Write failing API contract tests**

Add tests asserting exact calls:

```javascript
await api.listAudioCategories();
await api.searchCollections({ query: "disc", teacherId: 3, limit: 24, offset: 0 });
await api.getCollection(10);

assert.deepEqual(calls, [
  ["list_audio_categories", undefined],
  ["search_collections", { request: { query: "disc", teacherId: 3, limit: 24, offset: 0 } }],
  ["get_collection", { id: 10 }]
]);
```

- [ ] **Step 2: Run the API test and verify RED**

Run `npm run build:web && node --test tests/api.test.mjs`.

Expected: methods do not exist.

- [ ] **Step 3: Add exact TypeScript interfaces**

Mirror every Task 2 Rust structure in `src/types.ts`. Change `Route` to include `"collections"`, `"collection-detail"`, and `"teacher-detail"`. Add `categoryId` and `collectionId` to `AudioSearchRequest` and `SearchState`.

- [ ] **Step 4: Add API methods**

Add to `CatalogueApi`:

```typescript
listAudioCategories(): Promise<AudioCategory[]> {
  return this.call("list_audio_categories");
}

searchCollections(request: CollectionSearchRequest): Promise<CollectionSearchPage> {
  return this.call("search_collections", { request });
}

getCollection(id: number): Promise<CollectionDetail> {
  return this.call("get_collection", { id });
}

getTeacher(id: number): Promise<TeacherDetail> {
  return this.call("get_teacher", { id });
}
```

- [ ] **Step 5: Add shared fixtures and verify GREEN**

Add one eligible category, two same-named collections with different IDs/teachers, one collection detail with numbered/un-numbered tracks, and one playable incomplete-metadata track to `tests/test-data.mjs`.

Run `npm run build:web && node --test tests/api.test.mjs`.

Expected: all API tests pass.

- [ ] **Step 6: Commit the frontend contracts**

```bash
git add src/types.ts src/api.ts tests/api.test.mjs tests/test-data.mjs
git commit -m "feat: add audio discovery client contracts"
```

### Task 5: Add deterministic discovery state

**Files:**

- Modify: `src/store.ts`
- Modify: `tests/store.test.mjs`

- [ ] **Step 1: Write failing reducer tests**

Cover these independent behaviors:

```javascript
state = reduce(state, { type: "set-category", categoryId: 4 });
assert.equal(state.search.categoryId, 4);
assert.equal(state.search.offset, 0);

state = reduce(state, { type: "open-collection", collectionId: 10, returnRoute: "collections" });
assert.equal(state.route, "collection-detail");
assert.deepEqual(state.navigationContext, { returnRoute: "collections" });

state = reduce(state, { type: "open-teacher", teacherId: 3, returnRoute: "teachers" });
assert.equal(state.route, "teacher-detail");
assert.equal(state.selectedTeacherId, 3);
```

Also test collection/category clearing, collection pagination, loading/error/not-found states, and returning without resetting list queries.

- [ ] **Step 2: Run store tests and verify RED**

Run `npm run build:web && node --test tests/store.test.mjs`.

Expected: new actions and fields are absent.

- [ ] **Step 3: Implement focused state slices**

Add loadable category data, a collection search request/page, selected collection detail, selected teacher detail, and `{ returnRoute: Route }` navigation context. Use separate offsets for Explore, Collections, and teacher-detail talks. Filter changes reset only their own list offset.

Keep `resetOffset` from silently discarding visible category/collection filters. Explicit clear actions remove only the named filter.

- [ ] **Step 4: Verify GREEN and commit**

Run:

```bash
npm run build:web
node --test tests/store.test.mjs
git add src/store.ts tests/store.test.mjs
git commit -m "feat: model audio discovery state"
```

Expected: store tests pass.

### Task 6: Orchestrate categories, collections, and details

**Files:**

- Modify: `src/app.ts`
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: Write failing controller tests**

Test that `start()` loads categories alongside existing startup data, `search()` forwards both new filter IDs, collection search forwards its independent request, opening a teacher loads detail plus the first talk page, and opening a collection loads detail. Test each failure path independently.

- [ ] **Step 2: Run app tests and verify RED**

Run `npm run build:web && node --test tests/app.test.mjs`.

Expected: the new dependency methods and controller methods are absent.

- [ ] **Step 3: Extend `CatalogueClient` and controller methods**

Add typed client members for all Task 4 methods. Add `loadCategories`, `searchCollections`, `openCollection`, `openTeacher`, `retryCollection`, and `retryTeacher`. Build requests exclusively from current state after dispatching start actions.

Update `findTrack` to search the current catalogue page, collection-detail tracks, teacher talk page, current player, and queue so collection/teacher actions reuse the secure player.

- [ ] **Step 4: Verify GREEN and commit**

Run:

```bash
npm run build:web
node --test tests/app.test.mjs
git add src/app.ts tests/app.test.mjs
git commit -m "feat: orchestrate audio discovery flows"
```

Expected: app tests pass.

### Task 7: Render the full audio discovery UI

**Files:**

- Modify: `src/view.ts`
- Modify: `tests/view.test.mjs`

- [ ] **Step 1: Write failing view tests**

Add focused assertions for:

- Collections appears in primary navigation and has correct `aria-current` behavior.
- Explore renders only eligible category choices and removable category/collection/teacher chips.
- Duplicate collection names show distinct teacher context.
- Collection detail renders tracks in supplied order and reuses play/favorite/queue actions.
- Teacher detail renders collections and paginated talks.
- A playable incomplete record displays `Untitled talk` and `Unknown teacher` with an enabled Play button.
- Loading, empty, error, retry, and not-found states exist for both detail routes.

- [ ] **Step 2: Run view tests and verify RED**

Run `npm run build:web && node --test tests/view.test.mjs`.

Expected: Collections navigation and detail markup are missing.

- [ ] **Step 3: Add discovery renderers**

Add `collections` to the sidebar and header labels. Implement small pure render helpers: `renderCategoryFilters`, `renderFilterChips`, `renderCollectionCard`, `renderCollections`, `renderCollectionDetail`, and `renderTeacherDetail`.

Reuse `renderTrack` for every audio row. Do not condition track-row rendering on teacher, collection, category, date, description, or location. Disable Play only when `track.playable` is false.

- [ ] **Step 4: Preserve responsive layout**

Update existing responsive CSS class strings so filter controls wrap below desktop widths and collection/teacher grids collapse without horizontal document overflow. Keep player controls and sidebar behavior unchanged.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```bash
npm run build:web
node --test tests/view.test.mjs
git add src/view.ts tests/view.test.mjs
git commit -m "feat: render audio collections and detail views"
```

Expected: view tests pass.

### Task 8: Wire browser events and deterministic mock data

**Files:**

- Modify: `src/main.ts`
- Modify: `src/mock-data.ts`
- Modify: `tests/mock-data.test.mjs`
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: Write failing mock and interaction-boundary tests**

Assert that mock invoke supports `list_audio_categories`, `search_collections`, `get_collection`, and `get_teacher`; unknown IDs reject with the existing typed error shape. Assert incomplete playable fixture records remain returned.

- [ ] **Step 2: Run focused tests and verify RED**

Run `npm run build:web && node --test tests/mock-data.test.mjs tests/app.test.mjs`.

Expected: mock commands are unsupported.

- [ ] **Step 3: Implement mock responses and delegated actions**

Wire `open-collection`, `open-teacher`, `back-to-list`, `filter-category`, `filter-collection`, all clear-filter actions, collection pagination, teacher-talk pagination, and retry actions in `src/main.ts`. Extend `isRoute` with `collections`; detail routes must be entered only through validated IDs, not raw navigation buttons.

Add a `collection-search` form branch alongside existing search forms. Parse IDs through `parseId` and never cast arbitrary form strings to numeric IDs.

- [ ] **Step 4: Verify GREEN and commit**

Run:

```bash
npm run build:web
node --test tests/mock-data.test.mjs tests/app.test.mjs
git add src/main.ts src/mock-data.ts tests/mock-data.test.mjs tests/app.test.mjs
git commit -m "feat: wire audio discovery interactions"
```

Expected: focused tests pass.

### Task 9: Lock the real database regression and current documentation

**Files:**

- Modify: `src-tauri/src/db.rs`
- Modify: `src/mock-data.ts`
- Modify: `tests/app.test.mjs`
- Modify: `tests/view.test.mjs`
- Modify: `README.md`
- Modify: `docs/index.html`
- Modify: `docs/architecture/data-flow.md`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Change real-data expectations and verify RED**

Update `bundled_database_exposes_current_catalogue` to require 30,563 audio rows, 257 teachers, four eligible audio categories, and 429 audio collections. Assert the first collection detail contains only audio tracks and a category-filtered search never returns non-audio rows.

Run `cargo test --manifest-path src-tauri/Cargo.toml bundled_database_exposes_current_catalogue`.

Expected: failure until all counts and queries align with the copied database.

- [ ] **Step 2: Update current public copy and fixtures**

Change current teacher totals from 267 to 257. Describe Collections, category discovery, teacher detail, incomplete-metadata fallback, and the continued audio-only boundary. Update the data-flow document with category/collection query sequences; do not rewrite historical verification records.

- [ ] **Step 3: Run focused regression tests**

Run:

```bash
npm run build:web
node --test tests/app.test.mjs tests/view.test.mjs tests/site.test.mjs
cargo test --manifest-path src-tauri/Cargo.toml bundled_database_exposes_current_catalogue
```

Expected: all focused tests pass.

- [ ] **Step 4: Commit current documentation and regression coverage**

```bash
git add src-tauri/src/db.rs src/mock-data.ts tests/app.test.mjs tests/view.test.mjs README.md docs/index.html docs/architecture/data-flow.md tests/site.test.mjs
git commit -m "docs: describe full audio catalogue discovery"
```

### Task 10: Run complete verification

**Files:**

- Modify only if a verification failure reveals an implementation defect in an already listed file.

- [ ] **Step 1: Run frontend quality gates**

Run:

```bash
bun run format
bun run lint
bun run typecheck
bun run test:coverage
bun run build:web
bun run smoke:web
```

Expected: every command exits zero with no warnings and enforced core coverage remains 100%.

- [ ] **Step 2: Run Rust quality gates**

Run:

```bash
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

Expected: clippy and all Rust tests pass.

- [ ] **Step 3: Verify final database and repository state**

Run:

```bash
sqlite3 src-tauri/resources/dhamma.db "PRAGMA integrity_check; PRAGMA foreign_key_check;"
shasum -a 256 /Users/aungmyokyaw/projects/life/dhammadownload-db/dhamma.db src-tauri/resources/dhamma.db
git diff --check
git status --short
git log --oneline -10
```

Expected: SQLite reports `ok` and no foreign-key rows, database hashes match, no whitespace errors exist, and only intentional plan/implementation state remains.

- [ ] **Step 4: Perform a native smoke check**

Run `bun run tauri:dev`, then verify Home, Explore, Collections, collection detail, Teachers, teacher detail, playback of an approved MP3, queueing, favorites, back navigation, and an incomplete-metadata playable row. Stop the development process after the checks.

- [ ] **Step 5: Commit any verification-only corrections**

If verification required corrections, stage only those exact files and commit:

```bash
git commit -m "fix: complete audio catalogue verification"
```

If no corrections were required, do not create an empty commit.
