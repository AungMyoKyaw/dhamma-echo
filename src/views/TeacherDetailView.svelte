<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import CollectionCard from "../components/CollectionCard.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, CollectionSummary } from "../types.js";
  import { isMyanmarText } from "../ui.js";
  import { pluralize } from "../utils.js";
  import { teacherAvatarDataUri } from "../teacherAvatar.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  function retry(): void {
    if (state.selectedTeacherId !== null)
      void app.openTeacher(
        state.selectedTeacherId,
        state.navigationContext?.returnRoute ?? "teachers"
      );
  }
  async function explore(): Promise<void> {
    const detail = state.teacherDetail.data;
    if (detail === null) return;
    app.dispatch({ type: "set-teacher", teacherId: detail.id });
    app.dispatch({ type: "navigate", route: "explore" });
    await app.search();
  }
  function open(collection: CollectionSummary): void {
    void app.openCollection(collection.id, "teacher-detail");
  }
</script>

<section class="space-y-6">
  <button
    class="inline-flex min-h-11 items-center justify-center rounded-full border border-app-border px-4 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] enabled:hover:bg-app-soft enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    type="button"
    onclick={() => app.dispatch({ type: "return-to-list" })}>← Back to Teachers</button
  >
  {#if state.teacherDetail.status === "error"}<AsyncState
      kind="error"
      detail={state.teacherDetail.message}
      onretry={retry}
    />
  {:else if state.teacherDetail.status !== "ready" || state.teacherDetail.data === null}<AsyncState
      kind="loading"
      loadingLabel="Loading teacher"
      shape="detail"
    />
  {:else}{@const detail = state.teacherDetail.data}
    {@const avatar = teacherAvatarDataUri(detail.id)}
    <div class="flex items-start gap-5 rounded-card border border-app-border bg-app-surface p-6">
      <div
        class="size-20 shrink-0 overflow-hidden rounded-full bg-app-soft ring-1 ring-app-border/60"
        aria-hidden="true"
      >
        <img src={avatar} alt="" class="block size-full object-cover" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-app-muted tabular-nums">
          {pluralize(detail.audioCount, "talk", undefined, state.settings.locale)}
        </p>
        <h2
          class="mt-2 text-2xl font-bold {isMyanmarText(detail.name) ? 'myanmar-text' : ''}"
          lang={isMyanmarText(detail.name) ? "my" : undefined}
        >
          {detail.name}
        </h2>
        <button
          class="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-app-primary px-4 pt-0.5 pb-0 text-xs leading-none font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          onclick={() => void explore()}>Explore this teacher's talks</button
        >
      </div>
    </div>
    {#if detail.collections.length > 0}<div>
        <h3 class="mb-3 text-lg font-bold">Collections</h3>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {#each detail.collections as collection (collection.id)}<CollectionCard
              {collection}
              {state}
              onselect={open}
            />{/each}
        </div>
      </div>{/if}
    <div>
      <h3 class="mb-3 text-lg font-bold">Talks</h3>
      {#if state.teacherTalks.status === "error"}<AsyncState
          kind="error"
          detail={state.teacherTalks.message}
          onretry={() => void app.loadTeacherTalks()}
        />{:else if state.teacherTalks.status !== "ready"}<AsyncState
          kind="loading"
          loadingLabel="Loading talks"
          shape="rows"
        />{:else if state.teacherTalks.page.items.length === 0}<AsyncState
          kind="empty"
          title={detail.audioCount > 0 ? "Loading more talks" : "No talks found"}
          detail={detail.audioCount > 0
            ? `This teacher has ${detail.audioCount} talks on file. Load more below to see them.`
            : "This teacher has no talks in the catalogue."}
        />{:else}<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
          {#each state.teacherTalks.page.items as track (track.id)}<TrackRow
              {track}
              {state}
              {app}
            />{/each}
        </div>{/if}{#if state.teacherTalks.status === "ready"}<div class="mt-4">
          <ProgressiveControls
            shown={state.teacherTalks.page.items.length}
            total={state.teacherTalks.page.total}
            nextLimit={state.teacherTalks.nextLoadSize}
            loading={state.teacherTalks.loadingMore}
            message={state.teacherTalks.loadMoreMessage}
            exhausted={state.teacherTalks.exhausted}
            noun="talks"
            locale={state.settings.locale}
            onloadmore={() => app.loadMoreTeacherTalks()}
          />
        </div>{/if}
    </div>{/if}
</section>
