# Unified Content Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Explore expose audio, video, and Abhidhamma categories with counts and category-scoped results that agree.

**Architecture:** Keep the existing `list_audio_categories` IPC command for compatibility, but return a neutral `ContentCategory` payload with a `count` field. Rust will derive one semantic category predicate from the database category type and reuse it for both category counts and `search_audio`; the Svelte Explore view will only change its copy and field binding, while the browser mock will mirror the same catalogue behavior.

**Tech Stack:** Rust 2024, Tauri 2, rusqlite, Svelte 5 runes, strict TypeScript, Vite, Bun, and Node's built-in test runner.

## Global Constraints

- Use Bun for JavaScript package scripts; `bun.lock` remains authoritative.
- Keep the six-command Tauri surface and the `list_audio_categories` command string unchanged.
- Do not add dependencies, CSP hosts, permissions, persistence keys, or database schema changes.
- Keep the summary, collections, teacher counts, playback, and existing audio/video player behavior unchanged.
- Audio categories count audio rows, video categories count video rows, and Abhidhamma categories count both audio and video rows.
- Required tests must not contain focused or skipped markers.
- Run formatting, lint, typecheck, unit/coverage, build, and web smoke checks before completion.

---

### Task 1: Make the Rust category query content-aware

**Files:**

- Modify: `src-tauri/src/models.rs` — rename `AudioCategory` to `ContentCategory` and `audio_count` to `count`.
- Modify: `src-tauri/src/commands.rs` — preserve `list_audio_categories` while returning `Vec<ContentCategory>` from the content-aware database method.
- Modify: `src-tauri/src/db.rs:97-119` — implement the shared category-type SQL rule and update the embedded fixtures/tests.

**Interfaces:**

- Produces `ContentCategory { id: i64, name: String, language: String, count: i64 }` serialized as `{ id, name, language, count }`.
- Keeps `list_audio_categories(database) -> Result<Vec<ContentCategory>, CommandError>` as the Tauri command interface.
- Keeps `Database::search_audio(&AudioSearchRequest)` unchanged at the Rust call boundary; only its category predicate changes.

- [ ] **Step 1: Write the failing Rust regression test**

Replace the old audio-only category assertion in `src-tauri/src/db.rs` with a test that seeds one video category and one media row for it, then asserts all six meaningful category IDs and exact fixture counts. Also add a category-search assertion for a video category:

```rust
#[test]
fn lists_meaningful_content_categories_and_scopes_category_search() {
    let database = fixture();
    let categories = database.audio_categories().expect("categories");
    assert_eq!(
        categories.iter().map(|item| item.id).collect::<Vec<_>>(),
        vec![1, 4, 5, 6, 7, 8]
    );
    assert_eq!(
        categories.iter().map(|item| item.count).collect::<Vec<_>>(),
        vec![1, 1, 1, 1, 1, 1]
    );

    let video_page = database
        .search_audio(&AudioSearchRequest {
            query: String::new(),
            language: None,
            format: None,
            teacher_id: None,
            category_id: Some(8),
            collection_id: None,
            limit: 50,
            offset: 0,
        })
        .expect("video category page");
    assert_eq!(video_page.total, 1);
    assert_eq!(video_page.items[0].media_type, "video");
}
```

Add category id `6` and one video row assigned to it in the test fixture, plus one deliberately mismatched video row under an audio category so the shared semantic rule is exercised.

- [ ] **Step 2: Run the focused test and verify it fails for the missing behavior**

Run:

```bash
cargo test --locked --manifest-path src-tauri/Cargo.toml db::tests::lists_meaningful_content_categories_and_scopes_category_search
```

Expected: FAIL because the current implementation returns only the four audio/Abhidhamma category IDs.

- [ ] **Step 3: Implement the minimal Rust model and query changes**

Use this category join rule in `Database::audio_categories()`:

