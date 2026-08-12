<script lang="ts">
  let {
    shown,
    total,
    limit,
    loading,
    message,
    exhausted,
    noun,
    onloadmore,
    onlimit
  }: {
    shown: number;
    total: number;
    limit: number;
    loading: boolean;
    message: string;
    exhausted: boolean;
    noun: string;
    onloadmore: () => void | Promise<void>;
    onlimit: (limit: 25 | 50 | 100) => void | Promise<void>;
  } = $props();
  let remaining = $derived(Math.max(0, total - shown));
  let nextCount = $derived(Math.min(limit, remaining));

  function selectLimit(event: Event): void {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    if (value === 25 || value === 50 || value === 100) void onlimit(value);
  }
</script>

<div class="flex flex-col items-center gap-3" aria-label={`${noun} pagination`}>
  <div class="flex items-center gap-4">
    <label class="inline-flex items-center gap-2 text-sm text-app-muted">
      <span>Rows</span>
      <select
        class="h-10 rounded-xl border border-app-border bg-app-surface px-3 font-bold text-app"
        value={String(limit)}
        onchange={selectLimit}
        disabled={loading}
        aria-label={`Rows per ${noun} load`}
      >
        <option value="25">25</option><option value="50">50</option><option value="100">100</option>
      </select>
    </label>
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
    {#if message}<p class="mt-1 text-xs text-red-700">{message}</p>{/if}
  </div>
</div>
