<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import { countLabel, t, tError } from "../i18n.js";
  import type { AppState } from "../types.js";
  import { isMyanmarText, truncateTrackTitle } from "../ui.js";
  import { formatLocaleDuration, formatLocaleNumber } from "../utils.js";
  import Icon from "./Icon.svelte";
  import QueuePanel from "./QueuePanel.svelte";
  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  let focusOpen = $state(false);
  let track = $derived(appState.player.current);
  let playing = $derived(appState.player.status === "playing");
  let loading = $derived(appState.player.status === "loading");
  let max = $derived(appState.player.duration > 0 ? appState.player.duration : 1);
  let locale = $derived(appState.settings.locale);
  let playerError = $derived(tError(locale, appState.player.error));
  let queueLabel = $derived(
    appState.player.queue.length === 0
      ? t(locale, "player.queue.show")
      : t(locale, "player.queue.showCount", {
          count: countLabel(locale, "talk", appState.player.queue.length)
        })
  );
  let playLabel = $derived(
    loading
      ? t(locale, "player.connectingTo")
      : playing
        ? t(locale, "player.pause")
        : t(locale, "player.play")
  );
  function closeFocusedOnEscape(event: KeyboardEvent): void {
    if (focusOpen && event.key === "Escape") focusOpen = false;
  }
  function numberFromControl(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
  }
  function clearError(): void {
    app.dispatch({ type: "set-player-error", message: "" });
  }
</script>

