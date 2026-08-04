import test from "node:test";
import assert from "node:assert/strict";
import { renderApp } from "../.test-build/src/view.js";
import { createInitialState, reduce } from "../.test-build/src/store.js";
import { tracks, teachers } from "./test-data.mjs";

test("renderApp produces accessible navigation and home summary", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "summary-loaded",
    summary: { totalAudio: 21402, totalTeachers: 212, myanmarAudio: 21074, englishAudio: 328 }
  });
  state = reduce(state, { type: "teachers-loaded", teachers });
  const html = renderApp(state);
  assert.match(html, /Dhamma Echo/);
  assert.match(html, /21,402/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /data-action="navigate" data-value="explore"/);
});

test("renderApp renders catalogue, errors, empty state, and player safely", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, {
    type: "search-loaded",
    page: { items: tracks, total: 2, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "play-track", track: { ...tracks[0], title: "<b>unsafe</b>" } });
  state = reduce(state, { type: "set-player-error", message: "Network unavailable" });
  let html = renderApp(state);
  assert.match(html, /&lt;b&gt;unsafe&lt;\/b&gt;/);
  assert.match(html, /Network unavailable/);
  assert.match(html, /data-action="play-track"/);
  state = reduce(state, {
    type: "search-loaded",
    page: { items: [], total: 0, limit: 50, offset: 0 }
  });
  html = renderApp(state);
  assert.match(html, /No talks match these filters/);
  state = reduce(state, { type: "search-failed", message: "Database unavailable" });
  html = renderApp(state);
  assert.match(html, /Database unavailable/);
  assert.match(html, /data-action="retry-search"/);
});

test("renderApp covers every route and catalogue state", () => {
  let state = createInitialState();
  state = reduce(state, { type: "summary-failed", message: "Summary unavailable" });
  assert.match(renderApp(state), /retry-summary/);

  state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "search-started" });
  assert.match(renderApp(state), /Loading talks/);
  state = reduce(state, {
    type: "search-loaded",
    page: { items: tracks, total: 120, limit: 50, offset: 50 }
  });
  let html = renderApp(state);
  assert.match(html, /51–100 of 120 talks/);
  assert.doesNotMatch(html, /data-action="next-page" disabled/);
  assert.doesNotMatch(html, /data-action="previous-page" disabled/);

  state = reduce(state, { type: "navigate", route: "teachers" });
  assert.match(renderApp(state), /Loading talks/);
  state = reduce(state, { type: "teachers-failed", message: "Teacher failure" });
  assert.match(renderApp(state), /retry-teachers/);
  state = reduce(state, { type: "teachers-loaded", teachers: [] });
  assert.match(renderApp(state), /No teachers found/);
  state = reduce(state, { type: "teachers-loaded", teachers });
  assert.match(renderApp(state), /Venerable Sayadaw U Jotika/);

  state = reduce(state, { type: "navigate", route: "library" });
  assert.match(renderApp(state), /Your library is ready/);
  state = reduce(state, { type: "toggle-favorite", id: 99 });
  assert.match(renderApp(state), /Favorites saved/);
  state = reduce(state, { type: "play-track", track: tracks[0] });
  state = reduce(state, { type: "toggle-favorite", id: 99 });
  state = reduce(state, { type: "toggle-favorite", id: 1 });
  assert.match(renderApp(state), /1 saved talks/);

  state = reduce(state, { type: "navigate", route: "settings" });
  html = renderApp(state);
  assert.match(html, /Follow system/);
  assert.match(html, /Default speed/);
});

test("renderApp covers player, queue, unavailable tracks, and resume metadata", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  const unavailable = {
    ...tracks[1],
    url: "http://dhammadownload.com/old.wma",
    playable: false,
    teacherName: ""
  };
  state = reduce(state, {
    type: "search-loaded",
    page: { items: [tracks[0], unavailable], total: 2, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "save-resume", id: 1, currentTime: 65 });
  state = reduce(state, { type: "toggle-favorite", id: 1 });
  state = reduce(state, { type: "play-track", track: unavailable });
  state = reduce(state, { type: "player-progress", currentTime: 5, duration: 100 });
  state = reduce(state, { type: "enqueue", track: tracks[0] });
  state = reduce(state, { type: "player-status", status: "playing" });
  state = reduce(state, { type: "toggle-queue" });
  let html = renderApp(state);
  assert.match(html, /Legacy HTTP/);
  assert.match(html, /Resume at 1:05/);
  assert.match(html, /Unknown teacher/);
  assert.match(html, /Up next/);
  assert.match(html, /aria-label="Pause"/);
  assert.match(html, /fill-current/);

  state = reduce(state, { type: "clear-queue" });
  html = renderApp(state);
  assert.match(html, /Your queue is empty/);
  state = reduce(state, { type: "set-theme", theme: "dark" });
  html = renderApp(state);
  assert.match(html, /aria-label="Change color theme"/);
  assert.match(html, /viewBox="0 0 24 24"/);
});

test("renderApp covers empty teacher highlights and every filter selection", () => {
  let state = createInitialState();
  state = reduce(state, { type: "teachers-loaded", teachers: [] });
  assert.match(renderApp(state), /Teacher highlights will appear here/);
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "set-language", language: "myanmar" });
  state = reduce(state, { type: "set-format", format: "mp3" });
  let html = renderApp(state);
  assert.match(html, /value="myanmar" selected/);
  assert.match(html, /value="mp3" selected/);
  state = reduce(state, { type: "set-language", language: "english" });
  state = reduce(state, { type: "set-format", format: "wma" });
  html = renderApp(state);
  assert.match(html, /value="english" selected/);
  assert.match(html, /value="wma" selected/);
});
