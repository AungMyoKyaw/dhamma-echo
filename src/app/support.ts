import type { CatalogueApi } from "../api.js";
import type { MediaLike } from "../player.js";
import type { AppAction } from "../store.js";
import type { AppState, StorageLike } from "../types.js";

export interface CatalogueClient {
  getSummary: CatalogueApi["getSummary"];
  listFeaturedTeachers: CatalogueApi["listFeaturedTeachers"];
  searchTeachers: CatalogueApi["searchTeachers"];
  searchAudio: CatalogueApi["searchAudio"];
  getAudioTrack: CatalogueApi["getAudioTrack"];
  downloadAudio: CatalogueApi["downloadAudio"];
  removeDownloadedAudio: CatalogueApi["removeDownloadedAudio"];
  downloadedMediaExists: CatalogueApi["downloadedMediaExists"];
  listContentCategories: CatalogueApi["listContentCategories"];
  searchCollections: CatalogueApi["searchCollections"];
  getCollection: CatalogueApi["getCollection"];
  getTeacher: CatalogueApi["getTeacher"];
}

export interface AppDependencies {
  api: CatalogueClient;
  storage: StorageLike;
  audio: MediaLike;
  render: (state: AppState, action: AppAction) => void;
  now: () => number;
}

export function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "The catalogue is unavailable.";
}

export const libraryActions = new Set<AppAction["type"]>([
  "hydrate",
  "toggle-favorite",
  "downloaded",
  "remove-download",
  "record-history",
  "save-resume"
]);
export const settingsActions = new Set<AppAction["type"]>([
  "hydrate",
  "set-rate",
  "set-browse-limit",
  "set-theme",
  "set-locale"
]);
export const uiActions = new Set<AppAction["type"]>(["hydrate", "set-sidebar-collapsed"]);
