import test from "node:test";
import assert from "node:assert/strict";
import { isEditableTarget, selectInvoke } from "../.test-build/src/runtime.js";

const supplied = async () => "ok";
test("selectInvoke keeps a supplied Tauri invoke function", () => {
  assert.equal(selectInvoke(supplied), supplied);
});
test("selectInvoke falls back to the local mock", async () => {
  assert.equal(typeof selectInvoke(undefined), "function");
  assert.equal((await selectInvoke(undefined)("get_catalogue_summary")).totalAudio, 30563);
});
test("isEditableTarget handles form fields, contenteditable and other targets", () => {
  assert.equal(isEditableTarget(null), false);
  assert.equal(isEditableTarget({}), false);
  assert.equal(isEditableTarget({ tagName: "INPUT" }), true);
  assert.equal(isEditableTarget({ tagName: "select" }), true);
  assert.equal(isEditableTarget({ tagName: "textarea" }), true);
  assert.equal(isEditableTarget({ tagName: "button" }), false);
  assert.equal(isEditableTarget({ tagName: "div", isContentEditable: true }), true);
});
test("localFileUrl uses Tauri conversion when available", async () => {
  const previous = globalThis.window;
  globalThis.window = { __TAURI__: { core: { convertFileSrc: (path) => `asset://${path}` } } };
  const { localFileUrl } = await import("../.test-build/src/runtime.js");
  assert.equal(localFileUrl("/tmp/talk.mp3"), "asset:///tmp/talk.mp3");
  globalThis.window = previous;
});
test("localFileUrl falls back to the original path", async () => {
  const previous = globalThis.window;
  globalThis.window = {};
  const { localFileUrl } = await import("../.test-build/src/runtime.js");
  assert.equal(localFileUrl("/tmp/talk.mp3"), "/tmp/talk.mp3");
  globalThis.window = previous;
});
