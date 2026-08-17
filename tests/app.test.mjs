import test from "node:test";
import assert from "node:assert/strict";
import { DhammaApp } from "../.test-build/src/app.js";
import { tracks, teachers, videoTrack } from "./test-data.mjs";

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
  removeAttribute(name) {
    if (name === "src") this.src = "";
  }
  emit(type) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function createApi(overrides = {}) {
  return {
    async getSummary() {
      return { totalAudio: 30563, totalTeachers: 257, myanmarAudio: 30098, englishAudio: 465 };
    },
    async listFeaturedTeachers() {
      return teachers;
    },
    async listContentCategories() {
      return [{ id: 7, name: "Audio in English", language: "english", count: 465 }];
    },
    async searchCollections(request) {
      return { items: [], total: 0, limit: request.limit, offset: request.offset };
    },
    async getCollection(id) {
      return {
        id,
        name: "Course",
        description: null,
        teacherId: 3,
        teacherName: teachers[0].name,
        audioCount: tracks.length,
        tracks
      };
    },
    async getTeacher(id) {
      return {
        id,
        name: teachers[0].name,
        nameMyanmar: null,
        title: null,
        description: null,
        audioCount: tracks.length,
        collections: []
      };
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
  const app = new DhammaApp({
    api: createApi(),
    storage,
    audio,
    render: (state) => renders.push(state),
    now: () => 123
  });
  await app.start();
  assert.equal(app.state.summary.data.totalAudio, 30563);
  assert.equal(app.state.catalogue.page.items.length, 2);
  assert.equal(app.state.teachers.data.length, 3);
  assert.equal(renders.length > 3, true);
  app.dispatch({ type: "toggle-favorite", id: 1 });
  app.setRate(1.5);
  assert.match(storage.getItem("dhamma-echo:library"), /"favorites":\[1\]/);
  assert.match(storage.getItem("dhamma-echo:settings"), /"playbackRate":1.5/);
  assert.match(storage.getItem("dhamma-echo:settings"), /"theme":"system"/);
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
  app.setRate(1.25);
  assert.equal(audio.currentTime, 40);
  assert.equal(audio.playbackRate, 1.25);
  app.destroy();
});

test("DhammaApp handles settings, track lookup failures, and offline downloads", async () => {
  let downloadAttempts = 0;
  const app = new DhammaApp({
    api: createApi({
      async getAudioTrack(id) {
        if (id === 999) throw new Error("missing");
        return tracks.find((track) => track.id === id);
      },
      async downloadAudio() {
        downloadAttempts += 1;
        if (downloadAttempts === 1) throw new Error("download failed");
        return "/tmp/talk.mp3";
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  app.setBrowseLimit(25);
  app.setTheme("dark");
  assert.equal(app.state.settings.browseLimit, 25);
  assert.equal(app.state.settings.theme, "dark");
  app.state.library.favorites = [tracks[0].id, 999];
  await app.loadFavoriteTracks();
  assert.deepEqual(
    app.state.favoriteTracks.map((track) => track.id),
    [tracks[0].id]
  );
  app.state.library.downloads = { 999: "/tmp/missing.mp3" };
  await app.loadDownloadedTracks();
  assert.deepEqual(app.state.downloadedTracks, []);
  await app.downloadTrack({ ...tracks[0], playable: false });
  assert.equal(downloadAttempts, 0);
  await assert.rejects(app.downloadTrack(tracks[0]), /download failed/);
  await app.downloadTrack(tracks[0]);
  assert.equal(app.state.library.downloads[String(tracks[0].id)], "/tmp/talk.mp3");
  app.setDownloadProgress(tracks[0].id, 3, 10);
  assert.deepEqual(app.state.downloadProgress[String(tracks[0].id)], { downloaded: 3, total: 10 });
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
    now: () => 0
  });
  await app.start();
  await app.playTrack({ ...tracks[0], playable: false });
  assert.equal(app.state.player.current, null);
  assert.equal(app.state.player.status, "idle");
  app.destroy();
});

test("DhammaApp ignores close requests when audio is active or nothing is playing", async () => {
  const audio = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 0
  });
  await app.start();
  app.closeVideoPlayer();
  await app.playTrack(tracks[0]);
  app.closeVideoPlayer();
  assert.equal(app.state.player.current?.id, tracks[0].id);
  assert.equal(audio.paused, false);
  app.destroy();
});

test("DhammaApp plays video tracks through the registered video element and records history", async () => {
  const audio = new FakeAudio();
  const video = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 1000
  });
  await app.start();
  app.registerVideoElement(video);
  await app.playTrack(videoTrack);
  // The route is left alone; the video card is rendered from player state.
  assert.notEqual(app.state.route, "play");
  assert.equal(app.state.player.current?.id, videoTrack.id);
  assert.deepEqual(app.state.library.history[0], { id: videoTrack.id, playedAt: 1000 });
  // The audio stream is paused and cleared when video takes over.
  assert.equal(audio.paused, true);
  assert.equal(audio.src, "");
  // The video element received the source.
  assert.match(video.src, /walkthrough\.mp4$/);
  app.destroy();
});

