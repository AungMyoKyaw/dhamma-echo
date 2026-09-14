<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import { t } from "../i18n.js";
  import type { AppState, AudioTrack } from "../types.js";
  import { isMyanmarText, truncateTrackTitle } from "../ui.js";
  import { formatLocaleDuration } from "../utils.js";
  import Icon from "./Icon.svelte";
  let {
    track,
    state: appState,
    app
  }: { track: AudioTrack; state: AppState; app: DhammaApp } = $props();
  let favorite = $derived(appState.library.favorites.includes(track.id));
  let current = $derived(appState.player.current?.id === track.id);
  let playing = $derived(current && appState.player.status === "playing");
  let loading = $derived(current && appState.player.status === "loading");
  let resume = $derived(appState.library.resume[String(track.id)] ?? 0);
  let locale = $derived(appState.settings.locale);
  let actionLabel = $derived(
    loading
      ? t(locale, "track.connecting", { title: track.title })
      : playing
        ? t(locale, "track.pause", { title: track.title })
        : t(locale, "track.play", { title: track.title })
  );
  let downloaded = $derived(appState.library.downloads?.[String(track.id)] !== undefined);
  let progress = $derived(appState.downloadProgress[String(track.id)] ?? null);
  let downloading = $derived(progress !== null);
  let myanmarTitle = $derived(isMyanmarText(track.title));
  let myanmarTeacher = $derived(isMyanmarText(track.teacherName));
  let displayTitle = $derived(truncateTrackTitle(track.title));
  let resumeLabel = $derived(resume > 0 ? formatLocaleDuration(resume, locale) : "");
  let menuOpen = $state(false);
  let menuRoot: HTMLDivElement | undefined = undefined;
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
  async function removeDownload(): Promise<void> {
    if (!downloaded) return;
    await app.removeDownload(track.id);
  }
  function toggleFavorite(): void {
    menuOpen = false;
    app.dispatch({ type: "toggle-favorite", id: track.id });
  }
  function enqueue(): void {
    menuOpen = false;
    app.dispatch({ type: "enqueue", track });
  }
  function toggleMenu(): void {
    menuOpen = !menuOpen;
  }
  function closeMenu(): void {
    menuOpen = false;
  }
</script>

<svelte:window
  onclick={(event: MouseEvent) => {
    if (!menuOpen) return;
    const target: EventTarget | null = event.target;
    if (target instanceof Node && menuRoot !== undefined && !menuRoot.contains(target)) {
      menuOpen = false;
    }
  }}
/>

<article
  class="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-b-app-border px-4 py-3 last:border-b-0 {current
    ? 'bg-app-primary/6 ring-1 ring-inset ring-app-primary/22'
    : ''} {track.playable ? 'transition hover:bg-app-soft/60' : ''}"
