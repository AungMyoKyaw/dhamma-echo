<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState, AudioTrack } from "../types.js";
  import { isMyanmarText, truncateTrackTitle } from "../ui.js";
  import Icon from "./Icon.svelte";
  let {
    state: appState,
    app,
    placement = "audio"
  }: { state: AppState; app: DhammaApp; placement?: "audio" | "video" } = $props();
  let panelClass = $derived(
    placement === "video"
      ? "absolute right-4 bottom-full z-40 mb-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-app-border bg-app-surface"
      : "fixed right-6 bottom-28 z-40 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-app-border bg-app-surface max-[1040px]:right-4 max-[1040px]:bottom-40"
  );
  let undoSnapshot: AudioTrack[] | null = $state(null);
  let undoTimer: ReturnType<typeof setTimeout> | null = null;
  function clearWithUndo(): void {
    if (appState.player.queue.length === 0) return;
    undoSnapshot = appState.player.queue.slice();
    app.dispatch({ type: "clear-queue" });
    if (undoTimer !== null) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      undoSnapshot = null;
    }, 6000);
  }
  function restore(): void {
    if (undoSnapshot === null) return;
    for (const track of undoSnapshot) app.dispatch({ type: "enqueue", track });
    if (undoTimer !== null) clearTimeout(undoTimer);
    undoSnapshot = null;
  }
  function dismissUndo(): void {
    undoSnapshot = null;
    if (undoTimer !== null) clearTimeout(undoTimer);
  }
</script>

{#if appState.player.queueOpen}
  <aside class={panelClass} aria-label="Playback queue">
    <div class="flex items-center justify-between border-b border-app-border p-4">
      <div>
        <p class="font-bold">Up next</p>
        <p class="text-xs text-app-muted">{appState.player.queue.length} talks</p>
      </div>
      <button
        class="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold text-app-primary hover:bg-app-soft disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        disabled={appState.player.queue.length === 0}
        onclick={clearWithUndo}>Clear</button
      >
    </div>
    <div
      class="max-h-80 overflow-y-auto [scrollbar-color:var(--color-app-border)_transparent] [scrollbar-width:thin]"
    >
      {#if appState.player.queue.length === 0}<p class="p-6 text-center text-sm text-app-muted">
          Your queue is empty.
        </p>
      {:else}{#each appState.player.queue as track (track.id)}<div
            class="flex items-center gap-3 border-b border-app-border p-3 last:border-0"
          >
            <div class="min-w-0 flex-1">
              <p
                class="line-clamp-2 break-words text-sm font-bold {isMyanmarText(track.title)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(track.title) ? "my" : undefined}
              >
                {truncateTrackTitle(track.title)}
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
              class="flex size-11 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app"
              type="button"
              onclick={() => app.dispatch({ type: "remove-queue", id: track.id })}
              aria-label="Remove {track.title} from queue"
              ><span class="size-4"><Icon name="close" /></span></button
            >
          </div>{/each}{/if}
    </div>
    {#if undoSnapshot !== null}
      <div
        class="flex items-center justify-between gap-3 border-t border-app-border bg-app-soft px-4 py-2 text-xs text-app-muted"
        role="status"
        aria-live="polite"
      >
        <span>{undoSnapshot.length} talk{undoSnapshot.length === 1 ? "" : "s"} cleared.</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            onclick={restore}
            class="inline-flex min-h-10 items-center rounded-full bg-app-primary px-3 pt-0.5 pb-0 text-xs leading-none font-bold text-app-primary-ink hover:bg-app-primary-strong"
            >Undo</button
          >
          <button
            type="button"
            onclick={dismissUndo}
            aria-label="Dismiss undo notification"
            class="inline-flex size-10 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app"
            ><span class="size-3"><Icon name="close" /></span></button
          >
        </div>
      </div>
    {/if}
  </aside>
{/if}