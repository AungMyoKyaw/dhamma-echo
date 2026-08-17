import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../docs/index.html", import.meta.url);
const privacyPath = new URL("../docs/privacy/index.html", import.meta.url);
const cssPath = new URL("../docs/assets/site.css", import.meta.url);
const screenshotPath = new URL("../docs/images/explore.png", import.meta.url);

async function readSite() {
  const [html, css] = await Promise.all([readFile(htmlPath, "utf8"), readFile(cssPath, "utf8")]);
  return { html, css };
}

test("product page exposes the launch narrative and semantic structure", async () => {
  const { html } = await readSite();

  assert.match(html, /<title>Dhamma Echo — Dhamma, without the noise\.<\/title>/);
  assert.match(html, /<main id="main-content">/);
  assert.match(html, /<h1[^>]*>\s*Dhamma, without the noise\.\s*<\/h1>/i);
  assert.match(html, /<nav[^>]+aria-label="Primary"/);
  assert.match(html, /<footer/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
});

test("product page treats the real application as the primary visual", async () => {
  const { html } = await readSite();
  const screenshot = await stat(new URL("../docs/images/home.png", import.meta.url));

  assert.match(html, /src="images\/home\.png"/);
  assert.match(html, /width="2784"\s+height="1866"/);
  assert.match(html, /alt="Dhamma Echo home view with listening activity and featured teachings"/);
  assert.equal(screenshot.isFile(), true);
  assert.ok(screenshot.size > 100_000);

  for (const name of ["home", "explore", "collections", "teachers", "library", "settings"]) {
    assert.match(html, new RegExp(`src="images/${name}\\.png"`));
  }
});

test("product page proves audio, video, catalogue depth, and local privacy", async () => {
  const { html } = await readSite();

  for (const phrase of ["30,563", "14,474", "257", "429"]) {
    assert.match(html, new RegExp(phrase));
  }

  assert.match(html, /audio talks/i);
  assert.match(html, /video records/i);
  assert.match(html, /personal listening state stays on your device/i);
  assert.match(html, /no accounts, analytics, ads, or telemetry/i);
  assert.match(html, /Tauri 2/);
  assert.match(html, /read-only SQLite/i);
  assert.match(html, /ten purpose-built desktop commands/i);
});

test("product page exposes install, source attribution, privacy, and safe GitHub hooks", async () => {
  const { html } = await readSite();

  assert.match(html, /brew install --cask AungMyoKyaw\/homebrew-tap\/dhamma-echo/);
  assert.match(html, /https:\/\/www\.dhammadownload\.com\//);
  assert.match(html, /catalog(?:s|ue)[^<]*Dhamma Download/i);
  assert.match(html, /href="privacy\/"/);
  assert.match(html, /data-github-link="repository"/);
  assert.match(html, /data-github-link="releases"/);
  assert.match(html, /href="assets\/site\.css"/);
  assert.match(html, /src="assets\/site-bootstrap\.js"/);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.(?:js|css|woff2?)/i);
});

test("product styles preserve accessibility and avoid template design tells", async () => {
  const { css } = await readSite();

  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /\.echo-rings/);
  assert.doesNotMatch(css, /background-clip:\s*text/);
  assert.doesNotMatch(css, /repeating-linear-gradient/);
  assert.doesNotMatch(css, /\.section-index/);
});

