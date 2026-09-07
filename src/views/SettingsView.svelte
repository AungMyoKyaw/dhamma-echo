<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import KeyboardCheatsheet from "../components/KeyboardCheatsheet.svelte";
  import type { AppLocale, AppState } from "../types.js";
  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ] as const;
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const browseLimits = [25, 50, 100] as const;
  const locales = [
    { value: "en-US", label: "English" },
    { value: "my-MM", label: "မြန်မာ" }
  ] as const satisfies { value: AppLocale; label: string }[];
  let helpOpen = $state(false);
  let aboutExpanded: boolean = $state(false);
  function numberValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }
  function resetRate(): void {
    app.setRate(1);
  }
</script>

<section class="mx-auto max-w-3xl space-y-4">
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Language</h2>
    <p class="mt-1 text-sm text-app-muted">
      Choose the language used for numbers and durations throughout the app.
    </p>
    <div
      class="mt-4 inline-flex rounded-control bg-app-soft p-1"
      role="group"
      aria-label="App language"
    >
      {#each locales as locale (locale.value)}<button
          class="inline-flex min-h-11 items-center justify-center rounded-control px-5 pt-0.5 pb-0 text-sm leading-none font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 {appState
            .settings.locale === locale.value
            ? 'bg-app-surface text-app-primary shadow-sm'
            : 'text-app-muted'}"
          type="button"
          aria-pressed={appState.settings.locale === locale.value}
          onclick={() => app.setLocale(locale.value)}>{locale.label}</button
        >{/each}
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Appearance</h2>
    <p class="mt-1 text-sm text-app-muted">Choose light, dark, or follow your operating system.</p>
    <div
      class="mt-4 inline-flex rounded-control bg-app-soft p-1"
      role="group"
      aria-label="Color theme"
    >
      {#each themes as theme (theme.value)}<button
          class="inline-flex min-h-11 items-center justify-center rounded-control px-5 pt-0.5 pb-0 text-sm leading-none font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 {appState
            .settings.theme === theme.value
            ? 'bg-app-surface text-app-primary shadow-sm'
            : 'text-app-muted'}"
          type="button"
          aria-pressed={appState.settings.theme === theme.value}
          onclick={() => app.setTheme(theme.value)}>{theme.label}</button
        >{/each}
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Playback</h2>
    <div class="mt-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <label class="text-sm font-bold"
        >Default speed
        <div class="mt-1 flex items-center gap-2">
          <select
            class="h-12 w-full rounded-control border border-app-border bg-app-bg px-4 font-normal"
            value={String(appState.settings.playbackRate)}
            onchange={(event) => app.setRate(numberValue(event))}
            >{#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option
              >{/each}</select
          >
          {#if appState.settings.playbackRate !== 1}<button
              type="button"
              onclick={resetRate}
              class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-app-border bg-transparent px-3 pt-0.5 pb-0 text-xs leading-none font-bold text-app-muted hover:bg-app-soft hover:text-app"
              >Reset</button
            >{/if}
        </div></label
      >
      <label class="text-sm font-bold"
        >Browse limit<span class="mt-1 block text-xs font-normal text-app-muted"
          >Talks loaded per page on Explore, Teachers, and Collections.</span
        ><select
          class="mt-1 h-12 w-full rounded-control border border-app-border bg-app-bg px-4 font-normal"
          value={String(appState.settings.browseLimit)}
          onchange={(event) =>
            app.dispatch({
              type: "set-browse-limit",
              limit: numberValue(event) as 25 | 50 | 100
            })}
          >{#each browseLimits as limit (limit)}<option value={String(limit)}>{limit}</option
            >{/each}</select
        ></label
      >
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-bold">Keyboard</h2>
    <p class="mt-1 text-sm text-app-muted">
      The app responds to a small set of keyboard shortcuts while listening.
    </p>
    <button
      type="button"
      onclick={() => (helpOpen = true)}
      class="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-app-primary px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98]"
      >View shortcuts</button
    >
  </div>
  <div class="rounded-card border border-app-border bg-app-soft p-6">
    <h2 class="text-sm font-bold">Privacy</h2>
    <p class="mt-2 text-sm leading-6 text-app-muted">
      Favorites, history, playback position, and settings are stored locally on this device. The
      bundled catalogue is read-only. Audio is requested from
      <code class="font-mono">dhammadownload.com</code> only when you press play. Downloads stay on this
      device until you remove them.
    </p>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <button
      type="button"
      onclick={() => (aboutExpanded = !aboutExpanded)}
      aria-expanded={aboutExpanded}
      class="flex w-full items-center justify-between gap-2 text-left"
    >
      <h2 class="text-lg font-bold">About Dhamma Echo</h2>
      <span class="text-xs font-bold tracking-wide text-app-muted uppercase">
        {aboutExpanded ? "Hide" : "Show"}
      </span>
    </button>
    {#if aboutExpanded}
      <div class="mt-3 space-y-2 text-sm leading-6 text-app-muted">
        <p>
          A quiet desktop library for Dhamma talks. PolyForm Noncommercial license. No accounts, no
          analytics, no telemetry.
        </p>
        <p>
          The catalogue is bundled with the application and refreshed only when you update the app.
        </p>
      </div>
    {/if}
  </div>
</section>

{#if helpOpen}<KeyboardCheatsheet onclose={() => (helpOpen = false)} />{/if}
