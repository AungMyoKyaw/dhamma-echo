<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState, Route } from "../types.js";
  import Icon from "./Icon.svelte";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  const routes = [
    { route: "home", label: "Home", icon: "home" },
    { route: "explore", label: "Explore", icon: "explore" },
    { route: "collections", label: "Collections", icon: "library" },
    { route: "teachers", label: "Teachers", icon: "teachers" },
    { route: "library", label: "My library", icon: "library" },
    { route: "settings", label: "Settings", icon: "settings" }
  ] as const;
  function active(route: Route): boolean {
    return (
      state.route === route ||
      (route === "collections" && state.route === "collection-detail") ||
      (route === "teachers" && state.route === "teacher-detail")
    );
  }
  function navigate(route: Route): void {
    app.dispatch({ type: "navigate", route });
    if (route === "home") void app.loadRecent();
    if (route === "collections") void app.searchCollections();
  }
</script>

<aside
  class="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-app-border bg-app-surface px-5 py-6"
>
  <div class="flex items-center gap-3 px-2">
    <img src="./logo.svg" alt="" class="size-11 rounded-2xl" />
    <div>
      <p class="text-lg font-bold tracking-tight">Dhamma Echo</p>
      <p class="text-xs text-app-muted">Listen with intention</p>
    </div>
  </div>
  <nav class="mt-10 space-y-2" aria-label="Primary navigation">
    {#each routes as item (item.route)}<button
        class="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition {active(
          item.route
        )
          ? 'bg-app-primary text-white shadow-sm'
          : 'text-app-muted hover:bg-app-soft hover:text-app'}"
        type="button"
        onclick={() => navigate(item.route)}
        aria-current={active(item.route) ? "page" : undefined}
        ><span class="size-5"><Icon name={item.icon} /></span><span>{item.label}</span></button
      >{/each}
  </nav>
  <div class="mt-auto rounded-3xl bg-app-soft p-4">
    <div
      class="mb-3 flex size-9 items-center justify-center rounded-full bg-app-secondary/15 text-app-secondary"
    >
      <span class="size-5"><Icon name="leaf" /></span>
    </div>
    <p class="text-sm font-bold">A quiet library</p>
    <p class="mt-1 text-xs leading-5 text-app-muted">
      Your catalogue remains on this device. Audio streams only when you press play.
    </p>
  </div>
</aside>
