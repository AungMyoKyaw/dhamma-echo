<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import Icon from "../components/Icon.svelte";
  import type { AppState } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  import { formatDuration } from "../utils.js";

  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];

  let track = $derived(state.player.current);
  let playing = $derived(state.player.status === "playing");
  let loading = $derived(state.player.status === "loading");
  let max = $derived(state.player.duration > 0 ? state.player.duration : 1);

  function numberFromControl(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }

  function close(): void {
    void app.dispatch({ type: "return-to-list" });
  }
</script>

{#if track !== null}
  <section class="space-y-5" aria-label="Video playback">
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p
          class="text-xs font-bold uppercase tracking-wider text-app-primary"
          lang={isMyanmarText(track.title) ? "my" : undefined}
        >
          Now playing · video
        </p>
        <h2
          class="mt-1 text-2xl font-bold {isMyanmarText(track.title) ? 'myanmar-text' : ''}"
          lang={isMyanmarText(track.title) ? "my" : undefined}
        >
          {track.title}
        </h2>
        <p
          class="mt-1 text-sm text-app-muted {isMyanmarText(track.teacherName)
            ? 'myanmar-text'
            : ''}"
          lang={isMyanmarText(track.teacherName) ? "my" : undefined}
        >
          {track.teacherName || "Unknown teacher"}
        </p>
        {#if state.player.error}
          <p class="mt-2 text-xs font-semibold text-error" role="alert">
            {state.player.error}
          </p>
        {:else if loading}
          <p
            class="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-app-primary"
            role="status"
          >
            <span
              class="size-2 animate-pulse rounded-full bg-app-primary motion-reduce:animate-none"
            ></span>
            Connecting…
          </p>
        {/if}
      </div>
      <button
        type="button"
        onclick={close}
        class="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-app-border bg-transparent px-4 text-xs font-bold text-app-muted transition-[background-color,color] duration-150 hover:bg-app-soft hover:text-app"
        aria-label="Close video and return"
        title="Close (Esc)"
      >
        <span class="block size-4 [&_svg]:size-full"><Icon name="close" /></span>
        <span>Close</span>
      </button>
    </header>

    <div
      class="relative overflow-hidden rounded-card border border-app-border bg-app-surface shadow-[0_1px_2px_rgb(46_46_42_/_0.04)]"
    >
      <div class="aspect-video w-full bg-black">
        <video class="h-full w-full" controls={false} preload="metadata" aria-label="Video player"
        ></video>
      </div>
      <div class="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div class="flex items-center justify-center gap-2" aria-label="Playback controls">
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
            aria-label={loading ? "Connecting to video" : playing ? "Pause" : "Play"}
            title={loading ? "Connecting to video" : playing ? "Pause" : "Play"}
            aria-pressed={playing}
            disabled={loading}
          >
            <span class="block size-[21px] {playing ? '' : 'translate-x-px'}"
              ><Icon name={playing ? "pause" : "play"} /></span
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
          class="grid grid-cols-[3.4rem_minmax(90px,1fr)_3.4rem] items-center gap-[0.55rem] text-[0.68rem] text-app-muted tabular-nums [&>span:first-child]:text-right"
        >
          <span>{formatDuration(state.player.currentTime)}</span>
          <input
            class="w-full min-w-0 accent-app-primary"
            type="range"
            min="0"
            {max}
            step="1"
            value={Math.min(state.player.currentTime, max)}
            oninput={(event) => app.seek(numberFromControl(event))}
            aria-label="Playback position"
          />
          <span>{formatDuration(state.player.duration)}</span>
        </div>
        <label class="inline-flex items-center justify-end" title="Playback speed">
          <span class="sr-only">Playback speed</span>
          <select
            value={String(state.settings.playbackRate)}
            onchange={(event) => app.setRate(numberFromControl(event))}
            class="h-10 min-w-16 rounded-xl border border-app-border bg-app-bg py-0 pr-[1.6rem] pl-[0.65rem] text-xs font-bold text-app"
            aria-label="Playback speed"
          >
            {#each rates as rate (rate)}
              <option value={String(rate)}>{rate}×</option>
            {/each}
          </select>
        </label>
      </div>
    </div>
  </section>
{/if}
