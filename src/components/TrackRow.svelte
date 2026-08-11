<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState, AudioTrack } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  import { formatDuration } from "../utils.js";
  import Icon from "./Icon.svelte";
  let { track, state, app }: { track: AudioTrack; state: AppState; app: DhammaApp } = $props();
  let favorite = $derived(state.library.favorites.includes(track.id));
  let current = $derived(state.player.current?.id === track.id);
  let playing = $derived(current && state.player.status === "playing");
  let loading = $derived(current && state.player.status === "loading");
  let resume = $derived(state.library.resume[String(track.id)] ?? 0);
  let actionLabel = $derived(loading ? "Connecting to" : playing ? "Pause" : "Play");
  let downloaded = $derived(state.library.downloads?.[String(track.id)] !== undefined);
  let progress = $derived(state.downloadProgress[String(track.id)] ?? null);
  let downloading = $derived(progress !== null);
  let myanmarTitle = $derived(isMyanmarText(track.title));
  let myanmarTeacher = $derived(isMyanmarText(track.teacherName));
  async function play(): Promise<void> {
    if (!track.playable || loading) return;
    if (current) await app.togglePlayback();
    else await app.playTrack(track);
  }
  async function download(): Promise<void> {
    if (downloading || downloaded || !track.playable) return;
    try {
      await app.downloadTrack(track);
    } catch {
      // The player remains usable; the next click retries the download.
    }
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
      ><span
        class="truncate font-bold {myanmarTitle ? 'myanmar-text' : ''}"
        lang={myanmarTitle ? "my" : undefined}>{track.title}</span
      >{#if !track.playable}<span
          class="badge-pill rounded-full bg-app-soft text-[10px] font-bold uppercase text-app-muted"
          >{track.format.toLowerCase() === "wma" ? "WMA unavailable" : "Unavailable"}</span
        >{/if}</span
    >
    <span
      class="mt-1 block truncate text-sm text-app-muted {myanmarTeacher ? 'myanmar-text' : ''}"
      lang={myanmarTeacher ? "my" : undefined}
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
      ><span class="size-5 {favorite ? 'text-app-primary' : ''}">
        <Icon name="heart" filled={favorite} />
      </span>
    </button>
    <button
      class="row-action-button {downloaded ? 'is-active' : ''}"
      type="button"
      onclick={() => void download()}
      aria-label={downloaded
        ? "Downloaded for offline listening"
        : downloading
          ? "Downloading"
          : "Download for offline listening"}
      title={downloaded
        ? "Downloaded for offline listening"
        : downloading
          ? "Downloading"
          : "Download for offline listening"}
      disabled={downloading || downloaded || !track.playable}
      ><span class="size-5"><Icon name="download" /></span>
    </button>
    {#if progress !== null}<span
        class="download-progress"
        aria-label={progress.total === null
          ? "Download in progress"
          : `${Math.round((progress.downloaded / progress.total) * 100)} percent downloaded`}
      >
        <span
          class="download-progress-bar"
          style:width={progress.total === null
            ? "35%"
            : `${Math.min(100, (progress.downloaded / progress.total) * 100)}%`}
        ></span>
      </span>{/if}
    <button
      class="row-queue-button"
      type="button"
      onclick={() => app.dispatch({ type: "enqueue", track })}>Queue</button
    >
  </div>
</article>
