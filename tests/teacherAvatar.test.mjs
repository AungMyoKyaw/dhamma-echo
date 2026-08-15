import test from "node:test";
import assert from "node:assert/strict";
import { teacherAvatarDataUri, teacherAvatarSvg } from "../.test-build/src/teacherAvatar.js";

test("teacherAvatarSvg is deterministic per teacher id", () => {
  assert.equal(teacherAvatarSvg(42), teacherAvatarSvg(42));
  assert.equal(teacherAvatarSvg(1), teacherAvatarSvg(1));
});

test("teacherAvatarSvg produces distinct output across teacher ids", () => {
  const ids = [1, 2, 3, 4, 5, 8, 16, 42, 53, 61, 100];
  const seen = new Set(ids.map(teacherAvatarSvg));
  assert.ok(seen.size >= Math.ceil(ids.length * 0.8), "expected most ids to map to distinct svgs");
});

test("teacherAvatarSvg returns a well-formed svg root", () => {
  const svg = teacherAvatarSvg(42);
  assert.ok(svg.startsWith("<svg"), "svg should start with <svg tag");
  assert.ok(svg.endsWith("</svg>"), "svg should end with </svg>");
  assert.ok(
    svg.includes('xmlns="http://www.w3.org/2000/svg"'),
    "svg should declare the svg namespace"
  );
  assert.ok(/viewBox="0 0 \d+ \d+"/.test(svg), "svg should declare a numeric viewBox");
  assert.ok(
    svg.includes('width="64"') && svg.includes('height="64"'),
    "svg should be sized at 64x64"
  );
});

test("teacherAvatarDataUri returns a data URI with the encoded svg", () => {
  const uri = teacherAvatarDataUri(42);
  assert.ok(uri.startsWith("data:image/svg+xml"), "uri should use the svg data URI scheme");
  assert.ok(uri.includes(encodeURIComponent("<svg")));
  assert.equal(uri, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(teacherAvatarSvg(42))}`);
});
