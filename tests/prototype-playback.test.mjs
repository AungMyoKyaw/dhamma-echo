import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../prototype/index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Minimal DOM harness: exercise the standalone prototype without new dependencies.
function element(dataset = {}) {
  const attributes = new Map();
  const classes = new Set();
  return {
    dataset,
    hidden: false,
    value: "36",
    textContent: "",
    innerHTML: "",
    title: "",
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      }
    },
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: (name) => attributes.get(name),
    addEventListener() {}
  };
}

function harness() {
  const nodes = new Map();
  const rows = [0, 1, 1, 2, 3, 4].map((index) => {
    const row = element({ index: String(index) });
    const status = element();
    row.querySelector = () => status;
    return row;
  });
  const buttons = rows.flatMap((row) => {
    const play = element(row.dataset);
    const title = element(row.dataset);
    title.classList.add("track-title");
    return [play, title];
  });
  const document = {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, element());
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === '[data-action="play-track"]') return buttons;
      if (selector === "[data-track-row]") return rows;
      return [];
    },
    addEventListener() {}
  };
  const context = { document, setTimeout: () => 1, clearTimeout() {} };
  runInNewContext(script, context);
  return { context, rows, buttons, node: (selector) => document.querySelector(selector) };
}

test("idle rows have explicit 44px playback controls and separate title buttons", () => {
  assert.match(html, /\.row-play\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/);
  assert.match(html, /class="track-title/);
  assert.match(html, /\[hidden\]\s*\{\s*display: none !important;/);
});

test("starting a different talk synchronizes every row, title, and footer", () => {
  const app = harness();
  app.context.playTrack(1);
  assert.equal(app.node("#player-title").textContent, "Praise and Blame");
  assert.equal(app.node("#time-duration").textContent, "46:00");
  assert.equal(app.node("#time-current").textContent, "00:00");
  for (const row of app.rows) {
    const current = row.dataset.index === "1";
    assert.equal(row.dataset.current, String(current));
    assert.equal(row.querySelector().hidden, !current);
    assert.equal(row.querySelector().textContent, current ? "Playing" : "");
  }
  for (const button of app.buttons.filter((item) => item.dataset.index === "1")) {
    assert.equal(button.getAttribute("aria-label"), "Pause Praise and Blame");
    assert.equal(button.getAttribute("aria-pressed"), "true");
  }
});

test("pressing the current talk pauses and then resumes it", () => {
  const app = harness();
  app.context.playTrack(1);
  app.context.playTrack(1);
  assert.equal(app.rows[1].querySelector().textContent, "Paused");
  assert.equal(app.buttons[2].getAttribute("aria-label"), "Play Praise and Blame");
  app.context.playTrack(1);
  assert.equal(app.rows[1].querySelector().textContent, "Playing");
});

test("footer pause synchronizes row controls without replacing focused DOM nodes", () => {
  const app = harness();
  app.context.playTrack(3);
  const markup = app.node("#view").innerHTML;
  const title = app.buttons[9];
  app.context.setPlaying(false);
  assert.equal(title.getAttribute("aria-label"), "Play Living with Awareness");
  assert.equal(app.node("#view").innerHTML, markup);
});

test("unplayable and invalid indices cannot replace the current talk", () => {
  const app = harness();
  app.context.playTrack(1);
  for (const index of [4, -1, 999, Number.NaN]) app.context.playTrack(index);
  assert.equal(app.node("#player-title").textContent, "Praise and Blame");
  assert.equal(app.rows[1].querySelector().textContent, "Playing");
});

test("seeking uses the current talk duration and clamps to its bounds", () => {
  const app = harness();
  app.context.playTrack(2);
  app.context.seek(15);
  assert.equal(app.node("#time-current").textContent, "00:15");
  app.context.seek(-15);
  assert.equal(app.node("#time-current").textContent, "00:00");
  app.context.seek(9999);
  assert.equal(app.node("#time-current").textContent, "38:00");
  assert.equal(app.node("#player-range").value, "100");
});
