import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repo = (path) => new URL(`../${path}`, import.meta.url);

async function read(path) {
  return readFile(repo(path), "utf8");
}

const sources = {
  app: () => read("src/App.svelte"),
  sidebar: () => read("src/components/Sidebar.svelte"),
  player: () => read("src/components/Player.svelte"),
  trackRow: () => read("src/components/TrackRow.svelte"),
  collectionCard: () => read("src/components/CollectionCard.svelte"),
  teacherCard: () => read("src/components/TeacherCard.svelte"),
  explore: () => read("src/views/ExploreView.svelte"),
  collections: () => read("src/views/CollectionsView.svelte"),
  teachers: () => read("src/views/TeachersView.svelte"),
  home: () => read("src/views/HomeView.svelte"),
  settings: () => read("src/views/SettingsView.svelte"),
  utils: () => read("src/utils.js"),
  i18n: () => read("src/i18n.ts")
};

// ─── Track A — cards ────────────────────────────────────────────────────────

test("A1 collection card removes flex h-full so cards size to content", async () => {
  const src = await sources.collectionCard();
  assert.doesNotMatch(src, /\bflex h-full\b/, "CollectionCard must not stretch to row height");
});

test("A2 collection card count uses muted ink, not rust", async () => {
  const src = await sources.collectionCard();
  // The count <p> no longer uses text-app-primary.
  assert.doesNotMatch(
    src,
    /class="[^"]*text-app-primary[^"]*"[^>]*>\s*\{countLabel/,
    "CollectionCard count text must not use rust"
  );
});

test("A3 teacher card count uses muted ink, not rust", async () => {
  const src = await sources.teacherCard();
  assert.doesNotMatch(
    src,
    /class="[^"]*text-app-primary[^"]*"[^>]*>\s*\{countLabel/,
    "TeacherCard count text must not use rust"
  );
});

test("A4 collections grid no longer uses auto-rows-fr", async () => {
  const src = await sources.collections();
  assert.doesNotMatch(src, /auto-rows-fr/, "Cards should size to their content, not row height");
});

// ─── Track B — TrackRow action cluster ──────────────────────────────────────

test("B1 TrackRow's Queue action lives behind the overflow menu, not as a visible pill", async () => {
  const src = await sources.trackRow();
  // Queue key reference exists, but only inside the menu (role="menu").
  const queueRefs = src.match(/t\(locale,\s*"track\.enqueue"\)/g) ?? [];
  assert.equal(queueRefs.length, 1, "Queue action must appear in exactly one place");
  // That one reference must live inside the menu block.
  const menuStart = src.indexOf('role="menu"');
  assert.ok(menuStart > 0, "TrackRow must render a menu block");
  assert.match(src.slice(menuStart), /t\(locale,\s*"track\.enqueue"\)/);
});

test("B2 TrackRow exposes an overflow menu trigger", async () => {
  const src = await sources.trackRow();
  // Either an aria-haspopup menu button or a new i18n key reference.
  assert.match(
    src,
    /aria-haspopup="menu"|track\.menu/,
    "TrackRow must offer an overflow menu for secondary actions"
  );
});

test("B3 i18n has the new track.menu key in English and Burmese", async () => {
  const src = await sources.i18n();
  assert.match(src, /"track\.menu":\s*"[^"]+"/, "English track.menu missing");
});

// ─── Track C — player padding ───────────────────────────────────────────────

test("C1 player bottom padding derives from --player-height to track the player", async () => {
  const src = await sources.app();
  // The literal `pb-28` and `pb-40` are the original values; they must be gone.
  assert.doesNotMatch(src, /\bpb-28\b/, "stale pb-28 literal");
  assert.doesNotMatch(src, /\bpb-40\b/, "stale pb-40 literal");
  // The audio-footer branch must reference --player-height.
  const audioBranch = src.match(/showAudioFooter\s*\?\s*([\s\S]*?)\s*:\s*"pb-8"/);
  assert.ok(audioBranch, "bottomPadding ternary must exist");
  assert.match(
    audioBranch[1],
    /var\(--player-height\)/,
    "audio-footer padding must derive from --player-height"
  );
});

test("C2 player zones share a top control axis and center track metadata across both rows", async () => {
  const src = await sources.player();
  assert.match(src, /items-start/, "player grid should align its top control row");
  assert.match(
    src,
    /player-track[^"]*self-center/,
    "track metadata should center across the player rows"
  );
  assert.match(
    src,
    /player-transport[^"]*grid[^"]*grid-rows/,
    "transport should own explicit control and progress rows"
  );
  assert.match(
    src,
    /player-actions[^"]*self-start/,
    "secondary actions should align with playback controls"
  );
});

test("C3 compact player preserves the 132px minimum-window contract", async () => {
  const src = await sources.player();
  assert.match(src, /max-\[1040px\]:min-h-\[132px\]/, "compact footer height token missing");
  assert.match(src, /max-\[1040px\]:py-2/, "compact footer must use reduced block padding");
  assert.match(
    src,
    /player-transport[^"]*max-\[1040px\]:grid-rows-\[2\.75rem_auto\]/,
    "compact transport rows must fit inside the 132px footer"
  );
  assert.match(
    src,
    /text-app-muted max-\[1040px\]:hidden/,
    "compact footer must hide the teacher metadata line"
  );
  assert.doesNotMatch(
    src,
    /max-\[980px\]:inline-flex min-h-10/,
    "compact keyboard hint must not force the footer beyond 132px"
  );
});

// ─── Track D — settings alignment ───────────────────────────────────────────

test("D1 playback settings use shared detail text so controls align", async () => {
  const src = await sources.settings();
  assert.match(src, /settings\.playback\.detail/);
  assert.doesNotMatch(
    src,
    /settings\.playback\.limit\.detail/,
    "Browse limit detail should not create an uneven field header"
  );
});

// ─── Track E — search panel ─────────────────────────────────────────────────

test("E1 explore search form is no longer a bordered card", async () => {
  const src = await sources.explore();
  // The form should not carry the bordered-card surface treatment.
  assert.doesNotMatch(
    src,
    /<form[^>]*rounded-card border border-app-border bg-app-surface/,
    "Explore form must not be a bordered card"
  );
});

test("E2 collections search form is no longer a bordered card", async () => {
  const src = await sources.collections();
  assert.doesNotMatch(src, /<form[^>]*rounded-card border border-app-border bg-app-surface/);
});

test("E3 teachers search form is no longer a bordered card", async () => {
  const src = await sources.teachers();
  assert.doesNotMatch(src, /<form[^>]*rounded-card border border-app-border bg-app-surface/);
});

test("E4 search submit buttons are removed (Enter submits the form)", async () => {
  const explore = await sources.explore();
  const collections = await sources.collections();
  const teachers = await sources.teachers();
  for (const src of [explore, collections, teachers]) {
    assert.doesNotMatch(
      src,
      />\{t\(locale,\s*"search\.submit"\)\}</,
      "Search submit button must be removed"
    );
  }
});

// ─── Track F — rust overuse ─────────────────────────────────────────────────

test("F1 HomeView 'View all teachers' link no longer uses rust", async () => {
  const src = await sources.home();
  // Find the button block that contains "home.featured.viewAll" and slice it out.
  const marker = "home.featured.viewAll";
  const idx = src.indexOf(marker);
  assert.ok(idx > 0, "HomeView View-all button present");
  const start = src.lastIndexOf("<button", idx);
  const end = src.indexOf("</button", idx) + "</button".length;
  assert.ok(start > 0 && end > start, "HomeView View-all button block delimiters present");
  const button = src.slice(start, end);
  assert.doesNotMatch(button, /text-app-primary/, "HomeView View-all link must not use rust text");
});

test("F2 active filter chips in ExploreView no longer use rust", async () => {
  const src = await sources.explore();
  assert.doesNotMatch(
    src,
    /bg-app-primary\/10[^"]*text-app-primary/,
    "active filter chip wrapper must not use rust"
  );
});

// ─── Track G — TrackRow metadata ────────────────────────────────────────────

test("G1 TrackRow inline metadata strip no longer shows language + format", async () => {
  const src = await sources.trackRow();
  // The visible truncate span for teacher should not include the language t() call
  // or the format uppercase fragment.
  assert.doesNotMatch(
    src,
    /track\.language\.\$\{track\.language\}/,
    "language lookup must leave the visible teacher row"
  );
  assert.doesNotMatch(
    src,
    /track\.format\)}\s\{track\.format\.toUpperCase\(\)/,
    "format uppercase must leave the visible teacher row"
  );
});

test("G2 TrackRow keeps language + format discoverable via title or aria-label", async () => {
  const src = await sources.trackRow();
  // Either a title= attribute on the row or play button, or an aria-label that
  // includes format/language somewhere.
  const hasTitle =
    /\btitle=\{[^}]*track\.(format|language)/.test(src) || /aria-label=\{actionLabel\}/.test(src);
  assert.ok(hasTitle, "language/format must remain discoverable via title or aria-label");
});

// ─── Track H — dead pluralize helper ────────────────────────────────────────

test("H1 pluralize is no longer exported from utils", async () => {
  // Build the test-build like scripts/test.mjs does, then import.
  const { spawnSync } = await import("node:child_process");
  const compile = spawnSync(
    process.execPath,
    ["node_modules/typescript/bin/tsc", "-p", "tsconfig.test.json"],
    { encoding: "utf8" }
  );
  if (compile.status !== 0) {
    assert.fail("tsc failed; cannot evaluate G1");
  }
  const mod = await import("../.test-build/src/utils.js");
  assert.equal("pluralize" in mod, false, "pluralize must be removed from utils.js");
});
