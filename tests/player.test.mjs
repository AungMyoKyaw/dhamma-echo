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
    if (this.failPlay) throw new Error("blocked");
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

test("AudioEngine loads, controls, and reports secure tracks", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack(tracks[0], 12), true);
  assert.equal(audio.src, tracks[0].url);
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
      url: "http://dhammadownload.com/a.mp3",
      playable: false
    }),
    false
  );
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "This legacy HTTP track is blocked for your safety."
  });
  audio.failPlay = true;
  assert.equal(await engine.setTrack(tracks[0]), false);
  assert.deepEqual(events.at(-1), { type: "error", message: "The audio stream could not start." });
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
  audio.emit("timeupdate");
  audio.emit("error");
  assert.deepEqual(events.at(-2), { type: "progress", currentTime: 0, duration: 0 });
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The remote audio stream is unavailable."
  });
  audio.pause();
  audio.failPlay = true;
  await engine.toggle();
  assert.deepEqual(events.at(-1), { type: "error", message: "The audio stream could not start." });
});
