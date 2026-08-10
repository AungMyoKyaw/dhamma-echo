<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState } from "../types.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  function numberValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }
</script>

<section class="mx-auto max-w-3xl space-y-4">
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Playback</h2>
    <div class="mt-5 grid grid-cols-2 gap-4">
      <label class="text-sm font-bold"
        >Default speed<select
          class="mt-2 h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 font-normal"
          value={String(state.settings.playbackRate)}
          onchange={(event) => app.setRate(numberValue(event))}
          >{#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option>{/each}</select
        ></label
      ><label class="text-sm font-bold"
        >Default volume<span
          class="mt-2 flex h-12 items-center rounded-2xl border border-app-border bg-app-bg px-4"
          ><input
            class="range-accent w-full"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.settings.volume}
            oninput={(event) => app.setVolume(numberValue(event))}
            aria-label="Default volume"
          /></span
        ></label
      >
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-soft p-6">
    <h2 class="text-sm font-bold">Privacy</h2>
    <p class="mt-2 text-sm leading-6 text-app-muted">
      Favorites, history, playback position, and settings are stored locally. The bundled catalogue
      is read-only. Audio is requested from dhammadownload.com only when played.
    </p>
  </div>
</section>
