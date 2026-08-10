<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState } from "../types.js";
  import { formatDuration } from "../utils.js";
  import Icon from "./Icon.svelte";
  import QueuePanel from "./QueuePanel.svelte";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  let track = $derived(state.player.current);
  let playing = $derived(state.player.status === "playing");
  let loading = $derived(state.player.status === "loading");
  let max = $derived(state.player.duration > 0 ? state.player.duration : 1);
  function numberFromControl(event: Event): number { return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value); }
</script>
{#if track !== null}
  <QueuePanel {state} {app} />
  <footer class="player-shell fixed bottom-0 left-64 right-0 z-30 border-t border-app-border bg-app-surface/95 px-5 py-3 shadow-player backdrop-blur-xl" aria-label="Audio player">
    <div class="player-grid">
      <div class="player-track min-w-0" aria-live="polite"><p class="truncate text-sm font-bold">{track.title}</p><p class="truncate text-xs text-app-muted">{track.teacherName || "Unknown teacher"}</p><div class="mt-1 min-h-4">{#if state.player.error}<span class="player-status player-status-error" role="alert"><span class="truncate">{state.player.error}</span><button class="player-retry-button" type="button" onclick={() => void app.retryPlayback()}>Retry</button></span>{:else if loading}<span class="player-status text-app-primary" role="status"><span class="size-2 animate-pulse rounded-full bg-app-primary"></span>Connecting…</span>{:else}<span class="player-status player-status-hint text-app-muted">Space: play/pause · ←/→: seek</span>{/if}</div></div>
      <div class="player-center">
        <div class="player-controls" aria-label="Playback controls">
          <button class="transport-button" type="button" onclick={() => app.seekBy(-15)} aria-label="Jump back 15 seconds" title="Jump back 15 seconds"><span><Icon name="backward15" /></span></button>
          <button class="transport-button transport-button-primary" type="button" onclick={() => void app.togglePlayback()} aria-label={loading ? "Connecting to audio" : playing ? "Pause" : "Play"} title={loading ? "Connecting to audio" : playing ? "Pause" : "Play"} aria-pressed={playing} disabled={loading}><span class="transport-primary-icon {playing ? '' : 'is-play'}"><Icon name={playing ? "pause" : "play"} /></span></button>
          <button class="transport-button" type="button" onclick={() => app.seekBy(15)} aria-label="Jump forward 15 seconds" title="Jump forward 15 seconds"><span><Icon name="forward15" /></span></button>
        </div>
        <div class="player-timeline"><span>{formatDuration(state.player.currentTime)}</span><input class="range-accent" type="range" min="0" {max} step="1" value={Math.min(state.player.currentTime, max)} oninput={(event) => app.seek(numberFromControl(event))} aria-label="Playback position" /><span>{formatDuration(state.player.duration)}</span></div>
      </div>
      <div class="player-session-controls">
        <label class="player-rate-control" title="Playback speed"><span class="sr-only">Playback speed</span><select value={String(state.settings.playbackRate)} onchange={(event) => app.setRate(numberFromControl(event))} aria-label="Playback speed">{#each rates as rate}<option value={String(rate)}>{rate}×</option>{/each}</select></label>
        <label class="player-volume-control" title="Volume"><span class="player-volume-icon"><Icon name="volume" /></span><input class="player-volume range-accent" type="range" min="0" max="1" step="0.05" value={state.settings.volume} oninput={(event) => app.setVolume(numberFromControl(event))} aria-label="Volume" /></label>
        <button class="queue-button" type="button" onclick={() => app.dispatch({ type: "toggle-queue" })} aria-label="Show queue" title="Show queue" aria-expanded={state.player.queueOpen}><span><Icon name="queue" /></span>{#if state.player.queue.length > 0}<span class="queue-count">{state.player.queue.length}</span>{/if}</button>
      </div>
    </div>
  </footer>
{/if}
