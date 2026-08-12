<script lang="ts">
  import type { Readable } from "svelte/store";
  import type { DhammaApp } from "./app.js";
  import Header from "./components/Header.svelte";
  import Player from "./components/Player.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import { isEditableTarget } from "./runtime.js";
  import type { AppState } from "./types.js";
  import CollectionDetailView from "./views/CollectionDetailView.svelte";
  import CollectionsView from "./views/CollectionsView.svelte";
  import ExploreView from "./views/ExploreView.svelte";
  import HomeView from "./views/HomeView.svelte";
  import LibraryView from "./views/LibraryView.svelte";
  import SettingsView from "./views/SettingsView.svelte";
  import TeacherDetailView from "./views/TeacherDetailView.svelte";
  import TeachersView from "./views/TeachersView.svelte";

  let { app, stateStore }: { app: DhammaApp; stateStore: Readable<AppState> } = $props();
  let state = $derived($stateStore);

  function keydown(event: KeyboardEvent): void {
    if (isEditableTarget(event.target)) return;
    if (event.code === "Space") {
      event.preventDefault();
      void app.togglePlayback();
    }
    if (event.code === "ArrowLeft") {
      event.preventDefault();
      app.seekBy(-10);
    }
    if (event.code === "ArrowRight") {
      event.preventDefault();
      app.seekBy(10);
    }
    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      void app.playNext();
    }
  }
</script>

<svelte:window onkeydown={keydown} onbeforeunload={() => app.destroy()} />
<div
  class="h-screen min-h-screen overflow-hidden bg-app-bg text-app"
  data-theme={state.settings.theme}
>
  <Sidebar {state} {app} />
  <div
    class="ml-64 h-full overflow-y-auto overscroll-none [scrollbar-gutter:stable] {state.player
      .current === null
      ? 'pb-8'
      : 'pb-40'}"
  >
    <Header {state} />
    <main class="px-10 py-4">
      {#if state.route === "home"}<HomeView {state} {app} />
      {:else if state.route === "explore"}<ExploreView {state} {app} />
      {:else if state.route === "collections"}<CollectionsView {state} {app} />
      {:else if state.route === "collection-detail"}<CollectionDetailView {state} {app} />
      {:else if state.route === "teachers"}<TeachersView {state} {app} />
      {:else if state.route === "teacher-detail"}<TeacherDetailView {state} {app} />
      {:else if state.route === "library"}<LibraryView {state} {app} />
      {:else}<SettingsView {state} {app} />{/if}
    </main>
  </div>
  <Player {state} {app} />
</div>
