<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import CollectionCard from "../components/CollectionCard.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import type { AppState, CollectionSummary } from "../types.js";
  import { t, tError } from "../i18n.js";
  import { groupCollectionsByTeacher } from "../ui.js";
  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(appState.settings.locale);
  let draftQuery = $state("");
  onMount(() => {
    draftQuery = appState.collectionSearch.query;
  });
  let pending = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  function cancelPending(): void {
    if (searchTimer !== null) clearTimeout(searchTimer);
    searchTimer = null;
    pending = false;
  }
  function changeQuery(query: string): void {
    draftQuery = query;
    cancelPending();
    pending = true;
    searchTimer = setTimeout(() => {
      searchTimer = null;
      pending = false;
      app.dispatch({ type: "set-collection-query", query: draftQuery });
      void app.searchCollections();
    }, 250);
  }
  function changeTeacher(value: string): void {
    cancelPending();
    app.dispatch({ type: "set-collection-query", query: draftQuery });
    const id = value === "" ? null : Number(value);
    app.dispatch({
      type: "set-collection-teacher",
      teacherId: id !== null && Number.isSafeInteger(id) && id > 0 ? id : null
    });
    void app.searchCollections();
  }
  onDestroy(() => {
    if (searchTimer !== null) {
      cancelPending();
      // Resolve latest query when navigation preempts debounce.
      app.dispatch({ type: "set-collection-query", query: draftQuery });
      void app.searchCollections();
    }
  });
  let groups = $derived(groupCollectionsByTeacher(appState.collections.page.items, locale));
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    cancelPending();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const teacherId = form.get("teacherId");
    const query = form.get("query");
    draftQuery = typeof query === "string" ? query : "";
    const raw = typeof teacherId === "string" ? teacherId : "";
    const parsedTeacherId = raw === "" ? null : Number(raw);
    app.dispatch({ type: "set-collection-query", query: draftQuery });
    app.dispatch({
      type: "set-collection-teacher",
      teacherId:
        parsedTeacherId !== null && Number.isSafeInteger(parsedTeacherId) && parsedTeacherId > 0
          ? parsedTeacherId
          : null
    });
    await app.searchCollections();
  }
  async function clear(): Promise<void> {
    cancelPending();
    draftQuery = "";
    app.dispatch({ type: "set-collection-query", query: "" });
    await app.searchCollections();
  }
  async function clearAll(): Promise<void> {
    cancelPending();
    draftQuery = "";
    app.dispatch({ type: "set-collection-query", query: "" });
    app.dispatch({ type: "set-collection-teacher", teacherId: null });
    await app.searchCollections();
  }
  let hasFilters = $derived(
    appState.collectionSearch.query.length > 0 || appState.collectionSearch.teacherId !== null
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
      value={draftQuery}
      onquerychange={changeQuery}
      className="min-w-[260px] flex-[1_1_360px]"
      clearLabel={t(locale, "search.collections.clearSearch")}
      onclear={clear}
    /><label class="min-w-[190px] flex-[0_1_240px]"
      ><span class="sr-only">{t(locale, "search.collections.teacher")}</span><select
        class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="teacherId"
        value={appState.collectionSearch.teacherId === null
          ? ""
          : String(appState.collectionSearch.teacherId)}
        onchange={(event) => changeTeacher(event.currentTarget.value)}
        ><option value="">{t(locale, "search.collections.allTeachers")}</option
        >{#each appState.teachers.data as teacher (teacher.id)}<option value={String(teacher.id)}
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
  {#if pending}<p class="text-sm text-app-muted" role="status">
      {t(locale, "collections.loading")}
    </p>{/if}
  {#if !pending && appState.collections.status === "error"}<AsyncState
      {locale}
      kind="error"
      detail={tError(locale, appState.collections.message)}
      onretry={() => void app.searchCollections()}
    />
  {:else if pending || appState.collections.status !== "ready"}<AsyncState
      {locale}
      kind="loading"
      loadingLabel={t(locale, "collections.loading")}
      shape="cards"
    />
  {:else if appState.collections.page.items.length === 0}<AsyncState
      {locale}
      kind="empty"
      title={appState.collectionSearch.query.length > 0
        ? t(locale, "collections.empty.title.query", { query: appState.collectionSearch.query })
        : t(locale, "collections.empty.title")}
      detail={t(locale, "collections.empty.detail")}
      actionLabel={hasFilters ? t(locale, "search.collections.clear") : ""}
      onaction={hasFilters
        ? () => {
            void clearAll();
          }
        : undefined}
    />
  {:else if appState.collectionSearch.teacherId !== null}<div
      class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
    >
      {#each appState.collections.page.items as collection (collection.id)}<CollectionCard
          {collection}
          state={appState}
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
                state={appState}
                showTeacher={false}
                onselect={open}
              />{/each}
          </div>
        </section>{/each}
    </div>{/if}
  {#if appState.collections.status === "ready"}<ProgressiveControls
      shown={appState.collections.page.items.length}
      total={appState.collections.page.total}
      nextLimit={appState.collections.nextLoadSize}
      loading={appState.collections.loadingMore}
      message={appState.collections.loadMoreMessage}
      exhausted={appState.collections.exhausted}
      noun="collections"
      locale={appState.settings.locale}
      onloadmore={() => app.loadMoreCollections()}
    />{/if}
</section>
