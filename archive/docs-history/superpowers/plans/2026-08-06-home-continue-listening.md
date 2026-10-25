# Home "Continue Listening" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a "Continue listening" section on Home with the last played talk as a prominent card plus up to 4 recent talks, each resuming at its saved position.

**Architecture:** Wire the existing Tauri `get_audio_track` command into `CatalogueApi`; add a `homeRecent` state slice loaded from `library.history` IDs on Home visits; render a new section in `renderHome`; extend the `play-track` click handler to resolve tracks not in queue/search results via the API.

**Tech Stack:** TypeScript (frontend), node:test (`.mjs` tests against `.test-build`), Tauri v2 (command already exists — no Rust changes).

## Global Constraints

- Tests run via `bun run test` (`node scripts/test.mjs`): it compiles `src` to `.test-build` with `tsc -p tsconfig.json`, then runs every `tests/*.test.mjs` file with `node --test`. Coverage mode (`bun run test:coverage`) requires **100% lines/functions/branches** on `.test-build/src/**/*.js` (excluding `main.js`). Every new branch needs a test.
- TypeScript check: `bun run typecheck` (`tsc --noEmit -p tsconfig.json`).
- Lint: `bun run lint` (`eslint . --max-warnings 0`).
- Conventional commits: `type(scope): description`. Stage files by name, never `git add -A`.
- No new dependencies. No Rust changes.

---

### Task 1: `CatalogueApi.getAudioTrack`

**Files:**

- Modify: `src/api.ts:40-55`
- Test: `tests/api.test.mjs`

**Interfaces:**

- Produces: `getAudioTrack(id: number): Promise<AudioTrack>` on `CatalogueApi`, invoking Tauri command `get_audio_track` with args `{ id }`. Consumed by Task 4 (`CatalogueClient`) and Task 5 (fallback playback).

- [ ] **Step 1: Write the failing test**

Append to `tests/api.test.mjs`:

```javascript
test("CatalogueApi fetches a single audio track by id", async () => {
  const calls = [];
  const track = {
    id: 7,
    title: "Dhamma Talk",
    format: "mp3",
    language: "english",
    url: "https://dhammadownload.com/MP3Library/talk.mp3",
    dateRecorded: null,
    location: null,
    teacherId: 3,
    teacherName: "Sayadaw",
    playable: true
  };
  const api = new CatalogueApi(async (command, args) => {
    calls.push({ command, args });
    return track;
  });
  assert.deepEqual(await api.getAudioTrack(7), track);
  assert.deepEqual(calls, [{ command: "get_audio_track", args: { id: 7 } }]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — `api.getAudioTrack is not a function`

- [ ] **Step 3: Implement `getAudioTrack`**

In `src/api.ts`, add to the `CatalogueApi` class after `listFeaturedTeachers`:

```typescript
getAudioTrack(id: number): Promise<AudioTrack> {
  return this.call("get_audio_track", { id });
}
```

Add `AudioTrack` to the existing type import at the top of `src/api.ts`:

```typescript
import type {
  AudioSearchPage,
  AudioSearchRequest,
  AudioTrack,
  CatalogueSummary,
  InvokeFn,
  TeacherSummary
} from "./types.js";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api.ts tests/api.test.mjs
git commit -m "feat(api): add getAudioTrack for single-track lookup"
```

---

### Task 2: `homeRecent` state slice and reducers

**Files:**

- Modify: `src/types.ts` (add `RecentState`, extend `AppState`)
- Modify: `src/store.ts:15-48` (actions), `src/store.ts:58-79` (initial state), `src/store.ts:87-232` (reducer cases)
- Test: `tests/store.test.mjs`

**Interfaces:**

- Produces:
  - Type `RecentState = { status: "idle" | "loading" | "ready" | "error"; tracks: AudioTrack[] }`
  - `AppState.homeRecent: RecentState`
  - Actions `{ type: "recent-started" }`, `{ type: "recent-loaded"; tracks: AudioTrack[] }`, `{ type: "recent-failed" }`
- Consumed by Task 3 (view) and Task 4 (app loader).

- [ ] **Step 1: Write the failing test**

Append to `tests/store.test.mjs`:

```javascript
test("recent actions track loading, results, and failure", () => {
  let state = createInitialState();
  assert.deepEqual(state.homeRecent, { status: "idle", tracks: [] });
  state = reduce(state, { type: "recent-started" });
  assert.equal(state.homeRecent.status, "loading");
  state = reduce(state, { type: "recent-loaded", tracks });
  assert.equal(state.homeRecent.status, "ready");
  assert.deepEqual(
    state.homeRecent.tracks.map((track) => track.id),
    [1, 2]
  );
  state = reduce(state, { type: "recent-failed" });
  assert.equal(state.homeRecent.status, "error");
  assert.deepEqual(state.homeRecent.tracks, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — unknown action type / missing `homeRecent` on state (type error at compile)

- [ ] **Step 3: Implement state slice and reducers**

In `src/types.ts`, after `PlayerState` (around line 95):

```typescript
export interface RecentState {
  status: "idle" | "loading" | "ready" | "error";
  tracks: AudioTrack[];
}
```

Add to `AppState` (after `catalogue`):

```typescript
homeRecent: RecentState;
```

In `src/store.ts`, add to the `AppAction` union (after `search-failed`):

```typescript
| { type: "recent-started" }
| { type: "recent-loaded"; tracks: AudioTrack[] }
| { type: "recent-failed" }
```

In `createInitialState`, add after the `catalogue` line:

```typescript
homeRecent: { status: "idle", tracks: [] },
```

In `reduce`, add cases after `search-failed`:

```typescript
case "recent-started":
  return { ...state, homeRecent: { status: "loading", tracks: state.homeRecent.tracks } };
case "recent-loaded":
  return { ...state, homeRecent: { status: "ready", tracks: action.tracks } };
case "recent-failed":
  return { ...state, homeRecent: { status: "error", tracks: [] } };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test && bun run typecheck`
Expected: PASS, no type errors

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/store.ts tests/store.test.mjs
git commit -m "feat(store): add homeRecent slice for continue-listening"
```

---

### Task 3: Mock invoke + `DhammaApp.loadRecent`

**Files:**

- Modify: `src/mock-data.ts:109-149` (handle `get_audio_track`)
- Modify: `src/app.ts:14-19` (CatalogueClient), `src/app.ts:57-66` (start), add `loadRecent` method
- Test: `tests/app.test.mjs`, `tests/mock-data.test.mjs`

**Interfaces:**

- Consumes: `CatalogueApi["getAudioTrack"]` (Task 1), actions from Task 2.
- Produces: `DhammaApp.loadRecent(): Promise<void>` — resolves first 5 `library.history` IDs to tracks via parallel `getAudioTrack` calls, drops failures, preserves history order, dispatches `recent-started`/`recent-loaded`/`recent-failed`. Empty history dispatches `recent-loaded` with `[]` and makes no API calls.

- [ ] **Step 1: Write the failing tests**

Append to `tests/app.test.mjs`:

```javascript
test("DhammaApp loads recent tracks from history for the home screen", async () => {
  const requested = [];
  const storage = new MemoryStorage();
  const app = new DhammaApp({
    api: createApi({
      async getAudioTrack(id) {
        requested.push(id);
        if (id === 2) throw new Error("gone");
        return tracks.find((track) => track.id === id);
      }
    }),
    storage,
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  assert.equal(app.state.homeRecent.status, "ready");
  assert.deepEqual(app.state.homeRecent.tracks, []);

  app.dispatch({ type: "record-history", id: 1, playedAt: 10 });
  app.dispatch({ type: "record-history", id: 2, playedAt: 20 });
  await app.loadRecent();
  assert.deepEqual(requested, [2, 1]);
  assert.equal(app.state.homeRecent.status, "ready");
  assert.deepEqual(
    app.state.homeRecent.tracks.map((track) => track.id),
    [1]
  );

  await app.loadRecent();
  assert.equal(requested.length, 4);
  app.destroy();
});
```

Also extend the existing `createApi` helper in `tests/app.test.mjs` with a default so every other test still passes:

```javascript
async getAudioTrack(id) {
  return tracks.find((track) => track.id === id);
},
```

Add to `tests/mock-data.test.mjs` (check its current assertions first and match style):

```javascript
test("mock invoke resolves a single track by id and rejects unknown ids", async () => {
  const invoke = createMockInvoke();
  const track = await invoke("get_audio_track", { id: 1 });
  assert.equal(track.title, "Praise and Blame");
  await assert.rejects(invoke("get_audio_track", { id: 999 }), /Unsupported command/);
});
```

(`createMockInvoke` is already imported in `tests/mock-data.test.mjs`; the file already asserts `/Unsupported command/` for unknown commands.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: FAIL — `this.dependencies.api.getAudioTrack is not a function` / mock rejects `get_audio_track` as unsupported

- [ ] **Step 3: Implement**

In `src/mock-data.ts`, inside `createMockInvoke`, before the final `throw`:

```typescript
if (command === "get_audio_track") {
  const id = readNumber(args?.id, 0);
  const track = tracks.find((item) => item.id === id);
  if (track !== undefined) return track as T;
}
```

(Falls through to the existing `Unsupported command` throw for unknown IDs.)

In `src/app.ts`, extend `CatalogueClient`:

```typescript
export interface CatalogueClient {
  getSummary: CatalogueApi["getSummary"];
  listFeaturedTeachers: CatalogueApi["listFeaturedTeachers"];
  searchTeachers: CatalogueApi["searchTeachers"];
  searchAudio: CatalogueApi["searchAudio"];
  getAudioTrack: CatalogueApi["getAudioTrack"];
}
```

Add the method to `DhammaApp` (after `loadTeachers`):

```typescript
async loadRecent(): Promise<void> {
  const ids = this.state.library.history.slice(0, 5).map((entry) => entry.id);
  if (ids.length === 0) {
    this.dispatch({ type: "recent-loaded", tracks: [] });
    return;
  }
  this.dispatch({ type: "recent-started" });
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        return await this.dependencies.api.getAudioTrack(id);
      } catch {
        return null;
      }
    })
  );
  const tracks = results.filter((track): track is AudioTrack => track !== null);
  if (tracks.length === 0) {
    this.dispatch({ type: "recent-failed" });
    return;
  }
  this.dispatch({ type: "recent-loaded", tracks });
}
```

Note: history is already most-recent-first and deduped by the `record-history` reducer, so `slice(0, 5)` gives the right IDs. `AudioTrack` is already imported in `src/app.ts`.

In `start()`, add `loadRecent` to the parallel loads:

```typescript
await Promise.all([this.loadSummary(), this.loadTeachers(), this.search(), this.loadRecent()]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test && bun run typecheck && bun run lint`
Expected: PASS, clean

- [ ] **Step 5: Commit**

```bash
git add src/app.ts src/mock-data.ts tests/app.test.mjs tests/mock-data.test.mjs
git commit -m "feat(app): load recent history tracks for home screen"
```

---

### Task 4: Home "Continue listening" view

**Files:**

- Modify: `src/view.ts` — `renderHome` (around line 90-110), new `renderRecent` helper
- Test: `tests/view.test.mjs`

**Interfaces:**

- Consumes: `state.homeRecent` (Task 2), `state.library.resume`, existing `icon("play")`, `formatDuration`, `escapeHtml`, `data-action="play-track"` convention.
- Produces: HTML section with `data-action="play-track" data-id="<id>"` buttons; no new actions.

- [ ] **Step 1: Write the failing test**

Append to `tests/view.test.mjs`:

```javascript
test("renderApp shows continue-listening on home and hides it without history", () => {
  let state = createInitialState();
  assert.doesNotMatch(renderApp(state), /Continue listening/);

  state = reduce(state, { type: "record-history", id: 1, playedAt: 10 });
  state = reduce(state, { type: "record-history", id: 2, playedAt: 20 });
  state = reduce(state, { type: "recent-started" });
  assert.match(renderApp(state), /Continue listening/);

  state = reduce(state, { type: "recent-failed" });
  assert.doesNotMatch(renderApp(state), /Continue listening/);

  state = reduce(state, { type: "recent-loaded", tracks });
  state = reduce(state, { type: "save-resume", id: 1, currentTime: 95 });
  const html = renderApp(state);
  assert.match(html, /Continue listening/);
  assert.match(html, /Resume at 1:35/);
  assert.match(html, /data-action="play-track" data-id="2"/);
  assert.match(html, /Praise and Blame/);

  const emptyResume = reduce(state, { type: "save-resume", id: 1, currentTime: 0 });
  assert.doesNotMatch(renderApp(emptyResume), /Resume at/);
});
```

(`formatDuration(95)` → check `src/utils.ts` for the exact output format and adjust the expected string; `95` seconds should render as `1:35`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — `Continue listening` not found / found when it shouldn't be

- [ ] **Step 3: Implement**

In `src/view.ts`, add a helper above `renderHome`:

```typescript
function renderRecent(state: AppState): string {
  const recent = state.homeRecent;
  if (recent.status === "idle" || recent.status === "error") return "";
  if (recent.status === "loading") {
    return `<section class="space-y-4"><div><p class="text-xs font-bold uppercase tracking-wider text-app-primary">Continue listening</p></div><div class="h-20 animate-pulse rounded-card bg-app-soft"></div></section>`;
  }
  const [latest, ...rest] = recent.tracks;
  if (latest === undefined) return "";
  const resume = state.library.resume[String(latest.id)] ?? 0;
  const playing = state.player.current?.id === latest.id && state.player.status === "playing";
  const rows = rest
    .filter((track) => track.playable)
    .map((track) => renderTrack(track, state))
    .join("");
  return `<section class="space-y-4">
    <div><p class="text-xs font-bold uppercase tracking-wider text-app-primary">Continue listening</p><h2 class="mt-1 text-2xl font-bold">Pick up where you left off</h2></div>
    <div class="flex items-center gap-4 rounded-card border border-app-border bg-app-surface p-5">
      <button class="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-primary text-white transition hover:opacity-90" data-action="play-track" data-id="${latest.id}" aria-label="Resume ${escapeHtml(latest.title)}"><span class="ml-0.5 size-6">${icon(playing ? "pause" : "play")}</span></button>
      <div class="min-w-0"><h3 class="truncate font-bold">${escapeHtml(latest.title)}</h3><p class="mt-1 truncate text-sm text-app-muted">${escapeHtml(latest.teacherName || "Unknown teacher")}${resume > 0 ? ` · Resume at ${formatDuration(resume)}` : ""}</p></div>
    </div>
    ${rows.length > 0 ? `<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">${rows}</div>` : ""}
  </section>`;
}
```

In `renderHome`, insert the section between the stats grid and the featured teachers block:

```typescript
return `<section class="space-y-8">
  <div class="relative overflow-hidden ...">...</div>
  <div class="grid grid-cols-4 gap-4">${...}</div>
  ${renderRecent(state)}
  <div><div class="mb-4 flex items-end justify-between">...
```

Guard: only render when `state.library.history.length > 0 || recent.tracks.length > 0` is unnecessary — the status checks inside `renderRecent` already handle it. Unplayable tracks are excluded from `rows`; if `latest` itself is unplayable the card still renders but the button should be disabled — add `${latest.playable ? "" : "disabled opacity-50 cursor-not-allowed"}` to the card button class and skip the `data-action` when unplayable:

```typescript
<button class="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-primary text-white transition hover:opacity-90${latest.playable ? "" : " cursor-not-allowed opacity-50"}"${latest.playable ? ` data-action="play-track" data-id="${latest.id}"` : " disabled"} ...>
```

Update the test to cover the unplayable-latest branch (100% branch coverage):

```javascript
const unplayable = reduce(state, {
  type: "recent-loaded",
  tracks: [{ ...tracks[0], playable: false }]
});
const unplayableHtml = renderApp(unplayable);
assert.match(unplayableHtml, /Continue listening/);
assert.doesNotMatch(unplayableHtml, /data-action="play-track" data-id="1"/);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test && bun run lint`
Expected: PASS including coverage (`--coverage` run: `bun run test:coverage` — confirm 100% branches on `view.js`)

- [ ] **Step 5: Commit**

```bash
git add src/view.ts tests/view.test.mjs
git commit -m "feat(view): continue-listening section on home"
```

---

### Task 5: Playback fallback + Home navigation refresh

**Files:**

- Modify: `src/main.ts:77-83` (play-track handler), `src/main.ts:65` (navigate handler)
- Modify: `src/app.ts` — add `resolveTrack(id)` helper
- Test: `tests/app.test.mjs`

**Interfaces:**

- Consumes: `homeRecent.tracks` (Task 2), `getAudioTrack` (Task 1).
- Produces: `DhammaApp.resolveTrack(id: number): Promise<AudioTrack | null>` — checks `findTrack`, then `homeRecent.tracks`, then `api.getAudioTrack`; returns `null` on failure. Used by `main.ts`.

- [ ] **Step 1: Write the failing test**

Append to `tests/app.test.mjs`:

```javascript
test("DhammaApp resolves tracks from recent list and the catalogue", async () => {
  const fetched = [];
  const app = new DhammaApp({
    api: createApi({
      async getAudioTrack(id) {
        fetched.push(id);
        if (id === 42) throw new Error("missing");
        return tracks.find((track) => track.id === id);
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  assert.equal((await app.resolveTrack(1))?.id, 1);
  assert.deepEqual(fetched, []);

  app.dispatch({ type: "search-loaded", page: { items: [], total: 0, limit: 50, offset: 0 } });
  app.dispatch({ type: "recent-loaded", tracks: [tracks[1]] });
  assert.equal((await app.resolveTrack(2))?.id, 2);
  assert.deepEqual(fetched, []);

  assert.equal((await app.resolveTrack(1))?.id, 1);
  assert.deepEqual(fetched, [1]);
  assert.equal(await app.resolveTrack(42), null);
  app.destroy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL — `app.resolveTrack is not a function`

- [ ] **Step 3: Implement**

In `src/app.ts`, add after `findTrack`:

```typescript
async resolveTrack(id: number): Promise<AudioTrack | null> {
  const known =
    this.findTrack(id) ?? this.state.homeRecent.tracks.find((track) => track.id === id) ?? null;
  if (known !== null) return known;
  try {
    return await this.dependencies.api.getAudioTrack(id);
  } catch {
    return null;
  }
}
```

In `src/main.ts`, replace the `play-track` handler (lines 77-83):

```typescript
if (action === "play-track" && id !== null) {
  if (app.state.player.current?.id === id) void app.togglePlayback();
  else {
    void app.resolveTrack(id).then((track) => {
      if (track !== null) return app.playTrack(track);
    });
  }
}
```

And extend the `navigate` handler so returning Home refreshes recents:

```typescript
if (action === "navigate" && isRoute(value)) {
  app.dispatch({ type: "navigate", route: value });
  if (value === "home") void app.loadRecent();
}
```

(`main.js` is excluded from coverage; the logic is covered through `app.test.mjs`.)

- [ ] **Step 4: Run full verification**

Run: `bun run test:coverage && bun run typecheck && bun run lint`
Expected: PASS, 100% coverage, clean lint

- [ ] **Step 5: Commit**

```bash
git add src/app.ts src/main.ts tests/app.test.mjs
git commit -m "feat(player): resume tracks from home recent list"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full verify**

Run: `bun run verify:web`
Expected: all stages pass (lint, typecheck, coverage, build, smoke)

- [ ] **Step 2: Manual smoke (optional, browser)**

Run: `bun run dev:web`, play a talk, pause mid-way, navigate Home → confirm "Continue listening" card shows title + "Resume at m:ss", click it → playback resumes at saved position.

- [ ] **Step 3: Commit any fixes**

```bash
git add <fixed files>
git commit -m "fix(home): <whatever the smoke test surfaced>"
```