test("DhammaApp closes a video by pausing, clearing, and resetting the player", async () => {
  const audio = new FakeAudio();
  const video = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 0
  });
  await app.start();
  app.registerVideoElement(video);
  await app.playTrack(videoTrack);
  assert.equal(video.paused, false);
  assert.match(video.src, /walkthrough\.mp4$/);
  app.closeVideoPlayer();
  assert.equal(video.paused, true);
  assert.equal(video.src, "");
  assert.equal(video.currentTime, 0);
  assert.equal(app.state.player.current, null);
  assert.equal(app.state.player.status, "idle");
  app.dispatch({ type: "enqueue", track: tracks[1] });
  video.emit("ended");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(app.state.player.current, null);
  assert.equal(app.state.player.queue.length, 1);
  assert.equal(video.src, "");
  await app.playTrack(videoTrack);
  assert.equal(app.state.player.current?.id, videoTrack.id);
  assert.match(video.src, /walkthrough\.mp4$/);
  app.destroy();
});

test("DhammaApp rebuilds the engine against the video element when it mounts after playTrack", async () => {
  const audio = new FakeAudio();
  const video = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 0
  });
  await app.start();
  // Play the track BEFORE the video element registers (the typical flow
  // because the route change and the view mount happen after playTrack).
  await app.playTrack(videoTrack);
  assert.equal(app.state.player.current?.id, videoTrack.id);
  // The audio element received the source as a fallback.
  assert.match(audio.src, /walkthrough\.mp4$/);
  // Now the view mounts and registers the video element.
  app.registerVideoElement(video);
  await new Promise((resolve) => setTimeout(resolve, 0));
  // The engine is rebuilt against the video element.
  assert.match(video.src, /walkthrough\.mp4$/);
  // The audio stream is paused and cleared.
  assert.equal(audio.paused, true);
  assert.equal(audio.src, "");
  app.registerVideoElement(null);
  assert.equal(video.paused, true);
  assert.equal(video.src, "");
  app.destroy();
});

test("DhammaApp ignores registerVideoElement when no video track is active", async () => {
  const audio = new FakeAudio();
  const video = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 0
  });
  await app.start();
  app.registerVideoElement(video);
  // No current track; nothing should change on the video element.
  assert.equal(video.src, "");
  app.registerVideoElement(null);
  await app.destroy();
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

test("DhammaApp loads categories and forwards discovery filters", async () => {
  const requests = [];
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        requests.push(request);
        return {
          items: tracks,
          total: tracks.length,
          limit: request.limit,
          offset: request.offset
        };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  await app.start();
  assert.equal(app.state.categories.status, "ready");
  app.dispatch({ type: "set-category", categoryId: 7 });
  app.dispatch({ type: "set-collection", collectionId: 10 });
  await app.search();
  assert.equal(requests.at(-1).categoryId, 7);
  assert.equal(requests.at(-1).collectionId, 10);
  app.destroy();
});

