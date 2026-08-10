import { mount } from "svelte";
import { writable } from "svelte/store";
import App from "./App.svelte";
import { CatalogueApi } from "./api.js";
import { DhammaApp } from "./app.js";
import "./index.css";
import { selectInvoke } from "./runtime.js";
import { createInitialState } from "./store.js";
import type { InvokeFn } from "./types.js";

declare global {
  interface Window {
    __TAURI__?: { core?: { invoke?: InvokeFn } };
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

  stateStore.set(app.state);
  mount(App, { target: root, props: { app, stateStore } });
  await app.start();
  return app;
}
