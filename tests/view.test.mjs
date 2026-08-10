import test from "node:test";
import assert from "node:assert/strict";
import { renderApp } from "../.test-build/src/view.js";
import { createInitialState, reduce } from "../.test-build/src/store.js";
import { categories, collections, incompleteTrack, tracks, teachers } from "./test-data.mjs";

function teacherCards(html) {
  return new Map(
    [
      ...html.matchAll(
        /<button[^>]*data-action="select-teacher" data-id="(\d+)"[^>]*>([\s\S]*?)<\/button>/gu
      )
    ].map(([, id, card]) => [Number(id), card])
  );
}

const featuredTeachers = [
  { id: 8, name: "Rector Sayadaw", audioCount: 3389 },
  { id: 53, name: "Maha Bodhi Myaing Sayadaw", audioCount: 229 },
  { id: 16, name: "Mogok Sayadaw", audioCount: 942 },
  { id: 61, name: "U Jotika", audioCount: 73 },
  {
    id: 40,
    name: "ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ",
    audioCount: 1321
  },
  { id: 42, name: "The-Inn-Gu Sayadaw", audioCount: 96 }
];

test("renderApp produces accessible navigation and home summary", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "summary-loaded",
    summary: { totalAudio: 30563, totalTeachers: 257, myanmarAudio: 30098, englishAudio: 465 }
  });
  state = reduce(state, { type: "teachers-loaded", teachers });
  const html = renderApp(state);
  assert.match(html, /Dhamma Echo/);
  assert.match(html, /30,563/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /data-action="navigate" data-value="explore"/);
});

test("renderApp uses the loaded catalogue size in the Explore header", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "summary-loaded",
    summary: { totalAudio: 30563, totalTeachers: 257, myanmarAudio: 30098, englishAudio: 465 }
  });
  state = reduce(state, { type: "navigate", route: "explore" });

  assert.match(renderApp(state), /30,563 audio talks/);
});

test("renderApp uses the mobile featured teacher list and exact order", () => {
  let state = createInitialState();
  const loaded = [...featuredTeachers, { id: 999, name: "Unrelated", audioCount: 9999 }];
  state = reduce(state, { type: "teachers-loaded", teachers: loaded });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(([, id]) =>
    Number(id)
  );
  assert.deepEqual(ids, [16, 42, 40, 53, 61, 8]);
  assert.doesNotMatch(html, /Unrelated/);

  state = reduce(state, {
    type: "teachers-loaded",
    teachers: loaded.filter(({ id }) => id !== 40)
  });
  const missingIds = [
    ...renderApp(state).matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)
  ].map(([, id]) => Number(id));
  assert.deepEqual(missingIds, [16, 42, 53, 61, 8]);
});

test("renderApp expands featured teachers when recent tracks are unavailable", () => {
  let state = createInitialState();
  state = reduce(state, {
    type: "summary-loaded",
    summary: { totalAudio: 30563, totalTeachers: 257, myanmarAudio: 30098, englishAudio: 465 }
  });
  state = reduce(state, { type: "teachers-loaded", teachers: featuredTeachers });
  state = reduce(state, { type: "record-history", id: 999999, playedAt: 10 });
  state = reduce(state, { type: "recent-loaded", tracks: [] });

  const html = renderApp(state);
  assert.match(html, /data-featured-layout="grid"/);
  assert.match(html, /grid grid-cols-3 gap-4/);
  assert.match(html, /30,563/);
  assert.doesNotMatch(html, /line-clamp-2/);
  assert.match(html, />Featured<[^]*ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ/u);
  assert.match(html, /class="[^"]*myanmar-text[^"]*" lang="my"/u);
});

