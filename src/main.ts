import { CatalogueApi } from "./api.js";
import { DhammaApp } from "./app.js";
import { createMockInvoke } from "./mock-data.js";
import type { AppState, InvokeFn, Route } from "./types.js";
import { renderApp } from "./view.js";

declare global {
  interface Window {
    __TAURI__?: { core?: { invoke?: InvokeFn } };
  }
}

function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isRoute(value: string | undefined): value is Route {
  return ["home", "explore", "collections", "teachers", "library", "settings"].includes(
    value ?? ""
  );
}

function focusSearchInput(formName: string): void {
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLInputElement>(`form[data-form="${formName}"] input[name="query"]`)
      ?.focus();
  });
}

export function selectInvoke(candidate: InvokeFn | undefined): InvokeFn {
  return candidate ?? createMockInvoke();
}

export function renderPreservingScroll(
  root: HTMLElement,
  state: AppState,
  preserveScroll = true
): void {
  const content = preserveScroll ? root.querySelector<HTMLElement>(".app-content") : null;
  const horizontalScroll = preserveScroll
    ? Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-preserve]")).map((element) => ({
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      }))
    : [];
  const scrollTop = content?.scrollTop ?? 0;
  const scrollLeft = content?.scrollLeft ?? 0;
  root.innerHTML = renderApp(state);
  const nextContent = preserveScroll
    ? root.querySelector<HTMLElement>(".app-content")
    : null;
  if (nextContent !== null) {
    nextContent.scrollTop = scrollTop;
    nextContent.scrollLeft = scrollLeft;
  }
  Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-preserve]")).forEach(
    (element, index) => {
      const position = horizontalScroll[index];
      if (position === undefined) return;
      element.scrollLeft = position.scrollLeft;
      element.scrollTop = position.scrollTop;
    }
  );
}