>
  <button
    class="group/track flex min-w-0 items-center gap-3 text-left {loading
      ? 'cursor-wait opacity-72'
      : ''} disabled:cursor-not-allowed"
    type="button"
    onclick={() => void play()}
    aria-label={actionLabel}
    title={actionLabel}
    aria-pressed={playing}
    disabled={!track.playable || loading}
  >
    <span
      class="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-0 bg-app-soft text-app-muted shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-app-border)_70%,transparent)] transition-[background-color,color,box-shadow,transform] duration-150 {track.playable
        ? 'bg-[color-mix(in_srgb,var(--color-app-primary)_12%,var(--color-app-surface))] text-app-primary group-hover:bg-app-primary group-hover:text-app-primary-ink'
        : ''} {current && track.playable ? 'bg-app-primary text-app-primary-ink' : ''}"
      ><span
        class="block size-[18px] [&_svg]:block [&_svg]:size-full {playing
          ? ''
          : 'translate-x-[0.75px]'}"><Icon name={playing ? "pause" : "play"} /></span
      ></span
    >
    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-2"
        ><span
          class="break-words font-bold leading-6 {myanmarTitle ? 'myanmar-text' : ''}"
          lang={myanmarTitle ? "my" : undefined}>{displayTitle}</span
        >{#if track.mediaType === "video"}<span
            class="inline-flex min-h-[22px] items-center justify-center rounded-full bg-app-primary/15 px-2 align-middle text-[10px] leading-normal font-bold text-app-primary uppercase"
            >{t(locale, "track.badge.video")}</span
          >{/if}{#if !track.playable}<span
            class="inline-flex min-h-[22px] items-center justify-center rounded-full bg-app-soft px-2 align-middle text-[10px] leading-normal font-bold text-app-muted uppercase"
            >{track.format.toLowerCase() === "wma"
              ? t(locale, "track.badge.wma")
              : t(locale, "track.badge.unavailable")}</span
          >{/if}</span
      >
      <span
        class="mt-1 flex items-center gap-2 truncate text-sm text-app-muted {myanmarTeacher
          ? 'myanmar-text'
          : ''}"
        lang={myanmarTeacher ? "my" : undefined}
        ><span class="truncate">{track.teacherName || t(locale, "player.unknownTeacher")}</span
        >{#if resume > 0 && !current}<span
            class="inline-flex shrink-0 items-center gap-1 rounded-full bg-app-soft px-2 align-middle text-[11px] leading-normal font-bold text-app-muted"
            aria-label={t(locale, "track.resumeAt", { time: resumeLabel })}
          >
            <span class="size-1.5 rounded-full bg-app-muted" aria-hidden="true"></span>
            {resumeLabel}
          </span>{/if}</span
      >
    </span>
  </button>
  <div class="relative flex items-center" bind:this={menuRoot}>
    <button
      class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed aria-expanded:bg-app-soft aria-expanded:text-app"
      type="button"
      onclick={toggleMenu}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-label={t(locale, "track.menu")}
      title={t(locale, "track.menu")}
      ><span class="size-5"><Icon name="more" /></span>
    </button>
    {#if progress !== null && !downloaded}<span
        class="ml-1 h-[3px] w-7 overflow-hidden rounded-full bg-app-border"
        role="progressbar"
        aria-label={progress.total === null
          ? t(locale, "track.download.progress.label")
          : t(locale, "track.download.progress.percent", {
              percent: Math.round((progress.downloaded / progress.total) * 100)
            })}
        aria-valuemin="0"
        aria-valuemax={progress.total ?? undefined}
        aria-valuenow={progress.total === null ? undefined : progress.downloaded}
        aria-valuetext={progress.total === null
          ? t(locale, "track.download.progress.label")
          : t(locale, "track.download.progress.percent", {
              percent: Math.round((progress.downloaded / progress.total) * 100)
            })}
      >
        <span
          class="block h-full rounded-[inherit] bg-app-primary transition-[width] duration-150"
          style:width={progress.total === null
            ? "35%"
            : `${Math.min(100, (progress.downloaded / progress.total) * 100)}%`}
        ></span>
      </span>{/if}
    {#if menuOpen}<div
        class="absolute right-0 top-full z-10 mt-2 min-w-[200px] rounded-card border border-app-border bg-app-surface p-1"
        role="menu"
        aria-label={t(locale, "track.menu")}
      >
        <button
          class="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-sm font-semibold text-app hover:bg-app-soft"
          type="button"
          role="menuitem"
          onclick={toggleFavorite}
        >
          <span class="size-5 {favorite ? 'text-app-primary' : 'text-app-muted'}">
            <Icon name="heart" filled={favorite} />
          </span>
          <span
            >{favorite ? t(locale, "track.favorite.remove") : t(locale, "track.favorite.add")}</span
          >
        </button>
        {#if downloaded}
          <button
            class="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-sm font-semibold text-app hover:bg-app-soft"
            type="button"
            role="menuitem"
            onclick={() => {
              closeMenu();
              void removeDownload();
            }}
          >
            <span class="size-5 text-app-primary"><Icon name="download" filled /></span>
            <span>{t(locale, "track.download.remove")}</span>
          </button>
        {:else if track.playable}
          <button
            class="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-sm font-semibold text-app hover:bg-app-soft disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            role="menuitem"
            disabled={downloading}
            onclick={() => {
              closeMenu();
              void download();
            }}
          >
            <span class="size-5 text-app-muted"><Icon name="download" /></span>
            <span
              >{downloading
                ? t(locale, "track.download.progress")
                : t(locale, "track.download.add")}</span
            >
          </button>
        {/if}
        <button
          class="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-sm font-semibold text-app hover:bg-app-soft"
          type="button"
          role="menuitem"
          onclick={enqueue}
        >
          <span class="size-5 text-app-muted"><Icon name="queue" /></span>
          <span>{t(locale, "track.enqueue")}</span>
        </button>
      </div>{/if}
  </div>
</article>
