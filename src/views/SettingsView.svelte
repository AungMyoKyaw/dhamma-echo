<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import Icon from "../components/Icon.svelte";
  import KeyboardCheatsheet from "../components/KeyboardCheatsheet.svelte";
  import { t } from "../i18n.js";
  import type { AppLocale, AppState } from "../types.js";
  import { formatLocaleNumber } from "../utils.js";
  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(appState.settings.locale);
  const themes = [
    { value: "light", labelKey: "settings.theme.light" },
    { value: "dark", labelKey: "settings.theme.dark" },
    { value: "system", labelKey: "settings.theme.system" }
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
    <h2 class="text-lg font-semibold">{t(locale, "settings.language")}</h2>
    <p class="mt-1 text-sm text-app-muted">
      {t(locale, "settings.language.detail")}
    </p>
    <div
      class="mt-4 inline-flex rounded-control bg-app-soft p-1"
      role="group"
      aria-label={t(locale, "settings.language.group")}
    >
      {#each locales as option (option.value)}<button
          class="inline-flex min-h-11 items-center justify-center rounded-control px-5 text-sm leading-normal font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 {appState
            .settings.locale === option.value
            ? 'bg-app-surface text-app-primary'
            : 'text-app-muted'}"
          type="button"
          aria-pressed={appState.settings.locale === option.value}
          onclick={() => app.setLocale(option.value)}>{option.label}</button
        >{/each}
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-semibold">{t(locale, "settings.appearance")}</h2>
    <p class="mt-1 text-sm text-app-muted">{t(locale, "settings.appearance.detail")}</p>
    <div
      class="mt-4 inline-flex rounded-control bg-app-soft p-1"
      role="group"
      aria-label={t(locale, "settings.appearance.group")}
    >
      {#each themes as theme (theme.value)}<button
          class="inline-flex min-h-11 items-center justify-center rounded-control px-5 text-sm leading-normal font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 {appState
            .settings.theme === theme.value
            ? 'bg-app-surface text-app-primary'
            : 'text-app-muted'}"
          type="button"
          aria-pressed={appState.settings.theme === theme.value}
          onclick={() => app.setTheme(theme.value)}>{t(locale, theme.labelKey)}</button
        >{/each}
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-semibold">{t(locale, "settings.playback")}</h2>
    <p class="mt-1 text-sm text-app-muted">
      {t(locale, "settings.playback.detail")}
    </p>
    <div class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <label class="text-sm font-bold"
        >{t(locale, "settings.playback.speed")}
        <div class="mt-1 flex items-center gap-2">
          <select
            class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 font-normal"
            value={String(appState.settings.playbackRate)}
            onchange={(event) => app.setRate(numberValue(event))}
            >{#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option
              >{/each}</select
          >
          {#if appState.settings.playbackRate !== 1}<button
              type="button"
              onclick={resetRate}
              class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-app-border bg-transparent px-3 text-xs leading-normal font-bold text-app-muted hover:bg-app-soft hover:text-app"
              >{t(locale, "settings.playback.speed.reset")}</button
            >{/if}
        </div></label
      >
      <label class="text-sm font-bold"
        >{t(locale, "settings.playback.limit")}<select
          class="field-select mt-1 h-12 w-full rounded-control border border-app-border bg-app-bg px-4 font-normal"
          value={String(appState.settings.browseLimit)}
          onchange={(event) =>
            app.dispatch({
              type: "set-browse-limit",
              limit: numberValue(event) as 25 | 50 | 100
            })}
          >{#each browseLimits as limit (limit)}<option value={String(limit)}
              >{formatLocaleNumber(limit, locale)}</option
            >{/each}</select
        ></label
      >
    </div>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <h2 class="text-lg font-semibold">{t(locale, "settings.keyboard")}</h2>
    <p class="mt-1 text-sm text-app-muted">
      {t(locale, "settings.keyboard.detail")}
    </p>
    <button
      type="button"
      onclick={() => (helpOpen = true)}
      class="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98]"
      >{t(locale, "settings.keyboard.view")}</button
    >
  </div>
  <div class="rounded-card border border-app-border/70 bg-app-soft p-6">
    <div
      class="mb-3 flex size-9 items-center justify-center rounded-full bg-app-primary/12 text-app-primary"
    >
      <span class="size-5"><Icon name="leaf" /></span>
    </div>
    <h2 class="text-sm font-bold">{t(locale, "settings.privacy.title")}</h2>
    <p class="mt-2 text-sm leading-6 text-app-muted">
      {t(locale, "privacy.body.settings")}
      <code class="font-mono">dhammadownload.com</code>{t(locale, "privacy.body.settings.tail")}
    </p>
  </div>
  <div class="rounded-card border border-app-border bg-app-surface p-6">
    <button
      type="button"
      onclick={() => (aboutExpanded = !aboutExpanded)}
      aria-expanded={aboutExpanded}
      class="flex w-full items-center justify-between gap-2 text-left"
    >
      <h2 class="text-lg font-semibold">{t(locale, "settings.about")}</h2>
      <span class="text-xs font-bold tracking-wide text-app-muted uppercase">
        {aboutExpanded ? t(locale, "settings.about.hide") : t(locale, "settings.about.show")}
      </span>
    </button>
    {#if aboutExpanded}
      <div class="mt-3 space-y-2 text-sm leading-6 text-app-muted">
        <p>
          {t(locale, "settings.about.body1")}
        </p>
        <p>
          {t(locale, "settings.about.body2")}
        </p>
      </div>
    {/if}
  </div>
</section>

{#if helpOpen}<KeyboardCheatsheet {locale} onclose={() => (helpOpen = false)} />{/if}
