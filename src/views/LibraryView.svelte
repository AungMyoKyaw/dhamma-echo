<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState } from "../types.js";
  import { knownFavoriteTracks } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let favorites = $derived(knownFavoriteTracks(state));
</script>

{#if state.library.favorites.length === 0}<AsyncState
    kind="empty"
    title="Your library is ready"
    detail="Favorite a talk while exploring to keep it close for another listening session."
  />{:else if favorites.length === 0}<AsyncState
    kind="empty"
    title="Favorites saved"
    detail="Open Explore to load the saved talks from the catalogue."
  />{:else}<section class="space-y-4">
    <div>
      <h2 class="text-xl font-bold">Favorites</h2>
      <p class="mt-1 text-sm text-app-muted">{state.library.favorites.length} saved talks</p>
    </div>
    <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
      {#each favorites as track (track.id)}<TrackRow {track} {state} {app} />{/each}
    </div>
  </section>{/if}
