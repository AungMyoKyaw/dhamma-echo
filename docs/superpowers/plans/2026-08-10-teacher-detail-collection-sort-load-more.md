# Teacher Detail Collection Sorting and Talk Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Naturally sort collection cards on teacher detail pages and replace teacher-talk Previous/Next pagination with an accessible, append-only Load more control.

**Architecture:** Rust sorts only the collections returned by `Database::teacher` using a focused natural-name comparator. TypeScript gives teacher talks a dedicated progressive-loading state: the initial request replaces the list, later requests append unique records, and append failures preserve playable content. The view renders progress and explicit loading/retry controls while the DOM event layer triggers the next batch.

**Tech Stack:** Rust, rusqlite, Tauri 2, TypeScript 6, DOM APIs, Node test runner invoked through Bun.

---

### Task 1: Natural teacher-collection ordering

**Files:**

- Modify: `src-tauri/src/db.rs`

- [ ] **Step 1: Extend the database fixture and write a failing ordering test**

Create a focused in-memory `teacher_collection_sort_fixture()` with one teacher, five audio rows, five linked collections named `alpha 1`, `Alpha 2`, `alpha 02`, ` alpha 10 `, and `alpha 10`. Then assert the IDs returned by `teacher(1)`:

```rust
#[test]
fn teacher_collections_use_trimmed_case_insensitive_natural_order() {
    let database = teacher_collection_sort_fixture();
    let detail = database.teacher(1).expect("teacher detail");
    assert_eq!(
        detail.collections.iter().map(|item| item.id).collect::<Vec<_>>(),
        vec![13, 12, 14, 11, 15]
    );
}
```

Assign IDs `13`, `12`, `14`, `11`, and `15` respectively. Link one unique MP3 audio row to each collection. Add a separate assertion that `search_collections` still puts collection `11` first under its existing SQL ordering, proving that the specialized natural comparator does not leak into the main Collections page.

- [ ] **Step 2: Run the Rust test and verify the database-order behavior fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml teacher_collections_use_trimmed_case_insensitive_natural_order -- --exact`

Expected: FAIL because `ORDER BY LOWER(c.name), c.id` compares digit runs lexically and does not trim names.

- [ ] **Step 3: Add the minimal natural comparator and apply it only in `Database::teacher`**

Remove ordering responsibility from that collection SQL statement, collect its normalized `CollectionSummary` values, and sort them before assigning to `detail.collections`:

```rust
fn natural_name_cmp(left: &CollectionSummary, right: &CollectionSummary) -> std::cmp::Ordering {
    natural_text_cmp(left.name.trim(), right.name.trim()).then_with(|| left.id.cmp(&right.id))
}

fn natural_text_cmp(left: &str, right: &str) -> std::cmp::Ordering {
    use std::cmp::Ordering;

    let left = left.trim().to_lowercase();
    let right = right.trim().to_lowercase();
    let (left, right) = (left.as_bytes(), right.as_bytes());
    let (mut left_index, mut right_index) = (0, 0);

    while left_index < left.len() && right_index < right.len() {
        if left[left_index].is_ascii_digit() && right[right_index].is_ascii_digit() {
            let left_end = left[left_index..]
                .iter()
                .position(|byte| !byte.is_ascii_digit())
                .map_or(left.len(), |offset| left_index + offset);
            let right_end = right[right_index..]
                .iter()
                .position(|byte| !byte.is_ascii_digit())
                .map_or(right.len(), |offset| right_index + offset);
            let left_digits = &left[left_index..left_end];
            let right_digits = &right[right_index..right_end];
            let left_significant = left_digits
                .iter()
                .position(|byte| *byte != b'0')
                .map_or(&left_digits[left_digits.len()..], |start| &left_digits[start..]);
            let right_significant = right_digits
                .iter()
                .position(|byte| *byte != b'0')
                .map_or(&right_digits[right_digits.len()..], |start| &right_digits[start..]);
            let ordering = left_significant
                .len()
                .cmp(&right_significant.len())
                .then_with(|| left_significant.cmp(right_significant))
                .then_with(|| left_digits.len().cmp(&right_digits.len()));
            if ordering != Ordering::Equal {
                return ordering;
            }
            left_index = left_end;
            right_index = right_end;
            continue;
        }

        let ordering = left[left_index].cmp(&right[right_index]);
        if ordering != Ordering::Equal {
            return ordering;
        }
        left_index += 1;
        right_index += 1;
    }

    left.len().cmp(&right.len())
}
```

Implement `natural_text_cmp` as a private pure function in `db.rs`; it must consume the entire strings and return `Ordering::Equal` only when their normalized comparison keys match. Keep `search_collections` unchanged.

```rust
let mut collections = statement
    .query_map([id], map_collection_summary)?
    .collect::<rusqlite::Result<Vec<_>>>()?;
