import type {
  AppState,
  AudioSearchPage,
  AudioTrack,
  CatalogueSummary,
  LanguageFilter,
  FormatFilter,
  PlayerStatus,
  Route,
  TeacherSummary
} from "../types.js";

export type AppAction =
  | {
      type: "hydrate";
      library: AppState["library"];
      settings: AppState["settings"];
      ui: AppState["ui"];
    }
  | { type: "navigate"; route: Route }
  | { type: "summary-started" }
  | { type: "summary-loaded"; summary: CatalogueSummary }
  | { type: "summary-failed"; message: string }
  | { type: "teachers-started" }
  | { type: "teachers-loaded"; teachers: TeacherSummary[] }
  | { type: "teachers-failed"; message: string }
  | { type: "categories-started" }
  | { type: "categories-loaded"; categories: AppState["categories"]["data"] }
  | { type: "categories-failed"; message: string }
  | { type: "set-query"; query: string }
  | { type: "set-language"; language: LanguageFilter }
  | { type: "set-format"; format: FormatFilter }
  | { type: "set-teacher"; teacherId: number | null }
  | { type: "set-category"; categoryId: number | null }
  | { type: "clear-category" }
  | { type: "set-collection"; collectionId: number | null }
  | { type: "clear-collection" }
  | { type: "set-teacher-query"; query: string }
  | { type: "teacher-results"; teachers: TeacherSummary[] }
  | { type: "search-started"; mode: "initial" | "append" }
  | { type: "search-loaded"; mode: "initial" | "append"; page: AudioSearchPage }
  | { type: "search-failed"; mode: "initial" | "append"; message: string }
  | { type: "set-collection-query"; query: string }
  | { type: "set-collection-teacher"; teacherId: number | null }
  | { type: "collections-started"; mode: "initial" | "append" }
  | {
      type: "collections-loaded";
      mode: "initial" | "append";
      page: AppState["collections"]["page"];
    }
  | { type: "collections-failed"; mode: "initial" | "append"; message: string }
  | { type: "open-collection"; collectionId: number; returnRoute: Route }
  | { type: "collection-detail-started" }
  | { type: "collection-detail-loaded"; detail: NonNullable<AppState["collectionDetail"]["data"]> }
  | { type: "collection-detail-failed"; message: string }
  | { type: "open-teacher"; teacherId: number; returnRoute: Route }
  | { type: "teacher-detail-started" }
  | { type: "teacher-detail-loaded"; detail: NonNullable<AppState["teacherDetail"]["data"]> }
  | { type: "teacher-detail-failed"; message: string }
  | { type: "teacher-talks-started"; mode: "initial" | "append" }
  | { type: "teacher-talks-loaded"; mode: "initial" | "append"; page: AudioSearchPage }
  | { type: "teacher-talks-failed"; mode: "initial" | "append"; message: string }
  | { type: "return-to-list" }
  | { type: "close-video-player" }
  | { type: "recent-started" }
  | { type: "recent-loaded"; tracks: AudioTrack[] }
  | { type: "recent-failed"; message: string }
  | { type: "favorite-tracks-loaded"; tracks: AudioTrack[] }
  | { type: "downloaded-tracks-loaded"; tracks: AudioTrack[] }
  | {
      type: "download-availability";
      id: number;
      availability: "available" | "missing" | "unverified";
    }
  | { type: "downloaded"; id: number; path: string }
  | { type: "download-progress"; id: number; progress: AppState["downloadProgress"][string] }
  | { type: "download-failed"; id: number }
  | { type: "remove-download"; id: number }
  | { type: "toggle-favorite"; id: number }
  | { type: "record-history"; id: number; playedAt: number }
  | { type: "save-resume"; id: number; currentTime: number }
  | { type: "play-track"; track: AudioTrack }
  | { type: "enqueue"; track: AudioTrack }
  | { type: "remove-queue"; id: number }
  | { type: "clear-queue" }
  | { type: "play-next" }
  | { type: "player-status"; status: PlayerStatus }
  | { type: "player-progress"; currentTime: number; duration: number }
  | { type: "set-player-error"; message: string }
  | { type: "toggle-queue" }
  | { type: "set-rate"; rate: number }
  | { type: "set-browse-limit"; limit: 25 | 50 | 100 }
  | { type: "set-theme"; theme: "light" | "dark" | "system" }
  | { type: "set-locale"; locale: "en-US" | "my-MM" }
  | { type: "set-sidebar-collapsed"; collapsed: boolean };
