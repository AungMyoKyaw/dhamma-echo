<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState, AudioTrack } from "../types.js";
  import { formatDuration } from "../utils.js";
  import Icon from "./Icon.svelte";
  let { track, state, app }: { track: AudioTrack; state: AppState; app: DhammaApp } = $props();
  let favorite = $derived(state.library.favorites.includes(track.id));
  let current = $derived(state.player.current?.id === track.id);
  let playing = $derived(current && state.player.status === "playing");
  let loading = $derived(current && state.player.status === "loading");
  let resume = $derived(state.library.resume[String(track.id)] ?? 0);
  let actionLabel = $derived(loading ? "Connecting to" : playing ? "Pause" : "Play");
  async function play(): Promise<void> {
    if (!track.playable || loading) return;
    if (current) await app.togglePlayback();
    else await app.playTrack(track);
  }
</script>

<article
  class="track-row grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-app-border px-4 py-3 last:border-0 {current
    ? 'is-current bg-app-primary/5'
    : ''} {track.playable ? 'transition hover:bg-app-soft/60' : ''}"
>
  <button
    class="track-play-button {track.playable ? 'is-playable' : 'is-unavailable'} {loading
      ? 'is-loading'
      : ''}"
    type="button"
    onclick={() => void play()}
    aria-label="{actionLabel} {track.title}"
    title="{actionLabel} {track.title}"
    aria-pressed={playing}
    disabled={!track.playable || loading}
    ><span class="track-play-icon {playing ? '' : 'is-play'}"
      ><Icon name={playing ? "pause" : "play"} /></span
    ></button
  >
  <button
    class="min-w-0 text-left {track.playable ? 'cursor-pointer' : 'cursor-default'}"
    type="button"
    onclick={() => void play()}
    disabled={!track.playable || loading}
    aria-label="{actionLabel} {track.title}"
  >
    <span class="flex items-center gap-2"
      ><span class="truncate font-bold">{track.title}</span>{#if !track.playable}<span
          class="rounded-full bg-app-soft px-2 py-0.5 text-[10px] font-bold uppercase text-app-muted"
          >{track.format.toLowerCase() === "wma" ? "WMA unavailable" : "Unavailable"}</span
        >{/if}</span
    >
    <span class="mt-1 block truncate text-sm text-app-muted"
      >{track.teacherName || "Unknown teacher"} · {track.language} · {track.format.toUpperCase()}{resume >
      0
        ? ` · Resume at ${formatDuration(resume)}`
        : ""}</span
    >
  </button>
  <div class="flex items-center gap-2">
    <button
      class="row-action-button {favorite ? 'is-active' : ''}"
      type="button"
      onclick={() => app.dispatch({ type: "toggle-favorite", id: track.id })}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
      ><span class="size-5 {favorite ? 'fill-current text-app-primary' : ''}"
        ><Icon name="heart" /></span
      ></button
    >
    <button
      class="row-queue-button"
      type="button"
      onclick={() => app.dispatch({ type: "enqueue", track })}>Queue</button
    >
  </div>
</article>