test("DhammaApp loads collection and teacher detail flows", async () => {
  const collectionRequests = [];
  const app = new DhammaApp({
    api: createApi({
      async searchCollections(request) {
        collectionRequests.push(request);
        return { items: [], total: 0, limit: request.limit, offset: request.offset };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  await app.start();
  await app.searchCollections();
  assert.equal(collectionRequests.at(-1).limit, 50);
  await app.openCollection(10, "collections");
  assert.equal(app.state.collectionDetail.data.id, 10);
  app.dispatch({ type: "search-loaded", page: { items: [], total: 0, limit: 50, offset: 0 } });
  assert.equal(app.findTrack(1).id, 1);
  await app.openTeacher(3, "teachers");
  assert.equal(app.state.teacherDetail.data.id, 3);
  assert.equal(app.state.teacherTalks.page.total, tracks.length);
  app.state = {
    ...app.state,
    collectionDetail: { status: "idle", data: null, message: "" }
  };
  assert.equal(app.findTrack(1).id, 1);
  assert.equal(app.findTrack(999), null);
  await app.loadTeacherTalks();
  assert.equal(app.state.teacherTalks.page.offset, 0);
  app.destroy();
});

test("DhammaApp surfaces teacher-talks failures and renders the error message", async () => {
  const audio = new FakeAudio();
  const app = new DhammaApp({
    api: createApi({
      async searchAudio() {
        throw new Error("talks offline");
      }
    }),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 1
  });
  await app.start();
  await app.openTeacher(3, "teachers");
  await Promise.resolve();
  assert.equal(app.state.teacherTalks.status, "error");
  assert.equal(app.state.teacherTalks.message, "talks offline");
  app.setSidebarCollapsed(true);
  assert.equal(app.state.ui.sidebarCollapsed, true);
  app.setSidebarCollapsed(false);
  assert.equal(app.state.ui.sidebarCollapsed, false);
  app.destroy();
});

test("DhammaApp appends and retries teacher talk batches", async () => {
  const allTracks = Array.from({ length: 60 }, (_, index) => ({
    ...tracks[0],
    id: index + 1,
    title: `Talk ${index + 1}`
  }));
  const requests = [];
  let failAppend = true;
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        requests.push(request);
        if (request.teacherId !== null && request.offset > 0 && failAppend) {
          failAppend = false;
          throw new Error("temporary failure");
        }
        return {
          items: allTracks.slice(request.offset, request.offset + request.limit),
          total: allTracks.length,
          limit: request.limit,
          offset: request.offset
        };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  await app.start();
  await app.openTeacher(3, "teachers");
  assert.equal(app.state.teacherTalks.page.items.length, 50);
  const firstCount = app.state.teacherTalks.page.items.length;
  await app.loadMoreTeacherTalks();
  assert.equal(requests.at(-1).offset, firstCount);
  assert.equal(app.state.teacherTalks.page.items.length, 50);
  assert.equal(app.state.teacherTalks.loadMoreMessage, "temporary failure");
  await app.loadMoreTeacherTalks();
  assert.equal(requests.at(-1).offset, firstCount);
  assert.equal(app.state.teacherTalks.page.items.length, 60);
  assert.equal(app.state.teacherTalks.exhausted, true);
  app.destroy();
});

test("DhammaApp ignores teacher load-more requests that cannot make progress", async () => {
  let requestCount = 0;
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        requestCount += 1;
        return { items: tracks, total: 10, limit: request.limit, offset: request.offset };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });

  await app.loadMoreTeacherTalks();
  assert.equal(requestCount, 0);
  app.state = {
    ...app.state,
    selectedTeacherId: 3,
    teacherTalks: { ...app.state.teacherTalks, loadingMore: true }
  };
  await app.loadMoreTeacherTalks();
  app.state = {
    ...app.state,
    teacherTalks: { ...app.state.teacherTalks, loadingMore: false, exhausted: true }
  };
  await app.loadMoreTeacherTalks();
  app.state = {
    ...app.state,
    teacherTalks: {
      ...app.state.teacherTalks,
      exhausted: false,
      page: { items: tracks, total: tracks.length, limit: 50, offset: 0 }
    }
  };
  await app.loadMoreTeacherTalks();
  assert.equal(requestCount, 0);
  app.destroy();
});

test("DhammaApp appends and retries Explore and Collection batches", async () => {
  const audioItems = Array.from({ length: 60 }, (_, index) => ({
    ...tracks[0],
    id: index + 1,
    title: `Talk ${index + 1}`
  }));
  const collectionItems = Array.from({ length: 60 }, (_, index) => ({
    id: index + 1,
    name: `Collection ${index + 1}`,
    teacherId: 3,
    teacherName: "Teacher",
    audioCount: 1
  }));
  const audioRequests = [];
  const collectionRequests = [];
  let failAudioAppend = true;
  let failCollectionAppend = true;
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        audioRequests.push(request);
        if (request.offset > 0 && failAudioAppend) {
          failAudioAppend = false;
          throw new Error("audio retry");
        }
        return {
          items: audioItems.slice(request.offset, request.offset + request.limit),
          total: audioItems.length,
          limit: request.limit,
          offset: request.offset
        };
      },
      async searchCollections(request) {
        collectionRequests.push(request);
        if (request.offset > 0 && failCollectionAppend) {
          failCollectionAppend = false;
          throw new Error("collection retry");
        }
        return {
          items: collectionItems.slice(request.offset, request.offset + request.limit),
          total: collectionItems.length,
          limit: request.limit,
          offset: request.offset
        };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  await app.start();
  assert.equal(app.state.catalogue.page.items.length, 50);
  await app.loadMoreSearchResults();
  assert.equal(audioRequests.at(-1).offset, 50);
  assert.equal(app.state.catalogue.loadMoreMessage, "audio retry");
  app.state.search.language = "myanmar";
  app.state.search.format = "mp3";
  await app.loadMoreSearchResults();
  assert.equal(app.state.catalogue.page.items.length, 60);

  await app.searchCollections();
  assert.equal(app.state.collections.page.items.length, 50);
  await app.loadMoreCollections();
  assert.equal(collectionRequests.at(-1).offset, 50);
  assert.equal(app.state.collections.loadMoreMessage, "collection retry");
  await app.loadMoreCollections();
  assert.equal(app.state.collections.page.items.length, 60);
  app.destroy();
});

test("DhammaApp guards completed catalogue append requests", async () => {
  let requests = 0;
  const app = new DhammaApp({
    api: createApi({
      async searchAudio(request) {
        requests += 1;
        return { items: [], total: 0, limit: request.limit, offset: request.offset };
      },
      async searchCollections(request) {
        requests += 1;
        return { items: [], total: 0, limit: request.limit, offset: request.offset };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  app.state.catalogue.loadingMore = true;
  await app.loadMoreSearchResults();
  app.state.catalogue.loadingMore = false;
  app.state.catalogue.exhausted = true;
  await app.loadMoreSearchResults();
  app.state.catalogue.exhausted = false;
  await app.loadMoreSearchResults();
  app.state.collections.loadingMore = true;
  await app.loadMoreCollections();
  app.state.collections.loadingMore = false;
  app.state.collections.exhausted = true;
  await app.loadMoreCollections();
  app.state.collections.exhausted = false;
  await app.loadMoreCollections();
  assert.equal(requests, 0);
  app.destroy();
});

test("DhammaApp reports category, collection, and detail failures", async () => {
  const failure = new Error("discovery offline");
  const app = new DhammaApp({
    api: createApi({
      async listContentCategories() {
        throw failure;
      },
      async searchCollections() {
        throw failure;
      },
      async getCollection() {
        throw failure;
      },
      async getTeacher() {
        throw failure;
      },
      async searchAudio(request) {
        if (request.teacherId !== null) throw failure;
        return { items: [], total: 0, limit: request.limit, offset: request.offset };
      }
    }),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  await app.start();
  assert.equal(app.state.categories.status, "error");
  await app.searchCollections();
  assert.equal(app.state.collections.status, "error");
  await app.openCollection(999, "collections");
  assert.equal(app.state.collectionDetail.status, "error");
  await app.openTeacher(999, "teachers");
  assert.equal(app.state.teacherDetail.status, "error");
  assert.equal(app.state.teacherTalks.status, "error");
  app.dispatch({ type: "return-to-list" });
  await app.loadTeacherTalks();
  app.destroy();

  const idle = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio: new FakeAudio(),
    render() {},
    now: () => 0
  });
  await idle.loadTeacherTalks();
  assert.equal(idle.state.teacherTalks.status, "idle");
  idle.destroy();
});

test("DhammaApp handles legacy download state and prefers a downloaded local file", async () => {
  const audio = new FakeAudio();
  const app = new DhammaApp({
    api: createApi(),
    storage: new MemoryStorage(),
    audio,
    render() {},
    now: () => 0
  });

  app.state.library.downloads = undefined;
  await app.loadDownloadedTracks();
  assert.deepEqual(app.state.downloadedTracks, []);

  app.state.library.downloads = { [String(tracks[0].id)]: "/tmp/talk.mp3" };
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    await app.playTrack(tracks[0]);
    assert.equal(audio.src, "/tmp/talk.mp3");
  } finally {
    globalThis.window = previousWindow;
    app.destroy();
  }
});
