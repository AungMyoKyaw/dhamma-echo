import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPlatformClass,
  detectPlatform,
  getNativeWindow,
  isEditableTarget,
  selectInvoke
} from "../.test-build/src/runtime.js";

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
test("getNativeWindow exposes the Tauri window fullscreen bridge", () => {
  const previous = globalThis.window;
  const nativeWindow = {
    isFullscreen: async () => false,
    setFullscreen: async () => {}
  };
  globalThis.window = { __TAURI__: { window: { getCurrentWindow: () => nativeWindow } } };
  assert.equal(getNativeWindow(), nativeWindow);
  globalThis.window = previous;
});
test("getNativeWindow returns null outside Tauri", () => {
  const previous = globalThis.window;
  globalThis.window = {};
  assert.equal(getNativeWindow(), null);
  globalThis.window = previous;
});

function setNavigator(userAgent) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: userAgent === undefined ? undefined : { userAgent },
    configurable: true,
    writable: true
  });
  return () => {
    if (previous === undefined) {
      delete globalThis.navigator;
    } else {
      Object.defineProperty(globalThis, "navigator", previous);
    }
  };
}

test("detectPlatform returns macos for macOS user agents", () => {
  const restore = setNavigator("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)");
  assert.equal(detectPlatform(), "macos");
  restore();
});

test("detectPlatform returns windows for Windows user agents", () => {
  const restore = setNavigator("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
  assert.equal(detectPlatform(), "windows");
  restore();
});

test("detectPlatform returns linux for Linux user agents", () => {
  const restore = setNavigator("Mozilla/5.0 (X11; Linux x86_64)");
  assert.equal(detectPlatform(), "linux");
  restore();
});

test("detectPlatform falls back to browser for unknown user agents", () => {
  const restore = setNavigator("Mozilla/5.0 (compatible; CustomBot/1.0)");
  assert.equal(detectPlatform(), "browser");
  restore();
});

test("detectPlatform handles a missing navigator without throwing", () => {
  const restore = setNavigator(undefined);
  assert.equal(detectPlatform(), "browser");
  restore();
});

test("applyPlatformClass writes the detected platform onto the target element", () => {
  const restore = setNavigator("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)");
  const target = { dataset: {} };
  applyPlatformClass(target);
  assert.equal(target.dataset.platform, "macos");
  restore();
});
