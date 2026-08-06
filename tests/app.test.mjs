import test from "node:test";
import assert from "node:assert/strict";
import { DhammaApp } from "../.test-build/src/app.js";
import { tracks, teachers } from "./test-data.mjs";

class MemoryStorage {
  values = new Map();
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.values.set(key, value);
  }
}

class FakeAudio {
  listeners = new Map();
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  playbackRate = 1;
  paused = true;
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  removeEventListener(type, listener) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((item) => item !== listener)
    );
  }
  async play() {
    this.paused = false;
    this.emit("play");
  }
  pause() {
    this.paused = true;
    this.emit("pause");
  }
  load() {}
  emit(type) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function createApi(overrides = {}) {
  return {
    async getSummary() {
      return { totalAudio: 21402, totalTeachers: 212, myanmarAudio: 21074, englishAudio: 328 };
    },
    async listFeaturedTeachers() {
      return teachers;
    },
    async searchTeachers() {
      return teachers;
    },
    async searchAudio(request) {
      return { items: tracks, total: tracks.length, limit: request.limit, offset: request.offset };
    },
    async getAudioTrack(id) {
      return tracks.find((track) => track.id === id);
    },
    ...overrides
  };
}

test("DhammaApp starts, loads the catalogue, and persists user state", async () => {
  const storage = new MemoryStorage();
  const audio = new FakeAudio();
  const renders = [];
  const themes = [];
  const app = new DhammaApp({
    api: createApi(),
    storage,
    audio,
    render: (state) => renders.push(state),
    applyTheme: (theme) => themes.push(theme),
    now: () => 123
  });
  await app.start();
  assert.equal(app.state.summary.data.totalAudio, 21402);
  assert.equal(app.state.catalogue.page.items.length, 2);
  assert.equal(app.state.teachers.data.length, 2);
  assert.equal(renders.length > 3, true);
  assert.deepEqual(themes, ["system"]);

  app.dispatch({ type: "toggle-favorite", id: 1 });
  app.dispatch({ type: "set-theme", theme: "dark" });
  assert.match(storage.getItem("dhamma-echo:library"), /"favorites":\[1\]/);
  assert.match(storage.getItem("dhamma-echo:settings"), /"theme":"dark"/);
  assert.deepEqual(themes, ["system", "dark"]);
  app.destroy();
});

test("DhammaApp controls playback, queue advancement, and resume progress", async () => {
  const storage = new MemoryStorage();
  const audio = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage,
    audio,
    render() {},
    applyTheme() {},
    now: () => 999
  });
  await app.start();
  await app.playTrack(tracks[0]);
  assert.equal(app.state.player.current.id, 1);
  assert.equal(app.state.library.history[0].playedAt, 999);
  app.dispatch({ type: "enqueue", track: tracks[1] });
  audio.currentTime = 24;
  audio.duration = 100;
  audio.emit("timeupdate");
  assert.equal(app.state.library.resume["1"], 24);
  audio.currentTime = 25;
  audio.emit("timeupdate");
  assert.equal(app.state.library.resume["1"], 24);
  audio.currentTime = 25.2;
  audio.duration = 101;
  audio.emit("timeupdate");
  audio.currentTime = 25.3;
  audio.emit("timeupdate");
  audio.emit("ended");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(app.state.library.resume["1"], 0);
  assert.equal(app.state.player.current.id, 2);
  await app.togglePlayback();
  assert.equal(audio.paused, true);
  app.seek(40);
  audio.emit("timeupdate");
  app.seekBy(15);
  assert.equal(audio.currentTime, 55);
  audio.emit("timeupdate");
  app.seekBy(-15);
  assert.equal(audio.currentTime, 40);
  app.setVolume(0.3);
  app.setRate(1.25);
  assert.equal(audio.currentTime, 40);
  assert.equal(audio.volume, 0.3);
  assert.equal(audio.playbackRate, 1.25);
  app.destroy();
});

