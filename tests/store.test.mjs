import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, reduce } from "../.test-build/src/store.js";
import { tracks } from "./test-data.mjs";

test("navigation and search actions update deterministic state", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "set-query", query: "  mettā  " });
  state = reduce(state, { type: "set-language", language: "myanmar" });
  assert.equal(state.route, "explore");
  assert.equal(state.search.query, "mettā");
  assert.equal(state.search.language, "myanmar");
  assert.equal(state.search.offset, 0);
  state = reduce(state, { type: "set-format", format: "mp3" });
  assert.equal(state.search.offset, 0);
});

test("browse row size is shared across catalogue surfaces", () => {
  let state = createInitialState();
  state = reduce(state, { type: "set-browse-limit", limit: 100 });

  assert.equal(state.settings.browseLimit, 100);
  assert.equal(state.search.limit, 100);
  assert.equal(state.collectionSearch.limit, 100);
  assert.equal(state.search.offset, 0);
  assert.equal(state.collectionSearch.offset, 0);
});

test("theme remains light until the user chooses dark", () => {
  let state = createInitialState();
  assert.equal(state.settings.theme, "light");
  state = reduce(state, { type: "set-theme", theme: "dark" });
  assert.equal(state.settings.theme, "dark");
});

test("catalogue requests expose loading, success, and error states", () => {
  let state = createInitialState();
  state = reduce(state, { type: "search-started" });
  assert.equal(state.catalogue.status, "loading");
  state = reduce(state, {
    type: "search-loaded",
    page: { items: tracks, total: 2, limit: 50, offset: 0 }
  });
  assert.equal(state.catalogue.status, "ready");
  assert.equal(state.catalogue.page.items.length, 2);
  state = reduce(state, { type: "search-failed", message: "offline" });
  assert.equal(state.catalogue.status, "error");
  assert.equal(state.catalogue.message, "offline");
});

test("catalogue and collection appends preserve and deduplicate visible results", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "search-loaded",
    mode: "initial",
    page: { items: tracks, total: 3, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "search-started", mode: "append" });
  state = reduce(state, {
    type: "search-loaded",
    mode: "append",
    page: {
      items: [tracks[1], { ...tracks[0], id: 3 }],
      total: 3,
      limit: 50,
      offset: 2
    }
  });
  assert.deepEqual(
    state.catalogue.page.items.map(({ id }) => id),
    [1, 2, 3]
  );
  assert.equal(state.catalogue.exhausted, true);

  const firstCollection = {
    id: 10,
    name: "One",
    teacherId: 3,
    teacherName: "Teacher",
    audioCount: 1
  };
  state = reduce(state, {
    type: "collections-loaded",
    mode: "initial",
    page: { items: [firstCollection], total: 2, limit: 24, offset: 0 }
  });
  state = reduce(state, { type: "collections-started", mode: "append" });
  state = reduce(state, {
    type: "collections-loaded",
    mode: "append",
    page: {
      items: [firstCollection, { ...firstCollection, id: 11, name: "Two" }],
      total: 2,
      limit: 24,
      offset: 1
    }
  });
  assert.deepEqual(
    state.collections.page.items.map(({ id }) => id),
    [10, 11]
  );
  assert.equal(state.collections.exhausted, true);
});

test("append failures and no-progress responses preserve progressive lists", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "search-loaded",
    mode: "initial",
    page: { items: tracks, total: 4, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "search-started", mode: "append" });
  state = reduce(state, {
    type: "search-failed",
    mode: "append",
    message: "audio retry"
  });
  assert.equal(state.catalogue.status, "ready");
  assert.equal(state.catalogue.loadMoreMessage, "audio retry");
  state = reduce(state, { type: "search-started", mode: "append" });
  state = reduce(state, {
    type: "search-loaded",
    mode: "append",
    page: { items: [], total: 4, limit: 50, offset: 2 }
  });
  assert.equal(state.catalogue.exhausted, true);

  state = reduce(state, {
    type: "collections-loaded",
    mode: "initial",
    page: { items: [], total: 2, limit: 24, offset: 0 }
  });
  state = reduce(state, { type: "collections-started", mode: "append" });
  state = reduce(state, {
    type: "collections-failed",
    mode: "append",
    message: "collection retry"
  });
  assert.equal(state.collections.status, "ready");
  assert.equal(state.collections.loadMoreMessage, "collection retry");
});

