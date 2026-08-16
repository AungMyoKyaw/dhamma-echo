<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import { getNativeWindow } from "../runtime.js";
  import type { AppState } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  import { formatDuration } from "../utils.js";
  import Icon from "./Icon.svelte";
  import QueuePanel from "./QueuePanel.svelte";

  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];

  let track = $derived(appState.player.current);
  let videoVisible = $derived(track !== null && track.mediaType === "video");
  let playing = $derived(appState.player.status === "playing");
  let loading = $derived(appState.player.status === "loading");
  let max = $derived(appState.player.duration > 0 ? appState.player.duration : 1);
  let videoEl: HTMLVideoElement | undefined = $state();
  let fullscreen = $state(false);

  let contentLeft = $derived(
    appState.ui.sidebarCollapsed
      ? "left-[72px] max-[640px]:left-0"
      : "left-64 max-[1040px]:left-56 max-[640px]:left-0"
  );
  let asideClass = $derived(
    fullscreen ? "fixed inset-0 z-50 bg-black" : `fixed right-0 bottom-0 z-30 ${contentLeft}`
  );
  let sectionClass = $derived(
    fullscreen
      ? "h-full w-full overflow-hidden bg-black"
      : "mx-auto max-w-[1120px] overflow-hidden rounded-t-card border border-b-0 border-app-border bg-app-surface shadow-[0_-18px_48px_rgb(46_46_42_/_0.16)]"
  );
  let layoutClass = $derived(
    fullscreen
      ? "h-full w-full"
      : "grid min-h-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]"
  );
  let stageClass = $derived(
    fullscreen ? "relative h-full w-full bg-black" : "relative aspect-video min-h-0 bg-black"
  );

  $effect(() => {
    if (videoEl === undefined) return;
    app.registerVideoElement(videoEl);
    const onFullscreenChange = (): void => {
      fullscreen = globalThis.document.fullscreenElement === videoEl;
    };
    const onResize = (): void => {
      void syncNativeFullscreen();
    };
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape" || !fullscreen || globalThis.document.fullscreenElement !== null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      void exitFullscreen();
    };
    globalThis.document.addEventListener("fullscreenchange", onFullscreenChange);
    globalThis.addEventListener("resize", onResize);
    globalThis.document.addEventListener("keydown", onKeydown, true);
    void syncNativeFullscreen();
    return () => {
      globalThis.document.removeEventListener("fullscreenchange", onFullscreenChange);
      globalThis.removeEventListener("resize", onResize);
      globalThis.document.removeEventListener("keydown", onKeydown, true);
      app.registerVideoElement(null);
    };
  });

  $effect(() => {
    if (videoVisible || !fullscreen) return;
    void exitFullscreen();
  });

  function numberFromControl(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }

  async function syncNativeFullscreen(): Promise<void> {
    const nativeWindow = getNativeWindow();
    if (nativeWindow === null || globalThis.document.fullscreenElement !== null) return;
    try {
      fullscreen = await nativeWindow.isFullscreen();
    } catch {
      // Keep the current visual state if the native window is temporarily unavailable.
    }
  }

  async function exitFullscreen(): Promise<void> {
    try {
      if (globalThis.document.fullscreenElement === videoEl) {
        await globalThis.document.exitFullscreen();
      }
      const nativeWindow = getNativeWindow();
      if (nativeWindow !== null) await nativeWindow.setFullscreen(false);
    } catch {
      // The player can still leave its fullscreen layout if the platform refuses the exit.
    }
    fullscreen = false;
  }

  async function toggleFullscreen(): Promise<void> {
    if (videoEl === undefined) return;
    try {
      const nativeWindow = getNativeWindow();
      if (nativeWindow !== null) {
        const isFullscreen = await nativeWindow.isFullscreen();
        await nativeWindow.setFullscreen(!isFullscreen);
        fullscreen = !isFullscreen;
      } else if (globalThis.document.fullscreenElement === videoEl) {
        await exitFullscreen();
      } else if (typeof videoEl.requestFullscreen === "function") {
        await videoEl.requestFullscreen();
        fullscreen = true;
      } else {
        fullscreen = !fullscreen;
      }
    } catch {
      fullscreen = false;
    }
  }

  async function close(): Promise<void> {
    await exitFullscreen();
    app.closeVideoPlayer();
    fullscreen = false;
  }
