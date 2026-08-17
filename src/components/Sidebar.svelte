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
  let collapsed = $derived(state.ui.sidebarCollapsed);
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
  function toggle(): void {
    app.setSidebarCollapsed(!collapsed);
  }
</script>

<aside
  class="fixed inset-y-0 left-0 z-20 flex {collapsed
    ? 'w-[72px] px-3'
    : 'w-64 px-5 max-[1040px]:w-56 max-[1040px]:px-4'} flex-col border-r border-app-border bg-app-surface py-6 transition-[width,padding] duration-200"
  aria-label="Primary"
>
  <div class="flex items-center {collapsed ? 'justify-center' : 'gap-3 px-2'}">
    <img src="./logo.svg" alt="" class="size-11 rounded-control" />
    {#if !collapsed}<div>
        <p class="text-lg font-bold tracking-tight">Dhamma Echo</p>
        <p class="text-xs text-app-muted">Listen with intention</p>
      </div>{/if}
  </div>
  <nav class="mt-9 space-y-2 max-[1040px]:mt-8" aria-label="Primary navigation">
    {#each routes as item (item.route)}<button
        class="group flex h-12 min-h-12 w-full items-center {collapsed
          ? 'justify-center'
          : 'gap-3 px-4'} rounded-control py-0 text-left text-sm font-semibold leading-5 transition-[background-color,color,box-shadow] duration-150 {active(
          item.route
        )
          ? 'bg-app-primary text-white shadow-sm'
          : 'text-app-muted hover:bg-app-soft hover:text-app'}"
        type="button"
        onclick={() => navigate(item.route)}
        aria-current={active(item.route) ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        ><span
          class="flex size-5 shrink-0 -translate-y-px items-center justify-center [&_svg]:block [&_svg]:size-full"
          ><Icon name={item.icon} /></span
        >{#if !collapsed}<span>{item.label}</span>{/if}</button
      >{/each}
  </nav>
  <div class="mt-auto space-y-3">
    {#if !collapsed}<div
        class="rounded-card border border-app-border/70 bg-app-soft p-4 max-[1040px]:p-3.5"
      >
        <div
          class="mb-3 flex size-9 items-center justify-center rounded-full bg-app-secondary/15 text-app-secondary"
        >
          <span class="size-5"><Icon name="leaf" /></span>
        </div>
        <p class="text-sm font-bold">A quiet library</p>
        <p class="mt-1 text-xs leading-5 text-app-muted">
          Your catalogue remains on this device. Audio streams only when you press play.
        </p>
      </div>{/if}
    <button
      class="flex h-10 w-full items-center {collapsed
        ? 'justify-center'
        : 'gap-2 px-4'} rounded-control text-xs font-bold text-app-muted transition-[background-color,color] duration-150 hover:bg-app-soft hover:text-app"
      type="button"
      onclick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      ><span class="flex size-4 -translate-y-px items-center justify-center [&_svg]:size-full"
        ><Icon name={collapsed ? "chevron-right" : "chevron-left"} /></span
      >{#if !collapsed}<span>Collapse</span>{/if}</button
    >
  </div>
</aside>
