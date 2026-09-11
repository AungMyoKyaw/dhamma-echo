import test from "node:test";
import assert from "node:assert/strict";
import { t } from "../.test-build/src/i18n.js";

/**
 * Burmese translation fixes. Each `test` pins the corrected string for a
 * specific issue from the translation audit. The tests fail on the source as
 * it stands today and only pass once `src/i18n.ts` is updated.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HIGH severity: typos, missing space, embedded English, garbled particles,
// awkward compounds that are user-visible.
// ─────────────────────────────────────────────────────────────────────────────

test("nav.collapse fixes the ခေါတ် → ခေါက် typo", () => {
  assert.equal(t("my-MM", "nav.collapse"), "ခေါက်မည်");
});

test("nav.collapseSidebar uses ခေါက် (fold), not ခေါင်းလိုက်", () => {
  assert.equal(t("my-MM", "nav.collapseSidebar"), "ဘေးဘားကို ခေါက်မည်");
});

test("shortcuts.toggleSidebar uses ခေါက် (fold), not ခေါင်းလိုက်", () => {
  assert.equal(t("my-MM", "shortcuts.toggleSidebar"), "ဘေးဘားကို ခေါက်မည် သို့မဟုတ် ပြန်ဖွင့်မည်");
});

test("privacy.body translates play and streamed instead of leaving them in English", () => {
  const my = t("my-MM", "privacy.body");
  assert.equal(
    my,
    "စာရင်းဇယားသည် သင့်စက်ထဲတွင်သာ ရှိသည်။ ဖွင့်နှိပ်သည့်အချိန်မှသာ အသံကို ထုတ်လွှင့်၍ ဒေါင်းလုပ်များကိုလည်း သင်မဖျက်မချင်း စက်ထဲတွင်ပင် ကျန်ရှိနေမည်။"
  );
  assert.equal(my.includes("play"), false);
  assert.equal(my.includes("streamed"), false);
});

test("privacy.body.settings.tail translates play", () => {
  const my = t("my-MM", "privacy.body.settings.tail");
  assert.equal(
    my,
    " မှ ဖွင့်နှိပ်သည့်အချိန်မှသာ တောင်းဆိုသည်။ ဒေါင်းလုပ်များကိုလည်း သင်မဖျက်မချင်း ဤစက်ထဲတွင်ပင် ရှိနေမည်။"
  );
  assert.equal(my.includes("play"), false);
});

test("settings.appearance.detail translates operating system", () => {
  const my = t("my-MM", "settings.appearance.detail");
  assert.equal(my, "အလင်း၊ အမှောင် သို့မဟုတ် လည်ပတ်ရေးစနစ် အလိုက် ရွေးပါ။");
  assert.equal(my.includes("operating"), false);
});

test("settings.about.body1 translates desktop", () => {
  const my = t("my-MM", "settings.about.body1");
  assert.equal(
    my,
    "တရားတော်များအတွက် တိတ်ဆိတ်သော ကွန်ပျူတာ စာကြည့်တိုက်။ PolyForm Noncommercial လိုင်စင်။ အကောင့်များ၊ analytics များ၊ telemetry မရှိပါ။"
  );
  assert.equal(my.includes("desktop"), false);
});

test("settings.about.body2 translates update and renders refreshed, not recent", () => {
  const my = t("my-MM", "settings.about.body2");
  assert.equal(
    my,
    "စာရင်းဇယားသည် အက်ပ်နှင့်အတူ ပါရှိပြီး အက်ပ်ကို အသစ်ထုတ်သောအခါမှသာ ပြန်လည်လတ်ဆန်းသည်။"
  );
  assert.equal(my.includes("update"), false);
});

test("shortcuts.escape translates overlay", () => {
  const my = t("my-MM", "shortcuts.escape");
  assert.equal(my, "ဤဒိုင်ယာလော့ သို့မဟုတ် လက်ရှိ ဝင်းဒိုးကို ပိတ်မည်");
  assert.equal(my.includes("overlay"), false);
});

test("teacherDetail.pending.detail drops the garbled တည်းမှ particle", () => {
  const my = t("my-MM", "teacherDetail.pending.detail", { count: 5 });
  assert.equal(my, "ဤဆရာတော်တွင် တရားတော် ၅ ခု မှတ်တမ်းရှိသည်။ အောက်တွင်မှ နောက်ထပ် တင်ပါ။");
  assert.equal(my.includes("တည်းမှ"), false);
});

test("home.resumeTrack fixes the awkward ပြန်စနားထောင် compound", () => {
  const my = t("my-MM", "home.resumeTrack", { title: "Sample Talk" });
  assert.equal(my, "Sample Talk ကို ဆက်နားထောင်မည်");
  assert.equal(my.includes("ပြန်စနားထောင်"), false);
});

test("player.queue.showCount adds the missing space after {count}", () => {
  const my = t("my-MM", "player.queue.showCount", { count: 5 });
  assert.equal(my, "၅ ပါသော အစဉ်စာရင်း ကြည့်မည်");
});

// ─────────────────────────────────────────────────────────────────────────────
// MEDIUM severity: semantic mismatches, terminology inconsistency, awkward
// literal renderings.
// ─────────────────────────────────────────────────────────────────────────────

test("app.tagline distinguishes intention (ရည်ရွယ်ချက်) from mindfulness (သတိ)", () => {
  const my = t("my-MM", "app.tagline");
  assert.equal(my, "ရည်ရွယ်ချက်ဖြင့် နားထောင်ပါ");
  assert.equal(my.includes("သတိ"), false);
});

test("playback is rendered as ပြန်ဖွင့်ခြင်း consistently (not ဖွင့်ချိန်)", () => {
  assert.equal(t("my-MM", "route.settings.detail").includes("ဖွင့်ချိန်"), false);
  assert.equal(t("my-MM", "settings.playback"), "ပြန်ဖွင့်ခြင်း");
});

test("home.unsupportedTrack preserves the 'not supported' meaning", () => {
  const my = t("my-MM", "home.unsupportedTrack", { title: "Talk" });
  // Should say "Talk (macOS player မှ ပံ့ပိုးမထားပါ)" — "not supported by macOS player",
  // not "cannot open with macOS player".
  assert.equal(my, "Talk (macOS player မှ ပံ့ပိုးမထားပါ)");
  assert.equal(my.includes("ဖွင့်မရ"), false);
});

test("home.unsupportedHint preserves the 'not supported' meaning", () => {
  const my = t("my-MM", "home.unsupportedHint");
  assert.equal(my, "ဤဖော်မက်ကို macOS player မှ ပံ့ပိုးမထားပါ။");
  assert.equal(my.includes("ဖွင့်မရ"), false);
});

test("track.badge.unavailable keeps the 'source' noun", () => {
  const my = t("my-MM", "track.badge.unavailable");
  // English: "Source unavailable"
  assert.equal(my, "ရင်းမြစ် မရနိုင်");
  assert.equal(my.includes("ဖွင့်မရ"), false);
});

test("error.media.unsupported preserves the 'not supported' meaning", () => {
  const my = t("my-MM", "error.media.unsupported");
  assert.equal(my, "ဤမီဒီယာ ဖော်မက်ကို macOS player မှ ပံ့ပိုးမထားပါ။");
  assert.equal(my.includes("ဖွင့်မရ"), false);
});

test("error.catalogue.load uses စာရင်းဇယား (no ဓမ္မ prefix) for consistency", () => {
  const my = t("my-MM", "error.catalogue.load");
  assert.equal(my, "စာရင်းဇယားကို မတင်နိုင်ပါ။");
  assert.equal(my.includes("ဓမ္မ"), false);
});

test("home.featured.detail uses 'explore' (ရှာဖွေ), not 'view' (ကြည့်)", () => {
  const my = t("my-MM", "home.featured.detail");
  assert.equal(my, "နားထောင်စရန် ရွေးချယ်ထားသော ဆရာတော်များ။ တရားတော်များ ရှာဖွေရန် နှိပ်ပါ။");
  assert.equal(my.includes("ကြည့်ရန်"), false);
});

test("async.error.title fixes the awkward ကြိုးစားရ လိုအပ် structure", () => {
  const my = t("my-MM", "async.error.title");
  assert.equal(my, "ဤစာမျက်နှာကို ထပ်မံ ကြိုးစားရန် လိုအပ်သည်");
});

test("shortcuts.searchNote rewrites the awkward ဆက်ထား clause", () => {
  const my = t("my-MM", "shortcuts.searchNote", { key: "Esc" });
  assert.equal(
    my,
    "ရှာဖွေမှုကွက်လပ်များတွင် တည်းဖြတ်ရန် ကီးဘုတ်ကို ဆက်လက် အသုံးပြုနိုင်သည်။ ရိုက်ထားသည်ကို ဖျက်ရန် ရှာဖွေမှုကွက်လပ်အတွင်းတွင် Esc ကို နှိပ်ပါ။"
  );
  assert.equal(my.includes("ဆက်ထားသည်"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOW severity: polish for human tone.
// ─────────────────────────────────────────────────────────────────────────────

test("home.featured.empty uses အဆင်သင့်, not stiff အသင့်", () => {
  const my = t("my-MM", "home.featured.empty");
  assert.equal(my.includes("အဆင်သင့်"), true);
  assert.equal(my.includes(" အသင့်ဖြစ်"), false);
});

test("library.favorites.empty.detail uses နှလုံးပုံ for 'heart icon'", () => {
  const my = t("my-MM", "library.favorites.empty.detail");
  assert.equal(my, "ဤနေရာတွင် သိမ်းရန် တရားတော်ရှိ နှလုံးပုံ သင်္ကေတကို နှိပ်ပါ။");
  assert.equal(my.includes("နှလုံးသားသင်္ကေတ"), false);
});

test("library.downloads.hint drops redundant လည်း", () => {
  const my = t("my-MM", "library.downloads.hint");
  assert.equal(
    my,
    "ဒေါင်းလုပ်မလုပ်ဘဲ အနီးကပ် သိမ်းထားရန် ရှာဖွေနေစဉ် တရားတော်များကို အနှစ်သက်ဆုံး လုပ်ပါ။"
  );
  assert.equal(my.includes("မလုပ်ဘဲလည်း"), false);
});

test("player.hint.compact drops ကို to match the terser English 'Press ?'", () => {
  assert.equal(t("my-MM", "player.hint.compact"), "? နှိပ်ပါ");
});
