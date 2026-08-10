<script lang="ts">
  let {
    shown,
    total,
    limit,
    loading,
    message,
    exhausted,
    noun,
    onloadmore
  }: {
    shown: number;
    total: number;
    limit: number;
    loading: boolean;
    message: string;
    exhausted: boolean;
    noun: string;
    onloadmore: () => void | Promise<void>;
  } = $props();
  let remaining = $derived(Math.max(0, total - shown));
  let nextCount = $derived(Math.min(limit, remaining));
  let label = $derived(
    loading
      ? "Loading more…"
      : message
        ? "Retry"
        : `Load ${nextCount.toLocaleString("en-US")} more ${noun}`
  );
</script>

<div class="flex flex-col items-center gap-2" role="status">
  <p class="text-sm text-app-muted">
    Showing {shown.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
    {noun}
  </p>
  {#if message}<p class="text-sm text-red-700">{message}</p>{/if}
  {#if remaining > 0 && !exhausted}<button
      class="rounded-full border border-app-border px-5 py-2 text-sm font-bold text-app-primary disabled:opacity-50"
      type="button"
      disabled={loading}
      onclick={() => void onloadmore()}>{label}</button
    >{/if}
</div>
