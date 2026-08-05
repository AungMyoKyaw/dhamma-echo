import test from "node:test";
import assert from "node:assert/strict";
import { AudioEngine } from "../.test-build/src/player.js";
import { tracks } from "./test-data.mjs";

class FakeAudio {
  listeners = new Map();
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  playbackRate = 1;
  paused = true;
  failPlay = false;
  playCalls = 0;
  emitErrorOnLoad = false;
  addEventListener(type, listener) {
    const group = this.listeners.get(type) ?? [];
    group.push(listener);
    this.listeners.set(type, group);
  }
  removeEventListener(type, listener) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((item) => item !== listener)
    );
  }
  async play() {
    this.playCalls += 1;
    if (this.failPlay) throw new Error("blocked");
    this.paused = false;
    this.emit("play");
  }
  pause() {
    this.paused = true;
    this.emit("pause");
  }
  load() {
    if (this.emitErrorOnLoad) this.emit("error");
  }
  emit(type) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

test("AudioEngine loads, controls, and reports secure tracks", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack(tracks[0], 12), true);
  assert.equal(audio.src, "https://www.dhammadownload.com/MP3Library/UJotika/praise.mp3");
  assert.equal(audio.currentTime, 0);
  audio.duration = 100;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 12);
  assert.equal(audio.paused, false);
  await engine.toggle();
  assert.equal(audio.paused, true);
  await engine.toggle();
  assert.equal(audio.paused, false);
  engine.seek(50);
  engine.setVolume(0.4);
  engine.setRate(1.5);
  assert.equal(audio.currentTime, 50);
  assert.equal(audio.volume, 0.4);
  assert.equal(audio.playbackRate, 1.5);
  audio.duration = 100;
  audio.emit("timeupdate");
  audio.emit("ended");
  assert.deepEqual(events.at(-2), { type: "progress", currentTime: 50, duration: 100 });
  assert.deepEqual(events.at(-1), { type: "ended" });
  engine.destroy();
  assert.equal(
    [...audio.listeners.values()].every((listeners) => listeners.length === 0),
    true
  );
});

test("AudioEngine rejects unsafe media and reports play failures", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  assert.equal(
    await engine.setTrack({
      ...tracks[0],
      url: "https://example.com/a.mp3",
      playable: false
    }),
    false
  );
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "This audio source is not trusted."
  });
  audio.failPlay = true;
  assert.equal(await engine.setTrack(tracks[0]), false);
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The audio stream is unavailable from Dhamma Download."
  });
  audio.duration = Number.NaN;
  engine.seek(Number.NaN);
  engine.setVolume(5);
  engine.setRate(9);
  assert.equal(audio.currentTime, 0);
  assert.equal(audio.volume, 1);
  assert.equal(audio.playbackRate, 2);
});

test("AudioEngine reports media events and non-finite metadata safely", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack(tracks[0], Number.NaN), true);
  assert.equal(audio.currentTime, 0);
  audio.currentTime = Number.NaN;
  audio.duration = Number.POSITIVE_INFINITY;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 0);
  audio.currentTime = Number.NaN;
  audio.emit("timeupdate");
  assert.deepEqual(events.at(-1), { type: "progress", currentTime: 0, duration: 0 });
  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The audio stream is unavailable from Dhamma Download."
  });
  audio.pause();
  audio.failPlay = true;
  await engine.toggle();
  assert.deepEqual(events.at(-1), { type: "error", message: "The audio stream could not start." });
});


test("AudioEngine waits for metadata, clamps resume, and retries the alternate approved host", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  const track = {
    ...tracks[0],
    url: "http://dhammadownload.com/MP3Library/Myanmar/တရား တော်.mp3"
  };

  assert.equal(await engine.setTrack(track, 140), true);
  assert.equal(
    audio.src,
    "https://www.dhammadownload.com/MP3Library/Myanmar/%E1%80%90%E1%80%9B%E1%80%AC%E1%80%B8%20%E1%80%90%E1%80%B1%E1%80%AC%E1%80%BA.mp3"
  );
  assert.equal(audio.currentTime, 0);

  audio.duration = 120;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 120);

  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    audio.src,
    "https://dhammadownload.com/MP3Library/Myanmar/%E1%80%90%E1%80%9B%E1%80%AC%E1%80%B8%20%E1%80%90%E1%80%B1%E1%80%AC%E1%80%BA.mp3"
  );
  assert.equal(events.some((event) => event.type === "error"), false);
  assert.equal(audio.playCalls, 2);

  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The audio stream is unavailable from Dhamma Download."
  });
  const finalErrorCount = events.filter((event) => event.type === "error").length;
  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(events.filter((event) => event.type === "error").length, finalErrorCount);
});

test("AudioEngine ignores a synchronous media error while the candidate is starting", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.emitErrorOnLoad = true;
  const engine = new AudioEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack(tracks[0]), true);
  assert.equal(audio.playCalls, 1);
  assert.equal(events.some((event) => event.type === "error"), false);
});

test("AudioEngine rejects unsupported formats before changing the media source", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack({ ...tracks[0], format: "wma" }), false);
  assert.equal(audio.src, "");
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "This audio format is not supported by the macOS player."
  });
});