```sql
SELECT c.id, c.name, c.language, COUNT(m.id)
FROM categories c
JOIN media m
  ON m.category_id = c.id
 AND m.type IN ('audio', 'video')
 AND (c.type = 'abhidhamma' OR c.type = m.type)
WHERE c.type IN ('audio', 'video', 'abhidhamma')
GROUP BY c.id, c.name, c.language
HAVING COUNT(m.id) > 0
ORDER BY c.id
```

In `search_audio`, replace the direct `m.category_id = ?` clause with a parameterized `EXISTS` predicate that requires the selected category to be one of the three supported category types and requires `filter_category.type = m.type` except for `abhidhamma`. Keep all existing validation and parameter binding.

- [ ] **Step 4: Run the focused Rust test and the full Rust suite**

Run:

```bash
cargo test --locked --manifest-path src-tauri/Cargo.toml db::tests::lists_meaningful_content_categories_and_scopes_category_search
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

Expected: the focused test passes, then the complete Rust test suite passes with no warnings treated as errors.

- [ ] **Step 5: Commit the Rust slice**

```bash
git add src-tauri/src/models.rs src-tauri/src/commands.rs src-tauri/src/db.rs
git commit -m "feat(categories): include semantic video categories"
```

### Task 2: Align TypeScript types, API wiring, and the browser mock

**Files:**

- Modify: `src/types.ts` — add `ContentCategory` and use it in `AppState`.
- Modify: `src/api.ts` — expose `listContentCategories()` while invoking the unchanged `list_audio_categories` command.
- Modify: `src/app.ts` — load categories through `listContentCategories()`.
- Modify: `src/mock-data.ts` — add video category/track fixtures and mirror the Rust category predicate.
- Modify: `tests/mock-data.test.mjs` — assert video categories and video category filtering.
- Modify: `tests/app.test.mjs` and `tests/test-data.mjs` — update the test API contract and neutral category field.
- Modify: `tests/api.test.mjs` — assert `listContentCategories()` still maps to `list_audio_categories`.

**Interfaces:**

- Produces `ContentCategory { id: number; name: string; language: string; count: number }`.
- `CatalogueApi.listContentCategories(): Promise<ContentCategory[]>` invokes `list_audio_categories` with no arguments.
- `DhammaApp` consumes `listContentCategories()`; no request shape changes are needed for `AudioSearchRequest`.

- [ ] **Step 1: Write the failing mock/API tests**

Change the mock test to require video category names and a video result from category `8`:

```js
const videoCategories = categories.filter((item) => item.name.startsWith("Video"));
assert.deepEqual(
  videoCategories.map((item) => item.name),
  ["Video in English", "Video in Myanmar"]
);
const videoPage = await invoke("search_audio", {
  request: {
    query: "",
    language: null,
    format: null,
    teacherId: null,
    categoryId: 8,
    collectionId: null,
    limit: 50,
    offset: 0
  }
});
assert.equal(
  videoPage.items.every((track) => track.mediaType === "video"),
  true
);
```

Update the API test to call `api.listContentCategories()` and retain the expected command `{ command: "list_audio_categories", args: undefined }`.

- [ ] **Step 2: Run the targeted JavaScript tests and verify they fail**

Run:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.test.json
node --test tests/mock-data.test.mjs tests/api.test.mjs
```

Expected: FAIL because `listContentCategories` and the video category fixtures do not exist yet.

- [ ] **Step 3: Implement the neutral TypeScript contract and mock data**

Update the type and API method:

```ts
export interface ContentCategory {
  id: number;
  name: string;
  language: string;
  count: number;
}

listContentCategories(): Promise<ContentCategory[]> {
  return this.call("list_audio_categories");
}
```

Add the two video category records and a playable `mediaType: "video"` track to `src/mock-data.ts`. Apply the same rule as Rust in the mock search: audio/video category types match only the same track `mediaType`, while Abhidhamma matches either type. Update all category fixtures from `audioCount` to `count` and update `DhammaApp.loadCategories()` to call the new API method.

