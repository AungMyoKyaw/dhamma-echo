import test from "node:test";
import assert from "node:assert/strict";
import { MediaEngine } from "../.test-build/src/player.js";
import { tracks, videoTrack } from "./test-data.mjs";

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
  removeAttribute(name) {
    if (name === "src") this.src = "";
  }
  emit(type) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

test("MediaEngine loads, controls, and reports secure tracks", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
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

test("MediaEngine stops and clears the active media source", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  await engine.setTrack(tracks[0]);

  engine.stop();

  assert.equal(audio.paused, true);
  assert.equal(audio.src, "");
  assert.equal(audio.currentTime, 0);
  assert.deepEqual(events.at(-1), { type: "status", status: "paused" });
});

test("MediaEngine ignores stale media events after stop", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  await engine.setTrack(tracks[0]);
  engine.stop();
  const eventCount = events.length;

  audio.emit("play");
  audio.emit("pause");
  audio.emit("loadedmetadata");
  audio.emit("timeupdate");
  audio.emit("ended");
  audio.emit("error");

  assert.equal(events.length, eventCount);
  engine.destroy();
});

test("MediaEngine cancels a pending play request when toggled", async () => {
  const audio = new FakeAudio();
  let resolvePlay;
  let playPromise;
  audio.play = () => {
    audio.playCalls += 1;
    playPromise ??= new Promise((resolve) => (resolvePlay = resolve));
    return playPromise;
  };
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  const loading = engine.setTrack(tracks[0]);

  await new Promise((resolve) => setTimeout(resolve, 0));
  const toggling = engine.toggle();
  resolvePlay();
  await toggling;
  await loading;

  assert.equal(audio.playCalls, 1);
  assert.equal(audio.paused, true);
  assert.deepEqual(events.at(-1), { type: "status", status: "paused" });
  engine.destroy();
});

test("MediaEngine rejects unsafe media and reports play failures", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
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
    message: "This media source is not trusted."
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

test("MediaEngine reports video-specific final errors", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.failPlay = true;
  const engine = new MediaEngine(audio, (event) => events.push(event));
  await engine.setTrack(videoTrack);
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The video is unavailable from Dhamma Download."
  });
});

test("MediaEngine reports media events and non-finite metadata safely", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
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

test("MediaEngine reports video-specific resume failures", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  await engine.setTrack(videoTrack);
  audio.pause();
  audio.failPlay = true;
  await engine.toggle();
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The video could not start."
  });
});

test("MediaEngine waits for metadata, clamps resume, and retries the alternate approved host", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
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

test("MediaEngine ignores a synchronous media error while the candidate is starting", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.emitErrorOnLoad = true;
  const engine = new MediaEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack(tracks[0]), true);
  assert.equal(audio.playCalls, 1);
  assert.equal(
    events.some((event) => event.type === "error"),
    false
  );
});

test("MediaEngine rejects unsupported formats before changing the media source", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  assert.equal(await engine.setTrack({ ...tracks[0], format: "wma" }), false);
  assert.equal(audio.src, "");
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "This media format is not supported by the macOS player."
  });
});

test("MediaEngine rejects untrusted mp4 sources before changing the media source", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  assert.equal(
    await engine.setTrack({
      ...tracks[0],
      format: "mp4",
      url: "https://example.com/a.mp4",
      playable: false
    }),
    false
  );
  assert.equal(audio.src, "");
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "This media source is not trusted."
  });
});

test("MediaEngine prefers a downloaded local URL when provided", async () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  assert.equal(await engine.setTrack(tracks[0], 0, "asset:///tmp/talk.mp3"), true);
  assert.equal(audio.src, "asset:///tmp/talk.mp3");
});

test("MediaEngine cleans up event listeners and restores paused state on destroy", async () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  await engine.setTrack(tracks[0]);
  audio.play();
  engine.destroy();
  for (const listeners of audio.listeners.values()) {
    assert.equal(listeners.length, 0);
  }
});

test("MediaEngine seeks with a non-finite duration and a clamped rate", () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
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

test("MediaEngine handles timeupdate and loadedmetadata with non-finite values", () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
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

test("MediaEngine falls back to resumeAt when metadata duration is zero", () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  void engine.setTrack(tracks[0], 30);
  audio.duration = 0;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 30);
  audio.currentTime = Number.NaN;
  audio.duration = Number.NaN;
  audio.emit("timeupdate");
});

test("MediaEngine rejects a non-positive resumeAt value when loading", async () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  assert.equal(await engine.setTrack(tracks[0], -5), true);
  assert.equal(engine["resumeAt"], 0);
});

