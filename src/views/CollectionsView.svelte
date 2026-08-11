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
  function open(collection: CollectionSummary): void {
    void app.openCollection(collection.id, "collections");
  }
</script>

<section class="space-y-5">
  <form
    class="flex flex-wrap gap-3 rounded-card border border-app-border bg-app-surface p-4"
    onsubmit={(event) => void submit(event)}
  >
    <TextSearchField
      label="Search collections"
      placeholder="Search collection name"
      value={state.collectionSearch.query}
      className="min-w-64 flex-1"
      onclear={clear}
    /><label
      ><span class="sr-only">Collection teacher</span><select
        class="h-12 max-w-64 rounded-2xl border border-app-border bg-app-bg px-4 text-sm"
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
      class="primary-button h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white"
      type="submit">Search</button
    >
  </form>
  {#if state.collections.status === "error"}<AsyncState
      kind="error"
      detail={state.collections.message}
      onretry={() => void app.searchCollections()}
    />
  {:else if state.collections.status !== "ready"}<AsyncState kind="loading" />
  {:else if state.collections.page.items.length === 0}<AsyncState
      kind="empty"
      title="No collections match"
      detail="Try a shorter collection name or clear the teacher filter."
    />
  {:else if state.collectionSearch.teacherId !== null}<div
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {#each state.collections.page.items as collection (collection.id)}<CollectionCard
          {collection}
          showTeacher={false}
          onselect={open}
        />{/each}
    </div>
  {:else}<div class="space-y-7">
      {#each groups as group (group.key)}<section>
          <h2 class="mb-3 text-lg font-bold" data-collection-group-heading>{group.name}</h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {#each group.items as collection (collection.id)}<CollectionCard
                {collection}
                showTeacher={false}
                onselect={open}
              />{/each}
          </div>
        </section>{/each}
    </div>{/if}
  {#if state.collections.status === "ready"}<ProgressiveControls
      shown={state.collections.page.items.length}
      total={state.collections.page.total}
      limit={state.collections.page.limit}
      loading={state.collections.loadingMore}
      message={state.collections.loadMoreMessage}
      exhausted={state.collections.exhausted}
      noun="collections"
      onloadmore={() => app.loadMoreCollections()}
      onlimit={async (limit: 25 | 50 | 100) => {
        app.setBrowseLimit(limit);
        await app.searchCollections();
      }}
    />{/if}
</section>
