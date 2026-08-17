import type { CatalogueApi } from "./api.js";
import {
  loadLibrary,
  loadSettings,
  loadUi,
  saveLibrary,
  saveSettings,
  saveUi
} from "./persistence.js";
import { MediaEngine, type MediaLike } from "./player.js";
import { localFileUrl } from "./runtime.js";
import { createInitialState, reduce, type AppAction } from "./store.js";
import type {
  AppState,
  AudioSearchRequest,
  AudioTrack,
  PlayerEvent,
  Route,
  StorageLike
} from "./types.js";

interface CatalogueClient {
  getSummary: CatalogueApi["getSummary"];
  listFeaturedTeachers: CatalogueApi["listFeaturedTeachers"];
  searchTeachers: CatalogueApi["searchTeachers"];
  searchAudio: CatalogueApi["searchAudio"];
  getAudioTrack: CatalogueApi["getAudioTrack"];
  downloadAudio: CatalogueApi["downloadAudio"];
  listContentCategories: CatalogueApi["listContentCategories"];
  searchCollections: CatalogueApi["searchCollections"];
  getCollection: CatalogueApi["getCollection"];
  getTeacher: CatalogueApi["getTeacher"];
}

interface AppDependencies {
  api: CatalogueClient;
  storage: StorageLike;
  audio: MediaLike;
  render: (state: AppState, action: AppAction) => void;
  now: () => number;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "The catalogue is unavailable.";
}

const libraryActions = new Set<AppAction["type"]>([
  "hydrate",
  "toggle-favorite",
  "downloaded",
  "record-history",
  "save-resume"
]);
const settingsActions = new Set<AppAction["type"]>([
  "hydrate",
  "set-rate",
  "set-browse-limit",
  "set-theme"
]);
const uiActions = new Set<AppAction["type"]>(["hydrate", "set-sidebar-collapsed"]);

export class DhammaApp {
  state = createInitialState();
  private engine: MediaEngine;
  private engineMediaType: "audio" | "video" | null = null;
  private engineElement: MediaLike | null = null;
  private videoElement: MediaLike | null = null;

  constructor(private readonly dependencies: AppDependencies) {
    this.engine = new MediaEngine(dependencies.audio, (event) => {
      this.handlePlayerEvent(event);
    });
  }

  /**
   * Registers the live `<video>` element owned by `VideoPlayer`. The engine
   * uses this element when the active track is a video. Called from the
   * component's mount/unmount lifecycle. If the active track is already a
   * video and the engine was created before the element was available, the
   * engine is rebuilt against the freshly registered element and the track
   * is reloaded so playback resumes on the visible video.
   */
  registerVideoElement(element: MediaLike | null): void {
    const changed = this.videoElement !== element;
    const current = this.state.player.current;
    if (element === null && changed && current !== null && current.mediaType === "video") {
      this.engine.stop();
    }
    this.videoElement = element;
    if (changed && element !== null && current !== null && current.mediaType === "video") {
      void this.reloadCurrentTrack();
    }
  }

  private async reloadCurrentTrack(): Promise<void> {
    const track = this.state.player.current;
    if (track === null) return;
    const engine = this.ensureEngineFor(track.mediaType);
    engine.setRate(this.state.settings.playbackRate);
    await engine.setTrack(track, this.state.player.currentTime, this.localUrlFor(track.id));
  }

  private ensureEngineFor(mediaType: "audio" | "video"): MediaEngine {
    const desiredElement =
      mediaType === "video"
        ? (this.videoElement ?? this.dependencies.audio)
        : this.dependencies.audio;
    if (this.engineMediaType === mediaType && this.engineElement === desiredElement) {
      return this.engine;
    }
    this.engine.destroy();
    this.engine = new MediaEngine(desiredElement, (event) => {
      this.handlePlayerEvent(event);
    });
    this.engineMediaType = mediaType;
    this.engineElement = desiredElement;
    // Pause and clear the audio stream so the inactive element does not
    // keep streaming behind the video view.
    this.dependencies.audio.pause();
    this.dependencies.audio.removeAttribute("src");
    this.dependencies.audio.load();
    return this.engine;
  }