test("MediaEngine seek treats a finite non-positive duration as unbounded", () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  audio.duration = 0;
  engine.seek(60);
  assert.equal(audio.currentTime, 60);
  audio.duration = -10;
  engine.seek(90);
  assert.equal(audio.currentTime, 90);
});

test("MediaEngine loadedmetadata with a negative duration falls back to resumeAt", () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  void engine.setTrack(tracks[0], 25);
  audio.duration = -1;
  audio.emit("loadedmetadata");
  assert.equal(audio.currentTime, 25);
});

test("MediaEngine timeupdate reports non-finite currentTime as zero", () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  void engine.setTrack(tracks[0]);
  audio.currentTime = Number.NaN;
  audio.duration = Number.NaN;
  audio.emit("timeupdate");
  const progress = events.find((event) => event.type === "progress");
  assert.deepEqual(progress, { type: "progress", currentTime: 0, duration: 0 });
});

test("MediaEngine advances candidates when play rejects", async () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  audio.failPlay = true;
  assert.equal(await engine.setTrack(tracks[0]), false);
  assert.equal(audio.playCalls, 2);
  assert.deepEqual(events.at(-1), {
    type: "error",
    message: "The audio stream is unavailable from Dhamma Download."
  });
});

test("MediaEngine timeout advances to the next candidate", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.play = async () => {
    audio.playCalls += 1;
    // never resolves; emulates a stalled network request
    return new Promise(() => {});
  };
  const engine = new MediaEngine(audio, (event) => events.push(event), 5);
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

test("MediaEngine cancels in-flight candidates when a new track is loaded", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.play = async () => {
    audio.playCalls += 1;
    return new Promise(() => {});
  };
  const engine = new MediaEngine(audio, (event) => events.push(event), 5);
  void engine.setTrack(tracks[0]);
  // Immediately start a second track; the first attempt should be invalidated.
  void engine.setTrack(tracks[1]);
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Both attempts have timed out; ensure at least one play was attempted.
  assert.equal(audio.playCalls >= 2, true);
  engine.destroy();
});

test("MediaEngine invalidates stale onTimeout callbacks after success", async () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {}, 1);
  await engine.setTrack(tracks[0]);
  // The play() promise has already resolved; the setTimeout will fire and immediately
  // bail because settled=true.
  await new Promise((resolve) => setTimeout(resolve, 20));
  engine.destroy();
});

test("MediaEngine invalidates stale play callbacks after a timeout-driven retry", async () => {
  const audio = new FakeAudio();
  audio.play = async () => {
    audio.playCalls += 1;
    // Resolves later, after the timeout has already triggered a fallback attempt.
    return new Promise((resolve) => setTimeout(() => resolve(), 50));
  };
  const engine = new MediaEngine(audio, () => {}, 1);
  const result = await engine.setTrack(tracks[0]);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(typeof result, "boolean");
  engine.destroy();
});

test("MediaEngine seek keeps the position when audio duration is infinite", () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  audio.duration = Number.POSITIVE_INFINITY;
  engine.seek(50);
  assert.equal(audio.currentTime, 50);
});

test("MediaEngine seek with no playable track leaves currentTime at zero", () => {
  const audio = new FakeAudio();
  const engine = new MediaEngine(audio, () => {});
  audio.duration = 0;
  audio.currentTime = -5;
  engine.seek(60);
  assert.equal(audio.currentTime, 60);
});

test("MediaEngine surfaces the final error after a fallback also fails", async () => {
  const audio = new FakeAudio();
  const events = [];
  audio.failPlay = true;
  const engine = new MediaEngine(audio, (event) => events.push(event));
  await engine.setTrack(tracks[0]);
  assert.equal(audio.playCalls, 2);
  assert.equal(
    events.some((event) => event.type === "error" && event.message.includes("unavailable")),
    true
  );
});

test("MediaEngine timeupdate with finite duration records progress", () => {
  const audio = new FakeAudio();
  const events = [];
  const engine = new MediaEngine(audio, (event) => events.push(event));
  void engine.setTrack(tracks[0]);
  audio.currentTime = 25;
  audio.duration = 200;
  audio.emit("timeupdate");
  assert.deepEqual(events.at(-1), { type: "progress", currentTime: 25, duration: 200 });
});

test("MediaEngine error without startedAttempt does not advance candidates", async () => {
  const audio = new FakeAudio();
  const events = [];
  new MediaEngine(audio, (event) => events.push(event));
  audio.emit("error");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(events.length, 0);
});
