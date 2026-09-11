<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import CollectionCard from "../components/CollectionCard.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import type { AppState, CollectionSummary } from "../types.js";
  import { t, tError } from "../i18n.js";
  import { groupCollectionsByTeacher } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(state.settings.locale);
  let groups = $derived(groupCollectionsByTeacher(state.collections.page.items, locale));
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
  <form class="flex flex-wrap items-center gap-3" onsubmit={(event) => void submit(event)}>
    <TextSearchField
      label={t(locale, "search.collections.label")}
      placeholder={t(locale, "search.collections.placeholder")}
      value={state.collectionSearch.query}
      className="min-w-[260px] flex-[1_1_360px]"
      clearLabel={t(locale, "search.collections.clearSearch")}
      onclear={clear}
    /><label class="min-w-[190px] flex-[0_1_240px]"
      ><span class="sr-only">{t(locale, "search.collections.teacher")}</span><select
        class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="teacherId"
        value={state.collectionSearch.teacherId === null
          ? ""
          : String(state.collectionSearch.teacherId)}
        ><option value="">{t(locale, "search.collections.allTeachers")}</option
        >{#each state.teachers.data as teacher (teacher.id)}<option value={String(teacher.id)}
            >{teacher.name}</option
          >{/each}</select
      ></label
    >
  </form>
  {#if hasFilters}<div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => void clearAll()}
        class="inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border bg-transparent px-3 text-xs leading-normal font-bold text-app-muted hover:bg-app-soft hover:text-app"
        >{t(locale, "search.collections.clear")}</button
      >
    </div>{/if}
  {#if state.collections.status === "error"}<AsyncState
      {locale}
      kind="error"
      detail={tError(locale, state.collections.message)}
      onretry={() => void app.searchCollections()}
    />
  {:else if state.collections.status !== "ready"}<AsyncState
      {locale}
      kind="loading"
      loadingLabel={t(locale, "collections.loading")}
      shape="cards"
    />
  {:else if state.collections.page.items.length === 0}<AsyncState
      {locale}
      kind="empty"
      title={state.collectionSearch.query.length > 0
        ? t(locale, "collections.empty.title.query", { query: state.collectionSearch.query })
        : t(locale, "collections.empty.title")}
      detail={t(locale, "collections.empty.detail")}
      actionLabel={hasFilters ? t(locale, "search.collections.clear") : ""}
      onaction={hasFilters
        ? () => {
            void clearAll();
          }
        : undefined}
    />
  {:else if state.collectionSearch.teacherId !== null}<div
      class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
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
          <h2 class="mb-3 text-lg font-semibold">{group.name}</h2>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
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
