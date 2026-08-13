import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../.test-build/src/store.js";
import {
  featuredTeachers,
  groupCollectionsByTeacher,
  isCuratedFeaturedTeacher,
  isMyanmarText,
  knownFavoriteTracks,
  favoriteTracks,
  downloadedTracks,
  orderTeachersFeaturedFirst,
  routeLabel,
  teacherFilterName
} from "../.test-build/src/ui.js";

const teachers = [
  { id: 900, name: "Regular A", audioCount: 1 },
  { id: 42, name: "42", audioCount: 2 },
  { id: 16, name: "16", audioCount: 3 },
  { id: 61, name: "61", audioCount: 4 },
  { id: 901, name: "Regular B", audioCount: 5 }
];
test("featured teacher helpers preserve curated order", () => {
  assert.equal(isCuratedFeaturedTeacher(42), true);
  assert.equal(isCuratedFeaturedTeacher(900), false);
  assert.deepEqual(
    featuredTeachers(teachers).map((t) => t.id),
    [16, 42, 61]
  );
  assert.deepEqual(
    orderTeachersFeaturedFirst(teachers).map((t) => t.id),
    [16, 42, 61, 900, 901]
  );
});
test("Myanmar text detection identifies Myanmar script", () => {
  assert.equal(isMyanmarText("မြန်မာ"), true);
  assert.equal(isMyanmarText("English"), false);
});
test("route labels cover every route", () => {
  assert.deepEqual(routeLabel("home", 30563), {
    eyebrow: "Home",
    title: "Discover the Dhamma",
    detail: "Return to recent talks and trusted teachers."
  });
  assert.equal(routeLabel("explore", 30563).eyebrow, "30,563 audio talks");
  for (const route of [
    "collections",
    "collection-detail",
    "teachers",
    "teacher-detail",
    "library",
    "settings"
  ]) {
    const label = routeLabel(route, 1);
    assert.equal(typeof label.title, "string");
    assert.equal(typeof label.detail, "string");
    assert.ok(label.detail.length > 0);
  }
});
test("teacherFilterName prefers loaded teacher and preserves legacy fallback", () => {
  const state = createInitialState();
  state.search.teacherId = 2;
  state.teachers.data = [{ id: 2, name: "Loaded", audioCount: 1 }];
  assert.equal(teacherFilterName(state), "Loaded");
  state.teachers.data = [];
  state.player.current = {
    id: 2,
    title: "x",
    format: "mp3",
    language: "english",
    url: "https://x",
    dateRecorded: null,
    location: null,
    teacherId: 2,
    teacherName: "Current",
    playable: true
  };
  assert.equal(teacherFilterName(state), "Current");
  state.search.teacherId = 3;
  assert.equal(teacherFilterName(state), "selected teacher");
});
test("groupCollectionsByTeacher groups contiguous teacher runs", () => {
  const items = [
    { id: 1, name: "A", teacherId: 2, teacherName: "T", audioCount: 1 },
    { id: 2, name: "B", teacherId: 2, teacherName: "T", audioCount: 1 },
    { id: 3, name: "C", teacherId: null, teacherName: "", audioCount: 1 },
    { id: 4, name: "D", teacherId: 2, teacherName: "T", audioCount: 1 }
  ];
  assert.deepEqual(
    groupCollectionsByTeacher(items).map((g) => [g.key, g.name, g.items.map((i) => i.id)]),
    [
      ["2", "T", [1, 2]],
      ["unknown", "Unknown teacher", [3]],
      ["2", "T", [4]]
    ]
  );
});
test("knownFavoriteTracks returns unique loaded favorites", () => {
  const state = createInitialState();
  const a = {
    id: 1,
    title: "A",
    format: "mp3",
    language: "english",
    url: "https://x",
    dateRecorded: null,
    location: null,
    teacherId: null,
    teacherName: "T",
    playable: true
  };
  const b = { ...a, id: 2, title: "B" };
  state.library.favorites = [1, 2, 99];
  state.player.current = a;
  state.player.queue = [a, b];
  assert.deepEqual(
    knownFavoriteTracks(state).map((t) => t.id),
    [1, 2]
  );
  state.library.favorites = [];
  assert.deepEqual(knownFavoriteTracks(state), []);
});

test("favorite and downloaded track selectors merge known records uniquely", () => {
  const state = createInitialState();
  const track = {
    id: 1,
    title: "A",
    format: "mp3",
    language: "english",
    url: "https://x",
    dateRecorded: null,
    location: null,
    teacherId: null,
    teacherName: "T",
    playable: true
  };
  state.library.favorites = [1];
  state.library.downloads = { 1: "/tmp/a.mp3", 2: "/tmp/b.mp3" };
  state.favoriteTracks = [track];
  state.downloadedTracks = [track];
  state.catalogue.page.items = [track];
  assert.deepEqual(
    favoriteTracks(state).map((item) => item.id),
    [1]
  );
  assert.deepEqual(
    downloadedTracks(state).map((item) => item.id),
    [1]
  );
});
