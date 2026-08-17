# Exponential Progressive Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Explore, Collections, and teacher-detail append requests grow from 100 to 200 to 400 records, capped by the remaining result count, and remove the row-count chooser.

**Architecture:** Add `nextLoadSize` to every progressive list state. The app uses it to set each append request limit, reducers double it after successful appends up to 400, and fresh searches/teacher loads reset it to 100. The shared control receives the next size from each view and renders only the explicit append button. Give collection and audio search queries a 400-record validation ceiling.

**Tech Stack:** Svelte 5, TypeScript, Node test runner, Rust 2024, rusqlite, Tailwind CSS v4.

---

### Task 1: Define progressive batch state and reducer behavior

**Files:**

- Modify: `src/types.ts` — add append-size state to progressive catalogue lists.
- Modify: `src/store.ts` — initialize, reset, and double all progressive append sizes.
- Test: `tests/store.test.mjs` — cover the progressive sequences and existing list state transitions.

- [x] **Step 1: Write the failing reducer test**

Extend the progressive-list portion of `tests/store.test.mjs` so it asserts the 100 → 200 → 400 sequence, retry preservation, and reset behavior for each list state. The collection case can use:

```js
let state = createInitialState();
assert.equal(state.collections.nextLoadSize, 100);
state = reduce(state, {
  type: "collections-loaded",
  mode: "initial",
  page: {
    items: [firstCollection],
    total: 801,
    limit: 50,
    offset: 0
  }
});
assert.equal(state.collections.nextLoadSize, 100);
state = reduce(state, { type: "collections-started", mode: "append" });
state = reduce(state, {
  type: "collections-loaded",
  mode: "append",
  page: {
    items: [{ ...firstCollection, id: 11, name: "Two" }],
    total: 801,
    limit: 100,
    offset: 1
  }
});
assert.equal(state.collections.nextLoadSize, 200);
state = reduce(state, { type: "collections-started", mode: "append" });
state = reduce(state, {
  type: "collections-loaded",
  mode: "append",
  page: {
    items: [{ ...firstCollection, id: 12, name: "Three" }],
    total: 801,
    limit: 200,
    offset: 2
  }
});
assert.equal(state.collections.nextLoadSize, 400);
state = reduce(state, { type: "collections-started", mode: "append" });
state = reduce(state, { type: "collections-failed", mode: "append", message: "retry" });
assert.equal(state.collections.nextLoadSize, 400);
state = reduce(state, { type: "set-collection-query", query: "disc" });
assert.equal(state.collections.nextLoadSize, 100);
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun run test`

Expected: FAIL because `nextLoadSize` is not present in the collection state.

- [x] **Step 3: Implement the minimal state change**

Add `nextLoadSize: number` to every progressive list state, initialize each to `100`, reset it when a fresh search or teacher load starts, and update it after append success with `Math.min(state.nextLoadSize * 2, 400)`.

- [x] **Step 4: Run the test to verify it passes**

Run: `bun run test`

Expected: PASS for the reducer assertions and no regressions.

### Task 2: Use exponential sizes in every progressive request and remove the chooser

**Files:**

- Modify: `src/app.ts` — request current batch sizes for Explore, Collections, and teacher detail.
- Modify: `src/components/ProgressiveControls.svelte` — render the explicit button without the row chooser.
- Modify: `src/views/ExploreView.svelte`, `src/views/CollectionsView.svelte`, `src/views/TeacherDetailView.svelte` — pass next batch state.
- Test: `tests/app.test.mjs`, `tests/site.test.mjs` — verify all request limits and the shared control structure.

- [x] **Step 1: Write the failing application test**

Add application tests with 801 fixture records for Explore, Collections, and teacher detail. After each initial 50-row search, call the relevant append method and assert request limits `[100, 200, 400]`, offsets `[50, 150, 350]`, and displayed counts `[150, 350, 750]`. Assert that a final partial request uses the remaining count rather than 400, and that an append failure retries with the same batch size.

- [x] **Step 2: Run the test to verify it fails**

Run: `bun run test`

Expected: FAIL because Explore and teacher-detail requests currently reuse the persisted row limit and the shared control still renders the chooser.

- [x] **Step 3: Implement the minimal request and view changes**

In each append method, compute:

```ts
const offset = collections.page.items.length;
const remaining = collections.page.total - offset;
const limit = Math.min(collections.nextLoadSize, remaining);
```

Send that `limit` in the relevant request. Make `nextLimit` a required control prop, remove the `limit`, `onlimit`, and `<select>` chooser props/markup, and pass each view’s `nextLoadSize`.

- [x] **Step 4: Run the test to verify it passes**

Run: `bun run test`

Expected: PASS, including request limits 100, 200, 400 across all three surfaces and no row chooser source.

### Task 3: Permit bounded larger collection queries in Rust

**Files:**

- Modify: `src-tauri/src/db.rs` — use bounded 1–400 validation for collection and audio search.
- Test: `src-tauri/src/db.rs` — verify 200/400 collection and audio requests succeed while 401 fails.

- [x] **Step 1: Write the failing Rust test**

Extend `validates_filters_limits_and_ids()` with valid collection and audio requests at `limit: 200` and `limit: 400`, plus collection and audio requests at `limit: 401` that return `AppError::InvalidInput`.

- [x] **Step 2: Run the test to verify it fails**

Run: `cargo test --locked --manifest-path src-tauri/Cargo.toml validates_filters_limits_and_ids`

Expected: FAIL because collection and audio search currently use the shared 1–100 validator.

- [x] **Step 3: Implement collection-specific validation**

Add bounded validators for collection and audio search with the inclusive range 1–400. Keep the existing 1–100 validator for teacher lookup commands.

- [x] **Step 4: Run the test to verify it passes**

Run: `cargo test --locked --manifest-path src-tauri/Cargo.toml validates_filters_limits_and_ids`

Expected: PASS with both search endpoints accepting 400 and rejecting 401.

### Task 4: Run the full verification gates

**Files:**

- Verify: all three progressive views, shared state/control code, `src-tauri/src/db.rs`, port configuration, and their tests.

- [x] **Step 1: Format changed files**

Run: `bunx prettier --write src/types.ts src/store.ts src/app.ts src/components/ProgressiveControls.svelte src/views/CollectionsView.svelte tests/store.test.mjs tests/app.test.mjs docs/superpowers/specs/2026-08-17-collection-exponential-load-design.md docs/superpowers/plans/2026-08-17-collection-exponential-load.md`

- [x] **Step 2: Run frontend verification**

Run: `bun run test && bun run lint && bun run typecheck && bun run build:web && bun run smoke:web`

Expected: all commands exit 0; tests report no failures, lint has no warnings, Svelte type checking is clean, the Vite build succeeds, and the smoke check passes.

- [x] **Step 3: Run Rust verification**

Run: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check && cargo test --locked --manifest-path src-tauri/Cargo.toml --all-features`

Expected: formatting is clean and all Rust tests pass.

- [x] **Step 4: Inspect the final diff**

Run: `git diff --check && git status --short && git diff --stat`

Expected: only the approved collection-loading design, plan, source, and test changes are present; no generated build artifacts are included.
