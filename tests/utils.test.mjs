import test from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  escapeHtml,
  formatDuration,
  isPlayableUrl,
  mediaUrlCandidates,
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
  assert.equal(isPlayableUrl("http://dhammadownload.com/a.mp3"), true);
  assert.equal(isPlayableUrl("https://www.dhammadownload.com/a.mp3"), true);
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


test("mediaUrlCandidates normalizes approved MP3 sources and blocks unsupported media", () => {
  assert.deepEqual(
    mediaUrlCandidates(
      "http://dhammadownload.com/MP3Library/Myanmar/တရား တော်.mp3",
      "MP3"
    ),
    [
      "https://www.dhammadownload.com/MP3Library/Myanmar/%E1%80%90%E1%80%9B%E1%80%AC%E1%80%B8%20%E1%80%90%E1%80%B1%E1%80%AC%E1%80%BA.mp3",
      "https://dhammadownload.com/MP3Library/Myanmar/%E1%80%90%E1%80%9B%E1%80%AC%E1%80%B8%20%E1%80%90%E1%80%B1%E1%80%AC%E1%80%BA.mp3"
    ]
  );
  assert.deepEqual(
    mediaUrlCandidates("https://www.dhammadownload.com/audio/talk.mp3", "mp3"),
    [
      "https://www.dhammadownload.com/audio/talk.mp3",
      "https://dhammadownload.com/audio/talk.mp3"
    ]
  );
  assert.deepEqual(
    mediaUrlCandidates("https://dhammadownload.com/audio/talk.wma", "wma"),
    []
  );
  assert.deepEqual(mediaUrlCandidates("https://example.com/audio/talk.mp3", "mp3"), []);
  assert.deepEqual(mediaUrlCandidates("https://dhammadownload.com:8443/audio/talk.mp3", "mp3"), []);
  assert.deepEqual(mediaUrlCandidates("https://user@dhammadownload.com/audio/talk.mp3", "mp3"), []);
  assert.deepEqual(mediaUrlCandidates("not a url", "mp3"), []);
});
