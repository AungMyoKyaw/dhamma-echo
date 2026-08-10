<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import CollectionCard from "../components/CollectionCard.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, CollectionSummary } from "../types.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  function retry(): void { if (state.selectedTeacherId !== null) void app.openTeacher(state.selectedTeacherId, state.navigationContext?.returnRoute ?? "teachers"); }
  async function explore(): Promise<void> { const detail = state.teacherDetail.data; if (detail === null) return; app.dispatch({ type: "set-teacher", teacherId: detail.id }); app.dispatch({ type: "navigate", route: "explore" }); await app.search(); }
  function open(collection: CollectionSummary): void { void app.openCollection(collection.id, "teacher-detail"); }
</script>
<section class="space-y-6"><button class="rounded-full border border-app-border px-4 py-2 text-sm font-bold text-app-primary" type="button" onclick={() => app.dispatch({ type: "return-to-list" })}>Back</button>
{#if state.teacherDetail.status === "error"}<AsyncState kind="error" detail={state.teacherDetail.message} onretry={retry} />
{:else if state.teacherDetail.status !== "ready" || state.teacherDetail.data === null}<AsyncState kind="loading" />
{:else}{@const detail = state.teacherDetail.data}<div class="rounded-card border border-app-border bg-app-surface p-6"><p class="text-xs font-bold uppercase tracking-wider text-app-primary">{detail.audioCount.toLocaleString("en-US")} talks</p><h2 class="mt-2 text-2xl font-bold">{detail.name}</h2><button class="mt-4 rounded-full bg-app-primary px-4 py-2 text-xs font-bold text-white" type="button" onclick={() => void explore()}>Explore this teacher</button></div>
{#if detail.collections.length > 0}<div><h3 class="mb-3 text-lg font-bold">Collections</h3><div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{#each detail.collections as collection (collection.id)}<CollectionCard {collection} onselect={open} />{/each}</div></div>{/if}
<div><h3 class="mb-3 text-lg font-bold">Talks</h3>{#if state.teacherTalks.status === "error"}<AsyncState kind="error" detail={state.teacherTalks.message} onretry={() => void app.loadTeacherTalks()} />{:else if state.teacherTalks.status !== "ready"}<AsyncState kind="loading" />{:else if state.teacherTalks.page.items.length === 0}<AsyncState kind="empty" title="No talks found" detail="This teacher has no audio talks in the catalogue." />{:else}<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">{#each state.teacherTalks.page.items as track (track.id)}<TrackRow {track} {state} {app} />{/each}</div>{/if}{#if state.teacherTalks.status === "ready"}<div class="mt-4"><ProgressiveControls shown={state.teacherTalks.page.items.length} total={state.teacherTalks.page.total} limit={state.teacherTalks.page.limit} loading={state.teacherTalks.loadingMore} message={state.teacherTalks.loadMoreMessage} exhausted={state.teacherTalks.exhausted} noun="talks" onloadmore={() => app.loadMoreTeacherTalks()} /></div>{/if}</div>{/if}</section>
