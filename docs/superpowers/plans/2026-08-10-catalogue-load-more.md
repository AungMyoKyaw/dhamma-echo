# Catalogue Load More Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Explore and Collections Previous/Next pagination with explicit, append-only Load more controls.

**Architecture:** Extend the existing teacher-talk progressive-loading pattern to the Explore catalogue and Collections browse state. Initial requests replace results at offset zero; dedicated append methods request from the current unique item count and reducer actions append by stable ID. Views share the same progress/loading/retry behavior while retaining page-specific batch sizes and copy.

**Tech Stack:** TypeScript 6, DOM APIs, Node test runner invoked through Bun, existing Tauri API contracts.

---

### Task 1: Progressive Explore state

**Files:**

- Modify: `src/types.ts`
- Modify: `src/store.ts`
- Modify: `tests/store.test.mjs`

- [ ] **Step 1: Write failing reducer tests**

Dispatch `search-started`, `search-loaded`, and `search-failed` with `mode: "initial" | "append"`. Assert initial loading clears stale results, append loading preserves them, append success deduplicates by audio ID, empty append sets `exhausted`, and append failure keeps the ready list while setting `loadMoreMessage`.

- [ ] **Step 2: Verify RED**

Run: `bun run test`

Expected: FAIL because catalogue state lacks progressive fields and search actions lack a mode.

- [ ] **Step 3: Implement the state contract**

Add reusable fields to `CatalogueState`:

```ts
loadingMore: boolean;
loadMoreMessage: string;
exhausted: boolean;
```

Change search actions to:

```ts
| { type: "search-started"; mode: "initial" | "append" }
| { type: "search-loaded"; mode: "initial" | "append"; page: AudioSearchPage }
| { type: "search-failed"; mode: "initial" | "append"; message: string }
```

Follow the teacher-talk reducer behavior: replace on initial success, append unique IDs on append success, preserve items on append failure, and mark exhausted at total or on no progress. Reset catalogue progressive metadata whenever a search query or filter action changes.

- [ ] **Step 4: Verify GREEN**

Run: `bun run test:coverage`

Expected: all tests PASS with 100% line, branch, and function coverage.

### Task 2: Progressive Collections state

**Files:**

- Modify: `src/types.ts`
- Modify: `src/store.ts`
- Modify: `tests/store.test.mjs`

- [ ] **Step 1: Write failing collection reducer tests**

Exercise `collections-started`, `collections-loaded`, and `collections-failed` in both modes. Assert append deduplication by collection ID, offset zero for accumulated pages, retained query/teacher fields, inline failure preservation, completion, and reset after `set-collection-query` or `set-collection-teacher`.

- [ ] **Step 2: Verify RED**

Run: `bun run test`

Expected: FAIL because collection actions and state do not model append loading.

- [ ] **Step 3: Implement collection progressive state**

Add `loadingMore`, `loadMoreMessage`, and `exhausted` to `CollectionBrowseState`. Add mode to collection request actions and implement initial/append transitions with the same stable-ID rules as Explore while retaining `query`, `teacherId`, `limit`, and logical offset zero.

- [ ] **Step 4: Verify GREEN**

Run: `bun run test:coverage`

Expected: all tests PASS at required coverage.

### Task 3: Request append batches

**Files:**

- Modify: `src/app.ts`
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: Write failing application tests**

Capture API requests and assert:

```js
await app.search();
const shownTalks = app.state.catalogue.page.items.length;
await app.loadMoreSearchResults();
assert.equal(audioRequests.at(-1).offset, shownTalks);

await app.searchCollections();
const shownCollections = app.state.collections.page.items.length;
await app.loadMoreCollections();
assert.equal(collectionRequests.at(-1).offset, shownCollections);
```

Add failure/retry and guards for no remaining results, an active append, and exhausted state. Assert all current Explore filters and both collection filters remain in append requests.

- [ ] **Step 2: Verify RED**

Run: `bun run test`

Expected: FAIL because the two Load more methods do not exist.

- [ ] **Step 3: Implement initial and append orchestration**

Make `search()` and `searchCollections()` always issue initial offset-zero requests with their configured limits and mode-tagged actions. Add `loadMoreSearchResults()` and `loadMoreCollections()` that guard against duplicate/completed work, use displayed unique item count as offset, preserve current filters, and dispatch append-mode success or failure.

- [ ] **Step 4: Verify GREEN**

Run: `bun run test:coverage`

Expected: all tests PASS at 100% coverage.

### Task 4: Render and wire both Load more controls

**Files:**

- Modify: `src/view.ts`
- Modify: `src/main.ts`
- Modify: `tests/view.test.mjs`

- [ ] **Step 1: Write failing view tests**

Assert Explore renders `Showing 50 of 96 talks` and `Load 46 more talks`; Collections renders `Showing 24 of 50 collections` and `Load 24 more collections`. Cover loading-disabled labels, inline `role="status"` errors with Retry, completion without buttons, and absence of every `previous-page`, `next-page`, `previous-collections`, and `next-collections` action.

- [ ] **Step 2: Verify RED**

Run: `bun run test`

Expected: FAIL because both pages still render Previous/Next.

- [ ] **Step 3: Implement the views and event actions**

Render each result grid/list first, followed by centered progress, error, and dynamic button controls using existing visual styles. Add `load-more-search` and `load-more-collections` click actions in `src/main.ts`, calling the new application methods. Remove all four old pagination action branches and their offset mutations.

- [ ] **Step 4: Verify GREEN and format**

Run: `bunx prettier --write src/types.ts src/store.ts src/app.ts src/view.ts src/main.ts tests/store.test.mjs tests/app.test.mjs tests/view.test.mjs`

Run: `bun run test:coverage`

Expected: all tests PASS at 100% coverage.

### Task 5: Verify and deliver

**Files:**

- Modify: `src-tauri/src/db.rs` for the already-tested mixed-spacing natural-sort correction.

- [ ] **Step 1: Run complete verification**

Run: `bun run verify`

Expected: formatting, lint, type checking, 100% frontend coverage, build, smoke checks, Clippy, and all Rust tests PASS.

- [ ] **Step 2: Commit intentional changes**

```bash
git add src src-tauri/src/db.rs tests docs/superpowers/plans/2026-08-10-catalogue-load-more.md
git commit -m "feat: add load more across catalogue pages"
```

- [ ] **Step 3: Inspect and push**

Run: `git diff --check && git status --short && git log --oneline -8`

Expected: clean worktree and intentional commits only.

Run: `git push origin master`

Expected: remote `master` advances to the verified local commit.
