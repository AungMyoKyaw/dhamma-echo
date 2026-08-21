<script lang="ts">
  type Kind = "loading" | "empty" | "error";
  type Shape = "rows" | "cards" | "detail";
  let {
    kind,
    title = "",
    detail = "",
    loadingLabel = "Loading content",
    shape = "rows",
    onretry
  }: {
    kind: Kind;
    title?: string;
    detail?: string;
    loadingLabel?: string;
    shape?: Shape;
    onretry?: () => void;
  } = $props();
  let rowCount = $derived(shape === "detail" ? 4 : 6);
  let cardCount = $derived(shape === "cards" ? 6 : 0);
  let rowSlots = $derived(Array.from({ length: rowCount }, (_, index) => index));
  let cardSlots = $derived(Array.from({ length: cardCount }, (_, index) => index));
</script>

{#if kind === "loading"}
  <div
    class="rounded-card border border-app-border bg-app-surface p-4 motion-reduce:animate-none"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={loadingLabel}
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
    <img src="./empty-library.svg" alt="" class="h-32 w-40" />
    <h2 class="mt-4 text-xl font-bold">{title}</h2>
    <p class="mt-2 max-w-sm text-sm leading-6 text-app-muted">{detail}</p>
  </div>
{:else}
  <div
    class="flex min-h-64 flex-col items-center justify-center rounded-card border border-[color-mix(in_srgb,var(--color-error)_35%,var(--color-app-border))] bg-error-soft p-8 text-center"
  >
    <h2 class="text-xl font-bold">This view needs another try</h2>
    <p class="mt-2 max-w-md text-sm text-app-muted">{detail}</p>
    {#if onretry !== undefined}<button
        class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-app-primary px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary-ink transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        onclick={onretry}>Try again</button
      >{/if}
  </div>
{/if}
