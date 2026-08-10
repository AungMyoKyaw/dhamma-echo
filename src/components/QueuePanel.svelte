<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState } from "../types.js";
  import Icon from "./Icon.svelte";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
</script>
{#if state.player.queueOpen}
  <aside class="fixed bottom-28 right-6 z-40 w-96 overflow-hidden rounded-card border border-app-border bg-app-surface shadow-2xl" aria-label="Playback queue">
    <div class="flex items-center justify-between border-b border-app-border p-4"><div><p class="font-bold">Up next</p><p class="text-xs text-app-muted">{state.player.queue.length} talks</p></div><button class="text-xs font-bold text-app-primary" type="button" onclick={() => app.dispatch({ type: "clear-queue" })}>Clear</button></div>
    <div class="scrollbar-thin max-h-80 overflow-y-auto">
      {#if state.player.queue.length === 0}<p class="p-6 text-center text-sm text-app-muted">Your queue is empty.</p>
      {:else}{#each state.player.queue as track (track.id)}<div class="flex items-center gap-3 border-b border-app-border p-3 last:border-0"><div class="min-w-0 flex-1"><p class="truncate text-sm font-bold">{track.title}</p><p class="truncate text-xs text-app-muted">{track.teacherName}</p></div><button class="flex size-8 items-center justify-center rounded-full hover:bg-app-soft" type="button" onclick={() => app.dispatch({ type: "remove-queue", id: track.id })} aria-label="Remove {track.title} from queue"><span class="size-4"><Icon name="close" /></span></button></div>{/each}{/if}
    </div>
  </aside>
{/if}
