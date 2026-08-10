import test from "node:test";
import assert from "node:assert/strict";
import { isEditableTarget, isRoute, selectInvoke } from "../.test-build/src/runtime.js";

const supplied = async () => "ok";
test("selectInvoke keeps a supplied Tauri invoke function", () => { assert.equal(selectInvoke(supplied), supplied); });
test("selectInvoke falls back to the local mock", async () => { assert.equal(typeof selectInvoke(undefined), "function"); assert.equal((await selectInvoke(undefined)("get_catalogue_summary")).totalAudio, 30563); });
test("isRoute recognizes all app routes and rejects unknown values", () => { for (const route of ["home","explore","collections","collection-detail","teachers","teacher-detail","library","settings"]) assert.equal(isRoute(route), true); assert.equal(isRoute("missing"), false); });
test("isEditableTarget handles form fields, contenteditable and other targets", () => { assert.equal(isEditableTarget(null), false); assert.equal(isEditableTarget({}), false); assert.equal(isEditableTarget({ tagName: "INPUT" }), true); assert.equal(isEditableTarget({ tagName: "select" }), true); assert.equal(isEditableTarget({ tagName: "textarea" }), true); assert.equal(isEditableTarget({ tagName: "button" }), false); assert.equal(isEditableTarget({ tagName: "div", isContentEditable: true }), true); });