test("renderApp keeps featured teachers compact with recent content", () => {
  let state = createInitialState();
  state = reduce(state, { type: "teachers-loaded", teachers: featuredTeachers });
  state = reduce(state, { type: "recent-loaded", tracks: [tracks[0]] });

  const html = renderApp(state);
  assert.match(html, /Continue listening/);
  assert.match(html, /data-featured-layout="carousel"/);
  assert.match(html, /scrollbar-thin flex gap-4 overflow-x-auto/);
  assert.match(html, /-mx-2 px-2 pb-4 pt-2/);
});

test("renderApp pins featured teachers and labels their cards on the Teachers page", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, {
    type: "teachers-loaded",
    teachers: [
      { id: 900, name: "First regular", audioCount: 900 },
      { id: 42, name: "Teacher 42", audioCount: 96 },
      { id: 901, name: "Second regular", audioCount: 901 },
      { id: 8, name: "Teacher 8", audioCount: 3389 },
      { id: 902, name: "Third regular", audioCount: 902 },
      { id: 16, name: "Teacher 16", audioCount: 942 },
      { id: 53, name: "Teacher 53", audioCount: 229 },
      { id: 40, name: "Teacher 40", audioCount: 1321 },
      { id: 61, name: "Teacher 61", audioCount: 73 }
    ]
  });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(([, id]) =>
    Number(id)
  );
  const cards = teacherCards(html);
  assert.deepEqual(ids, [16, 42, 40, 53, 61, 8, 900, 901, 902]);
  for (const id of [16, 42, 40, 53, 61, 8]) {
    const card = cards.get(id);
    assert.ok(card, `Missing featured teacher card ${id}`);
    assert.equal((card.match(/>Featured</gu) ?? []).length, 1);
  }
  for (const id of [900, 901, 902]) {
    const card = cards.get(id);
    assert.ok(card, `Missing regular teacher card ${id}`);
    assert.equal((card.match(/>Featured</gu) ?? []).length, 0);
  }
});

test("renderApp skips missing curated teachers while preserving default ordering", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, {
    type: "teachers-loaded",
    teachers: [
      { id: 900, name: "First regular", audioCount: 900 },
      { id: 40, name: "Teacher 40", audioCount: 1321 },
      { id: 901, name: "Second regular", audioCount: 901 },
      { id: 16, name: "Teacher 16", audioCount: 942 }
    ]
  });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(([, id]) =>
    Number(id)
  );
  const cards = teacherCards(html);
  assert.deepEqual(ids, [16, 40, 900, 901]);
  for (const id of [16, 40]) {
    const card = cards.get(id);
    assert.ok(card, `Missing featured teacher card ${id}`);
    assert.equal((card.match(/>Featured</gu) ?? []).length, 1);
  }
  for (const id of [900, 901]) {
    const card = cards.get(id);
    assert.ok(card, `Missing regular teacher card ${id}`);
    assert.equal((card.match(/>Featured</gu) ?? []).length, 0);
  }
});

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
      { id: 8, name: "Featured match", audioCount: 3389 },
      { id: 901, name: "Second regular", audioCount: 901 }
    ]
  });

  const html = renderApp(state);
  const ids = [...html.matchAll(/data-action="select-teacher" data-id="(\d+)"/gu)].map(([, id]) =>
    Number(id)
  );
  const cards = teacherCards(html);
  assert.deepEqual(ids, [900, 8, 901]);
  assert.equal((html.match(/>Featured</gu) ?? []).length, 1);
  assert.match(cards.get(8) ?? "", />Featured</u);
  assert.doesNotMatch(cards.get(900) ?? "", />Featured</u);
  assert.doesNotMatch(cards.get(901) ?? "", />Featured</u);
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
  assert.match(html, /Showing 2 of 120 talks/);
  assert.match(html, /Load 50 more talks/);
  assert.match(html, /data-action="load-more-search"/);
  assert.doesNotMatch(html, /previous-page|next-page/);

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
  assert.match(html, /Default speed/);
  assert.doesNotMatch(html, /Appearance|data-setting="theme"/);
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
  state = reduce(state, { type: "navigate", route: "settings" });
  html = renderApp(state);
  assert.doesNotMatch(html, /cycle-theme|data-setting="theme"|Appearance/);
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
  state = reduce(state, { type: "teacher-results", teachers: [teachers[2]] });
  html = renderApp(state);
  assert.match(html, /value="dhammasami"/);
  assert.match(html, /data-action="clear-teacher-search"/);
  assert.match(html, /Dr\. K\. Dhammasami/);
  assert.doesNotMatch(html, /U Jotika/);
  state = reduce(state, { type: "teacher-results", teachers: [] });
  assert.match(renderApp(state), /No teachers match/);
});

