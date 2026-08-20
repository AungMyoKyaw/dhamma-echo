<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  import Icon from "./Icon.svelte";
  let {
    state,
    app,
    placement = "audio"
  }: { state: AppState; app: DhammaApp; placement?: "audio" | "video" } = $props();
  let panelClass = $derived(
    placement === "video"
      ? "absolute right-4 bottom-full z-40 mb-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-app-border bg-app-surface shadow-2xl"
      : "fixed right-6 bottom-28 z-40 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-app-border bg-app-surface shadow-2xl max-[1040px]:right-4 max-[1040px]:bottom-40"
  );
</script>

{#if state.player.queueOpen}
  <aside class={panelClass} aria-label="Playback queue">
    <div class="flex items-center justify-between border-b border-app-border p-4">
      <div>
        <p class="font-bold">Up next</p>
        <p class="text-xs text-app-muted">{state.player.queue.length} talks</p>
      </div>
      <button
        class="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold text-app-primary hover:bg-app-soft"
        type="button"
        onclick={() => app.dispatch({ type: "clear-queue" })}>Clear</button
      >
    </div>
    <div
      class="max-h-80 overflow-y-auto [scrollbar-color:var(--color-app-border)_transparent] [scrollbar-width:thin]"
    >
      {#if state.player.queue.length === 0}<p class="p-6 text-center text-sm text-app-muted">
          Your queue is empty.
        </p>
      {:else}{#each state.player.queue as track (track.id)}<div
            class="flex items-center gap-3 border-b border-app-border p-3 last:border-0"
          >
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-bold {isMyanmarText(track.title)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(track.title) ? "my" : undefined}
              >
                {track.title}
              </p>
              <p
                class="truncate text-xs text-app-muted {isMyanmarText(track.teacherName)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(track.teacherName) ? "my" : undefined}
              >
                {track.teacherName}
              </p>
            </div>
            <button
              class="flex size-10 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app"
              type="button"
              onclick={() => app.dispatch({ type: "remove-queue", id: track.id })}
              aria-label="Remove {track.title} from queue"
              ><span class="size-4"><Icon name="close" /></span></button
            >
          </div>{/each}{/if}
    </div>
  </aside>
{/if}
