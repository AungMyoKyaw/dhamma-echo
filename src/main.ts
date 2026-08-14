import { mount } from "svelte";
import { writable } from "svelte/store";
import App from "./App.svelte";
import { CatalogueApi } from "./api.js";
import { DhammaApp } from "./app.js";
import "./index.css";
import { selectInvoke } from "./runtime.js";
import { createInitialState } from "./store.js";
import { applyTheme } from "./theme.js";
import type { InvokeFn } from "./types.js";

declare global {
  interface Window {
    __TAURI__?: {
      core?: { invoke?: InvokeFn; convertFileSrc?: (path: string) => string };
      event?: {
        listen?: (name: string, handler: (event: { payload: unknown }) => void) => Promise<unknown>;
      };
    };
  }
}

export async function bootstrap(): Promise<DhammaApp> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Missing #app root element.");

  const audio = new Audio();
  audio.preload = "metadata";
  const stateStore = writable(createInitialState());
  const app = new DhammaApp({
    api: new CatalogueApi(selectInvoke(window.__TAURI__?.core?.invoke)),
    storage: window.localStorage,
    audio,
    now: () => Date.now(),
    render: (state) => stateStore.set(state)
  });

  applyTheme(app.state.settings.theme);

  await window.__TAURI__?.event?.listen?.("download-progress", (event) => {
    if (typeof event.payload !== "object" || event.payload === null) return;
    const payload = event.payload as Record<string, unknown>;
    if (typeof payload.id !== "number" || typeof payload.downloaded !== "number") return;
    app.setDownloadProgress(
      payload.id,
      payload.downloaded,
      typeof payload.total === "number" ? payload.total : null
    );
  });

  stateStore.set(app.state);
  mount(App, { target: root, props: { app, stateStore } });
  await app.start();
  return app;
}
