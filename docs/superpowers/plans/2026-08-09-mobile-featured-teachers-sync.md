# Mobile Featured Teachers Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the desktop Home featured teachers using the Expo mobile app's exact hardcoded IDs and order.

**Architecture:** Keep one ordered ID constant in `src/view.ts` and map the already-loaded teacher summaries through it. Do not change backend queries, API contracts, state, or the broader Teachers route.

**Tech Stack:** TypeScript, server-style HTML rendering, Node test runner

---

### Task 1: Curated frontend ordering

**Files:**

- Modify: `src/view.ts`
- Test: `tests/view.test.mjs`

- [ ] **Step 1: Write the failing Home ordering test**

Add a test that loads shuffled curated teachers plus an unrelated high-count teacher:

```js
test("renderApp uses the mobile featured teacher list and exact order", () => {
  let state = createInitialState();
  const loaded = [
    { id: 26, name: "Teacher 26", audioCount: 3116 },
    { id: 999, name: "Unrelated", audioCount: 9999 },
    { id: 67, name: "Teacher 67", audioCount: 229 },
    { id: 30, name: "Teacher 30", audioCount: 942 },
    { id: 75, name: "Teacher 75", audioCount: 73 },
    { id: 53, name: "Teacher 53", audioCount: 670 },
    { id: 58, name: "Teacher 58", audioCount: 96 }
  ];
  state = reduce(state, { type: "teachers-loaded", teachers: loaded });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(
    ([, id]) => Number(id)
  );
  assert.deepEqual(ids, [30, 58, 53, 67, 75, 26]);
  assert.doesNotMatch(html, /Unrelated/);

  state = reduce(state, { type: "teachers-loaded", teachers: loaded.filter(({ id }) => id !== 53) });
  const missingIds = [...renderApp(state).matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(
    ([, id]) => Number(id)
  );
  assert.deepEqual(missingIds, [30, 58, 67, 75, 26]);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.json && node --test --test-name-pattern="mobile featured teacher list" tests/view.test.mjs
```

Expected: assertion failure because the current Set-based filter preserves backend order instead of curated order.

- [ ] **Step 3: Implement the hardcoded ordered list**

Add near the top of `src/view.ts`:

```ts
const CURATED_FEATURED_TEACHER_IDS = [30, 58, 53, 67, 75, 26] as const;
```

In `renderHome`, replace the Set/filter logic with:

```ts
const teachersById = new Map(state.teachers.data.map((teacher) => [teacher.id, teacher]));
const featured = CURATED_FEATURED_TEACHER_IDS.flatMap((id) => {
  const teacher = teachersById.get(id);
  return teacher === undefined ? [] : [teacher];
});
```

Keep the existing ready/empty rendering behavior and remove the unnecessary `slice(0, 6)`.

- [ ] **Step 4: Run focused and full view tests and verify GREEN**

Run:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.json && node --test --test-name-pattern="mobile featured teacher list" tests/view.test.mjs
node scripts/test.mjs
```

Expected: both commands pass.

- [ ] **Step 5: Run full verification**

Run:

```bash
bun run verify
```

Expected: all formatting, lint, type, coverage, build, smoke, icon, clippy, and test checks pass.

- [ ] **Step 6: Commit**

```bash
git add src/view.ts tests/view.test.mjs
git commit -m "fix: sync featured teacher order"
```
