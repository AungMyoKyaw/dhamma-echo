import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, reduce } from "../.test-build/src/store.js";
import { tracks } from "./test-data.mjs";

test("navigation and search actions update deterministic state", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "set-query", query: "  mettā  " });
  state = reduce(state, { type: "set-language", language: "myanmar" });
  state = reduce(state, { type: "set-offset", offset: 50 });
  assert.equal(state.route, "explore");
  assert.equal(state.search.query, "mettā");
  assert.equal(state.search.language, "myanmar");
  assert.equal(state.search.offset, 50);
  state = reduce(state, { type: "set-format", format: "mp3" });
  assert.equal(state.search.offset, 0);
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
  const settings = { theme: "dark", playbackRate: 1.5, volume: 0.6 };
  state = reduce(state, { type: "hydrate", library, settings });
  assert.equal(state.settings.theme, "dark");
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
  state = reduce(state, { type: "set-theme", theme: "light" });
  state = reduce(state, { type: "set-volume", volume: -2 });
  state = reduce(state, { type: "set-rate", rate: 4 });
  assert.deepEqual(state.settings, { theme: "light", volume: 0, playbackRate: 2 });
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
