import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultLibrary,
  createDefaultSettings,
  loadLibrary,
  loadSettings,
  saveLibrary,
  saveSettings
} from "../.test-build/src/persistence.js";

class MemoryStorage {
  values = new Map();
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.values.set(key, value);
  }
}

test("library storage falls back for missing and corrupt values", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(loadLibrary(storage), createDefaultLibrary());
  storage.setItem("dhamma-echo:library", "{");
  assert.deepEqual(loadLibrary(storage), createDefaultLibrary());
  storage.setItem("dhamma-echo:library", JSON.stringify({ version: 99 }));
  assert.deepEqual(loadLibrary(storage), createDefaultLibrary());
});

test("library storage validates, deduplicates, and bounds data", () => {
  const storage = new MemoryStorage();
  saveLibrary(storage, {
    favorites: [3, 3, -1, 2],
    history: Array.from({ length: 120 }, (_, index) => ({ id: index + 1, playedAt: index })),
    resume: Object.fromEntries(
      Array.from({ length: 510 }, (_, index) => [String(index + 1), index + 0.5])
    ),
    downloads: { 3: "/tmp/three.mp3", 0: "bad", 4: "" }
  });
  const loaded = loadLibrary(storage);
  assert.deepEqual(loaded.favorites, [3, 2]);
  assert.equal(loaded.history.length, 100);
  assert.equal(Object.keys(loaded.resume).length, 500);
  assert.deepEqual(loaded.downloads, { 3: "/tmp/three.mp3" });
});

test("settings storage uses safe defaults and accepted values", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(loadSettings(storage), {
    playbackRate: 1,
    browseLimit: 50,
    theme: "light"
  });
  storage.setItem(
    "dhamma-echo:settings",
    JSON.stringify({ version: 1, theme: "dark", playbackRate: 1.5, volume: 0.7, browseLimit: 25 })
  );
  assert.deepEqual(loadSettings(storage), {
    playbackRate: 1.5,
    browseLimit: 25,
    theme: "dark"
  });
  storage.setItem(
    "dhamma-echo:settings",
    JSON.stringify({ version: 1, theme: "purple", playbackRate: 9, volume: -4 })
  );
  assert.deepEqual(loadSettings(storage), createDefaultSettings());
});

test("settings can be saved and loaded", () => {
  const storage = new MemoryStorage();
  saveSettings(storage, { playbackRate: 0.75, browseLimit: 100, theme: "dark" });
  assert.deepEqual(loadSettings(storage), {
    playbackRate: 0.75,
    browseLimit: 100,
    theme: "dark"
  });
  assert.match(storage.getItem("dhamma-echo:settings"), /"theme":"dark"/);
  assert.equal(Object.hasOwn(JSON.parse(storage.getItem("dhamma-echo:settings")), "volume"), false);
});

test("library storage rejects malformed nested values", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    "dhamma-echo:library",
    JSON.stringify({
      version: 1,
      favorites: "bad",
      history: [
        null,
        "bad",
        { id: -1, playedAt: 1 },
        { id: 1, playedAt: "bad" },
        { id: 2, playedAt: 2 }
      ],
      resume: { "-1": 3, 1: -1, 2: "bad", 3: 4 }
    })
  );
  assert.deepEqual(loadLibrary(storage), {
    favorites: [],
    history: [{ id: 2, playedAt: 2 }],
    resume: { 3: 4 },
    downloads: {}
  });
  storage.setItem("dhamma-echo:library", JSON.stringify({ version: 1, resume: null }));
  assert.deepEqual(loadLibrary(storage), createDefaultLibrary());
});

test("library save removes invalid history and resume entries", () => {
  const storage = new MemoryStorage();
  saveLibrary(storage, {
    favorites: [1, 0, 1],
    history: [
      { id: 1, playedAt: Number.NaN },
      { id: -1, playedAt: 1 },
      { id: 2, playedAt: 4 }
    ],
    resume: { 1: Number.NaN, "-2": 3, 3: -1, 4: 4 }
  });
  assert.deepEqual(loadLibrary(storage), {
    favorites: [1],
    history: [{ id: 2, playedAt: 4 }],
    resume: { 4: 4 },
    downloads: {}
  });
});

test("settings storage rejects corrupt JSON and non-object values", () => {
  const storage = new MemoryStorage();
  storage.setItem("dhamma-echo:settings", "{");
  assert.deepEqual(loadSettings(storage), createDefaultSettings());
  for (const value of [null, 1, "bad"]) {
    storage.setItem("dhamma-echo:settings", JSON.stringify(value));
    assert.deepEqual(loadSettings(storage), createDefaultSettings());
  }
});

test("library storage rejects fractional identifiers", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    "dhamma-echo:library",
    JSON.stringify({
      version: 1,
      favorites: [1.5, 2],
      history: [
        { id: 3.5, playedAt: 1 },
        { id: 3, playedAt: 2 }
      ],
      resume: { 4.5: 2, 4: 3 },
      downloads: { 5.5: "/tmp/bad.mp3", 5: "/tmp/good.mp3" }
    })
  );
  assert.deepEqual(loadLibrary(storage), {
    favorites: [2],
    history: [{ id: 3, playedAt: 2 }],
    resume: { 4: 3 },
    downloads: { 5: "/tmp/good.mp3" }
  });
});

test("settings keep valid playback values while defaulting unknown optional preferences", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    "dhamma-echo:settings",
    JSON.stringify({ version: 1, playbackRate: 1, volume: 0.5, browseLimit: 17, theme: "purple" })
  );
  assert.deepEqual(loadSettings(storage), {
    playbackRate: 1,
    browseLimit: 50,
    theme: "light"
  });
});