  async start(): Promise<void> {
    this.dispatch({
      type: "hydrate",
      library: loadLibrary(this.dependencies.storage),
      settings: loadSettings(this.dependencies.storage),
      ui: loadUi(this.dependencies.storage)
    });
    this.engine.setRate(this.state.settings.playbackRate);
    await Promise.all([
      this.loadSummary(),
      this.loadTeachers(),
      this.loadCategories(),
      this.search(),
      this.loadRecent(),
      this.loadFavoriteTracks(),
      this.loadDownloadedTracks()
    ]);
  }

  dispatch(action: AppAction): void {
    this.state = reduce(this.state, action);
    if (libraryActions.has(action.type)) saveLibrary(this.dependencies.storage, this.state.library);
    if (settingsActions.has(action.type))
      saveSettings(this.dependencies.storage, this.state.settings);
    if (uiActions.has(action.type)) saveUi(this.dependencies.storage, this.state.ui);
    this.dependencies.render(this.state, action);
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
        categories: await this.dependencies.api.listContentCategories()
      });
    } catch (error) {
      this.dispatch({ type: "categories-failed", message: messageFrom(error) });
    }
  }

  async searchCollections(): Promise<void> {
    this.dispatch({ type: "collections-started", mode: "initial" });
    try {
      this.dispatch({
        type: "collections-loaded",
        mode: "initial",
        page: await this.dependencies.api.searchCollections({
          ...this.state.collectionSearch,
          offset: 0
        })
      });
    } catch (error) {
      this.dispatch({ type: "collections-failed", mode: "initial", message: messageFrom(error) });
    }
  }

  async loadMoreCollections(): Promise<void> {
    const collections = this.state.collections;
    if (
      collections.loadingMore ||
      collections.exhausted ||
      collections.page.items.length >= collections.page.total
    )
      return;
    const offset = collections.page.items.length;
    const remaining = collections.page.total - offset;
    const limit = Math.min(collections.nextLoadSize, remaining);
    this.dispatch({ type: "collections-started", mode: "append" });
    try {
      this.dispatch({
        type: "collections-loaded",
        mode: "append",
        page: await this.dependencies.api.searchCollections({
          ...this.state.collectionSearch,
          limit,
          offset
        })
      });
    } catch (error) {
      this.dispatch({
        type: "collections-failed",
        mode: "append",
        message: messageFrom(error)
      });
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
        limit: this.state.settings.browseLimit,
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
    const remaining = teacherTalks.page.total - offset;
    const limit = Math.min(teacherTalks.nextLoadSize, remaining);
    this.dispatch({ type: "teacher-talks-started", mode: "append" });
    await this.dependencies.api
      .searchAudio({
        query: "",
        language: null,
        format: null,
        teacherId,
        categoryId: null,
        collectionId: null,
        limit,
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

  setBrowseLimit(limit: 25 | 50 | 100): void {
    this.dispatch({ type: "set-browse-limit", limit });
  }

  setTheme(theme: "light" | "dark" | "system"): void {
    this.dispatch({ type: "set-theme", theme });
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.dispatch({ type: "set-sidebar-collapsed", collapsed });
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

  async loadFavoriteTracks(): Promise<void> {
    const tracks = await this.loadTracksById(this.state.library.favorites);
    this.dispatch({ type: "favorite-tracks-loaded", tracks });
  }

  async loadDownloadedTracks(): Promise<void> {
    const tracks = await this.loadTracksById(
      Object.keys(this.state.library.downloads ?? {}).map(Number)
    );
    this.dispatch({ type: "downloaded-tracks-loaded", tracks });
  }

  private async loadTracksById(ids: number[]): Promise<AudioTrack[]> {
    const tracks = await Promise.all(
      ids.map(async (id) => {
        try {
          return await this.dependencies.api.getAudioTrack(id);
        } catch {
          return null;
        }
      })
    );
    return tracks.filter((track): track is AudioTrack => track !== null);
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
    this.dispatch({ type: "search-started", mode: "initial" });
    const request: AudioSearchRequest = {
      query: this.state.search.query,
      language: this.state.search.language === "all" ? null : this.state.search.language,
      format: this.state.search.format === "all" ? null : this.state.search.format,
      teacherId: this.state.search.teacherId,
      categoryId: this.state.search.categoryId,
      collectionId: this.state.search.collectionId,
      limit: this.state.search.limit,
      offset: 0
    };
    try {
      this.dispatch({
        type: "search-loaded",
        mode: "initial",
        page: await this.dependencies.api.searchAudio(request)
      });
    } catch (error) {
      this.dispatch({ type: "search-failed", mode: "initial", message: messageFrom(error) });
    }
  }

  async loadMoreSearchResults(): Promise<void> {
    const catalogue = this.state.catalogue;
    if (
      catalogue.loadingMore ||
      catalogue.exhausted ||
      catalogue.page.items.length >= catalogue.page.total
    )
      return;
    const offset = catalogue.page.items.length;
    const remaining = catalogue.page.total - offset;
    const limit = Math.min(catalogue.nextLoadSize, remaining);
    this.dispatch({ type: "search-started", mode: "append" });
    const request: AudioSearchRequest = {
      query: this.state.search.query,
      language: this.state.search.language === "all" ? null : this.state.search.language,
      format: this.state.search.format === "all" ? null : this.state.search.format,
      teacherId: this.state.search.teacherId,
      categoryId: this.state.search.categoryId,
      collectionId: this.state.search.collectionId,
      limit,
      offset
    };
    try {
      this.dispatch({
        type: "search-loaded",
        mode: "append",
        page: await this.dependencies.api.searchAudio(request)
      });
    } catch (error) {
      this.dispatch({ type: "search-failed", mode: "append", message: messageFrom(error) });
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
    const engine = this.ensureEngineFor(track.mediaType);
    engine.setRate(this.state.settings.playbackRate);
    await engine.setTrack(
      track,
      this.state.library.resume[String(track.id)] ?? 0,
      this.localUrlFor(track.id)
    );
  }

  async downloadTrack(track: AudioTrack): Promise<void> {
    if (!track.playable || this.state.library.downloads?.[String(track.id)] !== undefined) return;
    try {
      const path = await this.dependencies.api.downloadAudio(track.id, track.url);
      this.dispatch({ type: "downloaded", id: track.id, path });
    } catch (error) {
      this.dispatch({ type: "download-failed", id: track.id });
      throw error;
    }
  }

  setDownloadProgress(id: number, downloaded: number, total: number | null): void {
    this.dispatch({ type: "download-progress", id, progress: { downloaded, total } });
  }

  private localUrlFor(id: number): string | undefined {
    const path = this.state.library.downloads?.[String(id)];
    return path === undefined ? undefined : localFileUrl(path);
  }

  async togglePlayback(): Promise<void> {
    if (this.state.player.current === null) return;
    await this.engine.toggle();
  }

  closeVideoPlayer(): void {
    const track = this.state.player.current;
    if (track === null || track.mediaType !== "video") return;
    this.persistCurrentResume(true);
    this.engine.stop();
    this.dispatch({ type: "close-video-player" });
  }

  async retryPlayback(): Promise<void> {
    const track = this.state.player.current;
    if (track === null) return;
    this.engine.setRate(this.state.settings.playbackRate);
    const resumeAt = Math.max(
      this.state.player.currentTime,
      this.state.library.resume[String(track.id)] ?? 0
    );
    await this.engine.setTrack(track, resumeAt, this.localUrlFor(track.id));
  }

  seek(value: number): void {
    if (this.state.player.current === null) return;
    this.engine.seek(value);
  }

  seekBy(deltaSeconds: number): void {
    if (this.state.player.current === null) return;
    this.engine.seek(this.state.player.currentTime + deltaSeconds);
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
