<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import type { AppState } from "../types.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ] as const;
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  function numberValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }
</script>

<section class="mx-auto max-w-3xl space-y-4">
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Appearance</h2>
    <p class="mt-1 text-sm text-app-muted">Choose light, dark, or follow your operating system.</p>
    <div class="mt-4 inline-flex rounded-2xl bg-app-soft p-1" aria-label="Color theme">
      {#each themes as theme (theme.value)}<button
          class="inline-flex min-h-11 items-center justify-center rounded-xl px-5 pt-0.5 pb-0 text-sm leading-none font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 {state
            .settings.theme === theme.value
            ? 'bg-app-surface text-app-primary shadow-sm'
            : 'text-app-muted'}"
          type="button"
          aria-pressed={state.settings.theme === theme.value}
          onclick={() => app.setTheme(theme.value)}>{theme.label}</button
        >{/each}
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Playback</h2>
    <div class="mt-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <label class="text-sm font-bold"
        >Default speed<select
          class="mt-2 h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 font-normal"
          value={String(state.settings.playbackRate)}
          onchange={(event) => app.setRate(numberValue(event))}
          >{#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option>{/each}</select
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