collections.sort_by(natural_name_cmp);
detail.collections = collections;
```

- [ ] **Step 4: Run focused and full Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml teacher_collections_use_trimmed_case_insensitive_natural_order`

Expected: PASS.

Run: `cargo test --manifest-path src-tauri/Cargo.toml --all-features`

Expected: all Rust tests PASS.

- [ ] **Step 5: Commit the backend behavior**

```bash
git add src-tauri/src/db.rs
git commit -m "feat: naturally sort teacher collections"
```

### Task 2: Model append-only teacher-talk state

**Files:**

- Modify: `src/types.ts`
- Modify: `src/store.ts`
- Modify: `tests/store.test.mjs`

- [ ] **Step 1: Write failing reducer tests for reset, append, deduplication, failure, and exhaustion**

Add tests that dispatch the new actions and assert their complete state transitions:

```js
state = reduce(state, { type: "teacher-talks-started", mode: "initial" });
state = reduce(state, { type: "teacher-talks-loaded", mode: "initial", page: firstPage });
state = reduce(state, { type: "teacher-talks-started", mode: "append" });
state = reduce(state, {
  type: "teacher-talks-loaded",
  mode: "append",
  page: { items: [firstPage.items[1], nextTrack], total: 3, limit: 50, offset: 2 }
});
assert.deepEqual(state.teacherTalks.page.items.map(({ id }) => id), [1, 2, 3]);
assert.equal(state.teacherTalks.loadingMore, false);
```

Also assert that append failure keeps the items and changes only `loadMoreMessage`, a successful empty append sets `exhausted: true`, an initial load clears stale records, and `open-teacher` resets the progressive state for the newly selected teacher.

- [ ] **Step 2: Run the store tests and verify the new action contracts fail**

Run: `bun run test`

Expected: FAIL because teacher-talk actions do not accept a mode and state lacks append metadata.

- [ ] **Step 3: Add a dedicated state interface and reducer actions**

In `src/types.ts`, define and use:

```ts
export interface TeacherTalksState extends CatalogueState {
  loadingMore: boolean;
  loadMoreMessage: string;
  exhausted: boolean;
}

// AppState
teacherTalks: TeacherTalksState;
```

In `src/store.ts`, replace offset mutation with explicit initial/append actions:

```ts
type TeacherTalkLoadMode = "initial" | "append";

| { type: "teacher-talks-started"; mode: TeacherTalkLoadMode }
| { type: "teacher-talks-loaded"; mode: TeacherTalkLoadMode; page: AudioSearchPage }
| { type: "teacher-talks-failed"; mode: TeacherTalkLoadMode; message: string }
```

Initialize/reset the state with `loadingMore: false`, `loadMoreMessage: ""`, and `exhausted: false`. For append success, deduplicate with a `Set` of existing media IDs, retain offset `0` for the accumulated page, update total/limit from the response, and set `exhausted` when the response adds zero unique records or the unique count reaches total. For append failure, preserve `status`, `page`, and `exhausted`; clear `loadingMore` and set `loadMoreMessage`. Initial failure retains the page-level error behavior.

- [ ] **Step 4: Run store tests and coverage**

Run: `bun run test`

Expected: store tests PASS.

Run: `bun run test:coverage`

Expected: all frontend tests PASS with 100% line, branch, and function coverage.

- [ ] **Step 5: Commit the state model**

```bash
git add src/types.ts src/store.ts tests/store.test.mjs
git commit -m "feat: model progressive teacher talk loading"
```

### Task 3: Request and append the next teacher-talk batch

**Files:**

- Modify: `src/app.ts`
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: Write failing application tests for initial and append requests**

Capture `searchAudio` requests, return offset-specific pages, and assert:

```js
await app.openTeacher(3, "teachers");
assert.equal(requests.at(-1).offset, 0);
const firstCount = app.state.teacherTalks.page.items.length;
await app.loadMoreTeacherTalks();
assert.equal(requests.at(-1).offset, firstCount);
```

Add tests proving a concurrent Load more call is ignored, append errors preserve the first batch, retry uses the same offset, and calls return immediately when no teacher is selected or all records are loaded.

- [ ] **Step 2: Run application tests and verify the new method is missing**

Run: `bun run test`

Expected: FAIL because `loadMoreTeacherTalks` does not exist and initial actions lack a mode.

- [ ] **Step 3: Split initial loading from append loading**

Keep `loadTeacherTalks` as the initial loader and add:

```ts
async loadMoreTeacherTalks(): Promise<void> {
  const { selectedTeacherId: teacherId, teacherTalks } = this.state;
  if (
    teacherId === null ||
    teacherTalks.loadingMore ||
    teacherTalks.exhausted ||
    teacherTalks.page.items.length >= teacherTalks.page.total
  ) return;

  const offset = teacherTalks.page.items.length;
  this.dispatch({ type: "teacher-talks-started", mode: "append" });
  try {
    const page = await this.dependencies.api.searchAudio({
      query: "",
      language: null,
      format: null,
      teacherId,
      categoryId: null,
      collectionId: null,
      limit: teacherTalks.page.limit,
      offset
    });
    this.dispatch({ type: "teacher-talks-loaded", mode: "append", page });
  } catch (error) {
    this.dispatch({
      type: "teacher-talks-failed",
      mode: "append",
      message: messageFrom(error)
    });
  }
}
```

