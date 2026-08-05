import { createDefaultLibrary, createDefaultSettings } from "./persistence.js";
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
} from "./types.js";
import { clamp, normalizeWhitespace } from "./utils.js";

export type AppAction =
  | { type: "hydrate"; library: AppState["library"]; settings: AppState["settings"] }
  | { type: "navigate"; route: Route }
  | { type: "summary-started" }
  | { type: "summary-loaded"; summary: CatalogueSummary }
  | { type: "summary-failed"; message: string }
  | { type: "teachers-started" }
  | { type: "teachers-loaded"; teachers: TeacherSummary[] }
  | { type: "teachers-failed"; message: string }
  | { type: "set-query"; query: string }
  | { type: "set-language"; language: LanguageFilter }
  | { type: "set-format"; format: FormatFilter }
  | { type: "set-teacher"; teacherId: number | null }
  | { type: "set-teacher-query"; query: string }
  | { type: "teacher-results"; teachers: TeacherSummary[] }
  | { type: "set-offset"; offset: number }
  | { type: "search-started" }
  | { type: "search-loaded"; page: AudioSearchPage }
  | { type: "search-failed"; message: string }
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
  | { type: "set-volume"; volume: number }
  | { type: "set-rate"; rate: number }
  | { type: "set-theme"; theme: AppState["settings"]["theme"] };

const emptyPage: AudioSearchPage = { items: [], total: 0, limit: 50, offset: 0 };
const emptySummary: CatalogueSummary = {
  totalAudio: 0,
  totalTeachers: 0,
  myanmarAudio: 0,
  englishAudio: 0
};

export function createInitialState(): AppState {
  return {
    route: "home",
    summary: { status: "idle", data: emptySummary, message: "" },
    teachers: { status: "idle", data: [], message: "" },
    teacherQuery: "",
    teacherResults: [],
    search: { query: "", language: "all", format: "all", teacherId: null, limit: 50, offset: 0 },
    catalogue: { status: "idle", page: emptyPage, message: "" },
    library: createDefaultLibrary(),
    settings: createDefaultSettings(),
    player: {
      current: null,
      queue: [],
      status: "idle",
      currentTime: 0,
      duration: 0,
      error: "",
      queueOpen: false
    }
  };
}

// The Explore form exposes query/language/format but no teacher field, so any
// form change must drop the hidden teacherId scope set by "select-teacher".
function resetOffset(state: AppState): AppState["search"] {
  return { ...state.search, offset: 0, teacherId: null };
}

export function reduce(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      return { ...state, library: action.library, settings: action.settings };
    case "navigate":
      return { ...state, route: action.route };
    case "summary-started":
      return { ...state, summary: { ...state.summary, status: "loading", message: "" } };
    case "summary-loaded":
      return { ...state, summary: { status: "ready", data: action.summary, message: "" } };
    case "summary-failed":
      return { ...state, summary: { ...state.summary, status: "error", message: action.message } };
    case "teachers-started":
      return { ...state, teachers: { ...state.teachers, status: "loading", message: "" } };
    case "teachers-loaded":
      return { ...state, teachers: { status: "ready", data: action.teachers, message: "" } };
    case "teachers-failed":
      return {
        ...state,
        teachers: { ...state.teachers, status: "error", message: action.message }
      };
    case "set-query":
      return {
        ...state,
        search: { ...resetOffset(state), query: normalizeWhitespace(action.query) }
      };
    case "set-language":
      return { ...state, search: { ...resetOffset(state), language: action.language } };
    case "set-format":
      return { ...state, search: { ...resetOffset(state), format: action.format } };
    case "set-teacher":
      return { ...state, search: { ...resetOffset(state), teacherId: action.teacherId } };
    case "set-teacher-query":
      return { ...state, teacherQuery: normalizeWhitespace(action.query) };
    case "teacher-results":
      return { ...state, teacherResults: action.teachers };
    case "set-offset":
      return { ...state, search: { ...state.search, offset: Math.max(0, action.offset) } };
    case "search-started":
      return { ...state, catalogue: { ...state.catalogue, status: "loading", message: "" } };
    case "search-loaded":
      return { ...state, catalogue: { status: "ready", page: action.page, message: "" } };
    case "search-failed":
      return {
        ...state,
        catalogue: { ...state.catalogue, status: "error", message: action.message }
      };
    case "toggle-favorite": {
      const exists = state.library.favorites.includes(action.id);
      const favorites = exists
        ? state.library.favorites.filter((id) => id !== action.id)
        : [...state.library.favorites, action.id];
      return { ...state, library: { ...state.library, favorites } };
    }
    case "record-history": {
      const history = [
        { id: action.id, playedAt: action.playedAt },
        ...state.library.history.filter((entry) => entry.id !== action.id)
      ].slice(0, 100);
      return { ...state, library: { ...state.library, history } };
    }
    case "save-resume":
      return {
        ...state,
        library: {
          ...state.library,
          resume: { ...state.library.resume, [String(action.id)]: Math.max(0, action.currentTime) }
        }
      };
    case "play-track":
      return {
        ...state,
        player: {
          ...state.player,
          current: action.track,
          status: "loading",
          currentTime: 0,
          duration: 0,
          error: ""
        }
      };
    case "enqueue":
      return state.player.queue.some((track) => track.id === action.track.id)
        ? state
        : { ...state, player: { ...state.player, queue: [...state.player.queue, action.track] } };
    case "remove-queue":
      return {
        ...state,
        player: {
          ...state.player,
          queue: state.player.queue.filter((track) => track.id !== action.id)
        }
      };
    case "clear-queue":
      return { ...state, player: { ...state.player, queue: [] } };
    case "play-next": {
      const [next, ...queue] = state.player.queue;
      return next === undefined
        ? { ...state, player: { ...state.player, status: "paused" } }
        : {
            ...state,
            player: {
              ...state.player,
              current: next,
              queue,
              status: "loading",
              currentTime: 0,
              duration: 0,
              error: ""
            }
          };
    }
    case "player-status":
      return {
        ...state,
        player: {
          ...state.player,
          status: action.status,
          error:
            action.status === "loading" || action.status === "playing" ? "" : state.player.error
        }
      };
    case "player-progress":
      return {
        ...state,
        player: {
          ...state.player,
          currentTime: Math.max(0, action.currentTime),
          duration: Math.max(0, action.duration)
        }
      };
    case "set-player-error":
      return { ...state, player: { ...state.player, error: action.message, status: "paused" } };
    case "toggle-queue":
      return { ...state, player: { ...state.player, queueOpen: !state.player.queueOpen } };
    case "set-volume":
      return { ...state, settings: { ...state.settings, volume: clamp(action.volume, 0, 1) } };
    case "set-rate":
      return {
        ...state,
        settings: { ...state.settings, playbackRate: clamp(action.rate, 0.75, 2) }
      };
    case "set-theme":
      return { ...state, settings: { ...state.settings, theme: action.theme } };
  }
}
