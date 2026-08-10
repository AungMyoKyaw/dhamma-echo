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
  class="group flex min-w-0 flex-col rounded-card border border-app-border bg-app-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-app-primary/50 hover:shadow-lg"
  type="button"
  onclick={() => void onselect(collection)}
>
  <p class="font-bold leading-7 {myanmar ? 'myanmar-text' : ''}" lang={myanmar ? "my" : undefined}>
    {collection.name}
  </p>
  {#if showTeacher}<p class="mt-2 text-sm text-app-muted">
      {collection.teacherName || "Unknown teacher"}
    </p>{/if}
  <p class="mt-4 text-xs font-bold text-app-primary">
    {collection.audioCount.toLocaleString("en-US")} talks
  </p>
</button>
