import test from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  formatDuration,
  formatLocaleDuration,
  formatLocaleNumber,
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

test("formatLocaleDuration respects English and Burmese locales", () => {
  assert.equal(formatLocaleDuration(0, "en-US"), "0:00");
  assert.equal(formatLocaleDuration(65.9, "en-US"), "1:05");
  assert.equal(formatLocaleDuration(3661, "en-US"), "1:01:01");
  // Burmese numerals: 0=၀, 1=၁, 2=၂, 3=၃, 4=၄, 5=၅, 6=၆, 7=၇, 8=၈, 9=၉
  assert.equal(formatLocaleDuration(0, "my-MM"), "၀:၀၀");
  assert.equal(formatLocaleDuration(65.9, "my-MM"), "၁:၀၅");
  assert.equal(formatLocaleDuration(3661, "my-MM"), "၁:၀၁:၀၁");
  assert.equal(formatLocaleDuration(Number.NaN, "my-MM"), "၀:၀၀");
});

test("formatLocaleNumber respects English and Burmese locales", () => {
  assert.equal(formatLocaleNumber(0, "en-US"), "0");
  assert.equal(formatLocaleNumber(1234, "en-US"), "1,234");
  assert.equal(formatLocaleNumber(30563, "en-US"), "30,563");
  assert.equal(formatLocaleNumber(0, "my-MM"), "၀");
  assert.equal(formatLocaleNumber(1234, "my-MM"), "၁,၂၃၄");
  assert.equal(formatLocaleNumber(30563, "my-MM"), "၃၀,၅၆၃");
});

test("formatLocaleNumber accepts an explicit Intl locale tag", () => {
  // De-DE uses "." for thousands and "," for decimals
  assert.equal(formatLocaleNumber(1234567, "de-DE"), "1.234.567");
});

test("formatLocaleNumber falls back to ASCII digits when Intl rejects the locale", () => {
  // Constructed locale tag that Intl will reject; safe fallback path.
  assert.equal(formatLocaleNumber(42, "this-is-not-a-locale"), "42");
});

test("formatLocaleNumber treats non-finite input as zero", () => {
  assert.equal(formatLocaleNumber(Number.NaN, "en-US"), "0");
  assert.equal(formatLocaleNumber(-3, "en-US"), "0");
});

test("formatLocaleDuration passes through non-Burmese locales unchanged", () => {
  // Forces the isBurmeseLocale false branch.
  assert.equal(formatLocaleDuration(3725, "de-DE"), "1:02:05");
});

test("clamp constrains finite and non-finite values", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(Number.NaN, 0, 10), 0);
});

test("mediaUrlCandidates normalizes approved MP3 and MP4 sources and blocks unsupported media", () => {
  // 'တရား တော်' → 'တ'(U+1050) ရ(U+109B) ာ(U+102C) း(U+1038) ' '(U+0020) တ(U+1050) ေ(U+1031) ာ(U+102C) ်(U+103A)
  assert.deepEqual(
    mediaUrlCandidates("http://dhammadownload.com/MP3Library/Myanmar/တရား တော်.mp3", "MP3"),
    [
      "https://www.dhammadownload.com/MP3Library/Myanmar/%E1%80%90%E1%80%9B%E1%80%AC%E1%80%B8%20%E1%80%90%E1%80%B1%E1%80%AC%E1%80%BA.mp3",
      "https://dhammadownload.com/MP3Library/Myanmar/%E1%80%90%E1%80%9B%E1%80%AC%E1%80%B8%20%E1%80%90%E1%80%B1%E1%80%AC%E1%80%BA.mp3"
    ]
  );
  assert.deepEqual(mediaUrlCandidates("https://www.dhammadownload.com/audio/talk.mp3", "mp3"), [
    "https://www.dhammadownload.com/audio/talk.mp3",
    "https://dhammadownload.com/audio/talk.mp3"
  ]);
  assert.deepEqual(mediaUrlCandidates("https://dhammadownload.com/audio/talk.mp4", "mp4"), [
    "https://www.dhammadownload.com/audio/talk.mp4",
    "https://dhammadownload.com/audio/talk.mp4"
  ]);
  assert.deepEqual(mediaUrlCandidates("http://dhammadownload.com/audio/talk.mp4", "MP4"), [
    "https://www.dhammadownload.com/audio/talk.mp4",
    "https://dhammadownload.com/audio/talk.mp4"
  ]);
  assert.deepEqual(mediaUrlCandidates("https://dhammadownload.com/audio/talk.wma", "wma"), []);
  assert.deepEqual(mediaUrlCandidates("https://dhammadownload.com/audio/talk.wmv", "wmv"), []);
  assert.deepEqual(mediaUrlCandidates("https://example.com/audio/talk.mp4", "mp4"), []);
  assert.deepEqual(mediaUrlCandidates("https://dhammadownload.com:8443/audio/talk.mp4", "mp4"), []);
  assert.deepEqual(mediaUrlCandidates("https://user@dhammadownload.com/audio/talk.mp4", "mp4"), []);
  assert.deepEqual(mediaUrlCandidates("not a url", "mp3"), []);
});
