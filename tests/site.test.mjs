import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../docs/index.html", import.meta.url);
const privacyPath = new URL("../docs/privacy/index.html", import.meta.url);
const cssPath = new URL("../docs/assets/site.css", import.meta.url);
const screenshotPath = new URL("../docs/images/dhamma-echo-demo.png", import.meta.url);

async function readSite() {
  const [html, css] = await Promise.all([readFile(htmlPath, "utf8"), readFile(cssPath, "utf8")]);
  return { html, css };
}

test("product page exposes the approved semantic structure", async () => {
  const { html } = await readSite();

  assert.match(html, /<title>Dhamma Echo — A quiet desktop library<\/title>/);
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
  assert.match(html, /alt="Dhamma Echo explore view with an active audio player"/);
  assert.equal(screenshot.isFile(), true);
  assert.ok(screenshot.size > 100_000);
});

test("product page communicates the four approved product themes", async () => {
  const { html } = await readSite();

  for (const phrase of [
    "Discover the catalogue",
    "Focused playback",
    "Your library stays local",
    "Private by default"
  ]) {
    assert.match(html, new RegExp(phrase, "i"));
  }

  assert.match(html, /30,563/);
  assert.match(html, /257/);
  assert.match(html, /collections/i);
  assert.match(html, /Tauri 2/);
  assert.match(html, /SQLite/);
  assert.match(html, /strict TypeScript/);
});

test("product page includes safe GitHub link hooks and local runtime assets", async () => {
  const { html } = await readSite();

  assert.match(html, /data-github-link="repository"/);
  assert.match(html, /data-github-link="releases"/);
  assert.match(html, /href="assets\/site\.css"/);
  assert.match(html, /src="assets\/site-bootstrap\.js"/);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.(?:js|css|woff2?)/i);
});

test("product styles preserve keyboard focus and reduced motion", async () => {
  const { css } = await readSite();

  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test("app Myanmar text preserves script clusters while wrapping", async () => {
  const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

  assert.match(css, /\.myanmar-text[\s\S]*word-break:\s*keep-all/);
});

test("dynamic audio text uses unclipped Myanmar typography", async () => {
  const [css, trackRow, home] = await Promise.all([
    readFile(new URL("../src/index.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/TrackRow.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/views/HomeView.svelte", import.meta.url), "utf8")
  ]);

  assert.match(css, /\.myanmar-text\.myanmar-text\s*\{[^}]*line-height:\s*1\.8/s);
  assert.match(css, /\.myanmar-text\.myanmar-text\s*\{[^}]*padding-block:\s*0\.2em/s);
  assert.match(trackRow, /isMyanmarText\(track\.title\)/);
  assert.match(home, /isMyanmarText\(latest\.title\)/);
});

test("shared pill controls use Tailwind optical vertical centering", async () => {
  const [explore, trackRow, teacherCard] = await Promise.all([
    readFile(new URL("../src/views/ExploreView.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/components/TrackRow.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/components/TeacherCard.svelte", import.meta.url), "utf8")
  ]);

  assert.match(explore, /min-h-10[^"']*pt-0\.5/);
  assert.match(trackRow, /min-h-\[30px\][^"']*pt-0\.5/);
  assert.match(teacherCard, /items-center[^"']*pt-0\.5/);
});

test("active filter clear icons cannot expand beyond their control", async () => {
  const explore = await readFile(
    new URL("../src/views/ExploreView.svelte", import.meta.url),
    "utf8"
  );

  assert.equal((explore.match(/inline-flex size-6 shrink-0/g) ?? []).length, 3);
  assert.equal((explore.match(/class="block size-3"/g) ?? []).length, 3);
  assert.equal((explore.match(/inline-flex min-h-10 items-center gap-2/g) ?? []).length, 3);
});

test("app styling uses Tailwind utilities without legacy component CSS", async () => {
  const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
  const componentNames = await readdir(new URL("../src/components/", import.meta.url));
  const viewNames = await readdir(new URL("../src/views/", import.meta.url));
  const svelteUrls = [
    new URL("../src/App.svelte", import.meta.url),
    ...componentNames
      .filter((name) => name.endsWith(".svelte"))
      .map((name) => new URL(`../src/components/${name}`, import.meta.url)),
    ...viewNames
      .filter((name) => name.endsWith(".svelte"))
      .map((name) => new URL(`../src/views/${name}`, import.meta.url))
  ];
  const sources = await Promise.all(svelteUrls.map((url) => readFile(url, "utf8")));
  const forbiddenSelectors = [
    "app-shell",
    "app-content",
    "search-form",
    "filter-pill",
    "filter-clear-button",
    "active-filter-pill",
    "badge-pill",
    "pill-button",
    "primary-button",
    "sidebar-nav-button",
    "sidebar-nav-icon",
    "track-play-button",
    "track-play-icon",
    "row-action-button",
    "row-queue-button",
    "download-progress",
    "player-shell",
    "player-grid",
    "player-center",
    "player-controls",
    "transport-button",
    "transport-primary-icon",
    "player-timeline",
    "player-session-controls",
    "player-rate-control",
    "player-volume-control",
    "player-volume-icon",
    "player-volume",
    "queue-button",
    "queue-count",
    "player-status",
    "player-retry-button",
    "range-accent",
    "scrollbar-thin",
    "icon"
  ];

  assert.match(css, /^@import "tailwindcss";/);
  assert.match(css, /@theme\s*\{/);
  for (const selector of forbiddenSelectors) {
    assert.doesNotMatch(css, new RegExp(`\\.${selector}(?![a-z-])`), selector);
    if (selector !== "icon") {
      assert.equal(
        sources.some((source) =>
          new RegExp(`class=["'][^"']*(?:^|\\s)${selector}(?:\\s|["'])`).test(source)
        ),
        false,
        selector
      );
    }
  }
  for (const source of sources) {
    assert.doesNotMatch(source, /<style(?:\s|>)/);
    assert.doesNotMatch(source, /\sstyle\s*=/);
  }
});

test("privacy policy publishes the required user-data disclosures", async () => {
  const [privacy, landing] = await Promise.all([
    readFile(privacyPath, "utf8"),
    readFile(htmlPath, "utf8")
  ]);

  assert.match(privacy, /<title>Privacy Policy — Dhamma Echo<\/title>/);
  assert.equal((privacy.match(/<h1\b/g) ?? []).length, 1);
  assert.match(privacy, /Effective date:\s*August 9, 2026/i);
  assert.match(privacy, /builtbyamk@duck\.com/);
  assert.match(privacy, /stored locally on your device/i);
  assert.match(privacy, /dhammadownload\.com/);
  assert.match(privacy, /www\.dhammadownload\.com/);
  assert.match(privacy, /IP address/i);
  assert.match(privacy, /do not sell/i);
  assert.match(privacy, /clearing the app's data or uninstalling/i);
  assert.match(privacy, /children/i);
  assert.match(landing, /href="privacy\/"/);
});

test("site smoke command passes", () => {
  const result = spawnSync(process.execPath, ["scripts/site-smoke.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Product site smoke checks passed/);
});
