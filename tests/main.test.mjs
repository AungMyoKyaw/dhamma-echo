import test from "node:test";
import assert from "node:assert/strict";
import { renderPreservingScroll } from "../.test-build/src/main.js";
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
