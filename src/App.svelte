<script lang="ts">
  import type { Readable } from "svelte/store";
  import type { DhammaApp } from "./app.js";
  import Header from "./components/Header.svelte";
  import KeyboardCheatsheet from "./components/KeyboardCheatsheet.svelte";
  import Player from "./components/Player.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import VideoPlayer from "./components/VideoPlayer.svelte";
  import { isEditableTarget } from "./runtime.js";
  import { applyTheme, watchSystemTheme } from "./theme.js";
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
  let appState = $derived($stateStore);
  let helpOpen = $state(false);

  $effect(() => {
    const theme = appState.settings.theme;
    applyTheme(theme);
    return watchSystemTheme(theme, () => {});
  });

  function keydown(event: KeyboardEvent): void {
    if (isEditableTarget(event.target)) return;
    if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
      event.preventDefault();
      helpOpen = !helpOpen;
      return;
    }
    if (event.key === "Escape" && helpOpen) {
      helpOpen = false;
      return;
    }
    if (helpOpen) return;
    if (
      event.key === "Escape" &&
      globalThis.document.fullscreenElement === null &&
      appState.player.current?.mediaType === "video"
    ) {
      event.preventDefault();
      app.closeVideoPlayer();
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      void app.togglePlayback();
    }
    if (event.code === "ArrowLeft" && !event.shiftKey) {
      event.preventDefault();
      app.seekBy(-15);
    }
    if (event.code === "ArrowRight" && !event.shiftKey) {
      event.preventDefault();
      app.seekBy(15);
    }
    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      void app.playNext();
    }
  }

  let showAudioFooter = $derived(
    appState.player.current !== null && appState.player.current.mediaType !== "video"
  );
  let videoPlayerOpen = $derived(appState.player.current?.mediaType === "video");
  let bottomPadding = $derived(
    videoPlayerOpen
      ? "pb-[38rem] max-[1040px]:pb-[34rem]"
      : showAudioFooter
        ? "pb-28 max-[1040px]:pb-40"
        : "pb-8"
  );
</script>

<svelte:window onkeydown={keydown} onbeforeunload={() => app.destroy()} />
<div
  class="h-screen min-h-screen overflow-hidden bg-app-bg text-app"
  data-layout-shell
  data-sidebar-collapsed={appState.ui.sidebarCollapsed ? "true" : undefined}
>
  <div
    class="app-content-shell"
    inert={videoPlayerOpen}
    aria-hidden={videoPlayerOpen ? "true" : undefined}
  >
    <Sidebar state={appState} {app} />
    <div
      class="ml-[var(--sidebar-offset)] h-full overflow-y-auto overscroll-none [scrollbar-gutter:stable] transition-[margin] duration-200 {bottomPadding}"
    >
      <Header state={appState} />
      <main class="@container mx-auto max-w-[1520px] px-10 py-4 max-[1040px]:px-6">
        {#if appState.route === "home"}<HomeView state={appState} {app} />
        {:else if appState.route === "explore"}<ExploreView state={appState} {app} />
        {:else if appState.route === "collections"}<CollectionsView state={appState} {app} />
        {:else if appState.route === "collection-detail"}<CollectionDetailView
            state={appState}
            {app}
          />
        {:else if appState.route === "teachers"}<TeachersView state={appState} {app} />
        {:else if appState.route === "teacher-detail"}<TeacherDetailView state={appState} {app} />
        {:else if appState.route === "library"}<LibraryView state={appState} {app} />
        {:else}<SettingsView state={appState} {app} />{/if}
      </main>
    </div>
    {#if showAudioFooter}<Player state={appState} {app} />{/if}
  </div>
  <VideoPlayer state={appState} {app} />
  {#if helpOpen}<KeyboardCheatsheet onclose={() => (helpOpen = false)} />{/if}
</div>
