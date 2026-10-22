<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import { t } from "../i18n.js";
  import { dragWindow } from "../runtime.js";
  import type { AppState, Route } from "../types.js";
  import Icon from "./Icon.svelte";

  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(state.settings.locale);
  let collapsed = $derived(state.ui.sidebarCollapsed);
  const routes = [
    { route: "home", labelKey: "nav.home", icon: "home" },
    { route: "explore", labelKey: "nav.explore", icon: "explore" },
    { route: "collections", labelKey: "nav.collections", icon: "library" },
    { route: "teachers", labelKey: "nav.teachers", icon: "teachers" },
    { route: "library", labelKey: "nav.library", icon: "bookmark" }
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
  class="fixed inset-y-0 left-0 z-20 flex w-[var(--sidebar-offset)] flex-col overflow-y-auto overscroll-contain border-r border-app-border bg-app-surface px-3 pt-[var(--sidebar-padding-top)] pb-[var(--sidebar-padding-bottom)] [scrollbar-gutter:stable]"
  aria-label={t(locale, "nav.primary")}
>
  <div
    use:dragWindow
    class="flex min-h-[66px] items-center {collapsed ? 'justify-center' : 'gap-3 px-1'}"
  >
    <img src="./logo.svg" alt="" class="size-10 shrink-0 rounded-control" />
    {#if !collapsed}
      <div class="min-w-0">
        <p class="truncate text-[15px] font-semibold tracking-tight">{t(locale, "app.name")}</p>
        <p class="truncate text-xs text-app-muted">{t(locale, "app.tagline")}</p>
      </div>
    {/if}
  </div>
  <nav class="mt-5 space-y-1" aria-label={t(locale, "nav.primaryNavigation")}>
    {#each routes as item (item.route)}
      <button
        type="button"
        onclick={() => navigate(item.route)}
        aria-current={active(item.route) ? "page" : undefined}
        aria-label={collapsed ? t(locale, item.labelKey) : undefined}
        title={collapsed ? t(locale, item.labelKey) : undefined}
        class="group flex min-h-11 w-full items-center {collapsed
          ? 'justify-center'
          : 'gap-3 px-3'} rounded-control text-left text-sm font-medium transition-[background-color,color] duration-150 {active(
          item.route
        )
          ? 'bg-app-primary text-app-primary-ink'
          : 'text-app-muted hover:bg-app-soft hover:text-app'}"
      >
        <span class="size-[19px] shrink-0"><Icon name={item.icon} /></span>
        {#if !collapsed}<span class="truncate">{t(locale, item.labelKey)}</span>{/if}
      </button>
    {/each}
  </nav>
  <div class="mt-auto space-y-1 border-t border-app-border pt-4">
    <button
      type="button"
      onclick={() => navigate("settings")}
      aria-current={active("settings") ? "page" : undefined}
      aria-label={collapsed ? t(locale, "nav.settings") : undefined}
      title={collapsed ? t(locale, "nav.settings") : undefined}
      class="flex min-h-11 w-full items-center {collapsed
        ? 'justify-center'
        : 'gap-3 px-3'} rounded-control text-sm font-medium transition-colors {active('settings')
        ? 'bg-app-primary text-app-primary-ink'
        : 'text-app-muted hover:bg-app-soft hover:text-app'}"
    >
      <span class="size-[19px] shrink-0"><Icon name="settings" /></span>
      {#if !collapsed}<span class="truncate">{t(locale, "nav.settings")}</span>{/if}
    </button>
    <button
      type="button"
      onclick={() => app.setSidebarCollapsed(!collapsed)}
      aria-label={collapsed ? t(locale, "nav.expandSidebar") : t(locale, "nav.collapseSidebar")}
      aria-expanded={!collapsed}
      class="flex min-h-11 w-full items-center {collapsed
        ? 'justify-center'
        : 'gap-3 px-3'} rounded-control text-xs font-medium text-app-muted transition-colors hover:bg-app-soft hover:text-app"
    >
      <span class="size-[18px] shrink-0"
        ><Icon name={collapsed ? "chevron-right" : "chevron-left"} /></span
      >
      {#if !collapsed}<span>{t(locale, "nav.collapse")}</span>{/if}
    </button>
  </div>
</aside>
