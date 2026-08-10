import test from "node:test";
import assert from "node:assert/strict";
import { renderPlayerRegion, renderPreservingScroll } from "../.test-build/src/main.js";
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
