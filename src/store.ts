import { createDefaultLibrary, createDefaultSettings, createDefaultUi } from "./persistence.js";
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
  | { type: "open-play"; track: AudioTrack; returnRoute: Route }
  | { type: "teacher-talks-started"; mode: "initial" | "append" }
  | { type: "teacher-talks-loaded"; mode: "initial" | "append"; page: AudioSearchPage }
  | { type: "teacher-talks-failed"; mode: "initial" | "append"; message: string }
  | { type: "return-to-list" }
  | { type: "recent-started" }
  | { type: "recent-loaded"; tracks: AudioTrack[] }
  | { type: "recent-failed" }
  | { type: "favorite-tracks-loaded"; tracks: AudioTrack[] }
  | { type: "downloaded-tracks-loaded"; tracks: AudioTrack[] }
  | { type: "downloaded"; id: number; path: string }
  | { type: "download-progress"; id: number; progress: AppState["downloadProgress"][string] }
  | { type: "download-failed"; id: number }
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
  | { type: "set-sidebar-collapsed"; collapsed: boolean };

const emptyPage: AudioSearchPage = { items: [], total: 0, limit: 50, offset: 0 };
const emptySummary: CatalogueSummary = {
  totalAudio: 0,
  totalTeachers: 0,
  myanmarAudio: 0,
  englishAudio: 0
};
const emptyCollectionPage = { items: [], total: 0, limit: 24, offset: 0 };

