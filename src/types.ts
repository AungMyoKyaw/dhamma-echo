export type Route = "home" | "explore" | "teachers" | "library" | "settings";
export type Theme = "system" | "light" | "dark";
export type LanguageFilter = "all" | "myanmar" | "english";
export type FormatFilter = "all" | "mp3" | "wma";
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
}

export interface AudioSearchRequest {
  query: string;
  language: string | null;
  format: string | null;
  teacherId: number | null;
  limit: number;
  offset: number;
}

export interface AudioSearchPage {
  items: AudioTrack[];
  total: number;
  limit: number;
  offset: number;
}

export interface HistoryEntry {
  id: number;
  playedAt: number;
}

export interface LibraryState {
  favorites: number[];
  history: HistoryEntry[];
  resume: Record<string, number>;
}

export interface SettingsState {
  theme: Theme;
  playbackRate: number;
  volume: number;
}

export interface SearchState {
  query: string;
  language: LanguageFilter;
  format: FormatFilter;
  teacherId: number | null;
  limit: number;
  offset: number;
}

export interface Loadable<T> {
  status: "idle" | "loading" | "ready" | "error";
  data: T;
  message: string;
}

export interface CatalogueState {
  status: "idle" | "loading" | "ready" | "error";
  page: AudioSearchPage;
  message: string;
}

export interface PlayerState {
  current: AudioTrack | null;
  queue: AudioTrack[];
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  error: string;
  queueOpen: boolean;
}

export interface AppState {
  route: Route;
  summary: Loadable<CatalogueSummary>;
  teachers: Loadable<TeacherSummary[]>;
  teacherQuery: string;
  teacherResults: TeacherSummary[];
  search: SearchState;
  catalogue: CatalogueState;
  library: LibraryState;
  settings: SettingsState;
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
