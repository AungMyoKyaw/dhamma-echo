<script lang="ts">
  type Kind = "loading" | "empty" | "error";
  let {
    kind,
    title = "",
    detail = "",
    onretry
  }: { kind: Kind; title?: string; detail?: string; onretry?: () => void } = $props();
</script>

{#if kind === "loading"}
  <div
    class="space-y-3 rounded-card border border-app-border bg-app-surface p-4"
    aria-label="Loading talks"
  >
    {#each [0, 1, 2, 3, 4, 5] as row (row)}<div
        class="h-16 animate-pulse rounded-2xl bg-app-soft motion-reduce:animate-none"
      ></div>{/each}
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
    <h2 class="text-xl font-bold">The library needs another try</h2>
    <p class="mt-2 max-w-md text-sm text-app-muted">{detail}</p>
    {#if onretry !== undefined}<button
        class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-app-primary px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-white transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        onclick={onretry}>Try again</button
      >{/if}
  </div>
{/if}
