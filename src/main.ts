import { CatalogueApi } from "./api.js";
import { DhammaApp } from "./app.js";
import { createMockInvoke } from "./mock-data.js";
import type { InvokeFn, Route, Theme } from "./types.js";
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
  return ["home", "explore", "teachers", "library", "settings"].includes(value ?? "");
}

function nextTheme(theme: Theme): Theme {
  if (theme === "system") return "light";
  if (theme === "light") return "dark";
  return "system";
}

export function applyTheme(element: HTMLElement, theme: Theme, systemDark: boolean): void {
  element.classList.toggle("dark", theme === "dark" || (theme === "system" && systemDark));
}

export function selectInvoke(candidate: InvokeFn | undefined): InvokeFn {
  return candidate ?? createMockInvoke();
}

export async function bootstrap(): Promise<DhammaApp> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Missing #app root element.");

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const audio = new Audio();
  audio.preload = "metadata";
  const invoke = selectInvoke(window.__TAURI__?.core?.invoke);
  const app = new DhammaApp({
    api: new CatalogueApi(invoke),
    storage: window.localStorage,
    audio,
    now: () => Date.now(),
    render: (state) => {
      root.innerHTML = renderApp(state);
    },
    applyTheme: (theme) => {
      applyTheme(document.documentElement, theme, media.matches);
    }
  });

  root.addEventListener("click", (event) => {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;
    if (target === null) return;
    const action = target.dataset.action;
    const id = parseId(target.dataset.id);
    const value = target.dataset.value;

    if (action === "navigate" && isRoute(value)) app.dispatch({ type: "navigate", route: value });
    if (action === "cycle-theme")
      app.dispatch({ type: "set-theme", theme: nextTheme(app.state.settings.theme) });
    if (action === "select-teacher" && id !== null) {
      app.dispatch({ type: "set-teacher", teacherId: id });
      app.dispatch({ type: "navigate", route: "explore" });
      void app.search();
    }
    if (action === "clear-teacher") {
      app.dispatch({ type: "set-teacher", teacherId: null });
      void app.search();
    }
    if (action === "play-track" && id !== null) {
      const track = app.findTrack(id);
      if (track !== null) {
        if (app.state.player.current?.id === id) void app.togglePlayback();
        else void app.playTrack(track);
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
    if (action === "previous-page") {
      app.dispatch({
        type: "set-offset",
        offset: app.state.search.offset - app.state.search.limit
      });
      void app.search();
    }
    if (action === "next-page") {
      app.dispatch({
        type: "set-offset",
        offset: app.state.search.offset + app.state.search.limit
      });
      void app.search();
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.form !== "search" && form.dataset.form !== "teacher-search") return;
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
    if (target.dataset.setting === "theme")
      app.dispatch({ type: "set-theme", theme: target.value as Theme });
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

  media.addEventListener("change", () => {
    applyTheme(document.documentElement, app.state.settings.theme, media.matches);
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
