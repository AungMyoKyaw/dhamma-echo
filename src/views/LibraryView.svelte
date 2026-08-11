<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState } from "../types.js";
  import { downloadedTracks, favoriteTracks } from "../ui.js";

  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let favorites = $derived(favoriteTracks(state));
  let downloads = $derived(downloadedTracks(state));
  let hasDownloads = $derived(Object.keys(state.library.downloads ?? {}).length > 0);
  let favoriteOnly = $derived(
    favorites.filter((track) => state.library.downloads?.[String(track.id)] === undefined)
  );
  let unresolvedFavorites = $derived(state.library.favorites.length - favorites.length);
</script>

{#if state.library.favorites.length === 0 && !hasDownloads}
  <AsyncState
    kind="empty"
    title="Your library is ready"
    detail="Favorite a talk or download one while exploring to keep it close for another listening session."
  />
{:else}
  <section class="space-y-8">
    {#if hasDownloads}
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-bold">Downloads</h2>
          <p class="mt-1 text-sm text-app-muted">
            {downloads.length} available offline talk{downloads.length === 1 ? "" : "s"}
          </p>
        </div>
        {#if downloads.length > 0}
          <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
            {#each downloads as track (track.id)}<TrackRow {track} {state} {app} />{/each}
          </div>
        {:else}
          <p class="text-sm text-app-muted">
            Downloaded talks are still loading from the catalogue.
          </p>
        {/if}
      </section>
    {/if}

    {#if favoriteOnly.length > 0}
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-bold">Favorites</h2>
          <p class="mt-1 text-sm text-app-muted">
            {favoriteOnly.length} available saved talk{favoriteOnly.length === 1 ? "" : "s"}
          </p>
          {#if unresolvedFavorites > 0}
            <p class="mt-1 text-xs text-app-muted">
              {unresolvedFavorites} saved talk{unresolvedFavorites === 1 ? " is" : "s are"} unavailable
              in the current catalogue.
            </p>
          {/if}
        </div>
        <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
          {#each favoriteOnly as track (track.id)}<TrackRow {track} {state} {app} />{/each}
        </div>
      </section>
    {:else if state.library.favorites.length > 0 && favorites.length === 0}
      <AsyncState
        kind="empty"
        title="Favorites saved"
        detail="The saved talks are not available in the current catalogue. Open Explore to refresh the catalogue."
      />
    {/if}
  </section>
{/if}