test("renderApp exposes clear actions for every populated text search", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "set-query", query: "metta" });
  assert.match(renderApp(state), /data-action="clear-search-query"/);

  state = reduce(state, { type: "navigate", route: "collections" });
  state = reduce(state, { type: "set-collection-query", query: "disc" });
  assert.match(renderApp(state), /data-action="clear-collection-search"/);
  state = reduce(state, {
    type: "collections-loaded",
    mode: "initial",
    page: {
      items: [{ ...collections[0], name: "မေတ္တာသုတ်" }],
      total: 1,
      limit: 24,
      offset: 0
    }
  });
  assert.match(renderApp(state), /myanmar-text/);

  state = reduce(state, { type: "navigate", route: "teachers" });
  state = reduce(state, { type: "teachers-loaded", teachers });
  state = reduce(state, { type: "set-teacher-query", query: "sayadaw" });
  assert.match(renderApp(state), /data-action="clear-teacher-search"/);
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

test("renderApp exposes collection navigation and audio category filters", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "categories-loaded", categories });
  state = reduce(state, { type: "set-category", categoryId: 7 });
  state = reduce(state, { type: "set-collection", collectionId: 10 });
  const html = renderApp(state);
  assert.match(html, /data-value="collections"/);
  assert.match(html, /Audio in English/);
  assert.match(html, /data-action="clear-category"/);
  assert.match(html, /data-action="clear-collection"/);
});

test("renderApp distinguishes duplicate collection names with teacher context", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "collections" });
  state = reduce(state, {
    type: "collections-loaded",
    page: { items: collections, total: 2, limit: 24, offset: 0 }
  });
  const html = renderApp(state);
  assert.equal((html.match(/Dhamma Disc/gu) ?? []).length, 2);
  assert.match(html, /Venerable Sayadaw U Jotika/);
  assert.match(html, /Venerable Dr\. K\. Dhammasami/);
  assert.match(html, /data-action="open-collection" data-id="10"/);
});

test("renderApp groups ordered collections by teacher and hides redundant filtered heading", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "collections" });
  state = reduce(state, {
    type: "collections-loaded",
    mode: "initial",
    page: {
      items: [
        { ...collections[0], id: 12, name: "Disc 1", teacherName: "Teacher A" },
        { ...collections[0], id: 13, name: "Disc 2", teacherName: "Teacher A" },
        { ...collections[1], id: 14, name: "Disc 1", teacherName: "Teacher B" },
        {
          ...collections[1],
          id: 15,
          name: "Loose collection",
          teacherId: null,
          teacherName: ""
        }
      ],
      total: 4,
      limit: 24,
      offset: 0
    }
  });
  let html = renderApp(state);
  const teacherA = html.indexOf(">Teacher A<");
  const teacherB = html.indexOf(">Teacher B<");
  const unknown = html.indexOf(">Unknown teacher<");
  assert.ok(teacherA >= 0 && teacherA < teacherB && teacherB < unknown);
  assert.equal((html.match(/>Teacher A</gu) ?? []).length, 1);

  state = reduce(state, { type: "set-collection-teacher", teacherId: 3 });
  html = renderApp(state);
  assert.doesNotMatch(html, /data-collection-group-heading/);
});

