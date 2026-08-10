import type { CatalogueApi } from "./api.js";
import { loadLibrary, loadSettings, saveLibrary, saveSettings } from "./persistence.js";
import { AudioEngine, type AudioLike } from "./player.js";
import { createInitialState, reduce, type AppAction } from "./store.js";
import type {
  AppState,
  AudioSearchRequest,
  AudioTrack,
  PlayerEvent,
  Route,
  StorageLike
} from "./types.js";

export interface CatalogueClient {
  getSummary: CatalogueApi["getSummary"];
  listFeaturedTeachers: CatalogueApi["listFeaturedTeachers"];
  searchTeachers: CatalogueApi["searchTeachers"];
  searchAudio: CatalogueApi["searchAudio"];
  getAudioTrack: CatalogueApi["getAudioTrack"];
  listAudioCategories: CatalogueApi["listAudioCategories"];
  searchCollections: CatalogueApi["searchCollections"];
  getCollection: CatalogueApi["getCollection"];
  getTeacher: CatalogueApi["getTeacher"];
}

interface AppDependencies {
  api: CatalogueClient;
  storage: StorageLike;
  audio: AudioLike;
  render: (state: AppState) => void;
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
const settingsActions = new Set<AppAction["type"]>(["hydrate", "set-volume", "set-rate"]);

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
    await Promise.all([
      this.loadSummary(),
      this.loadTeachers(),
      this.loadCategories(),
      this.search(),
      this.loadRecent()
    ]);
  }

  dispatch(action: AppAction): void {
    this.state = reduce(this.state, action);
    if (libraryActions.has(action.type)) saveLibrary(this.dependencies.storage, this.state.library);
    if (settingsActions.has(action.type))
      saveSettings(this.dependencies.storage, this.state.settings);
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

  async loadCategories(): Promise<void> {
    this.dispatch({ type: "categories-started" });
    try {
      this.dispatch({
        type: "categories-loaded",
        categories: await this.dependencies.api.listAudioCategories()
      });
    } catch (error) {
      this.dispatch({ type: "categories-failed", message: messageFrom(error) });
    }
  }

  async searchCollections(): Promise<void> {
    this.dispatch({ type: "collections-started" });
    try {
      this.dispatch({
        type: "collections-loaded",
        page: await this.dependencies.api.searchCollections(this.state.collectionSearch)
      });
    } catch (error) {
      this.dispatch({ type: "collections-failed", message: messageFrom(error) });
    }
  }

  async openCollection(id: number, returnRoute: Route): Promise<void> {
    this.dispatch({ type: "open-collection", collectionId: id, returnRoute });
    this.dispatch({ type: "collection-detail-started" });
    try {
      this.dispatch({
        type: "collection-detail-loaded",
        detail: await this.dependencies.api.getCollection(id)
      });
    } catch (error) {
      this.dispatch({ type: "collection-detail-failed", message: messageFrom(error) });
    }
  }

  async openTeacher(id: number, returnRoute: Route): Promise<void> {
    this.dispatch({ type: "open-teacher", teacherId: id, returnRoute });
    this.dispatch({ type: "teacher-detail-started" });
    const detail = this.dependencies.api
      .getTeacher(id)
      .then((value) => this.dispatch({ type: "teacher-detail-loaded", detail: value }))
      .catch((error: unknown) =>
        this.dispatch({ type: "teacher-detail-failed", message: messageFrom(error) })
      );
    await Promise.all([detail, this.loadTeacherTalks()]);
  }

  async loadTeacherTalks(): Promise<void> {
    const id = this.state.selectedTeacherId;
    if (id === null) return;
    this.dispatch({ type: "teacher-talks-started", mode: "initial" });
    await this.dependencies.api
      .searchAudio({
        query: "",
        language: null,
        format: null,
        teacherId: id,
        categoryId: null,
        collectionId: null,
        limit: 50,
        offset: 0
      })
      .then((page) => this.dispatch({ type: "teacher-talks-loaded", mode: "initial", page }))
      .catch((error: unknown) =>
        this.dispatch({
          type: "teacher-talks-failed",
          mode: "initial",
          message: messageFrom(error)
        })
      );
  }

  async loadMoreTeacherTalks(): Promise<void> {
    const teacherId = this.state.selectedTeacherId;
    const teacherTalks = this.state.teacherTalks;
    if (
      teacherId === null ||
      teacherTalks.loadingMore ||
      teacherTalks.exhausted ||
      teacherTalks.page.items.length >= teacherTalks.page.total
    )
      return;

    const offset = teacherTalks.page.items.length;
    this.dispatch({ type: "teacher-talks-started", mode: "append" });
    await this.dependencies.api
      .searchAudio({
        query: "",
        language: null,
        format: null,
        teacherId,
        categoryId: null,
        collectionId: null,
        limit: teacherTalks.page.limit,
        offset
      })
      .then((page) => this.dispatch({ type: "teacher-talks-loaded", mode: "append", page }))
      .catch((error: unknown) =>
        this.dispatch({
          type: "teacher-talks-failed",
          mode: "append",
          message: messageFrom(error)
        })
      );
  }

  async loadRecent(): Promise<void> {
    const ids = this.state.library.history.slice(0, 5).map((entry) => entry.id);
    if (ids.length === 0) {
      this.dispatch({ type: "recent-loaded", tracks: [] });
      return;
    }
    this.dispatch({ type: "recent-started" });
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          return await this.dependencies.api.getAudioTrack(id);
        } catch {
          return null;
        }
      })
    );
    const tracks = results.filter((track): track is AudioTrack => track !== null);
    if (tracks.length === 0) {
      this.dispatch({ type: "recent-failed" });
      return;
    }
    this.dispatch({ type: "recent-loaded", tracks });
  }

  async searchTeachers(query: string): Promise<void> {
    this.dispatch({ type: "set-teacher-query", query });
    if (this.state.teacherQuery.length === 0) {
      this.dispatch({ type: "teacher-results", teachers: [] });
      return;
    }
    try {
      this.dispatch({
        type: "teacher-results",
        teachers: await this.dependencies.api.searchTeachers(this.state.teacherQuery)
      });
    } catch {
      this.dispatch({ type: "teacher-results", teachers: [] });
    }
  }

  async search(): Promise<void> {
    this.dispatch({ type: "search-started" });
    const request: AudioSearchRequest = {
      query: this.state.search.query,
      language: this.state.search.language === "all" ? null : this.state.search.language,
      format: this.state.search.format === "all" ? null : this.state.search.format,
      teacherId: this.state.search.teacherId,
      categoryId: this.state.search.categoryId,
      collectionId: this.state.search.collectionId,
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
      this.state.collectionDetail.data?.tracks.find((track) => track.id === id) ??
      this.state.teacherTalks.page.items.find((track) => track.id === id) ??
      this.state.player.queue.find((track) => track.id === id) ??
      null
    );
  }

  async resolveTrack(id: number): Promise<AudioTrack | null> {
    const known =
      this.findTrack(id) ?? this.state.homeRecent.tracks.find((track) => track.id === id) ?? null;
    if (known !== null) return known;
    try {
      return await this.dependencies.api.getAudioTrack(id);
    } catch {
      return null;
    }
  }

  async playTrack(track: AudioTrack): Promise<void> {
    if (!track.playable) return;
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

  seekBy(deltaSeconds: number): void {
    if (this.state.player.current === null) return;
    this.engine.seek(this.state.player.currentTime + deltaSeconds);
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
