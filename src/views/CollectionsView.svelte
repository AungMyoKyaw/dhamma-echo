<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import CollectionCard from "../components/CollectionCard.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import type { AppState, CollectionSummary } from "../types.js";
  import { groupCollectionsByTeacher } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let groups = $derived(groupCollectionsByTeacher(state.collections.page.items));
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const teacherId = form.get("teacherId");
    const query = form.get("query");
    const raw = typeof teacherId === "string" ? teacherId : "";
    const parsedTeacherId = raw === "" ? null : Number(raw);
    app.dispatch({ type: "set-collection-query", query: typeof query === "string" ? query : "" });
    app.dispatch({
      type: "set-collection-teacher",
      teacherId:
        parsedTeacherId !== null && Number.isInteger(parsedTeacherId) && parsedTeacherId > 0
          ? parsedTeacherId
          : null
    });
    await app.searchCollections();
  }
  async function clear(): Promise<void> {
    app.dispatch({ type: "set-collection-query", query: "" });
    await app.searchCollections();
  }
  async function clearAll(): Promise<void> {
    app.dispatch({ type: "set-collection-query", query: "" });
    app.dispatch({ type: "set-collection-teacher", teacherId: null });
    await app.searchCollections();
  }
  let hasFilters = $derived(
    state.collectionSearch.query.length > 0 || state.collectionSearch.teacherId !== null
  );
  function open(collection: CollectionSummary): void {
    void app.openCollection(collection.id, "collections");
  }
</script>

<section class="space-y-5">
  <form
    class="flex flex-wrap items-end gap-3 rounded-card border border-app-border bg-app-surface p-4"
    onsubmit={(event) => void submit(event)}
  >
    <TextSearchField
      label="Search collections"
      placeholder="Search collection name"
      value={state.collectionSearch.query}
      visibleLabel
      className="min-w-[260px] flex-[1_1_360px]"
      onclear={clear}
    /><label class="min-w-[190px] flex-[0_1_240px]"
      ><span class="mb-1.5 block text-xs font-bold tracking-wide text-app-muted uppercase"
        >Collection teacher</span
      ><select
        class="h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="teacherId"
        value={state.collectionSearch.teacherId === null
          ? ""
          : String(state.collectionSearch.teacherId)}
        ><option value="">All teachers</option
        >{#each state.teachers.data as teacher (teacher.id)}<option value={String(teacher.id)}
            >{teacher.name}</option
          >{/each}</select
      ></label
    ><button
      class="inline-flex h-12 min-h-11 items-center justify-center rounded-control bg-app-primary px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      type="submit">Search</button
    >
  </form>
  {#if hasFilters}<div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => void clearAll()}
        class="inline-flex min-h-10 items-center gap-2 rounded-full border border-app-border bg-transparent px-3 pt-0.5 pb-0 text-xs leading-none font-bold text-app-muted hover:bg-app-soft hover:text-app"
        >Clear filters</button
      >
    </div>{/if}
  {#if state.collections.status === "error"}<AsyncState
      kind="error"
      detail={state.collections.message}
      onretry={() => void app.searchCollections()}
    />
  {:else if state.collections.status !== "ready"}<AsyncState
      kind="loading"
      loadingLabel="Loading collections"
      shape="cards"
    />
  {:else if state.collections.page.items.length === 0}<AsyncState
      kind="empty"
      title={state.collectionSearch.query.length > 0
        ? `No collections match “${state.collectionSearch.query}”`
        : "No collections match"}
      detail="Try a shorter collection name or clear the teacher filter."
      actionLabel={hasFilters ? "Clear filters" : ""}
      onaction={hasFilters
        ? () => {
            void clearAll();
          }
        : undefined}
    />
  {:else if state.collectionSearch.teacherId !== null}<div
      class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
    >
      {#each state.collections.page.items as collection (collection.id)}<CollectionCard
          {collection}
          {state}
          showTeacher={false}
          onselect={open}
        />{/each}
    </div>
  {:else}<div class="space-y-7">
      {#each groups as group (group.key)}<section>
          <h2 class="mb-3 text-lg font-bold">{group.name}</h2>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {#each group.items as collection (collection.id)}<CollectionCard
                {collection}
                {state}
                showTeacher={false}
                onselect={open}
              />{/each}
          </div>
        </section>{/each}
    </div>{/if}
  {#if state.collections.status === "ready"}<ProgressiveControls
      shown={state.collections.page.items.length}
      total={state.collections.page.total}
      nextLimit={state.collections.nextLoadSize}
      loading={state.collections.loadingMore}
      message={state.collections.loadMoreMessage}
      exhausted={state.collections.exhausted}
      noun="collections"
      locale={state.settings.locale}
      onloadmore={() => app.loadMoreCollections()}
    />{/if}
</section>