test("DhammaApp exposes stable load failures and missing tracks", async () => {
  const failure = new Error("offline");
  const app = new DhammaApp({
    api: createApi({
      async getSummary() {
        throw failure;
      },
      async listFeaturedTeachers() {
        throw failure;
      },
      async searchAudio() {
        throw failure;
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  assert.equal(app.state.summary.status, "error");
  assert.equal(app.state.teachers.status, "error");
  assert.equal(app.state.catalogue.status, "error");
  assert.equal(app.findTrack(999), null);
  await app.playNext();
  await app.retryPlayback();
  await app.togglePlayback();
  app.seek(10);
  app.seekBy(15);
  assert.equal(app.state.player.status, "paused");
  app.destroy();
});

test("DhammaApp covers filter requests, track lookup paths, and player errors", async () => {
  const requests = [];
  const audio = new FakeAudio();
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        requests.push(request);
        return { items: tracks, total: 2, limit: request.limit, offset: request.offset };
      }
    }),
    storage: new MemoryStorage(),
    audio,
    render() {},
    applyTheme() {},
    now: () => 1
  });
  await app.start();
  assert.equal(app.findTrack(2).id, 2);
  app.dispatch({ type: "set-language", language: "english" });
  app.dispatch({ type: "set-format", format: "mp3" });
  await app.search();
  assert.equal(requests.at(-1).language, "english");
  assert.equal(requests.at(-1).format, "mp3");
  await app.playTrack(tracks[0]);
  assert.equal(app.findTrack(1).id, 1);
  app.dispatch({ type: "enqueue", track: tracks[1] });
  app.dispatch({ type: "search-loaded", page: { items: [], total: 0, limit: 50, offset: 0 } });
  assert.equal(app.findTrack(2).id, 2);
  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(app.state.player.error, "");
  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(app.state.player.error, "The audio stream is unavailable from Dhamma Download.");
  await app.retryPlayback();
  assert.equal(app.state.player.error, "");
  assert.equal(app.state.player.status, "playing");
  app.destroy();
});

test("DhammaApp refuses to play unplayable tracks", async () => {
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  await app.playTrack({ ...tracks[0], playable: false });
  assert.equal(app.state.player.current, null);
  assert.equal(app.state.player.status, "idle");
  app.destroy();
});

test("DhammaApp searches teachers by name", async () => {
  const queries = [];
  const app = new DhammaApp({
    api: createApi({
      async searchTeachers(query) {
        queries.push(query);
        return query === "jotika" ? [teachers[0]] : [];
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  await app.searchTeachers("jotika");
  assert.deepEqual(app.state.teacherResults, [teachers[0]]);
  await app.searchTeachers("nobody");
  assert.deepEqual(app.state.teacherResults, []);
  await app.searchTeachers("");
  assert.equal(queries.length, 2);
  assert.equal(app.state.teacherQuery, "");
  app.destroy();
});

test("DhammaApp clears teacher results when teacher search fails", async () => {
  const app = new DhammaApp({
    api: createApi({
      async searchTeachers() {
        throw new Error("Teacher search unavailable");
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  await app.searchTeachers("jotika");
  assert.deepEqual(app.state.teacherResults, []);
  app.destroy();
});

test("DhammaApp clears the teacher filter when a fresh search runs", async () => {
  const requests = [];
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        requests.push(request);
        return { items: [], total: 0, limit: request.limit, offset: request.offset };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  app.dispatch({ type: "set-teacher", teacherId: 45 });
  await app.search();
  assert.equal(requests.at(-1).teacherId, 45);
  app.dispatch({ type: "set-query", query: "" });
  await app.search();
  assert.equal(requests.at(-1).teacherId, null);
  app.destroy();
});

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

test("DhammaApp marks recent history unavailable when every track lookup fails", async () => {
  const app = new DhammaApp({
    api: createApi({
      async getAudioTrack() {
        throw new Error("gone");
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    applyTheme() {},
    now: () => 0
  });
  await app.start();
  app.dispatch({ type: "record-history", id: 1, playedAt: 10 });
  await app.loadRecent();
  assert.equal(app.state.homeRecent.status, "error");
  assert.deepEqual(app.state.homeRecent.tracks, []);
  app.destroy();
});

test("DhammaApp handles non-Error failures and progress without a current track", async () => {
  const audio = new FakeAudio();
  const app = new DhammaApp({
    api: createApi({
      async getSummary() {
        throw "bad";
      }
    }),
    storage: new MemoryStorage(),
    audio,
    render() {},
    applyTheme() {},
    now: () => 0
  });
  audio.currentTime = 2;
  audio.duration = 5;
  audio.emit("timeupdate");
  audio.emit("ended");
  await app.start();
  assert.equal(app.state.summary.message, "The catalogue is unavailable.");
  app.destroy();
});

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