export function createInitialState(): AppState {
  return {
    route: "home",
    summary: { status: "idle", data: emptySummary, message: "" },
    teachers: { status: "idle", data: [], message: "" },
    categories: { status: "idle", data: [], message: "" },
    teacherQuery: "",
    teacherResults: [],
    search: {
      query: "",
      language: "all",
      format: "all",
      teacherId: null,
      categoryId: null,
      collectionId: null,
      limit: 50,
      offset: 0
    },
    catalogue: {
      status: "idle",
      page: emptyPage,
      message: "",
      loadingMore: false,
      loadMoreMessage: "",
      exhausted: false
    },
    collections: {
      status: "idle",
      page: emptyCollectionPage,
      message: "",
      query: "",
      teacherId: null,
      limit: 24,
      offset: 0,
      loadingMore: false,
      loadMoreMessage: "",
      exhausted: false
    },
    collectionSearch: { query: "", teacherId: null, limit: 24, offset: 0 },
    collectionDetail: { status: "idle", data: null, message: "" },
    teacherDetail: { status: "idle", data: null, message: "" },
    teacherTalks: {
      status: "idle",
      page: emptyPage,
      message: "",
      loadingMore: false,
      loadMoreMessage: "",
      exhausted: false
    },
    selectedCollectionId: null,
    selectedTeacherId: null,
    navigationContext: null,
    homeRecent: { status: "idle", tracks: [] },
    library: createDefaultLibrary(),
    favoriteTracks: [],
    downloadedTracks: [],
    downloadProgress: {},
    settings: createDefaultSettings(),
    ui: createDefaultUi(),
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
      return {
        ...state,
        library: action.library,
        settings: action.settings,
        ui: action.ui,
        search: { ...state.search, limit: action.settings.browseLimit, offset: 0 },
        collectionSearch: {
          ...state.collectionSearch,
          limit: action.settings.browseLimit,
          offset: 0
        }
      };
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
    case "categories-started":
      return { ...state, categories: { ...state.categories, status: "loading", message: "" } };
    case "categories-loaded":
      return { ...state, categories: { status: "ready", data: action.categories, message: "" } };
    case "categories-failed":
      return {
        ...state,
        categories: { ...state.categories, status: "error", message: action.message }
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
    case "set-category":
      return { ...state, search: { ...state.search, categoryId: action.categoryId, offset: 0 } };
    case "clear-category":
      return { ...state, search: { ...state.search, categoryId: null, offset: 0 } };
    case "set-collection":
      return {
        ...state,
        search: { ...state.search, collectionId: action.collectionId, offset: 0 }
      };
    case "clear-collection":
      return { ...state, search: { ...state.search, collectionId: null, offset: 0 } };
    case "set-teacher-query":
      return { ...state, teacherQuery: normalizeWhitespace(action.query) };
    case "teacher-results":
      return { ...state, teacherResults: action.teachers };
    case "search-started":
      return action.mode === "append"
        ? {
            ...state,
            catalogue: { ...state.catalogue, loadingMore: true, loadMoreMessage: "" }
          }
        : {
            ...state,
            catalogue: {
              ...state.catalogue,
              status: "loading",
              page: emptyPage,
              message: "",
              loadingMore: false,
              loadMoreMessage: "",
              exhausted: false
            }
          };
    case "search-loaded":
      if (action.mode !== "append")
        return {
          ...state,
          catalogue: {
            status: "ready",
            page: action.page,
            message: "",
            loadingMore: false,
            loadMoreMessage: "",
            exhausted: action.page.offset + action.page.items.length >= action.page.total
          }
        };
      {
        const ids = new Set(state.catalogue.page.items.map((item) => item.id));
        const appended = action.page.items.filter((item) => !ids.has(item.id));
        const items = [...state.catalogue.page.items, ...appended];
        return {
          ...state,
          catalogue: {
            status: "ready",
            page: { ...action.page, items, offset: 0 },
            message: "",
            loadingMore: false,
            loadMoreMessage: "",
            exhausted: appended.length === 0 || items.length >= action.page.total
          }
        };
      }
    case "search-failed":
      return action.mode === "append"
        ? {
            ...state,
            catalogue: {
              ...state.catalogue,
              loadingMore: false,
              loadMoreMessage: action.message
            }
          }
        : {
            ...state,
            catalogue: { ...state.catalogue, status: "error", message: action.message }
          };
    case "set-collection-query": {
      const query = normalizeWhitespace(action.query);
      return {
        ...state,
        collectionSearch: { ...state.collectionSearch, query, offset: 0 },
        collections: { ...state.collections, query, offset: 0 }
      };
    }
    case "set-collection-teacher":
      return {
        ...state,
        collectionSearch: { ...state.collectionSearch, teacherId: action.teacherId, offset: 0 },
        collections: { ...state.collections, teacherId: action.teacherId, offset: 0 }
      };
    case "collections-started":
      return action.mode === "append"
        ? {
            ...state,
            collections: { ...state.collections, loadingMore: true, loadMoreMessage: "" }
          }
        : {
            ...state,
            collections: {
              ...state.collections,
              status: "loading",
              page: emptyCollectionPage,
              message: "",
              loadingMore: false,
              loadMoreMessage: "",
              exhausted: false
            }
          };
    case "collections-loaded":
      if (action.mode !== "append")
        return {
          ...state,
          collections: {
            ...state.collections,
            status: "ready",
            page: action.page,
            message: "",
            loadingMore: false,
            loadMoreMessage: "",
            exhausted: action.page.offset + action.page.items.length >= action.page.total
          }
        };
      {
        const ids = new Set(state.collections.page.items.map((item) => item.id));
        const appended = action.page.items.filter((item) => !ids.has(item.id));
        const items = [...state.collections.page.items, ...appended];
        return {
          ...state,
          collections: {
            ...state.collections,
            status: "ready",
            page: { ...action.page, items, offset: 0 },
            message: "",
            loadingMore: false,
            loadMoreMessage: "",
            exhausted: appended.length === 0 || items.length >= action.page.total
          }
        };
      }
    case "collections-failed":
      return action.mode === "append"
        ? {
            ...state,
            collections: {
              ...state.collections,
              loadingMore: false,
              loadMoreMessage: action.message
            }
          }
        : {
            ...state,
            collections: { ...state.collections, status: "error", message: action.message }
          };
    case "open-collection":
      return {
        ...state,
        route: "collection-detail",
        selectedCollectionId: action.collectionId,
        navigationContext: { returnRoute: action.returnRoute },
        collectionDetail: { status: "idle", data: null, message: "" }
      };
    case "collection-detail-started":
      return {
        ...state,
        collectionDetail: { ...state.collectionDetail, status: "loading", message: "" }
      };
    case "collection-detail-loaded":
      return {
        ...state,
        collectionDetail: { status: "ready", data: action.detail, message: "" }
      };
    case "collection-detail-failed":
      return {
        ...state,
        collectionDetail: { status: "error", data: null, message: action.message }
      };
    case "open-teacher":
      return {
        ...state,
        route: "teacher-detail",
        selectedTeacherId: action.teacherId,
        navigationContext: { returnRoute: action.returnRoute },
        teacherDetail: { status: "idle", data: null, message: "" },
        teacherTalks: {
          status: "idle",
          page: emptyPage,
          message: "",
          loadingMore: false,
          loadMoreMessage: "",
          exhausted: false
        }
      };
    case "teacher-detail-started":
      return {
        ...state,
        teacherDetail: { ...state.teacherDetail, status: "loading", message: "" }
      };
    case "teacher-detail-loaded":
      return { ...state, teacherDetail: { status: "ready", data: action.detail, message: "" } };
    case "teacher-detail-failed":
      return {
        ...state,
        teacherDetail: { ...state.teacherDetail, status: "error", message: action.message }
      };
    case "open-play":
      return {
        ...state,
        route: "play",
        navigationContext: { returnRoute: action.returnRoute }
      };
    case "teacher-talks-started":
      return action.mode === "initial"
        ? {
            ...state,
            teacherTalks: {
              ...state.teacherTalks,
              status: "loading",
              page: emptyPage,
              message: "",
              loadingMore: false,
              loadMoreMessage: "",
              exhausted: false
            }
          }
        : {
            ...state,
            teacherTalks: {
              ...state.teacherTalks,
              loadingMore: true,
              loadMoreMessage: ""
            }
          };
    case "teacher-talks-loaded":
      if (action.mode === "initial")
        return {
          ...state,
          teacherTalks: {
            status: "ready",
            page: action.page,
            message: "",
            loadingMore: false,
            loadMoreMessage: "",
            exhausted: action.page.offset + action.page.items.length >= action.page.total
          }
        };
      {
        const knownIds = new Set(state.teacherTalks.page.items.map((track) => track.id));
        const appended = action.page.items.filter((track) => !knownIds.has(track.id));
        const items = [...state.teacherTalks.page.items, ...appended];
        return {
          ...state,
          teacherTalks: {
            status: "ready",
            page: { ...action.page, items, offset: 0 },
            message: "",
            loadingMore: false,
            loadMoreMessage: "",
            exhausted: appended.length === 0 || items.length >= action.page.total
          }
        };
      }
    case "teacher-talks-failed":
      return action.mode === "initial"
        ? {
            ...state,
            teacherTalks: {
              ...state.teacherTalks,
              status: "error",
              message: action.message,
              loadingMore: false
            }
          }
        : {
            ...state,
            teacherTalks: {
              ...state.teacherTalks,
              loadingMore: false,
              loadMoreMessage: action.message
            }
          };
    case "return-to-list":
      return {
        ...state,
        route: state.navigationContext?.returnRoute ?? "home",
        navigationContext: null
      };
    case "recent-started":
      return { ...state, homeRecent: { status: "loading", tracks: state.homeRecent.tracks } };
    case "recent-loaded":
      return { ...state, homeRecent: { status: "ready", tracks: action.tracks } };
    case "recent-failed":
      return { ...state, homeRecent: { status: "error", tracks: [] } };
    case "favorite-tracks-loaded":
      return { ...state, favoriteTracks: action.tracks };
    case "downloaded-tracks-loaded":
      return { ...state, downloadedTracks: action.tracks };
    case "downloaded":
      return {
        ...state,
        downloadProgress: Object.fromEntries(
          Object.entries(state.downloadProgress).filter(([key]) => key !== String(action.id))
        ),
        library: {
          ...state.library,
          downloads: { ...(state.library.downloads ?? {}), [String(action.id)]: action.path }
        }
      };
    case "download-progress":
      return {
        ...state,
        downloadProgress: {
          ...state.downloadProgress,
          [String(action.id)]: action.progress
        }
      };
    case "download-failed": {
      const downloadProgress = { ...state.downloadProgress };
      delete downloadProgress[String(action.id)];
      return { ...state, downloadProgress };
    }
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
    case "set-rate":
      return {
        ...state,
        settings: { ...state.settings, playbackRate: clamp(action.rate, 0.75, 2) }
      };
    case "set-browse-limit":
      return {
        ...state,
        settings: { ...state.settings, browseLimit: action.limit },
        search: { ...state.search, limit: action.limit, offset: 0 },
        collectionSearch: { ...state.collectionSearch, limit: action.limit, offset: 0 }
      };
    case "set-theme":
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case "set-sidebar-collapsed":
      return { ...state, ui: { ...state.ui, sidebarCollapsed: action.collapsed } };
  }
}