test("favorites, history, and queue remain unique and bounded", () => {
  let state = createInitialState();
  state = reduce(state, { type: "toggle-favorite", id: 1 });
  state = reduce(state, { type: "toggle-favorite", id: 2 });
  state = reduce(state, { type: "toggle-favorite", id: 1 });
  assert.deepEqual(state.library.favorites, [2]);
  state = reduce(state, { type: "enqueue", track: tracks[0] });
  state = reduce(state, { type: "enqueue", track: tracks[0] });
  state = reduce(state, { type: "enqueue", track: tracks[1] });
  assert.deepEqual(
    state.player.queue.map((track) => track.id),
    [1, 2]
  );
  state = reduce(state, { type: "remove-queue", id: 1 });
  assert.deepEqual(
    state.player.queue.map((track) => track.id),
    [2]
  );
  for (let id = 1; id <= 105; id += 1)
    state = reduce(state, { type: "record-history", id, playedAt: id });
  assert.equal(state.library.history.length, 100);
  assert.equal(state.library.history[0].id, 105);
});

test("player actions select tracks, advance queue, and update progress", () => {
  let state = createInitialState();
  state = reduce(state, { type: "play-track", track: tracks[0] });
  state = reduce(state, { type: "enqueue", track: tracks[1] });
  state = reduce(state, { type: "player-status", status: "playing" });
  state = reduce(state, { type: "player-progress", currentTime: 10, duration: 120 });
  assert.equal(state.player.current?.id, 1);
  assert.equal(state.player.status, "playing");
  assert.equal(state.player.currentTime, 10);
  state = reduce(state, { type: "play-next" });
  assert.equal(state.player.current?.id, 2);
  assert.equal(state.player.queue.length, 0);
  state = reduce(state, { type: "play-next" });
  assert.equal(state.player.status, "paused");
  state = reduce(state, { type: "set-volume", volume: 0.25 });
  state = reduce(state, { type: "set-rate", rate: 1.75 });
  state = reduce(state, { type: "set-player-error", message: "network" });
  assert.equal(state.settings.volume, 0.25);
  assert.equal(state.settings.playbackRate, 1.75);
  assert.equal(state.player.error, "network");
});

test("all load, failure, persistence, queue, and settings actions are deterministic", () => {
  let state = createInitialState();
  const library = { favorites: [1], history: [{ id: 1, playedAt: 10 }], resume: { 1: 3 } };
  const settings = { playbackRate: 1.5, volume: 0.6 };
  state = reduce(state, { type: "hydrate", library, settings });
  assert.equal(state.settings.playbackRate, 1.5);
  state = reduce(state, { type: "summary-started" });
  state = reduce(state, { type: "summary-failed", message: "summary fail" });
  assert.equal(state.summary.message, "summary fail");
  state = reduce(state, { type: "teachers-started" });
  state = reduce(state, { type: "teachers-failed", message: "teachers fail" });
  assert.equal(state.teachers.message, "teachers fail");
  state = reduce(state, { type: "set-teacher", teacherId: 3 });
  assert.equal(state.search.teacherId, 3);
  state = reduce(state, { type: "save-resume", id: 1, currentTime: -4 });
  assert.equal(state.library.resume["1"], 0);
  state = reduce(state, { type: "enqueue", track: tracks[0] });
  state = reduce(state, { type: "clear-queue" });
  assert.deepEqual(state.player.queue, []);
  state = reduce(state, { type: "toggle-queue" });
  assert.equal(state.player.queueOpen, true);
  state = reduce(state, { type: "set-volume", volume: -2 });
  state = reduce(state, { type: "set-rate", rate: 4 });
  assert.deepEqual(state.settings, { volume: 0, playbackRate: 2 });
});

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

test("audio discovery filters and detail navigation are deterministic", () => {
  let state = createInitialState();
  state = reduce(state, { type: "set-category", categoryId: 4 });
  assert.equal(state.search.categoryId, 4);
  assert.equal(state.search.offset, 0);

  state = reduce(state, { type: "set-collection", collectionId: 10 });
  assert.equal(state.search.collectionId, 10);
  state = reduce(state, { type: "clear-category" });
  assert.equal(state.search.categoryId, null);
  assert.equal(state.search.collectionId, 10);

  state = reduce(state, {
    type: "open-collection",
    collectionId: 10,
    returnRoute: "collections"
  });
  assert.equal(state.route, "collection-detail");
  assert.equal(state.selectedCollectionId, 10);
  assert.deepEqual(state.navigationContext, { returnRoute: "collections" });

  state = reduce(state, { type: "open-teacher", teacherId: 3, returnRoute: "teachers" });
  assert.equal(state.route, "teacher-detail");
  assert.equal(state.selectedTeacherId, 3);
  assert.deepEqual(state.navigationContext, { returnRoute: "teachers" });
});

