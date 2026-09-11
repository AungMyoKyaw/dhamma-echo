<script lang="ts">
  import { t } from "../i18n.js";
  import type { AppLocale } from "../types.js";
  type Kind = "loading" | "empty" | "error";
  type Shape = "rows" | "cards" | "detail";
  let {
    kind,
    title = "",
    detail = "",
    loadingLabel = undefined,
    shape = "rows",
    errorTitle = undefined,
    illustration = "./empty-library.svg",
    actionLabel = undefined as string | undefined,
    onaction = undefined as (() => void) | undefined,
    onretry = undefined as (() => void) | undefined,
    locale = "en-US"
  }: {
    kind: Kind;
    title?: string;
    detail?: string;
    loadingLabel?: string | undefined;
    shape?: Shape;
    errorTitle?: string | undefined;
    illustration?: string;
    actionLabel?: string | undefined;
    onaction?: (() => void) | undefined;
    onretry?: (() => void) | undefined;
    locale?: AppLocale;
  } = $props();
  let rowCount = $derived(shape === "detail" ? 4 : 6);
  let cardCount = $derived(shape === "cards" ? 6 : 0);
  let rowSlots = $derived(Array.from({ length: rowCount }, (_, index) => index));
  let cardSlots = $derived(Array.from({ length: cardCount }, (_, index) => index));
  let showAction = $derived(
    kind === "empty" && actionLabel !== undefined && onaction !== undefined
  );
</script>

{#if kind === "loading"}
  <div
    class="rounded-card border border-app-border bg-app-surface p-4 motion-reduce:animate-none"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={loadingLabel ?? t(locale, "async.loading")}
  >
    {#if shape === "detail"}
      <div class="space-y-3">
        <div class="h-3 w-24 animate-pulse rounded-control bg-app-soft"></div>
        <div class="h-7 w-2/3 animate-pulse rounded-control bg-app-soft"></div>
        <div class="h-3 w-full max-w-md animate-pulse rounded-control bg-app-soft"></div>
        <div class="h-3 w-5/6 max-w-md animate-pulse rounded-control bg-app-soft"></div>
      </div>
    {:else if shape === "cards"}
      <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {#each cardSlots as index (index)}<div
            class="h-32 animate-pulse rounded-card bg-app-soft"
          ></div>{/each}
      </div>
    {:else}
      <div class="space-y-3">
        {#each rowSlots as index (index)}<div
            class="h-16 animate-pulse rounded-control bg-app-soft"
          ></div>{/each}
      </div>
    {/if}
  </div>
{:else if kind === "empty"}
  <div
    class="flex min-h-80 flex-col items-center justify-center rounded-card border border-dashed border-app-border bg-app-surface p-8 text-center"
  >
    <img src={illustration} alt="" class="h-32 w-40" />
    <h2 class="mt-4 text-xl font-semibold">{title}</h2>
    <p class="mt-2 max-w-sm text-sm leading-6 text-app-muted">{detail}</p>
    {#if showAction}
      {@const label = actionLabel ?? ""}
      <button
        class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98]"
        type="button"
        onclick={() => onaction?.()}>{label}</button
      >
    {/if}
  </div>
{:else}
  <div
    class="flex min-h-64 flex-col items-center justify-center rounded-card border border-[color-mix(in_srgb,var(--color-error)_35%,var(--color-app-border))] bg-error-soft p-8 text-center"
  >
    <h2 class="text-xl font-semibold">{errorTitle ?? t(locale, "async.error.title")}</h2>
    <p class="mt-2 max-w-md text-sm text-app-muted">{detail}</p>
    {#if onretry !== undefined}<button
        class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        onclick={onretry}>{t(locale, "async.retry")}</button
      >{/if}
  </div>
{/if}