Update initial loading to always request offset `0` with limit `50` and dispatch the same actions with `mode: "initial"`.

- [ ] **Step 4: Run application tests and coverage**

Run: `bun run test`

Expected: application tests PASS.

Run: `bun run test:coverage`

Expected: all frontend tests PASS with required 100% coverage.

- [ ] **Step 5: Commit orchestration**

```bash
git add src/app.ts tests/app.test.mjs
git commit -m "feat: append teacher talk batches"
```

### Task 4: Render and wire accessible Load more controls

**Files:**

- Modify: `src/view.ts`
- Modify: `src/main.ts`
- Modify: `tests/view.test.mjs`

- [ ] **Step 1: Replace pagination expectations with failing Load more view tests**

For a ready page with 50 of 96 records, assert:

```js
assert.match(html, /Showing 50 of 96 talks/);
assert.match(html, /data-action="load-more-teacher-talks"/);
assert.match(html, /Load 46 more talks/);
assert.doesNotMatch(html, /previous-teacher-talks|next-teacher-talks/);
```

Add cases for pending (`disabled` and `Loading more…`), inline error (`role="status"`, error text, and `Retry`), completion (progress remains and button is absent), empty state, and exhausted/no-progress state. Confirm an initial failure still renders the existing page-level retry.

- [ ] **Step 2: Run view tests and verify the old Previous/Next UI fails expectations**

Run: `bun run test`

Expected: FAIL because teacher detail still renders Previous and Next controls.

- [ ] **Step 3: Render progress, append status, and the dynamic button**

Build the control from accumulated item count and total:

```ts
const shown = page.items.length;
const remaining = Math.max(0, page.total - shown);
const nextCount = Math.min(page.limit, remaining);
const canLoadMore = remaining > 0 && !state.teacherTalks.exhausted;
const loadMore = canLoadMore
  ? `<button class="rounded-full border border-app-border px-5 py-2 text-sm font-bold" data-action="load-more-teacher-talks" ${state.teacherTalks.loadingMore ? "disabled" : ""}>${state.teacherTalks.loadingMore ? "Loading more…" : state.teacherTalks.loadMoreMessage ? "Retry" : `Load ${nextCount.toLocaleString("en-US")} more talks`}</button>`
  : "";
```

Render `Showing N of M talks` and the inline `loadMoreMessage` in a `role="status"` container below the track list. Do not replace already rendered talks when `loadingMore` or `loadMoreMessage` is set. Remove teacher-talk Previous/Next markup.

- [ ] **Step 4: Replace old click actions with one Load more action**

In `src/main.ts`, delete both teacher-talk offset branches and add:

```ts
if (action === "load-more-teacher-talks") {
  void app.loadMoreTeacherTalks();
}
```

The same action serves retry because the preserved item count produces the same offset.

- [ ] **Step 5: Run focused tests, formatting, and frontend verification**

Run: `bun run test`

Expected: focused tests PASS.

Run: `bunx prettier --write src/types.ts src/store.ts src/app.ts src/view.ts src/main.ts tests/store.test.mjs tests/app.test.mjs tests/view.test.mjs`

Expected: files are formatted.

Run: `bun run verify:web`

Expected: lint, typecheck, 100% coverage, production build, smoke test, and icon checks PASS.

- [ ] **Step 6: Commit the teacher-detail UI**

```bash
git add src/view.ts src/main.ts tests/view.test.mjs
git commit -m "feat: add teacher talk load more control"
```

### Task 5: Full verification and delivery

**Files:**

- Modify only files requiring formatting or test corrections discovered by verification.

- [ ] **Step 1: Run the complete repository verification with Bun**

Run: `bun run verify`

Expected: formatting, ESLint, type checking, 100% frontend coverage, production build, web smoke checks, icon checks, Clippy with warnings denied, and all Rust tests PASS.

- [ ] **Step 2: Inspect the final diff and repository state**

Run: `git diff --check && git status --short && git log --oneline -8`

Expected: no whitespace errors; only intentional feature changes remain uncommitted, if any.

- [ ] **Step 3: Commit verification-only corrections if needed**

If Step 1 required a correction, rerun the affected verification first, then commit only those files:

Stage the exact files reported by `git status --short`, verify their diffs individually, and commit them with `git commit -m "test: cover teacher talk loading edge states"`.

If the worktree is already clean, do not create an empty commit.

- [ ] **Step 4: Push the completed master branch**

Run: `git push origin master`

Expected: the remote `master` branch advances to the final verified commit.
