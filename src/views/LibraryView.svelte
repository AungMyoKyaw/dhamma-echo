<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, Route } from "../types.js";
  import { downloadedTracks, favoriteTracks } from "../ui.js";
  import { pluralize } from "../utils.js";

  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
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
</script>

{#if appState.library.favorites.length === 0 && !hasDownloads}
  <AsyncState
    kind="empty"
    title="Find a talk to start your library"
    detail="Favorite a talk or download one while exploring to keep it close for another listening session."
    actionLabel="Explore talks"
    onaction={() => explore("explore")}
  />
{:else}
  <section class="space-y-6">
    <div class="flex flex-wrap gap-2" role="tablist" aria-label="Library sections">
      <button
        role="tab"
        aria-selected={activeTab === "downloads"}
        class="inline-flex min-h-11 items-center gap-2 rounded-full px-4 pt-0.5 pb-0 text-sm leading-none font-bold transition-[background-color,color,border-color] duration-150 {activeTab ===
        'downloads'
          ? 'bg-app-primary text-app-primary-ink'
          : 'bg-app-soft text-app-muted hover:text-app'}"
        type="button"
        onclick={() => setTab("downloads")}
        >Downloads
        {#if hasDownloads}<span
            class="inline-flex min-h-[20px] items-center justify-center rounded-full bg-app-primary/15 px-2 pt-0.5 pb-0 align-middle text-[11px] leading-none font-bold text-app-primary"
            >{downloads.length}</span
          >{/if}
      </button>
      <button
        role="tab"
        aria-selected={activeTab === "favorites"}
        class="inline-flex min-h-11 items-center gap-2 rounded-full px-4 pt-0.5 pb-0 text-sm leading-none font-bold transition-[background-color,color,border-color] duration-150 {activeTab ===
        'favorites'
          ? 'bg-app-primary text-app-primary-ink'
          : 'bg-app-soft text-app-muted hover:text-app'}"
        type="button"
        onclick={() => setTab("favorites")}
        >Favorites
        {#if appState.library.favorites.length > 0}<span
            class="inline-flex min-h-[20px] items-center justify-center rounded-full bg-app-primary/15 px-2 pt-0.5 pb-0 align-middle text-[11px] leading-none font-bold text-app-primary"
            >{appState.library.favorites.length}</span
          >{/if}
      </button>
      <button
        role="tab"
        aria-selected={activeTab === "history"}
        class="inline-flex min-h-11 items-center gap-2 rounded-full px-4 pt-0.5 pb-0 text-sm leading-none font-bold transition-[background-color,color,border-color] duration-150 {activeTab ===
        'history'
          ? 'bg-app-primary text-app-primary-ink'
          : 'bg-app-soft text-app-muted hover:text-app'}"
        type="button"
        onclick={() => setTab("history")}
        >History
        {#if historyTracks.length > 0}<span
            class="inline-flex min-h-[20px] items-center justify-center rounded-full bg-app-primary/15 px-2 pt-0.5 pb-0 align-middle text-[11px] leading-none font-bold text-app-primary"
            >{historyTracks.length}</span
          >{/if}
      </button>
    </div>

    {#if activeTab === "downloads"}
      <div class="space-y-3" role="tabpanel" aria-label="Downloads">
        <h2 class="text-xl font-bold">Downloads</h2>
        <p class="text-sm text-app-muted tabular-nums">
          {pluralize(downloads.length, "downloaded talk", undefined, appState.settings.locale)}
        </p>
        {#if downloads.length > 0 && appState.library.favorites.length === 0}<p
            class="text-xs text-app-muted"
          >
            Favorite talks while exploring to keep them close even without a download.
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
            <AsyncState kind="loading" loadingLabel="Loading downloaded talks" shape="rows" />
          {/if}
        {:else}
          <AsyncState
            kind="empty"
            title="No downloads yet"
            detail="Tap the download icon on a talk to keep it available offline."
            actionLabel="Explore talks"
            onaction={() => explore("explore")}
          />
        {/if}
      </div>
    {:else if activeTab === "favorites"}
      <div class="space-y-3" role="tabpanel" aria-label="Favorites">
        <h2 class="text-xl font-bold">Favorites</h2>
        <p class="text-sm text-app-muted tabular-nums">
          {pluralize(favoriteOnly.length, "saved talk", undefined, appState.settings.locale)}
        </p>
        {#if unresolvedFavorites > 0}
          <p class="text-xs text-app-muted">
            {unresolvedFavorites} saved talk{unresolvedFavorites === 1 ? " is" : "s are"} unavailable
            in the current catalogue.
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
            kind="empty"
            title="Favorites saved"
            detail="The saved talks are not available in the current catalogue. Restart the app to refresh the catalogue."
          />
        {:else}
          <AsyncState
            kind="empty"
            title="No favorites yet"
            detail="Tap the heart icon on a talk to save it here."
            actionLabel="Explore talks"
            onaction={() => explore("explore")}
          />
        {/if}
      </div>
    {:else}
      <div class="space-y-3" role="tabpanel" aria-label="History">
        <h2 class="text-xl font-bold">Recently played</h2>
        <p class="text-sm text-app-muted tabular-nums">
          {pluralize(historyTracks.length, "talk", undefined, appState.settings.locale)} played recently.
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
            kind="empty"
            title="No plays yet"
            detail="Talks you start will appear here so you can return to them."
            actionLabel="Browse teachers"
            onaction={() => explore("teachers")}
          />
        {/if}
      </div>
    {/if}
  </section>
{/if}