test("renderApp renders collection and teacher details with playable incomplete audio", () => {
  let state = createInitialState();
  state = reduce(state, { type: "open-collection", collectionId: 10, returnRoute: "collections" });
  state = reduce(state, {
    type: "collection-detail-loaded",
    detail: {
      ...collections[0],
      description: null,
      tracks: [incompleteTrack, tracks[0]]
    }
  });
  let html = renderApp(state);
  assert.match(html, /Untitled talk/);
  assert.match(html, /Unknown teacher/);
  assert.match(html, /title="Play Untitled talk"/);
  assert.match(html, /data-action="back-to-list"/);

  state = reduce(state, { type: "open-teacher", teacherId: 3, returnRoute: "teachers" });
  state = reduce(state, {
    type: "teacher-detail-loaded",
    detail: {
      id: 3,
      name: teachers[1].name,
      nameMyanmar: null,
      title: null,
      description: null,
      audioCount: 2,
      collections: [collections[0], { ...collections[1], teacherName: "" }]
    }
  });
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "initial",
    page: { items: tracks, total: 2, limit: 50, offset: 0 }
  });
  html = renderApp(state);
  assert.match(html, /2 talks/);
  assert.match(html, /Dhamma Disc/);
  assert.match(html, /data-action="filter-teacher"/);
  assert.match(html, /Showing 2 of 2 talks/);
  assert.doesNotMatch(html, /previous-teacher-talks|next-teacher-talks/);
});

test("renderApp covers discovery loading, empty, and error states", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "collections" });
  assert.match(renderApp(state), /Loading talks/);
  state = reduce(state, { type: "teachers-loaded", teachers });
  state = reduce(state, { type: "set-collection-teacher", teacherId: teachers[1].id });
  state = reduce(state, { type: "collections-failed", message: "Collection failure" });
  let html = renderApp(state);
  assert.match(html, /retry-collections/);
  assert.match(html, /Collection teacher/);
  assert.match(html, /selected/);
  state = reduce(state, {
    type: "collections-loaded",
    page: { items: [], total: 0, limit: 24, offset: 0 }
  });
  assert.match(renderApp(state), /No collections match/);

  state = reduce(state, { type: "open-collection", collectionId: 99, returnRoute: "collections" });
  state = reduce(state, { type: "collection-detail-failed", message: "Missing collection" });
  assert.match(renderApp(state), /retry-collection/);
  state = reduce(state, {
    type: "collection-detail-loaded",
    detail: {
      id: 99,
      name: "Empty collection",
      description: "Description",
      teacherId: null,
      teacherName: "",
      audioCount: 0,
      tracks: []
    }
  });
  html = renderApp(state);
  assert.match(html, /No audio talks in this collection/);
  assert.match(html, /Unknown teacher/);
  assert.match(html, /Description/);

  state = reduce(state, { type: "open-teacher", teacherId: 99, returnRoute: "teachers" });
  state = reduce(state, { type: "teacher-detail-failed", message: "Missing teacher" });
  assert.match(renderApp(state), /retry-teacher-detail/);
  state = reduce(state, {
    type: "teacher-detail-loaded",
    detail: {
      id: 99,
      name: "Teacher",
      nameMyanmar: null,
      title: null,
      description: null,
      audioCount: 0,
      collections: []
    }
  });
  state = reduce(state, {
    type: "teacher-talks-failed",
    mode: "initial",
    message: "Talk failure"
  });
  assert.match(renderApp(state), /Talk failure/);
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "initial",
    page: { items: [], total: 0, limit: 50, offset: 0 }
  });
  assert.match(renderApp(state), /No talks found/);
});