export async function bootstrap(): Promise<DhammaApp> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Missing #app root element.");

  const audio = new Audio();
  audio.preload = "metadata";
  const invoke = selectInvoke(window.__TAURI__?.core?.invoke);
  let previousRoute: Route | null = null;
  const app = new DhammaApp({
    api: new CatalogueApi(invoke),
    storage: window.localStorage,
    audio,
    now: () => Date.now(),
    render: (state) => {
      renderPreservingScroll(root, state, previousRoute === state.route);
      previousRoute = state.route;
    }
  });

  root.addEventListener("click", (event) => {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;
    if (target === null) return;
    const action = target.dataset.action;
    const id = parseId(target.dataset.id);
    const value = target.dataset.value;

    if (action === "navigate" && isRoute(value)) {
      app.dispatch({ type: "navigate", route: value });
      if (value === "home") void app.loadRecent();
      if (value === "collections") void app.searchCollections();
    }
    if (action === "select-teacher" && id !== null) {
      const returnRoute = app.state.route === "home" ? "home" : "teachers";
      void app.openTeacher(id, returnRoute);
    }
    if (action === "open-collection" && id !== null) {
      const returnRoute = app.state.route === "teacher-detail" ? "teacher-detail" : "collections";
      void app.openCollection(id, returnRoute);
    }
    if (action === "back-to-list") app.dispatch({ type: "return-to-list" });
    if (action === "filter-teacher" && id !== null) {
      app.dispatch({ type: "set-teacher", teacherId: id });
      app.dispatch({ type: "navigate", route: "explore" });
      void app.search();
    }
    if (action === "filter-category") {
      app.dispatch({ type: "set-category", categoryId: id });
      void app.search();
    }
    if (action === "clear-teacher") {
      app.dispatch({ type: "set-teacher", teacherId: null });
      void app.search();
    }
    if (action === "clear-category") {
      app.dispatch({ type: "clear-category" });
      void app.search();
    }
    if (action === "clear-collection") {
      app.dispatch({ type: "clear-collection" });
      void app.search();
    }
    if (action === "clear-search-query") {
      app.dispatch({ type: "set-query", query: "" });
      void app.search().finally(() => focusSearchInput("search"));
    }
    if (action === "clear-teacher-search") {
      void app.searchTeachers("").finally(() => focusSearchInput("teacher-search"));
    }
    if (action === "clear-collection-search") {
      app.dispatch({ type: "set-collection-query", query: "" });
      void app.searchCollections().finally(() => focusSearchInput("collection-search"));
    }
    if (action === "play-track" && id !== null) {
      if (app.state.player.current?.id === id) void app.togglePlayback();
      else {
        void app.resolveTrack(id).then((track) => {
          if (track !== null) return app.playTrack(track);
        });
      }
    }
    if (action === "toggle-favorite" && id !== null) app.dispatch({ type: "toggle-favorite", id });
    if (action === "enqueue" && id !== null) {
      const track = app.findTrack(id);
      if (track !== null) app.dispatch({ type: "enqueue", track });
    }
    if (action === "remove-queue" && id !== null) app.dispatch({ type: "remove-queue", id });
    if (action === "clear-queue") app.dispatch({ type: "clear-queue" });
    if (action === "toggle-queue") app.dispatch({ type: "toggle-queue" });
    if (action === "toggle-play") void app.togglePlayback();
    if (action === "seek-backward") app.seekBy(-15);
    if (action === "seek-forward") app.seekBy(15);
    if (action === "retry-playback") void app.retryPlayback();
    if (action === "play-next") void app.playNext();
    if (action === "retry-summary") void app.loadSummary();
    if (action === "retry-teachers") void app.loadTeachers();
    if (action === "retry-search") void app.search();
    if (action === "retry-collections") void app.searchCollections();
    if (action === "retry-collection" && app.state.selectedCollectionId !== null)
      void app.openCollection(
        app.state.selectedCollectionId,
        app.state.navigationContext?.returnRoute ?? "collections"
      );
    if (action === "retry-teacher-detail" && app.state.selectedTeacherId !== null)
      void app.openTeacher(
        app.state.selectedTeacherId,
        app.state.navigationContext?.returnRoute ?? "teachers"
      );
    if (action === "load-more-search") void app.loadMoreSearchResults();
    if (action === "load-more-collections") void app.loadMoreCollections();
    if (action === "load-more-teacher-talks") {
      void app.loadMoreTeacherTalks();
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (
      form.dataset.form !== "search" &&
      form.dataset.form !== "teacher-search" &&
      form.dataset.form !== "collection-search"
    )
      return;
    event.preventDefault();
    const values = new FormData(form);
    const text = (key: string, fallback: string): string => {
      const value = values.get(key);
      return typeof value === "string" ? value : fallback;
    };
    if (form.dataset.form === "teacher-search") {
      void app.searchTeachers(text("query", ""));
      return;
    }
    if (form.dataset.form === "collection-search") {
      app.dispatch({ type: "set-collection-query", query: text("query", "") });
      const teacherId = parseId(text("teacherId", ""));
      app.dispatch({ type: "set-collection-teacher", teacherId });
      void app.searchCollections();
      return;
    }
    app.dispatch({ type: "set-query", query: text("query", "") });
    app.dispatch({
      type: "set-language",
      language: text("language", "all") as "all" | "myanmar" | "english"
    });
    app.dispatch({
      type: "set-format",
      format: text("format", "all") as "all" | "mp3" | "wma"
    });
    void app.search();
  });

  root.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action === "seek") app.seek(Number(target.value));
    if (target.dataset.setting === "volume") app.setVolume(Number(target.value));
  });

  root.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.dataset.setting === "rate") app.setRate(Number(target.value));
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )
      return;
    if (event.code === "Space") {
      event.preventDefault();
      void app.togglePlayback();
    }
    if (event.code === "ArrowLeft") app.seek(app.state.player.currentTime - 10);
    if (event.code === "ArrowRight") app.seek(app.state.player.currentTime + 10);
    if (event.key.toLowerCase() === "n") void app.playNext();
  });

  window.addEventListener(
    "beforeunload",
    () => {
      app.destroy();
    },
    { once: true }
  );
  await app.start();
  return app;
}
