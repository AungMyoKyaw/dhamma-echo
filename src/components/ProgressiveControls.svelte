<script lang="ts">
  import { t, tError } from "../i18n.js";
  import type { AppLocale } from "../types.js";
  import { formatLocaleNumber } from "../utils.js";
  let {
    shown,
    total,
    nextLimit,
    loading,
    message,
    exhausted,
    noun,
    locale,
    onloadmore
  }: {
    shown: number;
    total: number;
    nextLimit: number;
    loading: boolean;
    message: string;
    exhausted: boolean;
    noun: "talks" | "collections";
    locale: AppLocale;
    onloadmore: () => void | Promise<void>;
  } = $props();
  let remaining = $derived(Math.max(0, total - shown));
  let nextCount = $derived(Math.min(nextLimit, remaining));
  let nounLabel = $derived(t(locale, noun === "talks" ? "noun.talks" : "noun.collections"));
  let localizedMessage = $derived(tError(locale, message));
</script>

<div
  class="flex flex-col items-center gap-3"
  aria-label={t(locale, "progress.pagination", { noun: nounLabel })}
>
  <div class="flex items-center justify-center">
    {#if remaining > 0 && !exhausted}<button
        class="inline-flex min-h-11 items-center justify-center rounded-control bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        disabled={loading}
        onclick={() => void onloadmore()}
        >{loading
          ? t(locale, "progress.loading")
          : t(locale, "progress.loadMore", { count: nextCount })}</button
      >{/if}
  </div>
  <div class="text-center" aria-live="polite">
    <p class="text-sm text-app-muted">
      {t(locale, "progress.showing", {
        shown: formatLocaleNumber(shown, locale),
        total: formatLocaleNumber(total, locale),
        noun: nounLabel
      })}
    </p>
    {#if localizedMessage}<p class="mt-1 text-xs text-error" role="alert">
        {localizedMessage}
      </p>{/if}
  </div>
</div>
