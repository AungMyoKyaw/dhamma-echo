import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = (name) => readFileSync(new URL(`../prototype/${name}`, import.meta.url), "utf8");
const html = source("index.html");
const css = source("styles.css") + source("parity.css") + source("video.css");

// Minimal state/DOM harness. Real layout, focus, and native dialog behavior are
// verified separately in the browser, not claimed from these string assertions.
function harness(saved = null, brokenStorage = false) {
  const nodes = new Map();
  const intervals = new Map();
  const timeouts = new Map();
  const storage = new Map(saved ? [["dhamma-echo:prototype:v1", JSON.stringify(saved)]] : []);
  let timerId = 0;
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => element({ id: String(id) }));
  buttons.forEach((button) => button.classList.add("play-button"));
  const statuses = buttons.map((button) => element({ status: button.dataset.id }));
  const rows = buttons.map((button) => element({ track: button.dataset.id }));
  function element(dataset = {}) {
    const attributes = new Map();
    const classes = new Set();
    const listeners = new Map();
    return {
      dataset,
      hidden: false,
      open: false,
      value: "",
      innerHTML: "",
      textContent: "",
      paused: true,
      readyState: 2,
      currentTime: 0,
      duration: 24,
      loadCount: 0,
      play() {
        this.paused = false;
      },
      pause() {
        this.paused = true;
      },
      load() {
        this.loadCount += 1;
      },
      classList: {
        add: (value) => classes.add(value),
        remove: (value) => classes.delete(value),
        contains: (value) => classes.has(value),
        toggle: (value, force) => (force ? classes.add(value) : classes.delete(value))
      },
      setAttribute: (key, value) => attributes.set(key, value),
      getAttribute: (key) => attributes.get(key),
      hasAttribute: (key) => attributes.has(key),
      removeAttribute: (key) => attributes.delete(key),
      addEventListener(key, callback) {
        const handlers = listeners.get(key) ?? [];
        handlers.push(callback);
        listeners.set(key, handlers);
      },
      emit(key) {
        for (const callback of listeners.get(key) ?? []) callback();
      },
      append(child) {
        child.parentElement = this;
      },
      focus() {},
      contains: () => false,
      querySelector: (selector) => node(`child:${selector}`),
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
      }
    };
  }
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  }
  const document = {
    documentElement: element(),
    body: element(),
    activeElement: null,
    querySelector: node,
    querySelectorAll(selector) {
      if (selector === "[data-action='play']") return buttons;
      if (selector === "[data-status]") return statuses;
      if (selector === "[data-track]") return rows;
      if (selector === "[data-seek]") return [node("[data-seek]")];
      if (selector.startsWith("[data-time=")) return [node(selector)];
      return [];
    },
    addEventListener() {}
  };
  const context = {
    document,
    CSS: { escape: (value) => value },
    localStorage: {
      getItem: (key) => {
        if (brokenStorage) throw new Error("Storage disabled");
        return storage.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (brokenStorage) throw new Error("Storage disabled");
        storage.set(key, value);
      },
      removeItem: (key) => storage.delete(key)
    },
    history: { replaceState() {} },
    location: { hash: "", pathname: "/prototype/" },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {},
    scrollTo() {},
    setInterval(callback, delay) {
      const id = ++timerId;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval: (id) => intervals.delete(id),
    setTimeout(callback, delay) {
      const id = ++timerId;
      timeouts.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timeouts.delete(id)
  };
  for (const file of ["messages.js", "data.js", "video.js", "app.js"])
    runInNewContext(source(file), context);
  return {
    ...context.DhammaPrototype,
    buttons,
    statuses,
    rows,
    node,
    storage,
    context,
    tick(delay) {
      for (const timer of [...intervals.values()]) if (timer.delay === delay) timer.callback();
    },
    finish(delay) {
      for (const [id, timer] of [...timeouts.entries()])
        if (timer.delay === delay) {
          timeouts.delete(id);
          timer.callback();
        }
    }
  };
}

test("prototype loads dependency-free local scripts and preserves visible playback controls", () => {
  for (const file of ["messages.js", "data.js", "video.js", "app.js"])
    assert.match(html, new RegExp(`src="\\./${file}" defer`));
  assert.match(css, /\.track-play\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/);
  assert.match(css, /\[hidden\]\s*\{\s*display: none !important;/);
  assert.match(source("app.js"), /class="track-title/);
});

test("shared icon frames and collapsed/mobile navigation rules remain intact", () => {
  assert.match(css, /--icon-label-shift:\s*-1px;/);
  assert.match(css, /\.nav-label,\s*\.collapse-label\s*\{[^}]*line-height:\s*20px;/);
  assert.match(
    css,
    /\.nav-button \.icon,\s*\.collapse-button \.icon,\s*\.search-box \.icon\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/
  );
  assert.match(css, /\.sidebar\[data-collapsed="true"\] \.nav-label/);
  assert.match(css, /\.mobile-nav \.nav-label\s*\{\s*display:\s*block;/);
  assert.doesNotMatch(source("app.js"), /style\.setProperty\("--sidebar-width"/);
});

test("starting a different talk synchronizes rows, controls, footer, and history", () => {
  const app = harness();
  app.playTrack(3);
  assert.equal(app.state.current, 3);
  assert.equal(app.state.playing, true);
  assert.equal(app.state.position, 418);
  assert.equal(app.state.history[0], 3);
  assert.match(app.node("#player").innerHTML, /Understanding the nature of the mind/);
  assert.equal(
    app.buttons[2].getAttribute("aria-label"),
    "Pause Understanding the nature of the mind"
  );
  assert.equal(app.rows[2].dataset.current, "true");
  assert.equal(app.statuses[2].textContent, "Playing");
});

test("current talk toggles pause/resume and transport pause leaves the view intact", () => {
  const app = harness();
  app.navigate("explore");
  app.playTrack(3);
  app.playTrack(3);
  assert.equal(app.state.playing, false);
  app.playTrack(3);
  assert.equal(app.state.playing, true);
  const view = app.node("#view").innerHTML;
  app.setPlaying(false);
  assert.equal(app.node("#view").innerHTML, view);
  assert.equal(app.statuses[2].textContent, "Paused");
});

test("WMA, WMV, and invalid IDs cannot play or enter the queue", () => {
  const app = harness();
  app.playTrack(3);
  for (const id of [6, 8, -1, 999, Number.NaN]) {
    app.playTrack(id);
    app.enqueue(id);
  }
  assert.equal(app.state.current, 3);
  assert.equal(app.state.queue.length, 0);
  const markup = app.node("#view").innerHTML;
  assert.doesNotMatch(markup, /undefined/);
});

test("duration-aware seeking clamps bounds and persists resume positions", () => {
  const app = harness();
  app.playTrack(3);
  app.seek(-15);
  assert.equal(app.state.position, 0);
  app.seek(9999);
  assert.equal(app.state.position, 3872);
  assert.equal(app.node("[data-seek]").value, "3872");
  assert.equal(app.node("[data-time='current']").textContent, "64:32");
  app.seek(Number.NaN);
  assert.equal(app.state.position, 3872);
  assert.equal(JSON.parse(app.storage.get(app.storageKey)).resume[3], 3872);
});

test("playback timer respects speed and advances to the next queued track", () => {
  const app = harness();
  app.playTrack(5);
  app.changeSetting("rate", "2");
  app.seek(10);
  app.tick(1000);
  assert.equal(app.state.position, 12);
  app.enqueue(2);
  app.seek(app.durationSeconds() - 1);
  app.tick(1000);
  assert.equal(app.state.current, 2);
  assert.equal(app.state.queue.length, 0);
  assert.equal(app.state.playing, true);
});

test("queue deduplicates, clears with undo, and does not persist", () => {
  const app = harness();
  app.enqueue(2);
  app.enqueue(2);
  app.enqueue(3);
  assert.deepEqual(Array.from(app.state.queue), [2, 3]);
  app.clearQueue();
  assert.equal(app.state.queue.length, 0);
  app.enqueue(5);
  app.undoQueue();
  assert.deepEqual(Array.from(app.state.queue), [2, 3, 5]);
  app.clearQueue();
  app.finish(6000);
  app.undoQueue();
  assert.equal(app.state.queue.length, 0);
  app.changeSetting("theme", "dark");
  assert.equal("queue" in JSON.parse(app.storage.get(app.storageKey)), false);
});

test("full filters combine across language, format, category, teacher, collection, and query", () => {
  const app = harness();
  Object.assign(app.state, {
    language: "English",
    format: "MP3",
    category: "Abhidhamma",
    teacherId: "1",
    collectionId: "4",
    query: "nature"
  });
  assert.equal(app.filteredTracks().length, 9);
  assert.ok(app.filteredTracks().every((track) => track.collectionId === 4));
  app.state.format = "WMA";
  assert.equal(app.filteredTracks().length, 0);
  Object.assign(app.state, {
    language: "",
    format: "",
    teacherId: "",
    collectionId: "",
    query: "",
    category: "Video"
  });
  assert.equal(app.filteredTracks().length, 18);
});

test("simulated downloads expose progress, save/remove sample badges, and recover from error", () => {
  const app = harness();
  app.download(5);
  assert.equal(app.state.downloadJobs[5], 0);
  app.tick(400);
  assert.equal(app.state.downloadJobs[5], 25);
  app.tick(400);
  app.tick(400);
  app.tick(400);
  assert.ok(app.state.downloads.includes(5));
  assert.equal(app.state.downloadJobs[5], undefined);
  assert.match(app.node("#toast").textContent, /No media file was downloaded/);
  app.download(5);
  assert.equal(app.state.downloads.includes(5), false);
  app.changeSetting("playerPreview", "error");
  app.download(5);
  assert.ok(app.state.downloadErrors.includes(5));
  app.changeSetting("playerPreview", "ready");
  app.download(5);
  assert.equal(app.state.downloadErrors.includes(5), false);
  app.download(6);
  assert.equal(app.state.downloadJobs[6], undefined);
});

test("video opens a dedicated watch page with a real local sample and inline queue", () => {
  const app = harness();
  app.navigate("explore");
  app.playTrack(7);
  assert.equal(app.state.route, "watch");
  assert.equal(app.node("#player").hidden, true);
  assert.match(app.node("#view").innerHTML, /id="watch-screen"/);
  assert.match(app.node("#view").innerHTML, /id="watch-upnext"/);
  assert.match(app.node("#view").innerHTML, /Not a recorded talk/);
  assert.equal(app.node("#video-media").src, "./assets/video-sample.mp4");
  assert.equal(app.node("#video-media").paused, false);
  assert.equal(app.durationSeconds(), 24);
  assert.doesNotMatch(html + css, /video-panel|video-open|No video stream is loaded/);
});

test("Back and Return keep the same video, playback position, and browse filters", () => {
  const app = harness();
  app.navigate("explore");
  app.state.language = "English";
  app.state.shown = 72;
  app.playTrack(7);
  app.seek(9);
  const media = app.node("#video-media");
  const loads = media.loadCount;
  app.back();
  assert.equal(app.state.route, "explore");
  assert.equal(app.state.shown, 72);
  assert.equal(app.state.language, "English");
  assert.equal(app.state.playing, true);
  assert.equal(app.node("#player").hidden, false);
  assert.match(app.node("#player").innerHTML, /Return to video/);
  assert.equal(media.parentElement, app.node("[data-dock-media]"));
  app.openWatch();
  assert.equal(app.state.route, "watch");
  assert.equal(media.parentElement, app.node("[data-watch-media]"));
  assert.equal(media.loadCount, loads);
  assert.equal(media.currentTime, 9);
});

test("video uses native time updates rather than the simulated audio timer", () => {
  const app = harness();
  app.playTrack(7);
  app.tick(1000);
  assert.equal(app.state.position, 0);
  const media = app.node("#video-media");
  media.currentTime = 8.5;
  media.emit("timeupdate");
  assert.equal(app.state.position, 8.5);
  assert.equal(app.state.resume[7], 8.5);
  app.seek(99);
  assert.equal(media.currentTime, 24);
  app.setPlaying(false);
  assert.equal(media.paused, true);
  app.setPlaying(true);
  assert.equal(media.currentTime, 0);
});

test("video completion can hand off to queued audio and Stop is distinct from Back", () => {
  const app = harness();
  app.navigate("explore");
  app.enqueue(3);
  app.playTrack(7);
  app.node("#video-media").emit("ended");
  assert.equal(app.state.current, 3);
  assert.equal(app.state.route, "explore");
  assert.equal(app.node("#player").hidden, false);
  app.playTrack(7);
  app.seek(6);
  app.closeVideo();
  assert.equal(app.state.current, null);
  assert.equal(app.state.playing, false);
  assert.equal(app.state.resume[7], 6);
  assert.equal(app.node("#video-media").paused, true);
  assert.equal(app.state.route, "explore");
});

test("video control updates preserve the media element and honor playback speed", () => {
  const app = harness();
  app.playTrack(7);
  const media = app.node("#video-media");
  const loads = media.loadCount;
  app.changeSetting("rate", "1.75");
  app.setPlaying(false);
  app.setPlaying(true);
  app.enqueue(3);
  assert.equal(media.playbackRate, 1.75);
  assert.equal(media.loadCount, loads);
  assert.equal(media.parentElement, app.node("[data-watch-media]"));
  app.changeSetting("playerPreview", "error");
  assert.equal(media.paused, true);
  assert.match(app.node("#watch-message").innerHTML, /could not play/);
  app.changeSetting("locale", "my-MM");
  assert.equal(app.node(".watch-stop span").textContent, "ဗီဒီယို ရပ်မည်");
  assert.match(app.node(".watch-back").querySelector("span").textContent, /ပင်မ/);
});

test("detail back navigation restores the originating view and settings are validated", () => {
  const app = harness();
  app.navigate("teacher-detail", 1, true);
  assert.match(app.node("#view").innerHTML, /Explore this teacher/);
  app.navigate("collection-detail", 1, true);
  app.back();
  assert.equal(app.state.route, "teacher-detail");
  app.back();
  assert.equal(app.state.route, "home");
  app.changeSetting("rate", "9");
  assert.equal(app.state.rate, 1);
  app.changeSetting("browseLimit", "25");
  assert.equal(app.state.shown, 25);
  app.changeSetting("browseLimit", "24");
  assert.equal(app.state.browseLimit, 25);
});

test("English/Myanmar settings affect UI, numerals, themes, and survive reload", () => {
  const app = harness();
  app.changeSetting("locale", "my-MM");
  app.changeSetting("theme", "dark");
  assert.equal(app.context.document.documentElement.lang, "my");
  assert.equal(app.context.document.documentElement.dataset.theme, "dark");
  assert.match(app.node("#desktop-nav").innerHTML, /ကိုယ်ပိုင်စာကြည့်တိုက်/);
  assert.match(app.formatTime(65), /၁:၀၅/);
  const reloaded = harness(JSON.parse(app.storage.get(app.storageKey)));
  assert.equal(reloaded.state.locale, "my-MM");
  assert.equal(reloaded.state.theme, "dark");
  assert.ok([...app.storage.keys()].every((key) => key.includes(":prototype:")));
});

test("invalid saved data and disabled browser storage do not break the preview", () => {
  const malformed = harness({
    version: 1,
    favorites: [1, 1, -1, "2", 999],
    history: [],
    downloads: [],
    resume: { 1: 99999, 2: -5, 3: "bad" },
    rate: 9,
    locale: "bad",
    theme: "bad"
  });
  assert.deepEqual(Array.from(malformed.state.favorites), [1]);
  assert.equal(malformed.state.resume[1], 3130);
  assert.equal(malformed.state.resume[2], undefined);
  assert.equal(malformed.state.rate, 1);
  assert.equal(malformed.state.current, null);
  const blocked = harness(null, true);
  blocked.playTrack(5);
  blocked.seek(12);
  assert.equal(blocked.state.position, 12);
});

test("first-launch preview clears the seeded library and media failures pause simulation", () => {
  const app = harness();
  app.changeSetting("preview", "first");
  assert.equal(app.state.history.length, 0);
  assert.equal(app.state.favorites.length, 0);
  assert.equal(app.state.downloads.length, 0);
  assert.equal(app.node("#player").hidden, true);
  assert.match(app.node("#view").innerHTML, /Find something to listen to/);
  app.changeSetting("playerPreview", "loading");
  app.playTrack(5);
  assert.equal(app.state.playing, false);
  app.changeSetting("playerPreview", "error");
  assert.match(app.node("#player").innerHTML, /Simulated media unavailable/);
});
