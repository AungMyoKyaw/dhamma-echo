<script lang="ts">
  import type { AppState, CollectionSummary } from "../types.js";
  import { countLabel, t } from "../i18n.js";
  import { isMyanmarText } from "../ui.js";
  let {
    collection,
    showTeacher = true,
    state,
    onselect
  }: {
    collection: CollectionSummary;
    showTeacher?: boolean;
    state: AppState;
    onselect: (collection: CollectionSummary) => void | Promise<void>;
  } = $props();
  let myanmar = $derived(isMyanmarText(collection.name));
</script>

<button
  class="group flex min-w-0 flex-col gap-3 overflow-hidden rounded-card border border-app-border bg-app-surface p-4 text-left transition-[border-color,background-color] duration-150 hover:border-app-primary/50 hover:bg-app-soft/35 focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(collection)}
>
  <div class="flex flex-col gap-2">
    <p
      class="line-clamp-3 break-words font-bold leading-7 {myanmar ? 'myanmar-text' : ''}"
      lang={myanmar ? "my" : undefined}
    >
      {collection.name}
    </p>
    {#if showTeacher}<p
        class="text-sm text-app-muted {isMyanmarText(collection.teacherName) ? 'myanmar-text' : ''}"
        lang={isMyanmarText(collection.teacherName) ? "my" : undefined}
      >
        {collection.teacherName || t(state.settings.locale, "collections.unknownTeacher")}
      </p>{/if}
  </div>
  <p class="text-xs font-bold text-app-muted tabular-nums">
    {countLabel(state.settings.locale, "talk", collection.audioCount)}
  </p>
</button>
