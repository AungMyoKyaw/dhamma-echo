<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import { countLabel, t } from "../i18n.js";
  import type { AppState, Route } from "../types.js";
  import { downloadedTracks, favoriteTracks } from "../ui.js";
  import { formatLocaleNumber } from "../utils.js";

  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(appState.settings.locale);
  let favorites = $derived(favoriteTracks(appState));
  let downloads = $derived(downloadedTracks(appState));
  let hasDownloads = $derived(Object.keys(appState.library.downloads ?? {}).length > 0);
  let favoriteOnly = $derived(
    favorites.filter((track) => appState.library.downloads?.[String(track.id)] === undefined)
  );
  let unresolvedFavorites = $derived(appState.library.favorites.length - favorites.length);
  let historyTracks = $derived(appState.homeRecent.tracks);
  type Tab = "downloads" | "favorites" | "history";
  let activeTab: Tab = $state("downloads");
  function setTab(tab: Tab): void {
    activeTab = tab;
  }
  function explore(route: Route): void {
    app.dispatch({ type: "navigate", route });
  }
  const tabs = [
    { id: "downloads", labelKey: "library.downloads" },
    { id: "favorites", labelKey: "library.favorites" },
    { id: "history", labelKey: "library.history" }
  ] as const;
  function tabCount(tab: Tab): number {
    if (tab === "downloads") return downloads.length;
    if (tab === "favorites") return appState.library.favorites.length;
    return historyTracks.length;
  }
</script>

{#if appState.library.favorites.length === 0 && !hasDownloads}
  <AsyncState
    {locale}
    kind="empty"
    title={t(locale, "library.empty.title")}
    detail={t(locale, "library.empty.detail")}
    actionLabel={t(locale, "library.empty.action")}
    onaction={() => explore("explore")}
  />
{:else}
  <section class="space-y-6">
    <div class="flex flex-wrap gap-2" role="tablist" aria-label={t(locale, "library.tabs")}>
      {#each tabs as tab (tab.id)}
        <button
          role="tab"
          aria-selected={activeTab === tab.id}
          class="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm leading-normal font-bold transition-[background-color,color,border-color] duration-150 {activeTab ===
          tab.id
            ? 'bg-app-primary text-app-primary-ink'
            : 'bg-app-soft text-app-muted hover:text-app'}"
          type="button"
          onclick={() => setTab(tab.id)}
          >{t(locale, tab.labelKey)}
          {#if tabCount(tab.id) > 0}<span
              class="inline-flex min-h-[20px] items-center justify-center rounded-full bg-app-primary/15 px-2 align-middle text-[11px] leading-normal font-bold text-app-primary"
              >{formatLocaleNumber(tabCount(tab.id), locale)}</span
            >{/if}
        </button>
      {/each}
    </div>

    {#if activeTab === "downloads"}
      <div class="space-y-3" role="tabpanel" aria-label={t(locale, "library.downloads")}>
        <h2 class="text-xl font-bold">{t(locale, "library.downloads")}</h2>
        <p class="text-sm text-app-muted tabular-nums">
          {countLabel(locale, "downloadedTalk", downloads.length)}
        </p>
        {#if downloads.length > 0 && appState.library.favorites.length === 0}<p
            class="text-xs text-app-muted"
          >
            {t(locale, "library.downloads.hint")}
          </p>{/if}
        {#if hasDownloads}
          {#if downloads.length > 0}
            <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
              {#each downloads as track (track.id)}<TrackRow
                  {track}
                  state={appState}
                  {app}
                />{/each}
            </div>
          {:else}
            <AsyncState
              {locale}
              kind="loading"
              loadingLabel={t(locale, "library.downloads.loading")}
              shape="rows"
            />
          {/if}
        {:else}
          <AsyncState
            {locale}
            kind="empty"
            title={t(locale, "library.downloads.empty.title")}
            detail={t(locale, "library.downloads.empty.detail")}
            actionLabel={t(locale, "library.empty.action")}
            onaction={() => explore("explore")}
          />
        {/if}
      </div>
    {:else if activeTab === "favorites"}
      <div class="space-y-3" role="tabpanel" aria-label={t(locale, "library.favorites")}>
        <h2 class="text-xl font-bold">{t(locale, "library.favorites")}</h2>
        <p class="text-sm text-app-muted tabular-nums">
          {countLabel(locale, "savedTalk", favoriteOnly.length)}
        </p>
        {#if unresolvedFavorites > 0}
          <p class="text-xs text-app-muted">
            {t(locale, "library.favorites.unresolved", {
              count: countLabel(locale, "savedTalkAre", unresolvedFavorites)
            })}
          </p>
        {/if}
        {#if favoriteOnly.length > 0}
          <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
            {#each favoriteOnly as track (track.id)}<TrackRow
                {track}
                state={appState}
                {app}
              />{/each}
          </div>
        {:else if appState.library.favorites.length > 0}
          <AsyncState
            {locale}
            kind="empty"
            title={t(locale, "library.favorites.saved.title")}
            detail={t(locale, "library.favorites.saved.detail")}
          />
        {:else}
          <AsyncState
            {locale}
            kind="empty"
            title={t(locale, "library.favorites.empty.title")}
            detail={t(locale, "library.favorites.empty.detail")}
            actionLabel={t(locale, "library.empty.action")}
            onaction={() => explore("explore")}
          />
        {/if}
      </div>
    {:else}
      <div class="space-y-3" role="tabpanel" aria-label={t(locale, "library.history")}>
        <h2 class="text-xl font-bold">{t(locale, "home.recentlyPlayed")}</h2>
        <p class="text-sm text-app-muted tabular-nums">
          {t(locale, "library.history.count", {
            count: countLabel(locale, "talk", historyTracks.length)
          })}
        </p>
        {#if historyTracks.length > 0}
          <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
            {#each historyTracks as track (track.id)}<TrackRow
                {track}
                state={appState}
                {app}
              />{/each}
          </div>
        {:else}
          <AsyncState
            {locale}
            kind="empty"
            title={t(locale, "library.history.empty.title")}
            detail={t(locale, "library.history.empty.detail")}
            actionLabel={t(locale, "library.history.empty.action")}
            onaction={() => explore("teachers")}
          />
        {/if}
      </div>
    {/if}
  </section>
{/if}