test("app Myanmar text preserves script clusters while wrapping", async () => {
  const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

  assert.match(css, /\.myanmar-text[\s\S]*word-break:\s*keep-all/);
  assert.match(css, /\.myanmar-text[\s\S]*overflow-wrap:\s*normal/);
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
  assert.match(trackRow, /min-h-10[^"']*pt-0\.5/);
  assert.match(teacherCard, /items-center[^"']*pt-0\.5/);
});

test("progressive loading controls use explicit batches without a row chooser", async () => {
  const [controls, explore, collections, teacherDetail] = await Promise.all([
    readFile(new URL("../src/components/ProgressiveControls.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/views/ExploreView.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/views/CollectionsView.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/views/TeacherDetailView.svelte", import.meta.url), "utf8")
  ]);

  assert.doesNotMatch(controls, /Rows|onlimit|<select/);
  assert.match(explore, /nextLimit=\{state\.catalogue\.nextLoadSize\}/);
  assert.match(collections, /nextLimit=\{state\.collections\.nextLoadSize\}/);
  assert.match(teacherDetail, /nextLimit=\{state\.teacherTalks\.nextLoadSize\}/);
});

test("video loading state exposes the quiet centered signal", async () => {
  const videoPlayer = await readFile(
    new URL("../src/components/VideoPlayer.svelte", import.meta.url),
    "utf8"
  );

  assert.match(videoPlayer, /aria-label="Preparing video"/);
  assert.match(videoPlayer, /Preparing the video/);
  assert.match(videoPlayer, /A moment of quiet before playback/);
  assert.match(videoPlayer, /bg-app-primary/);
  assert.match(videoPlayer, /motion-reduce:animate-none/);
  assert.doesNotMatch(videoPlayer, /Connecting…/);
});

test("video loading signal remains until the first video data is ready", async () => {
  const videoPlayer = await readFile(
    new URL("../src/components/VideoPlayer.svelte", import.meta.url),
    "utf8"
  );

  assert.match(videoPlayer, /let videoReady = \$state\(false\);/);
  assert.match(videoPlayer, /element\.addEventListener\("loadeddata", onVideoReady\)/);
  assert.match(videoPlayer, /element\.addEventListener\("loadstart", onVideoLoadStart\)/);
  assert.match(videoPlayer, /\{#if videoVisible && !videoReady && !appState\.player\.error\}/);
});

test("teacher avatars keep their circular dimensions beside long names", async () => {
  const teacherCard = await readFile(
    new URL("../src/components/TeacherCard.svelte", import.meta.url),
    "utf8"
  );

  assert.match(teacherCard, /size-12 shrink-0[^"']*rounded-full/);
  assert.match(teacherCard, /title=\{teacher\.name\}/);
  assert.match(teacherCard, /aria-label=\{teacher\.name\}/);
});

test("interactive card hover feedback does not move cards", async () => {
  const [teacherCard, collectionCard] = await Promise.all([
    readFile(new URL("../src/components/TeacherCard.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/components/CollectionCard.svelte", import.meta.url), "utf8")
  ]);

  assert.match(teacherCard, /hover:border-app-primary\/50/);
  assert.match(collectionCard, /hover:border-app-primary\/50/);
  for (const card of [teacherCard, collectionCard]) {
    assert.doesNotMatch(card, /hover:-translate-y/);
    assert.doesNotMatch(card, /focus-visible:-translate-y/);
  }
});

test("collection cards show complete names", async () => {
  const collectionCard = await readFile(
    new URL("../src/components/CollectionCard.svelte", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(collectionCard, /line-clamp-/);
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

test("application UI leaves volume control to the operating system", async () => {
  const settings = await readFile(
    new URL("../src/views/SettingsView.svelte", import.meta.url),
    "utf8"
  );
  const player = await readFile(
    new URL("../src/components/Player.svelte", import.meta.url),
    "utf8"
  );
  const icon = await readFile(new URL("../src/components/Icon.svelte", import.meta.url), "utf8");

  for (const source of [settings, player, icon]) {
    assert.doesNotMatch(source, /Default volume|aria-label="Volume"|setVolume|name="volume"/);
  }
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
  assert.match(privacy, /Effective date:\s*August 18, 2026/i);
  assert.match(privacy, /builtbyamk@duck\.com/);
  assert.match(privacy, /stored locally on your device/i);
  assert.match(privacy, /Media streaming and third parties/i);
  assert.match(privacy, /audio or video/i);
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

test("desktop shell keeps compact-window layout contracts", async () => {
  const [app, sidebar, player, teachers, explore] = await Promise.all([
    readFile(new URL("../src/App.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Sidebar.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Player.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/views/TeachersView.svelte", import.meta.url), "utf8"),
    readFile(new URL("../src/views/ExploreView.svelte", import.meta.url), "utf8")
  ]);

  assert.match(app, /max-\[1040px\]:ml-56/);
  assert.match(app, /@container/);
  assert.match(sidebar, /max-\[1040px\]:w-56/);
  assert.match(player, /max-\[1040px\]:min-h-\[132px\]/);
  assert.match(player, /max-\[1040px\]:col-span-2 max-\[1040px\]:row-start-2/);
  assert.match(teachers, /repeat\(auto-fit,minmax\(220px,1fr\)\)/);
  assert.doesNotMatch(explore, /max-\[760px\]/);
});
