import test from "node:test";
import assert from "node:assert/strict";
import {
  renderPlayerRegion,
  renderPlayerProgress,
  renderPreservingScroll
} from "../.test-build/src/main.js";
import { createInitialState } from "../.test-build/src/store.js";

class FakeRoot {
  content = { scrollTop: 240, scrollLeft: 12 };
  horizontal = { scrollLeft: 360, scrollTop: 0 };
  nextContent = { scrollTop: 0, scrollLeft: 0 };
  nextHorizontal = { scrollLeft: 0, scrollTop: 0 };
  rendered = "";

  querySelector(selector) {
    return selector === ".app-content" ? this.content : null;
  }

  querySelectorAll(selector) {
    return selector === "[data-scroll-preserve]" ? [this.horizontal] : [];
  }

  set innerHTML(value) {
    this.rendered = value;
    this.content = this.nextContent;
    this.horizontal = this.nextHorizontal;
  }
}

test("renderPreservingScroll keeps the content position across playback renders", () => {
  const root = new FakeRoot();

  renderPreservingScroll(root, createInitialState());

  assert.equal(root.content.scrollTop, 240);
  assert.equal(root.content.scrollLeft, 12);
  assert.equal(root.horizontal.scrollLeft, 360);
  assert.match(root.rendered, /class="app-content/);
});

test("renderPlayerRegion updates only the player region", () => {
  const root = new FakeRoot();
  const playerRegion = { innerHTML: "old player" };
  root.querySelector = (selector) =>
    selector === "[data-player-region]" ? playerRegion : selector === ".app-content" ? root.content : null;

  renderPlayerRegion(root, createInitialState());

  assert.notEqual(playerRegion.innerHTML, "old player");
  assert.equal(root.rendered, "");
});

test("renderPlayerProgress updates playback controls without replacing the player DOM", () => {
  const root = new FakeRoot();
  const currentTime = { textContent: "0:00" };
  const duration = { textContent: "0:00" };
  const seek = { value: "0" };
  root.querySelector = (selector) =>
    ({
      "[data-player-current-time]": currentTime,
      "[data-player-duration]": duration,
      'input[data-action="seek"]': seek
    })[selector] ?? null;
  const state = createInitialState();
  state.player.currentTime = 42;
  state.player.duration = 120;

  assert.equal(renderPlayerProgress(root, state), true);
  assert.equal(currentTime.textContent, "0:42");
  assert.equal(duration.textContent, "2:00");
  assert.equal(seek.value, "42");
  assert.equal(root.rendered, "");
});