<svelte:window onkeydown={closeFocusedOnEscape} />
{#if track !== null}
  <QueuePanel state={appState} {app} />
  <footer
    class="fixed right-0 bottom-0 left-(--sidebar-offset) z-30 min-h-[84px] border-t border-app-border bg-app-surface px-5 py-3 shadow-player max-[1040px]:min-h-[132px] max-[1040px]:px-4 max-[1040px]:py-2 motion-safe:animate-[fade-in_180ms_ease-out] {focusOpen
      ? 'top-[var(--titlebar-height)] flex flex-col justify-center gap-9 overflow-y-auto'
      : ''}"
    aria-label={t(locale, "player.region")}
  >
    {#if focusOpen}
      <section
        class="mx-auto w-full max-w-3xl space-y-4 px-4 text-center"
        aria-label={t(locale, "player.focus")}
      >
        <p class="text-sm font-medium text-app-muted">{t(locale, "player.focus")}</p>
        <h2
          class="mx-auto max-w-2xl break-words text-[clamp(1.75rem,3.4vw,3.2rem)] font-semibold leading-[1.25] tracking-tight {isMyanmarText(
            track.title
          )
            ? 'myanmar-text'
            : ''}"
          lang={isMyanmarText(track.title) ? "my" : undefined}
        >
          {track.title}
        </h2>
        <p
          class="text-base text-app-muted {isMyanmarText(track.teacherName) ? 'myanmar-text' : ''}"
          lang={isMyanmarText(track.teacherName) ? "my" : undefined}
        >
          {track.teacherName || t(locale, "player.unknownTeacher")}
        </p>
      </section>
    {/if}
    <div
      class="grid {focusOpen
        ? 'mx-auto w-full max-w-[1100px]'
        : ''} grid-cols-[minmax(180px,0.9fr)_minmax(340px,1.45fr)_minmax(210px,0.9fr)] items-start gap-5 max-[1180px]:grid-cols-[minmax(150px,0.75fr)_minmax(300px,1.35fr)_minmax(180px,auto)] max-[1180px]:gap-4 max-[1040px]:grid-cols-[minmax(0,1fr)_auto] max-[1040px]:gap-x-3 max-[1040px]:gap-y-1"
    >
      <div class="player-track min-w-0 self-center" aria-live="polite">
        <button
          type="button"
          onclick={() => (focusOpen = !focusOpen)}
          aria-label={t(locale, focusOpen ? "player.closeFocus" : "player.focus")}
          aria-expanded={focusOpen}
          class="block w-full rounded text-left underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-app-primary"
          ><p
            class="line-clamp-2 break-words text-sm font-bold {appState.player.error
              ? 'max-[1040px]:hidden'
              : 'max-[1040px]:line-clamp-1'} {isMyanmarText(track.title) ? 'myanmar-text' : ''}"
            lang={isMyanmarText(track.title) ? "my" : undefined}
          >
            {truncateTrackTitle(track.title)}
          </p></button
        >
        <p
          class="truncate text-xs text-app-muted max-[1040px]:hidden {isMyanmarText(
            track.teacherName
          )
            ? 'myanmar-text'
            : ''}"
          lang={isMyanmarText(track.teacherName) ? "my" : undefined}
        >
          {track.teacherName || t(locale, "player.unknownTeacher")}
        </p>
        <div class="mt-1 min-h-4 max-[1040px]:mt-0">
          {#if appState.player.error}<span
              class="inline-flex max-w-full items-center gap-2 text-xs font-semibold text-error"
              role="alert"
              ><span class="truncate" title={playerError}>{playerError}</span><button
                class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] bg-transparent px-3 text-xs leading-normal font-bold text-inherit hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
                type="button"
                onclick={() => void app.retryPlayback()}>{t(locale, "player.retry")}</button
              ><button
                class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] bg-transparent px-3 text-xs leading-normal font-bold text-inherit hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
                type="button"
                onclick={clearError}>{t(locale, "player.dismiss")}</button
              ></span
            >{:else if loading}<span
              class="inline-flex max-w-full items-center gap-2 text-xs font-semibold text-app-primary"
              role="status"
              ><span
                class="size-2 animate-pulse rounded-full bg-app-primary motion-reduce:animate-none"
              ></span>{t(locale, "player.connecting")}</span
            >{:else}<span
              class="inline-flex max-w-full items-center gap-2 text-xs font-semibold text-app-muted max-[980px]:hidden"
              >{t(locale, "player.hint")}</span
            ><span
              class="hidden items-center text-xs font-semibold text-app-muted max-[980px]:inline-flex"
              aria-hidden="true">{t(locale, "player.hint.compact")}</span
            >{/if}
        </div>
      </div>
      <div
        class="player-transport grid min-w-0 grid-rows-[3rem_auto] gap-y-[0.3rem] self-start max-[1040px]:col-span-2 max-[1040px]:row-start-2 max-[1040px]:grid-rows-[2.75rem_auto] max-[1040px]:gap-y-1"
      >
        <div class="flex items-center justify-center gap-2" aria-label="Playback controls">
          <button
            class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed disabled:opacity-45 [&>span]:block [&>span]:size-5 [&_svg]:size-full"
            type="button"
            onclick={() => app.seekBy(-15)}
            aria-label={t(locale, "player.back15")}
            aria-keyshortcuts="ArrowLeft"
            title={t(locale, "player.back15")}><span><Icon name="backward15" /></span></button
          >
          <button
            class="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-app-primary text-app-primary-ink shadow-[0_4px_12px_color-mix(in_srgb,var(--color-app-primary)_25%,transparent)] transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-primary-strong hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--color-app-primary)_30%,transparent)] disabled:cursor-wait disabled:opacity-45 max-[1040px]:size-11 [&_svg]:size-full"
            type="button"
            onclick={() => void app.togglePlayback()}
            aria-label={playLabel}
            aria-keyshortcuts="Space"
            title={playLabel}
            aria-pressed={playing}
            disabled={loading}
            ><span class="block size-[21px] {playing ? '' : 'translate-x-px'}"
              ><Icon name={playing ? "pause" : "play"} /></span
            ></button
          >
          <button
            class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app disabled:cursor-not-allowed disabled:opacity-45 [&>span]:block [&>span]:size-5 [&_svg]:size-full"
            type="button"
            onclick={() => app.seekBy(15)}
            aria-label={t(locale, "player.forward15")}
            aria-keyshortcuts="ArrowRight"
            title={t(locale, "player.forward15")}><span><Icon name="forward15" /></span></button
          >
        </div>
        <div
          class="grid grid-cols-[3.4rem_minmax(90px,1fr)_3.4rem] items-center gap-[0.55rem] text-xs text-app-muted tabular-nums max-[1040px]:grid-cols-[3rem_minmax(120px,1fr)_3rem] max-[1040px]:gap-2 [&>span:first-child]:text-right"
        >
          <span>{formatLocaleDuration(appState.player.currentTime, locale)}</span><input
            class="w-full min-w-0 accent-app-primary"
            type="range"
            min="0"
            {max}
            step="5"
            value={Math.min(appState.player.currentTime, max)}
            oninput={(event) => app.seek(numberFromControl(event))}
            aria-label={t(locale, "player.position")}
            aria-keyshortcuts="Home End"
            aria-valuemin="0"
            aria-valuemax={Math.round(appState.player.duration)}
            aria-valuenow={Math.round(appState.player.currentTime)}
            aria-valuetext={t(locale, "player.position.value", {
              current: formatLocaleDuration(appState.player.currentTime, locale),
              duration: formatLocaleDuration(appState.player.duration, locale)
            })}
          /><span>{formatLocaleDuration(appState.player.duration, locale)}</span>
        </div>
      </div>
      <div
        class="player-actions flex min-w-0 items-center justify-end gap-[0.55rem] self-start max-[1040px]:col-start-2 max-[1040px]:row-start-1"
      >
        <label title={t(locale, "player.speed")}
          ><span class="sr-only">{t(locale, "player.speed")}</span><select
            value={String(appState.settings.playbackRate)}
            onchange={(event) => app.setRate(numberFromControl(event))}
            class="field-select h-11 min-w-16 rounded-control border border-app-border bg-app-bg py-0 pr-[1.95rem] pl-[0.65rem] text-xs font-bold text-app max-[1040px]:min-w-[58px] max-[1040px]:pr-[1.6rem] max-[1040px]:pl-2"
            >{#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option
              >{/each}</select
          ></label
        >
        <button
          class="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-app-muted transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95 hover:bg-app-soft hover:text-app-primary aria-expanded:bg-app-soft aria-expanded:text-app-primary disabled:opacity-45 [&>span:first-child]:block [&>span:first-child]:size-[19px] [&_svg]:size-full"
          type="button"
          onclick={() => app.dispatch({ type: "toggle-queue" })}
          aria-label={queueLabel}
          title={queueLabel}
          aria-expanded={appState.player.queueOpen}
          ><span><Icon name="queue" /></span>{#if appState.player.queue.length > 0}<span
              class="absolute -top-[3px] -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-app-surface bg-app-primary text-[0.58rem] font-extrabold text-app-primary-ink"
              aria-hidden="true">{formatLocaleNumber(appState.player.queue.length, locale)}</span
            >{/if}</button
        >
      </div>
    </div>
  </footer>
{/if}
