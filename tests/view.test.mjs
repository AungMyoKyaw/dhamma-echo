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
  assert.match(html, /class="search-form/);
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
    format: "wma",
    teacherName: ""
  };
  state = reduce(state, {
    type: "search-loaded",
    page: {
      items: [tracks[0], unavailable, { ...tracks[1], playable: false }],
      total: 3,
      limit: 50,
      offset: 0
    }
  });
  state = reduce(state, { type: "save-resume", id: 1, currentTime: 65 });
  state = reduce(state, { type: "toggle-favorite", id: 1 });
  state = reduce(state, { type: "play-track", track: unavailable });
  state = reduce(state, { type: "player-progress", currentTime: 5, duration: 100 });
  state = reduce(state, { type: "enqueue", track: tracks[0] });
  state = reduce(state, { type: "player-status", status: "playing" });
  state = reduce(state, { type: "toggle-queue" });
  let html = renderApp(state);
  assert.match(html, /WMA unavailable/);
  assert.match(html, />Unavailable<\/span>/);
  assert.match(html, /Resume at 1:05/);
  assert.match(html, /Unknown teacher/);
  assert.match(html, /Up next/);
  assert.match(html, /aria-label="Pause"/);
  assert.match(html, /data-action="seek-backward"/);
  assert.match(html, /data-action="seek-forward"/);
  assert.match(html, /title="Jump back 15 seconds"/);
  assert.match(html, /title="Jump forward 15 seconds"/);
  assert.match(html, /class="player-controls/);
  assert.match(html, /transport-button-primary/);
  assert.match(html, /player-volume-control/);
  assert.match(html, /aria-label="Volume"/);
  assert.match(html, /fill-current/);

  state = reduce(state, { type: "clear-queue" });
  html = renderApp(state);
  assert.match(html, /Your queue is empty/);
  state = reduce(state, { type: "set-theme", theme: "dark" });
  html = renderApp(state);
  assert.match(html, /aria-label="Change color theme"/);
  assert.match(html, /viewBox="0 0 24 24"/);
});

test("renderApp makes the whole track row playable only when the track is playable", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, {
    type: "search-loaded",
    page: { items: [tracks[0], { ...tracks[1], playable: false }], total: 2, limit: 50, offset: 0 }
  });
  const html = renderApp(state);
  assert.match(html, /<article[^>]*data-action="play-track" data-id="1"/);
  assert.doesNotMatch(html, /<article[^>]*data-action="play-track" data-id="2"/);
  assert.match(html, /cursor-pointer/);
  assert.match(html, /track-play-button/);
  assert.match(html, /title="Play Praise and Blame"/);
});

test("renderApp shows a clearable teacher chip when the explore list is teacher-scoped", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "teachers-loaded", teachers });
  state = reduce(state, { type: "set-teacher", teacherId: 3 });
  state = reduce(state, {
    type: "search-loaded",
    page: { items: tracks, total: 2, limit: 50, offset: 0 }
  });
  const html = renderApp(state);
  assert.match(html, /Teacher: Venerable Sayadaw U Jotika/);
  assert.match(html, /data-action="clear-teacher"/);
  const cleared = reduce(state, { type: "set-teacher", teacherId: null });
  assert.doesNotMatch(renderApp(cleared), /clear-teacher/);
});

test("renderApp renders the teacher search bar and results", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, { type: "teachers-loaded", teachers });
  let html = renderApp(state);
  assert.match(html, /data-form="teacher-search"/);
  assert.match(html, /Venerable Sayadaw U Jotika/);
  state = reduce(state, { type: "set-teacher-query", query: "dhammasami" });
  state = reduce(state, { type: "teacher-results", teachers: [teachers[1]] });
  html = renderApp(state);
  assert.match(html, /value="dhammasami"/);
  assert.match(html, /Dr\. K\. Dhammasami/);
  assert.doesNotMatch(html, /U Jotika/);
  state = reduce(state, { type: "teacher-results", teachers: [] });
  assert.match(renderApp(state), /No teachers match/);
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

test("renderApp keeps the fixed player compact and exposes recovery controls", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, { type: "teachers-loaded", teachers });
  state = reduce(state, { type: "play-track", track: tracks[0] });
  state = reduce(state, { type: "set-player-error", message: "Stream failed" });
  const html = renderApp(state);
  assert.match(html, /data-action="select-teacher" data-id="3"/);
  assert.match(html, /pb-40/);
  assert.match(html, /class="player-grid/);
  assert.match(html, /class="player-controls/);
  assert.match(html, /transport-button-primary/);
  assert.match(html, /data-action="retry-playback"/);
});

