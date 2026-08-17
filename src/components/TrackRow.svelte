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
  class="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-b-app-border px-4 py-3 last:border-b-0 {current
    ? 'bg-app-primary/5 ring-1 ring-inset ring-app-primary/20'
    : ''} {track.playable ? 'transition hover:bg-app-soft/60' : ''}"
>
  <button
    class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-app-soft text-app-muted shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-app-border)_70%,transparent)] transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 {track.playable
      ? 'bg-[color-mix(in_srgb,var(--color-app-primary)_12%,var(--color-app-surface))] text-app-primary hover:bg-app-primary hover:text-white hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--color-app-primary)_22%,transparent)] group-hover:bg-app-primary group-hover:text-white group-hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--color-app-primary)_22%,transparent)]'
      : ''} {current && track.playable
      ? 'bg-app-primary text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--color-app-primary)_22%,transparent)]'
      : ''} {loading ? 'cursor-wait opacity-72' : ''}"
    type="button"
    onclick={() => void play()}
    aria-label="{actionLabel} {track.title}"
    title="{actionLabel} {track.title}"
    aria-pressed={playing}
    disabled={!track.playable || loading}
    ><span
      class="block size-[18px] [&_svg]:block [&_svg]:size-full {playing
        ? ''
        : 'translate-x-[0.75px]'}"><Icon name={playing ? "pause" : "play"} /></span
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
      >{#if track.mediaType === "video"}<span
          class="inline-flex min-h-[22px] items-center justify-center rounded-full bg-app-primary/15 px-2 pt-0.5 pb-0 align-middle text-[10px] leading-none font-bold text-app-primary uppercase"
          >Video</span
        >{/if}{#if !track.playable}<span
          class="inline-flex min-h-[22px] items-center justify-center rounded-full bg-app-soft px-2 pt-0.5 pb-0 align-middle text-[10px] leading-none font-bold text-app-muted uppercase"
          >{track.format.toLowerCase() === "wma" ? "WMA unavailable" : "Source unavailable"}</span
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
      class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app-primary disabled:cursor-not-allowed disabled:opacity-45 {favorite
        ? 'bg-transparent text-app-primary'
        : ''} [&_svg]:block [&_svg]:size-full"
      type="button"
      onclick={() => app.dispatch({ type: "toggle-favorite", id: track.id })}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
      ><span class="size-5 {favorite ? 'text-app-primary' : ''}">
        <Icon name="heart" filled={favorite} />
      </span>
    </button>
    <button
      class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app-primary disabled:cursor-not-allowed disabled:opacity-45 {downloaded
        ? 'bg-transparent text-app-primary'
        : ''} [&_svg]:block [&_svg]:size-full"
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
        class="h-[3px] w-7 overflow-hidden rounded-full bg-app-border"
        aria-label={progress.total === null
          ? "Download in progress"
          : `${Math.round((progress.downloaded / progress.total) * 100)} percent downloaded`}
      >
        <span
          class="block h-full rounded-[inherit] bg-app-primary transition-[width] duration-150"
          style:width={progress.total === null
            ? "35%"
            : `${Math.min(100, (progress.downloaded / progress.total) * 100)}%`}
        ></span>
      </span>{/if}
    <button
      class="inline-flex min-h-10 items-center justify-center rounded-full border border-app-border bg-transparent px-3 pt-0.5 pb-0 text-xs leading-5 font-bold text-app-muted transition-[border-color,background-color,color] duration-150 hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] hover:bg-app-soft hover:text-app"
      type="button"
      onclick={() => app.dispatch({ type: "enqueue", track })}>Queue</button
    >
  </div>
</article>
