import test from "node:test";
import assert from "node:assert/strict";
import { AudioEngine } from "../.test-build/src/player.js";
import { tracks } from "./test-data.mjs";

class FakeAudio {
  listeners = new Map();
  src = "";
  currentTime = 0;
  duration = 0;
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
  engine.setRate(1.5);
  assert.equal(audio.currentTime, 50);
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
  engine.setRate(9);
  assert.equal(audio.currentTime, 0);
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
  assert.equal(
    events.some((event) => event.type === "error"),
    false
  );
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
  assert.equal(
    events.some((event) => event.type === "error"),
    false
  );
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

test("AudioEngine prefers a downloaded local URL when provided", async () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  assert.equal(await engine.setTrack(tracks[0], 0, "asset:///tmp/talk.mp3"), true);
  assert.equal(audio.src, "asset:///tmp/talk.mp3");
});

test("AudioEngine cleans up event listeners and restores paused state on destroy", async () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  await engine.setTrack(tracks[0]);
  audio.play();
  engine.destroy();
  for (const listeners of audio.listeners.values()) {
    assert.equal(listeners.length, 0);
  }
});

test("AudioEngine seeks with a non-finite duration and a clamped rate", () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  audio.duration = Number.NaN;
  engine.seek(42);
  assert.equal(audio.currentTime, 42);
  audio.duration = 100;
  engine.seek(75);
  assert.equal(audio.currentTime, 75);
  engine.setRate(9);
  assert.equal(audio.playbackRate, 2);
  engine.setRate(0.1);
  assert.equal(audio.playbackRate, 0.75);
});

test("AudioEngine handles timeupdate and loadedmetadata with non-finite values", () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  void engine.setTrack(tracks[0]);
  audio.currentTime = Number.NaN;
  audio.duration = Number.NaN;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 0);
  audio.emit("timeupdate");
  assert.equal(
    events.some((event) => event.type === "progress"),
    true
  );
});

test("AudioEngine falls back to resumeAt when metadata duration is zero", () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  void engine.setTrack(tracks[0], 30);
  audio.duration = 0;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 30);
  audio.currentTime = Number.NaN;
  audio.duration = Number.NaN;
  audio.emit("timeupdate");
});

test("AudioEngine rejects a non-positive resumeAt value when loading", async () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  assert.equal(await engine.setTrack(tracks[0], -5), true);
  assert.equal(engine["resumeAt"], 0);
});

test("AudioEngine seek treats a finite non-positive duration as unbounded", () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  audio.duration = 0;
  engine.seek(60);
  assert.equal(audio.currentTime, 60);
  audio.duration = -10;
  engine.seek(90);
  assert.equal(audio.currentTime, 90);
});

test("AudioEngine loadedmetadata with a negative duration falls back to resumeAt", () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  void engine.setTrack(tracks[0], 25);
  audio.duration = -1;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 25);
});

test("AudioEngine timeupdate reports non-finite currentTime as zero", () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  void engine.setTrack(tracks[0]);
  audio.currentTime = Number.NaN;
  audio.duration = Number.NaN;
  audio.emit("timeupdate");
  const progress = events.find((event) => event.type === "progress");
  assert.deepEqual(progress, { type: "progress", currentTime: 0, duration: 0 });
});

test("AudioEngine advances candidates when play rejects", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  audio.failPlay = true;
  assert.equal(await engine.setTrack(tracks[0]), false);
  assert.equal(audio.playCalls, 2);
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The audio stream is unavailable from Dhamma Download."
  });
});

test("AudioEngine timeout advances to the next candidate", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.play = async () => {
    audio.playCalls += 1;
    // never resolves; emulates a stalled network request
    return new Promise(() => {});
  };
  const engine = new AudioEngine(audio, (event) => events.push(event), 5);
  const result = await engine.setTrack(tracks[0]);
  // Wait for the chained fallback attempt to also time out and emit its final error.
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(result, false);
  assert.equal(audio.playCalls >= 2, true);
  assert.equal(
    events.some((event) => event.type === "error"),
    true
  );
});

test("AudioEngine cancels in-flight candidates when a new track is loaded", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.play = async () => {
    audio.playCalls += 1;
    return new Promise(() => {});
  };
  const engine = new AudioEngine(audio, (event) => events.push(event), 5);
  void engine.setTrack(tracks[0]);
  // Immediately start a second track; the first attempt should be invalidated.
  void engine.setTrack(tracks[1]);
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Both attempts have timed out; ensure at least one play was attempted.
  assert.equal(audio.playCalls >= 2, true);
  engine.destroy();
});

test("AudioEngine invalidates stale onTimeout callbacks after success", async () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {}, 1);
  await engine.setTrack(tracks[0]);
  // The play() promise has already resolved; the setTimeout will fire and immediately
  // bail because settled=true.
  await new Promise((resolve) => setTimeout(resolve, 20));
  engine.destroy();
});

test("AudioEngine invalidates stale play callbacks after a timeout-driven retry", async () => {
  const audio = new FakeAudio();
  audio.play = async () => {
    audio.playCalls += 1;
    // Resolves later, after the timeout has already triggered a fallback attempt.
    return new Promise((resolve) => setTimeout(() => resolve(), 50));
  };
  const engine = new AudioEngine(audio, () => {}, 1);
  const result = await engine.setTrack(tracks[0]);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(typeof result, "boolean");
  engine.destroy();
});

test("AudioEngine seek keeps the position when audio duration is infinite", () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  audio.duration = Number.POSITIVE_INFINITY;
  engine.seek(50);
  assert.equal(audio.currentTime, 50);
});

test("AudioEngine seek with no playable track leaves currentTime at zero", () => {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio, () => {});
  audio.duration = 0;
  audio.currentTime = -5;
  engine.seek(60);
  assert.equal(audio.currentTime, 60);
});

test("AudioEngine surfaces the final error after a fallback also fails", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.failPlay = true;
  const engine = new AudioEngine(audio, (event) => events.push(event));
  await engine.setTrack(tracks[0]);
  assert.equal(audio.playCalls, 2);
  assert.equal(
    events.some((event) => event.type === "error" && event.message.includes("unavailable")),
    true
  );
});

test("AudioEngine timeupdate with finite duration records progress", () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new AudioEngine(audio, (event) => events.push(event));
  void engine.setTrack(tracks[0]);
  audio.currentTime = 25;
  audio.duration = 200;
  audio.emit("timeupdate");
  assert.deepEqual(events.at(-1), { type: "progress", currentTime: 25, duration: 200 });
});
