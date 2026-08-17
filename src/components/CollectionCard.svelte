<script lang="ts">
  import type { CollectionSummary } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  let {
    collection,
    showTeacher = true,
    onselect
  }: {
    collection: CollectionSummary;
    showTeacher?: boolean;
    onselect: (collection: CollectionSummary) => void | Promise<void>;
  } = $props();
  let myanmar = $derived(isMyanmarText(collection.name));
</script>

<button
  class="group flex h-full min-h-44 min-w-0 flex-col overflow-hidden rounded-card border border-app-border bg-app-surface p-5 text-left transition-[border-color,background-color] duration-150 hover:border-app-primary/50 hover:bg-app-soft/35 focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(collection)}
>
  <p class="font-bold leading-7 {myanmar ? 'myanmar-text' : ''}" lang={myanmar ? "my" : undefined}>
    {collection.name}
  </p>
  {#if showTeacher}<p
      class="mt-2 text-sm text-app-muted {isMyanmarText(collection.teacherName)
        ? 'myanmar-text'
        : ''}"
      lang={isMyanmarText(collection.teacherName) ? "my" : undefined}
    >
      {collection.teacherName || "Unknown teacher"}
    </p>{/if}
  <p class="mt-auto pt-4 text-xs font-bold text-app-primary tabular-nums">
    {collection.audioCount.toLocaleString("en-US")} talks
  </p>
</button>
