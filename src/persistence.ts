import type { LibraryState, SettingsState, StorageLike } from "./types.js";
import { clamp } from "./utils.js";

const LIBRARY_KEY = "dhamma-echo:library";
const SETTINGS_KEY = "dhamma-echo:settings";
const VERSION = 1;
const RATES = new Set([0.75, 1, 1.25, 1.5, 1.75, 2]);
const BROWSE_LIMITS = new Set([25, 50, 100]);

export function createDefaultLibrary(): LibraryState {
  return { favorites: [], history: [], resume: {}, downloads: {} };
}

export function createDefaultSettings(): SettingsState {
  return { playbackRate: 1, volume: 0.8, browseLimit: 50, theme: "light" };
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function loadLibrary(storage: StorageLike): LibraryState {
  const raw = storage.getItem(LIBRARY_KEY);
  if (raw === null) return createDefaultLibrary();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== VERSION
    ) {
      return createDefaultLibrary();
    }
    const record = parsed as Record<string, unknown>;
    const favorites = Array.isArray(record.favorites)
      ? [...new Set(record.favorites.filter(positiveInteger))]
      : [];
    const history = Array.isArray(record.history)
      ? record.history
          .filter(
            (entry): entry is { id: number; playedAt: number } =>
              typeof entry === "object" &&
              entry !== null &&
              positiveInteger((entry as Record<string, unknown>).id) &&
              typeof (entry as Record<string, unknown>).playedAt === "number"
          )
          .slice(0, 100)
      : [];
    const resumeEntries =
      typeof record.resume === "object" && record.resume !== null
        ? Object.entries(record.resume)
            .filter(
              ([key, value]) =>
                positiveInteger(Number(key)) && typeof value === "number" && value >= 0
            )
            .slice(-500)
        : [];
    const downloads =
      typeof record.downloads === "object" && record.downloads !== null
        ? Object.fromEntries(
            Object.entries(record.downloads).filter(
              ([key, value]) =>
                positiveInteger(Number(key)) && typeof value === "string" && value.length > 0
            )
          )
        : {};
    return {
      favorites,
      history,
      resume: Object.fromEntries(resumeEntries),
      downloads
    };
  } catch {
    return createDefaultLibrary();
  }
}

export function saveLibrary(storage: StorageLike, library: LibraryState): void {
  const favorites = [...new Set(library.favorites.filter(positiveInteger))];
  const history = library.history
    .filter((entry) => positiveInteger(entry.id) && Number.isFinite(entry.playedAt))
    .slice(0, 100);
  const resume = Object.fromEntries(
    Object.entries(library.resume)
      .filter(
        ([key, value]) => positiveInteger(Number(key)) && Number.isFinite(value) && value >= 0
      )
      .slice(-500)
  );
  const downloads = Object.fromEntries(
    Object.entries(library.downloads ?? {}).filter(
      ([key, value]) =>
        positiveInteger(Number(key)) && typeof value === "string" && value.length > 0
    )
  );
  storage.setItem(
    LIBRARY_KEY,
    JSON.stringify({ version: VERSION, favorites, history, resume, downloads })
  );
}

export function loadSettings(storage: StorageLike): SettingsState {
  const raw = storage.getItem(SETTINGS_KEY);
  if (raw === null) return createDefaultSettings();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return createDefaultSettings();
    const record = parsed as Record<string, unknown>;
    if (
      record.version !== VERSION ||
      typeof record.playbackRate !== "number" ||
      !RATES.has(record.playbackRate) ||
      typeof record.volume !== "number" ||
      record.volume < 0 ||
      record.volume > 1
    ) {
      return createDefaultSettings();
    }
    return {
      playbackRate: record.playbackRate,
      volume: clamp(record.volume, 0, 1),
      browseLimit:
        typeof record.browseLimit === "number" && BROWSE_LIMITS.has(record.browseLimit)
          ? (record.browseLimit as 25 | 50 | 100)
          : 50,
      theme: record.theme === "dark" ? "dark" : "light"
    };
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(storage: StorageLike, settings: SettingsState): void {
  storage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      version: VERSION,
      playbackRate: settings.playbackRate,
      volume: settings.volume,
      browseLimit: settings.browseLimit,
      theme: settings.theme
    })
  );
}
