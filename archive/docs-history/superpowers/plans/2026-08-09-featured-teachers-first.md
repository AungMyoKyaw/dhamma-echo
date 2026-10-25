# Featured Teachers First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the six curated teachers first on the default Teachers page and label featured teacher cards without changing the order of other teachers or search results.

**Architecture:** Keep the existing curated ID constant in `src/view.ts`. Add small membership and default-list ordering helpers beside it, make the shared teacher-card renderer conditionally add the badge, and apply ordering only when the Teachers page is not showing search results.

**Tech Stack:** TypeScript, server-style HTML rendering, Node test runner, Tailwind CSS utility classes

---

### Task 1: Featured-first Teachers page and badge

**Files:**

- Modify: `tests/view.test.mjs`
- Modify: `src/view.ts`

- [ ] **Step 1: Write the failing default-list and badge test**

Add this focused test to `tests/view.test.mjs` after the existing Home featured-teacher test:

```js
test("renderApp pins featured teachers and labels their cards on the Teachers page", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, {
    type: "teachers-loaded",
    teachers: [
      { id: 900, name: "First regular", audioCount: 900 },
      { id: 26, name: "Teacher 26", audioCount: 26 },
      { id: 901, name: "Second regular", audioCount: 901 },
      { id: 30, name: "Teacher 30", audioCount: 30 },
      { id: 67, name: "Teacher 67", audioCount: 67 }
    ]
  });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(([, id]) =>
    Number(id)
  );
  assert.deepEqual(ids, [30, 67, 26, 900, 901]);
  assert.equal((html.match(/>Featured</gu) ?? []).length, 3);
  assert.match(html, /Teacher 30[\s\S]*?>Featured</u);
  assert.doesNotMatch(html, /First regular[\s\S]*?>Featured</u);
});
```

This verifies curated ordering, clean omission of absent curated IDs, preservation of the two regular teachers' input order, and badge membership.

- [ ] **Step 2: Write the failing search-order test**

Add this second test immediately after the default-list test:

```js
test("renderApp preserves teacher search order while labeling featured matches", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, {
    type: "teachers-loaded",
    teachers: [{ id: 900, name: "Loaded teacher", audioCount: 1 }]
  });
  state = reduce(state, { type: "set-teacher-query", query: "teacher" });
  state = reduce(state, {
    type: "teacher-results",
    teachers: [
      { id: 900, name: "First regular", audioCount: 900 },
      { id: 26, name: "Featured match", audioCount: 26 },
      { id: 901, name: "Second regular", audioCount: 901 }
    ]
  });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(([, id]) =>
    Number(id)
  );
  assert.deepEqual(ids, [900, 26, 901]);
  assert.equal((html.match(/>Featured</gu) ?? []).length, 1);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.json && node --test --test-name-pattern="pins featured teachers|preserves teacher search order" tests/view.test.mjs
```

Expected: both new tests fail because the default Teachers page currently preserves the complete backend order and teacher cards do not contain a `Featured` badge.

- [ ] **Step 4: Add featured membership and ordering helpers**

In `src/view.ts`, immediately after `CURATED_FEATURED_TEACHER_IDS`, add:

```ts
const CURATED_FEATURED_TEACHER_ID_SET = new Set<number>(CURATED_FEATURED_TEACHER_IDS);

function isCuratedFeaturedTeacher(id: number): boolean {
  return CURATED_FEATURED_TEACHER_ID_SET.has(id);
}

function orderTeachersFeaturedFirst(teachers: TeacherSummary[]): TeacherSummary[] {
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const featured = CURATED_FEATURED_TEACHER_IDS.flatMap((id) => {
    const teacher = teachersById.get(id);
    return teacher === undefined ? [] : [teacher];
  });
  const remaining = teachers.filter((teacher) => !isCuratedFeaturedTeacher(teacher.id));
  return [...featured, ...remaining];
}
```

This keeps absent curated IDs harmless and retains the original order of every non-featured teacher.

- [ ] **Step 5: Render the conditional badge**

Replace the teacher-name paragraph in `renderTeacherCard` with this name-and-badge row:

```ts
    <div class="mt-4 flex items-start gap-2"><p class="line-clamp-2 font-bold">${escapeHtml(teacher.name)}</p>${isCuratedFeaturedTeacher(teacher.id) ? '<span class="shrink-0 rounded-full bg-app-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-app-primary">Featured</span>' : ""}</div><p class="mt-1 text-sm text-app-muted">${teacher.audioCount.toLocaleString("en-US")} talks</p>
```

Keep the surrounding button, talk count, and browse action unchanged.

- [ ] **Step 6: Order only the default Teachers list**

In `renderTeachers`, replace the result selection with:

```ts
const results = searching ? state.teacherResults : orderTeachersFeaturedFirst(state.teachers.data);
```

This deliberately preserves backend search-result ordering while allowing the shared card renderer to badge featured matches.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.json && node --test --test-name-pattern="pins featured teachers|preserves teacher search order" tests/view.test.mjs
```

Expected: both tests pass.

- [ ] **Step 8: Run all JavaScript tests**

Run:

```bash
node scripts/test.mjs
```

Expected: all tests pass with no failures.

- [ ] **Step 9: Run full project verification**

Run:

```bash
bun run verify
```

Expected: formatting, lint, types, coverage, web build, smoke tests, icon checks, Clippy, and Rust tests all pass.

- [ ] **Step 10: Commit the implementation**

```bash
git add src/view.ts tests/view.test.mjs
git commit -m "feat: feature teachers first"
```