test("renderApp covers loading and paused player control states", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, {
    type: "search-loaded",
    page: { items: tracks, total: 2, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "play-track", track: tracks[0] });

  let html = renderApp(state);
  assert.match(html, /Connecting…/);
  assert.match(html, /Connecting to Praise and Blame/);
  assert.match(html, /aria-label="Connecting to audio"/);
  assert.match(html, /transport-button-primary[^>]*disabled/);

  state = reduce(state, { type: "player-status", status: "paused" });
  html = renderApp(state);
  assert.match(html, /aria-label="Play"/);
  assert.match(html, /Space: play\/pause/);
  assert.match(html, /track-play-icon is-play/);
});

test("renderApp resolves teacher chip names from the player and safe fallback", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "play-track", track: tracks[0] });
  state = reduce(state, { type: "set-teacher", teacherId: tracks[0].id });
  state = reduce(state, {
    type: "search-loaded",
    page: { items: tracks, total: 2, limit: 50, offset: 0 }
  });
  assert.match(renderApp(state), /Teacher: Venerable Sayadaw U Jotika/);

  state = reduce(state, { type: "set-teacher", teacherId: 9999 });
  assert.match(renderApp(state), /Teacher: selected teacher/);
});

test("renderApp shows continue-listening on home and hides it without history", () => {
  let state = createInitialState();
  assert.doesNotMatch(renderApp(state), /Continue listening/);

  state = reduce(state, { type: "record-history", id: 1, playedAt: 10 });
  state = reduce(state, { type: "record-history", id: 2, playedAt: 20 });
  state = reduce(state, { type: "recent-started" });
  assert.match(renderApp(state), /Continue listening/);
  assert.match(renderApp(state), /h-20 animate-pulse rounded-card bg-app-soft/);

  state = reduce(state, { type: "recent-failed" });
  assert.doesNotMatch(renderApp(state), /Continue listening/);

  state = reduce(state, { type: "recent-loaded", tracks });
  assert.doesNotMatch(renderApp(state), /Resume at/);
  state = reduce(state, { type: "save-resume", id: 1, currentTime: 95 });
  const html = renderApp(state);
  assert.match(html, /Continue listening/);
  assert.match(html, /Resume at 1:35/);
  assert.match(html, /data-action="play-track" data-id="2"/);
  assert.match(html, /Praise and Blame/);

  const emptyResume = reduce(state, { type: "save-resume", id: 1, currentTime: 0 });
  assert.doesNotMatch(renderApp(emptyResume), /Resume at/);

  const playing = reduce(reduce(state, { type: "play-track", track: tracks[0] }), {
    type: "player-status",
    status: "playing"
  });
  assert.match(renderApp(playing), /<path d="M8 6.5h3.25v11H8zM12.75 6.5H16v11h-3.25z"/);

  const rowsEmpty = reduce(state, { type: "recent-loaded", tracks: [tracks[0]] });
  assert.doesNotMatch(
    renderApp(rowsEmpty),
    /overflow-hidden rounded-card border border-app-border bg-app-surface"><article/
  );

  const emptyRecent = reduce(state, { type: "recent-loaded", tracks: [] });
  assert.doesNotMatch(renderApp(emptyRecent), /Continue listening/);

  const unknownTeacher = reduce(state, {
    type: "recent-loaded",
    tracks: [{ ...tracks[0], teacherName: "" }]
  });
  assert.match(renderApp(unknownTeacher), /Unknown teacher/);

  const manyRecent = reduce(state, {
    type: "recent-loaded",
    tracks: [
      tracks[0],
      ...Array.from({ length: 5 }, (_, index) => ({ ...tracks[1], id: index + 2 }))
    ]
  });
  assert.equal([...renderApp(manyRecent).matchAll(/<article class="track-row/g)].length, 4);

  const unplayable = reduce(state, {
    type: "recent-loaded",
    tracks: [{ ...tracks[0], playable: false }]
  });
  const unplayableHtml = renderApp(unplayable);
  assert.match(unplayableHtml, /Continue listening/);
  assert.doesNotMatch(unplayableHtml, /data-action="play-track" data-id="1"/);
});