</script>

<aside
  class="{asideClass} {videoVisible ? '' : 'hidden'}"
  aria-hidden={!videoVisible}
  aria-label="Video player"
>
  {#if !fullscreen}<QueuePanel state={appState} {app} placement="video" />{/if}
  <section class={sectionClass}>
    <div class={layoutClass}>
      <div class={stageClass}>
        <video
          bind:this={videoEl}
          class="h-full w-full object-contain {videoVisible ? '' : 'hidden'}"
          controls={fullscreen}
          preload="metadata"
          playsinline
          aria-label="Video player"
        ></video>
        {#if fullscreen}<button
            type="button"
            onclick={() => void exitFullscreen()}
            class="absolute top-4 right-4 z-10 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-black/65 px-3 text-xs font-bold text-white backdrop-blur-sm transition-[background-color,border-color] duration-150 hover:border-white/70 hover:bg-black/85"
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
          >
            <span class="block size-4 [&_svg]:size-full"><Icon name="exit-fullscreen" /></span>
            <span>Exit fullscreen</span>
          </button>{/if}
        {#if videoVisible && loading}<div
            class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-xs font-bold text-white"
            role="status"
          >
            <span class="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-2"
              ><span class="size-2 animate-pulse rounded-full bg-white motion-reduce:animate-none"
              ></span>Connecting…</span
            >
          </div>{/if}
      </div>

      {#if !fullscreen && videoVisible && track !== null}
        <div class="flex min-w-0 flex-col border-l border-app-border max-lg:border-t">
          <header class="flex items-start justify-between gap-4 p-5 pb-3">
            <div class="min-w-0">
              <p class="text-[0.65rem] font-bold tracking-wider text-app-primary uppercase">
                Now playing · video
              </p>
              <h2
                class="mt-1 truncate text-base font-bold {isMyanmarText(track.title)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(track.title) ? "my" : undefined}
                title={track.title}
              >
                {track.title}
              </h2>
              <p
                class="mt-0.5 truncate text-xs text-app-muted {isMyanmarText(track.teacherName)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(track.teacherName) ? "my" : undefined}
                title={track.teacherName || "Unknown teacher"}
              >
                {track.teacherName || "Unknown teacher"} · {track.format.toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onclick={() => void close()}
              class="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-app-border bg-transparent px-3 text-xs font-bold text-app-muted transition-[background-color,color] duration-150 hover:bg-app-soft hover:text-app"
              aria-label="Close video player"
              title="Close video player (Esc)"
            >
              <span class="block size-4 [&_svg]:size-full"><Icon name="close" /></span>
              <span>Close</span>
            </button>
          </header>

          <div class="min-h-5 px-5">
            {#if appState.player.error}<p
                class="text-[0.7rem] font-semibold text-error"
                role="alert"
              >
                {appState.player.error}
              </p>{:else if loading}<p
                class="inline-flex items-center gap-2 text-[0.7rem] font-semibold text-app-primary"
                role="status"
              >
                Loading video…
              </p>{:else}<p class="text-[0.7rem] text-app-muted">
                Space to pause · ←/→ to seek
              </p>{/if}
          </div>

          <div class="mt-auto border-t border-app-border px-5 py-4">
            <div
              class="flex items-center justify-center gap-2"
              aria-label="Video playback controls"
            >
              <button
                type="button"
                onclick={() => app.seekBy(-15)}
                class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed disabled:opacity-45 [&>span]:block [&>span]:size-5 [&_svg]:size-full"
                aria-label="Jump back 15 seconds"
                title="Jump back 15 seconds"
              >
                <span><Icon name="backward15" /></span>
              </button>
              <button
                type="button"
                onclick={() => void app.togglePlayback()}
                class="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-app-primary text-white shadow-[0_5px_14px_color-mix(in_srgb,var(--color-app-primary)_25%,transparent)] transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-primary-strong disabled:cursor-wait disabled:opacity-45 [&_svg]:size-full"
                aria-label={loading
                  ? "Pause video loading"
                  : playing
                    ? "Pause video"
                    : "Play video"}
                title={loading ? "Pause video loading" : playing ? "Pause video" : "Play video"}
                aria-pressed={playing}
              >
                <span class="block size-[21px] {playing || loading ? '' : 'translate-x-px'}"
                  ><Icon name={playing || loading ? "pause" : "play"} /></span
                >
              </button>
              <button
                type="button"
                onclick={() => app.seekBy(15)}
                class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed disabled:opacity-45 [&>span]:block [&>span]:size-5 [&_svg]:size-full"
                aria-label="Jump forward 15 seconds"
                title="Jump forward 15 seconds"
              >
                <span><Icon name="forward15" /></span>
              </button>
            </div>

            <div
              class="mt-3 grid grid-cols-[3.2rem_minmax(70px,1fr)_3.2rem] items-center gap-2 text-[0.68rem] text-app-muted tabular-nums [&>span:first-child]:text-right"
            >
              <span>{formatDuration(appState.player.currentTime)}</span>
              <input
                class="w-full min-w-0 accent-app-primary"
                type="range"
                min="0"
                {max}
                step="1"
                value={Math.min(appState.player.currentTime, max)}
                oninput={(event) => app.seek(numberFromControl(event))}
                aria-label="Playback position"
              />
              <span>{formatDuration(appState.player.duration)}</span>
            </div>

            <div
              class="mt-3 flex items-center justify-between gap-2 border-t border-app-border pt-3"
            >
              <label title="Playback speed">
                <span class="sr-only">Playback speed</span>
                <select
                  value={String(appState.settings.playbackRate)}
                  onchange={(event) => app.setRate(numberFromControl(event))}
                  class="h-10 min-w-16 rounded-xl border border-app-border bg-app-bg py-0 pr-[1.6rem] pl-[0.65rem] text-xs font-bold text-app"
                  aria-label="Playback speed"
                >
                  {#each rates as rate (rate)}
                    <option value={String(rate)}>{rate}×</option>
                  {/each}
                </select>
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick={() => app.dispatch({ type: "toggle-queue" })}
                  class="relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-app-border bg-transparent text-app-muted transition-[background-color,border-color,color] duration-150 hover:border-app-primary hover:bg-app-soft hover:text-app-primary"
                  aria-label="Show queue"
                  title="Show queue"
                  aria-expanded={appState.player.queueOpen}
                >
                  <span class="block size-[18px] [&_svg]:size-full"><Icon name="queue" /></span>
                  {#if appState.player.queue.length > 0}<span
                      class="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-app-surface bg-app-primary text-[0.55rem] font-extrabold text-white"
                      >{appState.player.queue.length}</span
                    >{/if}
                </button>
                <button
                  type="button"
                  onclick={() => void toggleFullscreen()}
                  class="inline-flex min-h-10 items-center gap-2 rounded-full border border-app-border bg-transparent px-3 text-xs font-bold text-app-muted transition-[background-color,border-color,color] duration-150 hover:border-app-primary hover:bg-app-soft hover:text-app-primary"
                  aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <span class="block size-4 [&_svg]:size-full"
                    ><Icon name={fullscreen ? "exit-fullscreen" : "fullscreen"} /></span
                  >
                  <span>{fullscreen ? "Exit" : "Fullscreen"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </section>
</aside>
