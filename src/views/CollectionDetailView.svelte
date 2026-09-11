<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState } from "../types.js";
  import { backLabel, countLabel, t, tError } from "../i18n.js";
  import { isMyanmarText } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(state.settings.locale);
  function retry(): void {
    if (state.selectedCollectionId !== null)
      void app.openCollection(
        state.selectedCollectionId,
        state.navigationContext?.returnRoute ?? "collections"
      );
  }
</script>

<section class="space-y-5">
  <button
    class="inline-flex min-h-11 items-center justify-center rounded-full border border-app-border px-4 text-sm leading-normal font-bold text-app-primary transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] enabled:hover:bg-app-soft enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    type="button"
    onclick={() => app.dispatch({ type: "return-to-list" })}
    >{backLabel(locale, state.navigationContext?.returnRoute)}</button
  >
  {#if state.collectionDetail.status === "error"}<AsyncState
      {locale}
      kind="error"
      detail={tError(locale, state.collectionDetail.message)}
      onretry={retry}
    />
  {:else if state.collectionDetail.status !== "ready" || state.collectionDetail.data === null}<AsyncState
      {locale}
      kind="loading"
      loadingLabel={t(locale, "collectionDetail.loading")}
      shape="detail"
    />
  {:else}{@const detail = state.collectionDetail.data}
    <div class="flex items-start gap-5 rounded-card border border-app-border bg-app-surface p-6">
      <div
        class="flex size-16 shrink-0 items-center justify-center rounded-control bg-app-secondary/15 text-app-secondary"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" class="size-8" fill="none" stroke="currentColor" stroke-width="2"
          ><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"
          ></path></svg
        >
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-app-muted tabular-nums">
          {countLabel(locale, "talk", detail.audioCount)}
        </p>
        <h2
          class="mt-2 text-2xl font-semibold {isMyanmarText(detail.name) ? 'myanmar-text' : ''}"
          lang={isMyanmarText(detail.name) ? "my" : undefined}
        >
          {detail.name}
        </h2>
        <p
          class="mt-2 text-sm text-app-muted {isMyanmarText(detail.teacherName)
            ? 'myanmar-text'
            : ''}"
          lang={isMyanmarText(detail.teacherName) ? "my" : undefined}
        >
          {detail.teacherName || t(locale, "collections.unknownTeacher")}
        </p>
        {#if detail.description !== null}<p
            class="mt-4 line-clamp-3 break-words text-sm leading-6 text-app-muted"
          >
            {detail.description}
          </p>{/if}
      </div>
    </div>
    {#if detail.tracks.length === 0}<AsyncState
        {locale}
        kind="empty"
        title={t(locale, "collectionDetail.empty.title")}
        detail={t(locale, "collectionDetail.empty.detail")}
      />{:else}<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
        {#each detail.tracks as track (track.id)}<TrackRow {track} {state} {app} />{/each}
      </div>{/if}{/if}
</section>