test("audio discovery loadable states preserve independent pagination", () => {
  let state = createInitialState();
  state = reduce(state, { type: "categories-loaded", categories: [{ id: 1 }] });
  assert.equal(state.categories.status, "ready");
  state = reduce(state, { type: "set-collection-query", query: " disc  one " });
  assert.equal(state.collectionSearch.query, "disc one");
  assert.equal(state.collectionSearch.offset, 0);
  assert.equal(state.search.offset, 0);
  assert.equal(state.teacherTalks.page.offset, 0);
  state = reduce(state, { type: "collection-detail-failed", message: "missing" });
  assert.equal(state.collectionDetail.status, "error");
  assert.equal(state.collectionDetail.message, "missing");
  state = reduce(state, { type: "return-to-list" });
  assert.equal(state.route, "home");
});

test("audio discovery failures and remaining transitions stay isolated", () => {
  let state = createInitialState();
  state = reduce(state, { type: "categories-started" });
  assert.equal(state.categories.status, "loading");
  state = reduce(state, { type: "categories-failed", message: "categories offline" });
  assert.equal(state.categories.message, "categories offline");
  state = reduce(state, { type: "set-collection", collectionId: 10 });
  state = reduce(state, { type: "clear-collection" });
  assert.equal(state.search.collectionId, null);
  state = reduce(state, { type: "set-collection-teacher", teacherId: 3 });
  assert.equal(state.collectionSearch.teacherId, 3);
  state = reduce(state, { type: "collections-started" });
  assert.equal(state.collections.status, "loading");
  state = reduce(state, { type: "collections-failed", message: "collections offline" });
  assert.equal(state.collections.message, "collections offline");
  state = reduce(state, { type: "teacher-detail-failed", message: "teacher missing" });
  assert.equal(state.teacherDetail.message, "teacher missing");
  state = reduce(state, { type: "teacher-talks-started", mode: "initial" });
  assert.equal(state.teacherTalks.status, "loading");
  state = reduce(state, {
    type: "teacher-talks-failed",
    mode: "initial",
    message: "talks offline"
  });
  assert.equal(state.teacherTalks.message, "talks offline");
});

test("teacher talks append unique records and expose completion", () => {
  let state = createInitialState();
  state = reduce(state, { type: "teacher-talks-started", mode: "initial" });
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "initial",
    page: { items: tracks, total: 3, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "teacher-talks-started", mode: "append" });
  assert.equal(state.teacherTalks.loadingMore, true);
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "append",
    page: {
      items: [tracks[1], { ...tracks[0], id: 3, title: "Third talk" }],
      total: 3,
      limit: 50,
      offset: 2
    }
  });
  assert.deepEqual(
    state.teacherTalks.page.items.map((track) => track.id),
    [1, 2, 3]
  );
  assert.equal(state.teacherTalks.page.offset, 0);
  assert.equal(state.teacherTalks.loadingMore, false);
  assert.equal(state.teacherTalks.exhausted, true);
});

test("teacher talk append failures preserve records and empty appends exhaust loading", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "initial",
    page: { items: tracks, total: 5, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "teacher-talks-started", mode: "append" });
  state = reduce(state, {
    type: "teacher-talks-failed",
    mode: "append",
    message: "temporary failure"
  });
  assert.deepEqual(state.teacherTalks.page.items, tracks);
  assert.equal(state.teacherTalks.status, "ready");
  assert.equal(state.teacherTalks.loadMoreMessage, "temporary failure");

  state = reduce(state, { type: "teacher-talks-started", mode: "append" });
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "append",
    page: { items: [], total: 5, limit: 50, offset: 2 }
  });
  assert.equal(state.teacherTalks.exhausted, true);

  state = reduce(state, { type: "open-teacher", teacherId: 4, returnRoute: "teachers" });
  assert.deepEqual(state.teacherTalks.page.items, []);
  assert.equal(state.teacherTalks.exhausted, false);
  assert.equal(state.teacherTalks.loadMoreMessage, "");
});
