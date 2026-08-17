export type Route =
  | "home"
  | "explore"
  | "collections"
  | "collection-detail"
  | "teachers"
  | "teacher-detail"
  | "library"
  | "settings";
export type LanguageFilter = "all" | "myanmar" | "english";
export type FormatFilter = "all" | "mp3" | "wma" | "mp4" | "wmv";
export type PlayerStatus = "idle" | "loading" | "playing" | "paused";

export interface CatalogueSummary {
  totalAudio: number;
  totalTeachers: number;
  myanmarAudio: number;
  englishAudio: number;
}

export interface TeacherSummary {
  id: number;
  name: string;
  audioCount: number;
}

export interface ContentCategory {
  id: number;
  name: string;
  language: string;
  count: number;
}

export interface CollectionSearchRequest {
  query: string;
  teacherId: number | null;
  limit: number;
  offset: number;
}

export interface CollectionSummary {
  id: number;
  name: string;
  teacherId: number | null;
  teacherName: string;
  audioCount: number;
}

export interface CollectionSearchPage {
  items: CollectionSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface CollectionDetail {
  id: number;
  name: string;
  description: string | null;
  teacherId: number | null;
  teacherName: string;
  audioCount: number;
  tracks: AudioTrack[];
}

export interface TeacherDetail {
  id: number;
  name: string;
  nameMyanmar: string | null;
  title: string | null;
  description: string | null;
  audioCount: number;
  collections: CollectionSummary[];
}

export interface AudioTrack {
  id: number;
  title: string;
  format: string;
  language: string;
  url: string;
  dateRecorded: string | null;
  location: string | null;
  teacherId: number | null;
  teacherName: string;
  playable: boolean;
  /**
   * Catalogue media type. `audio` rows are played through `<audio>`;
   * `video` rows play in the pinned video card overlay.
   */
  mediaType: "audio" | "video";
}

export interface AudioSearchRequest {
  query: string;
  language: string | null;
  format: string | null;
  teacherId: number | null;
  categoryId: number | null;
  collectionId: number | null;
  limit: number;
  offset: number;
}

export interface AudioSearchPage {
  items: AudioTrack[];
  total: number;
  limit: number;
  offset: number;
}

interface HistoryEntry {
  id: number;
  playedAt: number;
}

export interface LibraryState {
  favorites: number[];
  history: HistoryEntry[];
  resume: Record<string, number>;
  downloads?: Record<string, string>;
}

export interface DownloadProgress {
  downloaded: number;
  total: number | null;
}

export interface SettingsState {
  playbackRate: number;
  browseLimit: 25 | 50 | 100;
  theme: "light" | "dark" | "system";
}

interface SearchState {
  query: string;
  language: LanguageFilter;
  format: FormatFilter;
  teacherId: number | null;
  categoryId: number | null;
  collectionId: number | null;
  limit: number;
  offset: number;
}

interface CollectionBrowseState {
  status: "idle" | "loading" | "ready" | "error";
  page: CollectionSearchPage;
  message: string;
  query: string;
  teacherId: number | null;
  limit: number;
  offset: number;
  nextLoadSize: number;
  loadingMore: boolean;
  loadMoreMessage: string;
  exhausted: boolean;
}

interface Loadable<T> {
  status: "idle" | "loading" | "ready" | "error";
  data: T;
  message: string;
}

interface CatalogueState {
  status: "idle" | "loading" | "ready" | "error";
  page: AudioSearchPage;
  message: string;
  nextLoadSize: number;
  loadingMore: boolean;
  loadMoreMessage: string;
  exhausted: boolean;
}

type TeacherTalksState = CatalogueState;

interface PlayerState {
  current: AudioTrack | null;
  queue: AudioTrack[];
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  error: string;
  queueOpen: boolean;
}

interface RecentState {
  status: "idle" | "loading" | "ready" | "error";
  tracks: AudioTrack[];
}

export interface AppState {
  route: Route;
  summary: Loadable<CatalogueSummary>;
  teachers: Loadable<TeacherSummary[]>;
  categories: Loadable<ContentCategory[]>;
  teacherQuery: string;
  teacherResults: TeacherSummary[];
  search: SearchState;
  catalogue: CatalogueState;
  collections: CollectionBrowseState;
  collectionSearch: Pick<CollectionBrowseState, "query" | "teacherId" | "limit" | "offset">;
  collectionDetail: Loadable<CollectionDetail | null>;
  teacherDetail: Loadable<TeacherDetail | null>;
  teacherTalks: TeacherTalksState;
  selectedCollectionId: number | null;
  selectedTeacherId: number | null;
  navigationContext: { returnRoute: Route } | null;
  homeRecent: RecentState;
  library: LibraryState;
  favoriteTracks: AudioTrack[];
  downloadedTracks: AudioTrack[];
  downloadProgress: Record<string, DownloadProgress>;
  settings: SettingsState;
  ui: { sidebarCollapsed: boolean };
  player: PlayerState;
}

export type PlayerEvent =
  | { type: "status"; status: PlayerStatus }
  | { type: "progress"; currentTime: number; duration: number }
  | { type: "ended" }
  | { type: "error"; message: string };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type InvokeFn = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
