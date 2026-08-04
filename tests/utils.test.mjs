import test from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  escapeHtml,
  formatDuration,
  isPlayableUrl,
  normalizeWhitespace
} from "../.test-build/src/utils.js";

test("normalizeWhitespace collapses scraped whitespace", () => {
  assert.equal(
    normalizeWhitespace("  Venerable\n\t Sayadaw   U Jotika "),
    "Venerable Sayadaw U Jotika"
  );
});

test("formatDuration formats unknown, minute, and hour durations", () => {
  assert.equal(formatDuration(Number.NaN), "0:00");
  assert.equal(formatDuration(65.9), "1:05");
  assert.equal(formatDuration(3661), "1:01:01");
});

test("isPlayableUrl only permits secure Dhamma Download media", () => {
  assert.equal(isPlayableUrl("https://dhammadownload.com/a.mp3"), true);
  assert.equal(isPlayableUrl("http://dhammadownload.com/a.mp3"), false);
  assert.equal(isPlayableUrl("https://example.com/a.mp3"), false);
  assert.equal(isPlayableUrl("not a url"), false);
});

test("clamp constrains finite and non-finite values", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(Number.NaN, 0, 10), 0);
});

test("escapeHtml protects rendered catalogue text", () => {
  assert.equal(
    escapeHtml(`<script>&"'</script>`),
    "&lt;script&gt;&amp;&quot;&#039;&lt;/script&gt;"
  );
});
