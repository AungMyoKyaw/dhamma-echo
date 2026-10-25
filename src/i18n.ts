import type { AppLocale, Route } from "./types.js";
import { formatLocaleNumber } from "./utils.js";
import { en } from "./i18n/en.js";
import { my } from "./i18n/my.js";
import type { MessageKey } from "./i18n/en.js";
export type { MessageKey } from "./i18n/en.js";

/**
 * UI string catalogue. English is the source of truth: every key declared in
 * `en` must have a Burmese twin in `my` (enforced by tests/i18n.test.mjs).
 * Templates interpolate `{name}` placeholders via `t()`.
 */

const dictionaries: Record<AppLocale, Partial<Record<MessageKey, string>>> = {
  "en-US": en,
  "my-MM": my
};

/** Interpolates `{name}` placeholders; numbers are formatted per locale. */
export function t(
  locale: AppLocale,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const template = dictionaries[locale][key] ?? en[key] ?? key;
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/gu, (match, name: string) => {
    const value = vars[name];
    if (value === undefined) return match;
    return typeof value === "number" ? formatLocaleNumber(value, locale) : value;
  });
}

/** Full locale dictionaries, exposed for completeness checks in tests. */
export function dictionaryKeys(locale: AppLocale): MessageKey[] {
  return Object.keys(dictionaries[locale]) as MessageKey[];
}

export function sourceKeyCount(): number {
  return Object.keys(en).length;
}

/** Plural-aware count phrase, e.g. "1 talk" / "2 talks" / "တရားတော် ၂ ခု". */
const countPhrases = {
  talk: {
    en: ["{count} talk", "{count} talks"],
    my: "တရားတော် {count} ခု"
  },
  downloadedTalk: {
    en: ["{count} downloaded talk", "{count} downloaded talks"],
    my: "ဒေါင်းလုပ် ဆွဲထားသော တရားတော် {count} ခု"
  },
  savedTalk: {
    en: ["{count} saved talk", "{count} saved talks"],
    my: "သိမ်းထားသော တရားတော် {count} ခု"
  },
  savedTalkAre: {
    en: ["{count} saved talk is", "{count} saved talks are"],
    my: "သိမ်းထားသော တရားတော် {count} ခုသည်"
  },
  collection: {
    en: ["{count} collection", "{count} collections"],
    my: "စုစည်းမှု {count} ခု"
  },
  teacher: {
    en: ["{count} teacher", "{count} teachers"],
    my: "ဆရာတော် {count} ပါး"
  }
} as const;

export type CountKind = keyof typeof countPhrases;

export function countLabel(locale: AppLocale, kind: CountKind, count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const formatted = formatLocaleNumber(safe, locale);
  const phrase = countPhrases[kind];
  const template = locale === "my-MM" ? phrase.my : safe === 1 ? phrase.en[0] : phrase.en[1];
  return template.replace("{count}", formatted);
}

/** Route eyebrow/title/detail in the active locale. */
export function routeLabels(
  route: Route,
  locale: AppLocale
): { eyebrow: string; title: string; detail: string } {
  const keys: Record<Route, [MessageKey, MessageKey, MessageKey]> = {
    home: ["route.home.eyebrow", "route.home.title", "route.home.detail"],
    explore: ["route.explore.eyebrow", "route.explore.title", "route.explore.detail"],
    collections: [
      "route.collections.eyebrow",
      "route.collections.title",
      "route.collections.detail"
    ],
    "collection-detail": [
      "route.collection-detail.eyebrow",
      "route.collection-detail.title",
      "route.collection-detail.detail"
    ],
    teachers: ["route.teachers.eyebrow", "route.teachers.title", "route.teachers.detail"],
    "teacher-detail": [
      "route.teacher-detail.eyebrow",
      "route.teacher-detail.title",
      "route.teacher-detail.detail"
    ],
    library: ["route.library.eyebrow", "route.library.title", "route.library.detail"],
    settings: ["route.settings.eyebrow", "route.settings.title", "route.settings.detail"]
  };
  const [eyebrow, title, detail] = keys[route];
  return { eyebrow: t(locale, eyebrow), title: t(locale, title), detail: t(locale, detail) };
}

/** "Back to X" for list routes, generic "Back" for detail routes. */
export function backLabel(locale: AppLocale, returnRoute: Route | undefined): string {
  if (returnRoute === undefined || returnRoute.endsWith("-detail"))
    return t(locale, "back.generic");
  return t(locale, "back.to", { destination: routeLabels(returnRoute, locale).eyebrow });
}

/** Translates known engine/API error messages; unknown text passes through. */
const errorKeyByMessage: Record<string, MessageKey> = {
  "This media source is not trusted.": "error.media.untrusted",
  "This media format is not supported by the macOS player.": "error.media.unsupported",
  "The video could not start.": "error.video.start",
  "The audio stream could not start.": "error.audio.start",
  "The video is unavailable from Dhamma Download.": "error.video.unavailable",
  "The audio stream is unavailable from Dhamma Download.": "error.audio.unavailable",
  "The catalogue is unavailable.": "error.catalogue.unavailable",
  "Unable to load the Dhamma catalogue.": "error.catalogue.load"
};

export function tError(locale: AppLocale, message: string): string {
  const key = errorKeyByMessage[message];
  return key === undefined ? message : t(locale, key);
}

/** BCP-47 language tag for the document root. */
export function documentLanguage(locale: AppLocale): string {
  return locale === "my-MM" ? "my" : "en";
}
