<script lang="ts">
  let {
    shown,
    total,
    nextLimit,
    loading,
    message,
    exhausted,
    noun,
    onloadmore
  }: {
    shown: number;
    total: number;
    nextLimit: number;
    loading: boolean;
    message: string;
    exhausted: boolean;
    noun: string;
    onloadmore: () => void | Promise<void>;
  } = $props();
  let remaining = $derived(Math.max(0, total - shown));
  let nextCount = $derived(Math.min(nextLimit, remaining));
</script>

<div class="flex flex-col items-center gap-3" aria-label={`${noun} pagination`}>
  <div class="flex items-center justify-center">
    {#if remaining > 0 && !exhausted}<button
        class="inline-flex min-h-10 items-center justify-center rounded-full bg-app-primary px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-white transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        disabled={loading}
        onclick={() => void onloadmore()}
        >{loading ? "Loading…" : `Load ${nextCount.toLocaleString("en-US")} more`}</button
      >{/if}
  </div>
  <div class="text-center" aria-live="polite">
    <p class="text-sm text-app-muted">
      Showing {shown.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
      {noun}
    </p>
    {#if message}<p class="mt-1 text-xs text-error" role="alert">{message}</p>{/if}
  </div>
</div>