test("renderApp covers discovery selection and pagination alternatives", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, { type: "categories-loaded", categories });
  let html = renderApp(state);
  assert.match(html, /bg-app-primary text-white[^>]*data-action="filter-category" data-id="0"/);

  state = reduce(state, { type: "navigate", route: "collections" });
  state = reduce(state, {
    type: "collections-loaded",
    page: {
      items: [{ ...collections[0], teacherName: "" }, collections[1]],
      total: 50,
      limit: 24,
      offset: 24
    }
  });
  html = renderApp(state);
  assert.match(html, /Showing 2 of 50 collections/);
  assert.match(html, /Load 24 more collections/);
  assert.match(html, /data-action="load-more-collections"/);
  assert.doesNotMatch(html, /previous-collections|next-collections/);
  assert.match(html, /Unknown teacher/);

  state = {
    ...state,
    route: "collection-detail",
    collectionDetail: { status: "ready", data: null, message: "" }
  };
  assert.match(renderApp(state), /Loading talks/);

  state = {
    ...state,
    route: "teacher-detail",
    teacherDetail: { status: "ready", data: null, message: "" }
  };
  assert.match(renderApp(state), /Loading talks/);

  state = reduce(state, {
    type: "teacher-detail-loaded",
    detail: {
      id: 3,
      name: "Teacher",
      nameMyanmar: null,
      title: null,
      description: null,
      audioCount: 100,
      collections: []
    }
  });
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "initial",
    page: { items: tracks, total: 120, limit: 50, offset: 50 }
  });
  html = renderApp(state);
  assert.match(html, /Showing 2 of 120 talks/);
  assert.match(html, /Load 50 more talks/);
  assert.match(html, /data-action="load-more-teacher-talks"/);
  assert.doesNotMatch(html, /previous-teacher-talks|next-teacher-talks/);
});

test("renderApp keeps teacher talks visible through load-more progress and retry", () => {
  let state = createInitialState();
  state = reduce(state, { type: "open-teacher", teacherId: 3, returnRoute: "teachers" });
  state = reduce(state, {
    type: "teacher-detail-loaded",
    detail: {
      id: 3,
      name: "Teacher",
      nameMyanmar: null,
      title: null,
      description: null,
      audioCount: 96,
      collections: []
    }
  });
  state = reduce(state, {
    type: "teacher-talks-loaded",
    mode: "initial",
    page: { items: tracks, total: 96, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "teacher-talks-started", mode: "append" });
  let html = renderApp(state);
  assert.match(html, /Praise and Blame/);
  assert.match(html, /Loading more…/);
  assert.match(html, /data-action="load-more-teacher-talks" disabled/);

  state = reduce(state, {
    type: "teacher-talks-failed",
    mode: "append",
    message: "Temporary failure"
  });
  html = renderApp(state);
  assert.match(html, /Temporary failure/);
  assert.match(html, /role="status"/);
  assert.match(html, />Retry</);
});

test("renderApp exposes progressive loading and retry for Explore and Collections", () => {
  let state = createInitialState();
  state = reduce(state, { type: "navigate", route: "explore" });
  state = reduce(state, {
    type: "search-loaded",
    mode: "initial",
    page: { items: tracks, total: 10, limit: 50, offset: 0 }
  });
  state = reduce(state, { type: "search-started", mode: "append" });
  let html = renderApp(state);
  assert.match(html, /Loading more…/);
  assert.match(html, /data-action="load-more-search" disabled/);
  state = reduce(state, { type: "search-failed", mode: "append", message: "Audio retry" });
  html = renderApp(state);
  assert.match(html, /Audio retry/);
  assert.match(html, />Retry</);

  state = reduce(state, { type: "navigate", route: "collections" });
  state = reduce(state, {
    type: "collections-loaded",
    mode: "initial",
    page: { items: collections, total: 10, limit: 24, offset: 0 }
  });
  state = reduce(state, { type: "collections-started", mode: "append" });
  html = renderApp(state);
  assert.match(html, /Loading more…/);
  state = reduce(state, {
    type: "collections-loaded",
    mode: "append",
    page: { items: [], total: 10, limit: 24, offset: 2 }
  });
  html = renderApp(state);
  assert.match(html, /Showing 2 of 10 collections/);
  assert.doesNotMatch(html, /data-action="load-more-collections"/);
});