- [ ] **Step 4: Run the targeted tests and the complete TypeScript test suite**

Run:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.test.json
node --test tests/mock-data.test.mjs tests/api.test.mjs
bun run test
```

Expected: both targeted tests and the full Node test suite pass.

- [ ] **Step 5: Commit the TypeScript/data slice**

```bash
git add src/types.ts src/api.ts src/app.ts src/mock-data.ts tests/mock-data.test.mjs tests/api.test.mjs tests/app.test.mjs tests/test-data.mjs
git commit -m "feat(categories): model content categories in web data"
```

### Task 3: Update the Explore category presentation

**Files:**

- Modify: `src/views/ExploreView.svelte:77-104` — use neutral copy and the `count` field without changing layout or active-state styling.

**Interfaces:**

- Consumes `state.categories.data: ContentCategory[]` from Task 2.
- Produces visible `Content categories`, `All content`, Video in English, and Video in Myanmar controls in the existing chip strip.

- [ ] **Step 1: Verify the current rendered contract is missing the requested content**

Start the browser preview and inspect the Explore source/rendered page before editing:

```bash
bun run dev:web
```

Confirm the current screen contains `Audio categories` and `All audio`, and does not contain `Video in Myanmar`.

- [ ] **Step 2: Make the smallest Svelte template change**

Change only the category presentation strings and field binding:

```svelte
aria-label="Content categories"
...
onclick={() => setCategory(null)}>All content</button>
...
>{item.name} · {item.count.toLocaleString("en-US")}</button>
...
<p class="text-sm text-app-muted">Search the complete talk catalogue</p>
```

Keep the current `categoryId` selection, active styles, filter pill, and layout intact.

- [ ] **Step 3: Run static frontend checks**

Run:

```bash
bun run typecheck
bun run lint
bun run build:web
```

Expected: Svelte check, ESLint, and the Vite production build pass with no warnings/errors.

- [ ] **Step 4: Commit the Explore UI slice**

```bash
git add src/views/ExploreView.svelte
git commit -m "fix(explore): show unified content categories"
```

### Task 4: Verify the complete behavior and rendered surface

**Files:**

- No committed files; use the existing scripts and a temporary browser-check script outside the repository if needed.

- [ ] **Step 1: Run repository policy and coverage gates**

Run:

```bash
bun run test:policy
bun run test:coverage
bun run smoke:web
```

Expected: no focused/skipped tests, coverage thresholds pass, and the production asset smoke check passes.

- [ ] **Step 2: Run formatting and Rust quality gates**

Run:

```bash
bun run format:check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

Expected: formatting is clean and Clippy reports no warnings.

- [ ] **Step 3: Exercise the rendered Explore flow**

With `bun run dev:web` serving `http://127.0.0.1:51729`, verify:

1. The page loads as the Explore route with meaningful catalogue content.
2. The category strip says `Content categories` and includes `Video in English` and `Video in Myanmar`.
3. Selecting `Video in Myanmar` changes the active chip and leaves only video rows in the result list.
4. Selecting `All content` restores the combined catalogue.
5. The console has no relevant application errors, and the first desktop viewport has no clipping or horizontal overflow.

Use the Browser plugin if available; otherwise use the repository's available Playwright/browser tooling and record the fallback in the final QA report.

- [ ] **Step 4: Inspect the final diff and working tree**

Run:

```bash
git diff --check
git status --short --branch
git log -4 --oneline --decorate
```

Expected: only the approved spec, plan, Rust category changes, neutral TypeScript/mock changes, and Explore template changes are present; generated build/coverage output is not committed.

- [ ] **Step 5: Commit any final formatting-only changes by named file**

```bash
git status --short
```

If the quality gates produced a necessary source formatting change, stage only those named source files and commit it with `chore(format): format content category changes`. Do not stage generated output or unrelated work.
