import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../docs/index.html", import.meta.url);
const cssPath = new URL("../docs/assets/site.css", import.meta.url);
const screenshotPath = new URL(
  "../docs/images/dhamma-echo-demo.png",
  import.meta.url,
);

async function readSite() {
  const [html, css] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);
  return { html, css };
}

test("product page exposes the approved semantic structure", async () => {
  const { html } = await readSite();

  assert.match(
    html,
    /<title>Dhamma Echo — A quiet desktop library<\/title>/,
  );
  assert.match(html, /<main id="main-content">/);
  assert.match(html, /<h1[^>]*>[^<]*Dhamma talks[^<]*<\/h1>/i);
  assert.match(html, /<nav[^>]+aria-label="Primary"/);
  assert.match(html, /<footer/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
});

test("product page integrates the supplied demo screenshot without duplication", async () => {
  const { html } = await readSite();
  const screenshot = await stat(screenshotPath);

  assert.match(html, /src="images\/dhamma-echo-demo\.png"/);
  assert.match(html, /width="3248"\s+height="2122"/);
  assert.match(
    html,
    /alt="Dhamma Echo explore view with an active audio player"/,
  );
  assert.equal(screenshot.isFile(), true);
  assert.ok(screenshot.size > 100_000);
});

test("product page communicates the four approved product themes", async () => {
  const { html } = await readSite();

  for (const phrase of [
    "Discover the catalogue",
    "Focused playback",
    "Your library stays local",
    "Private by default",
  ]) {
    assert.match(html, new RegExp(phrase, "i"));
  }

  assert.match(html, /21,402/);
  assert.match(html, /Tauri 2/);
  assert.match(html, /SQLite/);
  assert.match(html, /strict TypeScript/);
});

test("product page includes safe GitHub link hooks and local runtime assets", async () => {
  const { html } = await readSite();

  assert.match(html, /data-github-link="repository"/);
  assert.match(html, /data-github-link="releases"/);
  assert.match(html, /href="assets\/site\.css"/);
  assert.match(html, /src="assets\/site\.js"/);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.(?:js|css|woff2?)/i);
});

test("product styles preserve keyboard focus and reduced motion", async () => {
  const { css } = await readSite();

  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
});


test("site smoke command passes", () => {
  const result = spawnSync(process.execPath, ["scripts/site-smoke.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Product site smoke checks passed/);
});
