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
        class="h-16 animate-pulse rounded-2xl bg-app-soft"
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
    class="flex min-h-64 flex-col items-center justify-center rounded-card border border-red-300/40 bg-red-50/50 p-8 text-center"
  >
    <h2 class="text-xl font-bold">The library needs another try</h2>
    <p class="mt-2 max-w-md text-sm text-app-muted">{detail}</p>
    {#if onretry !== undefined}<button
        class="mt-5 rounded-full bg-app-primary px-5 py-2.5 text-sm font-bold text-white"
        type="button"
        onclick={onretry}>Try again</button
      >{/if}
  </div>
{/if}
