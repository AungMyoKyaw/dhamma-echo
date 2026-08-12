<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  import { formatDuration } from "../utils.js";
  import Icon from "./Icon.svelte";
  import QueuePanel from "./QueuePanel.svelte";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  let track = $derived(state.player.current);
  let playing = $derived(state.player.status === "playing");
  let loading = $derived(state.player.status === "loading");
  let max = $derived(state.player.duration > 0 ? state.player.duration : 1);
  function numberFromControl(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }
</script>

{#if track !== null}
  <QueuePanel {state} {app} />
  <footer
    class="fixed right-0 bottom-0 left-64 z-30 min-h-[84px] border-t border-app-border bg-app-surface/95 px-5 py-3 shadow-[0_-10px_34px_rgb(46_46_42_/_0.1)] backdrop-blur-xl max-[1040px]:left-56 max-[1040px]:min-h-[132px] max-[1040px]:px-4"
    aria-label="Audio player"
  >
    <div
      class="grid grid-cols-[minmax(180px,0.9fr)_minmax(340px,1.45fr)_minmax(210px,0.9fr)] items-center gap-5 max-[1180px]:grid-cols-[minmax(150px,0.75fr)_minmax(300px,1.35fr)_minmax(180px,auto)] max-[1180px]:gap-4 max-[1040px]:grid-cols-[minmax(0,1fr)_auto] max-[1040px]:gap-x-3 max-[1040px]:gap-y-2"
    >
      <div class="player-track min-w-0" aria-live="polite">
        <p
          class="truncate text-sm font-bold {isMyanmarText(track.title) ? 'myanmar-text' : ''}"
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
          {track.teacherName || "Unknown teacher"}
        </p>
        <div class="mt-1 min-h-4">
          {#if state.player.error}<span
              class="inline-flex max-w-full items-center gap-2 text-[0.68rem] font-semibold text-error"
              role="alert"
              ><span class="truncate">{state.player.error}</span><button
                class="inline-flex min-h-10 shrink-0 items-center rounded-full border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] bg-transparent px-3 text-[0.65rem] font-bold text-inherit hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
                type="button"
                onclick={() => void app.retryPlayback()}>Retry</button
              ></span
            >{:else if loading}<span
              class="inline-flex max-w-full items-center gap-[0.4rem] text-[0.68rem] font-semibold text-app-primary"
              role="status"
              ><span class="size-2 animate-pulse rounded-full bg-app-primary motion-reduce:animate-none"
              ></span>Connecting…</span
            >{:else}<span
              class="inline-flex max-w-full items-center gap-[0.4rem] text-[0.68rem] font-semibold text-app-muted max-[980px]:truncate"
              >Space: play/pause · ←/→: seek</span
            >{/if}
        </div>
      </div>
      <div class="min-w-0 max-[1040px]:col-span-2 max-[1040px]:row-start-2">
        <div class="flex items-center justify-center gap-2" aria-label="Playback controls">
          <button
            class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed disabled:opacity-45 [&>span]:block [&>span]:size-5 [&_svg]:size-full"
            type="button"
            onclick={() => app.seekBy(-15)}
            aria-label="Jump back 15 seconds"
            title="Jump back 15 seconds"><span><Icon name="backward15" /></span></button
          >
          <button
            class="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-app-primary text-white shadow-[0_5px_14px_color-mix(in_srgb,var(--color-app-primary)_25%,transparent)] transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-primary-strong hover:shadow-[0_7px_18px_color-mix(in_srgb,var(--color-app-primary)_30%,transparent)] disabled:cursor-wait disabled:opacity-45 [&_svg]:size-full"
            type="button"
            onclick={() => void app.togglePlayback()}
            aria-label={loading ? "Connecting to audio" : playing ? "Pause" : "Play"}
            title={loading ? "Connecting to audio" : playing ? "Pause" : "Play"}
            aria-pressed={playing}
            disabled={loading}
            ><span class="block size-[21px] {playing ? '' : 'translate-x-px'}"
              ><Icon name={playing ? "pause" : "play"} /></span
            ></button
          >
          <button
            class="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed disabled:opacity-45 [&>span]:block [&>span]:size-5 [&_svg]:size-full"
            type="button"
            onclick={() => app.seekBy(15)}
            aria-label="Jump forward 15 seconds"
            title="Jump forward 15 seconds"><span><Icon name="forward15" /></span></button
          >
        </div>
        <div
          class="mt-[0.3rem] grid grid-cols-[3.4rem_minmax(90px,1fr)_3.4rem] items-center gap-[0.55rem] text-[0.68rem] text-app-muted tabular-nums max-[1040px]:grid-cols-[3rem_minmax(120px,1fr)_3rem] max-[1040px]:gap-2 [&>span:first-child]:text-right"
        >
          <span>{formatDuration(state.player.currentTime)}</span><input
            class="w-full min-w-0 accent-app-primary"
            type="range"
            min="0"
            {max}
            step="1"
            value={Math.min(state.player.currentTime, max)}
            oninput={(event) => app.seek(numberFromControl(event))}
            aria-label="Playback position"
          /><span>{formatDuration(state.player.duration)}</span>
        </div>
      </div>
      <div class="flex min-w-0 items-center justify-end gap-[0.55rem] max-[1040px]:col-start-2 max-[1040px]:row-start-1">
        <label title="Playback speed"
          ><span class="sr-only">Playback speed</span><select
            value={String(state.settings.playbackRate)}
            onchange={(event) => app.setRate(numberFromControl(event))}
            class="h-10 min-w-16 rounded-xl border border-app-border bg-app-bg py-0 pr-[1.6rem] pl-[0.65rem] text-xs font-bold text-app max-[1040px]:min-w-[58px] max-[1040px]:pr-[1.3rem] max-[1040px]:pl-2"
            aria-label="Playback speed"
            >{#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option
              >{/each}</select
          ></label
        >
        <label class="flex min-w-0 items-center gap-[0.4rem] max-[1040px]:gap-1" title="Volume"
          ><span class="block size-[18px] shrink-0 text-app-muted [&_svg]:size-full"
            ><Icon name="volume" /></span
          ><input
            class="w-[78px] min-w-[38px] accent-app-primary max-[1180px]:w-14 max-[1040px]:w-[54px]"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.settings.volume}
            oninput={(event) => app.setVolume(numberFromControl(event))}
            aria-label="Volume"
          /></label
        >
        <button
          class="relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app-primary aria-expanded:bg-app-soft aria-expanded:text-app-primary disabled:opacity-45 [&>span:first-child]:block [&>span:first-child]:size-[19px] [&_svg]:size-full"
          type="button"
          onclick={() => app.dispatch({ type: "toggle-queue" })}
          aria-label="Show queue"
          title="Show queue"
          aria-expanded={state.player.queueOpen}
          ><span><Icon name="queue" /></span>{#if state.player.queue.length > 0}<span
              class="absolute -top-[3px] -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-app-surface bg-app-primary text-[0.58rem] font-extrabold text-white"
              >{state.player.queue.length}</span
            >{/if}</button
        >
      </div>
    </div>
  </footer>
{/if}
