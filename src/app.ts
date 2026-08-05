import type { CatalogueApi } from "./api.js";
import { loadLibrary, loadSettings, saveLibrary, saveSettings } from "./persistence.js";
import { AudioEngine, type AudioLike } from "./player.js";
import { createInitialState, reduce, type AppAction } from "./store.js";
import type {
  AppState,
  AudioSearchRequest,
  AudioTrack,
  PlayerEvent,
  StorageLike,
  Theme
} from "./types.js";

export interface CatalogueClient {
  getSummary: CatalogueApi["getSummary"];
  listFeaturedTeachers: CatalogueApi["listFeaturedTeachers"];
  searchTeachers: CatalogueApi["searchTeachers"];
  searchAudio: CatalogueApi["searchAudio"];
}

interface AppDependencies {
  api: CatalogueClient;
  storage: StorageLike;
  audio: AudioLike;
  render: (state: AppState) => void;
  applyTheme: (theme: Theme) => void;
  now: () => number;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "The catalogue is unavailable.";
}

const libraryActions = new Set<AppAction["type"]>([
  "hydrate",
  "toggle-favorite",
  "record-history",
  "save-resume"
]);
const settingsActions = new Set<AppAction["type"]>([
  "hydrate",
  "set-volume",
  "set-rate",
  "set-theme"
]);

export class DhammaApp {
  state = createInitialState();
  private readonly engine: AudioEngine;

  constructor(private readonly dependencies: AppDependencies) {
    this.engine = new AudioEngine(dependencies.audio, (event) => {
      this.handlePlayerEvent(event);
    });
  }

  async start(): Promise<void> {
    this.dispatch({
      type: "hydrate",
      library: loadLibrary(this.dependencies.storage),
      settings: loadSettings(this.dependencies.storage)
    });
    this.engine.setVolume(this.state.settings.volume);
    this.engine.setRate(this.state.settings.playbackRate);
    await Promise.all([this.loadSummary(), this.loadTeachers(), this.search()]);
  }

  dispatch(action: AppAction): void {
    this.state = reduce(this.state, action);
    if (libraryActions.has(action.type)) saveLibrary(this.dependencies.storage, this.state.library);
    if (settingsActions.has(action.type))
      saveSettings(this.dependencies.storage, this.state.settings);
    if (action.type === "set-theme" || action.type === "hydrate") {
      this.dependencies.applyTheme(this.state.settings.theme);
    }
    this.dependencies.render(this.state);
  }

  async loadSummary(): Promise<void> {
    this.dispatch({ type: "summary-started" });
    try {
      this.dispatch({ type: "summary-loaded", summary: await this.dependencies.api.getSummary() });
    } catch (error) {
      this.dispatch({ type: "summary-failed", message: messageFrom(error) });
    }
  }

  async loadTeachers(): Promise<void> {
    this.dispatch({ type: "teachers-started" });
    try {
      this.dispatch({
        type: "teachers-loaded",
        teachers: await this.dependencies.api.listFeaturedTeachers(100)
      });
    } catch (error) {
      this.dispatch({ type: "teachers-failed", message: messageFrom(error) });
    }
  }

  async search(): Promise<void> {
    this.dispatch({ type: "search-started" });
    const request: AudioSearchRequest = {
      query: this.state.search.query,
      language: this.state.search.language === "all" ? null : this.state.search.language,
      format: this.state.search.format === "all" ? null : this.state.search.format,
      teacherId: this.state.search.teacherId,
      limit: this.state.search.limit,
      offset: this.state.search.offset
    };
    try {
      this.dispatch({
        type: "search-loaded",
        page: await this.dependencies.api.searchAudio(request)
      });
    } catch (error) {
      this.dispatch({ type: "search-failed", message: messageFrom(error) });
    }
  }

  findTrack(id: number): AudioTrack | null {
    if (this.state.player.current?.id === id) return this.state.player.current;
    return (
      this.state.catalogue.page.items.find((track) => track.id === id) ??
      this.state.player.queue.find((track) => track.id === id) ??
      null
    );
  }

  async playTrack(track: AudioTrack): Promise<void> {
    this.dispatch({ type: "play-track", track });
    this.dispatch({ type: "record-history", id: track.id, playedAt: this.dependencies.now() });
    this.engine.setVolume(this.state.settings.volume);
    this.engine.setRate(this.state.settings.playbackRate);
    await this.engine.setTrack(track, this.state.library.resume[String(track.id)] ?? 0);
  }

  async togglePlayback(): Promise<void> {
    if (this.state.player.current === null) return;
    await this.engine.toggle();
  }

  async retryPlayback(): Promise<void> {
    const track = this.state.player.current;
    if (track === null) return;
    this.engine.setVolume(this.state.settings.volume);
    this.engine.setRate(this.state.settings.playbackRate);
    const resumeAt = Math.max(
      this.state.player.currentTime,
      this.state.library.resume[String(track.id)] ?? 0
    );
    await this.engine.setTrack(track, resumeAt);
  }

  seek(value: number): void {
    if (this.state.player.current === null) return;
    this.engine.seek(value);
  }

  setVolume(value: number): void {
    this.dispatch({ type: "set-volume", volume: value });
    this.engine.setVolume(this.state.settings.volume);
  }

  setRate(value: number): void {
    this.dispatch({ type: "set-rate", rate: value });
    this.engine.setRate(this.state.settings.playbackRate);
  }

  async playNext(): Promise<void> {
    const previousId = this.state.player.current?.id;
    this.dispatch({ type: "play-next" });
    const next = this.state.player.current;
    if (next !== null && next.id !== previousId) await this.playTrack(next);
  }

  destroy(): void {
    this.persistCurrentResume(true);
    this.engine.destroy();
  }

  private persistCurrentResume(force: boolean): void {
    const track = this.state.player.current;
    if (track === null) return;
    const saved = this.state.library.resume[String(track.id)] ?? 0;
    if (!force && Math.abs(saved - this.state.player.currentTime) < 5) return;
    this.dispatch({
      type: "save-resume",
      id: track.id,
      currentTime: this.state.player.currentTime
    });
  }

  private handlePlayerEvent(event: PlayerEvent): void {
    switch (event.type) {
      case "status":
        this.dispatch({ type: "player-status", status: event.status });
        if (event.status === "paused") this.persistCurrentResume(true);
        break;
      case "progress": {
        const secondChanged =
          Math.floor(event.currentTime) !== Math.floor(this.state.player.currentTime);
        const durationChanged =
          Math.floor(event.duration) !== Math.floor(this.state.player.duration);
        if (secondChanged || durationChanged) {
          this.dispatch({
            type: "player-progress",
            currentTime: event.currentTime,
            duration: event.duration
          });
        }
        this.persistCurrentResume(false);
        break;
      }
      case "ended": {
        const track = this.state.player.current;
        if (track !== null) {
          this.dispatch({ type: "save-resume", id: track.id, currentTime: 0 });
        }
        void this.playNext();
        break;
      }
      case "error":
        this.dispatch({ type: "set-player-error", message: event.message });
        break;
    }
  }
}
