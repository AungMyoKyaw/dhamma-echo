<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState } from "../types.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  function retry(): void { if (state.selectedCollectionId !== null) void app.openCollection(state.selectedCollectionId, state.navigationContext?.returnRoute ?? "collections"); }
</script>
<section class="space-y-5"><button class="rounded-full border border-app-border px-4 py-2 text-sm font-bold text-app-primary" type="button" onclick={() => app.dispatch({ type: "return-to-list" })}>Back</button>
{#if state.collectionDetail.status === "error"}<AsyncState kind="error" detail={state.collectionDetail.message} onretry={retry} />
{:else if state.collectionDetail.status !== "ready" || state.collectionDetail.data === null}<AsyncState kind="loading" />
{:else}{@const detail = state.collectionDetail.data}<div class="rounded-card border border-app-border bg-app-surface p-6"><p class="text-xs font-bold uppercase tracking-wider text-app-primary">{detail.audioCount.toLocaleString("en-US")} talks</p><h2 class="mt-2 text-2xl font-bold">{detail.name}</h2><p class="mt-2 text-sm text-app-muted">{detail.teacherName || "Unknown teacher"}</p>{#if detail.description !== null}<p class="mt-4 text-sm leading-6 text-app-muted">{detail.description}</p>{/if}</div>{#if detail.tracks.length === 0}<AsyncState kind="empty" title="No audio talks in this collection" detail="This collection has no audio records to play." />{:else}<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">{#each detail.tracks as track (track.id)}<TrackRow {track} {state} {app} />{/each}</div>{/if}{/if}</section>
