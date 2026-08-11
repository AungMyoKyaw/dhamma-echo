<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import Icon from "../components/Icon.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, FormatFilter, LanguageFilter } from "../types.js";
  import { teacherFilterName } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let category = $derived(
    state.categories.data.find((item) => item.id === state.search.categoryId)
  );
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const query = form.get("query");
    const language = form.get("language");
    const format = form.get("format");
    app.dispatch({ type: "set-query", query: typeof query === "string" ? query : "" });
    app.dispatch({
      type: "set-language",
      language: (typeof language === "string" ? language : "all") as LanguageFilter
    });
    app.dispatch({
      type: "set-format",
      format: (typeof format === "string" ? format : "all") as FormatFilter
    });
    await app.search();
  }
  async function clearQuery(): Promise<void> {
    app.dispatch({ type: "set-query", query: "" });
    await app.search();
  }
  function setCategory(id: number | null): void {
    app.dispatch({ type: "set-category", categoryId: id });
    void app.search();
  }
</script>

<section class="space-y-5">
  <form
    class="search-form gap-3 rounded-card border border-app-border bg-app-surface p-4"
    onsubmit={(event) => void submit(event)}
  >
    <TextSearchField
      label="Search talks"
      placeholder="Search title or teacher"
      value={state.search.query}
      onclear={clearQuery}
    />
    <label
      ><span class="sr-only">Language</span><select
        class="h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 text-sm"
        name="language"
        value={state.search.language}
        ><option value="all">All languages</option><option value="myanmar">Myanmar</option><option
          value="english">English</option
        ></select
      ></label
    >
    <label
      ><span class="sr-only">Format</span><select
        class="h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 text-sm"
        name="format"
        value={state.search.format}
        ><option value="all">All formats</option><option value="mp3">MP3</option><option value="wma"
          >WMA</option
        ></select
      ></label
    >
    <button
      class="primary-button h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white"
      type="submit">Search</button
    >
    {#if state.categories.status === "ready"}<div
        class="col-span-full flex flex-wrap gap-2"
        aria-label="Audio categories"
      >
        <button
          class="filter-pill rounded-full px-3 py-2 text-xs font-bold {state.search.categoryId ===
          null
            ? 'bg-app-primary text-white'
            : 'bg-app-soft text-app-muted'}"
          type="button"
          onclick={() => setCategory(null)}>All audio</button
        >{#each state.categories.data as item (item.id)}<button
            class="filter-pill rounded-full px-3 py-2 text-xs font-bold {state.search.categoryId ===
            item.id
              ? 'bg-app-primary text-white'
              : 'bg-app-soft text-app-muted'}"
            type="button"
            onclick={() => setCategory(item.id)}
            >{item.name} · {item.audioCount.toLocaleString("en-US")}</button
          >{/each}
      </div>{/if}
  </form>
  <div class="flex flex-wrap gap-2">
    {#if state.search.teacherId !== null}<div
        class="active-filter-pill rounded-full bg-app-primary/10 text-xs font-bold text-app-primary"
      >
        Teacher: {teacherFilterName(state)}<button
          type="button"
          onclick={() => {
            app.dispatch({ type: "set-teacher", teacherId: null });
            void app.search();
          }}
          class="filter-clear-button"
          aria-label="Clear teacher filter"><span><Icon name="close" /></span></button
        >
      </div>{/if}
    {#if category !== undefined}<div
        class="active-filter-pill rounded-full bg-app-primary/10 text-xs font-bold text-app-primary"
      >
        Category: {category.name}<button
          type="button"
          onclick={() => {
            app.dispatch({ type: "clear-category" });
            void app.search();
          }}
          class="filter-clear-button"
          aria-label="Clear category filter"><span><Icon name="close" /></span></button
        >
      </div>{/if}
    {#if state.search.collectionId !== null}<div
        class="active-filter-pill rounded-full bg-app-primary/10 text-xs font-bold text-app-primary"
      >
        Collection filter<button
          type="button"
          onclick={() => {
            app.dispatch({ type: "clear-collection" });
            void app.search();
          }}
          class="filter-clear-button"
          aria-label="Clear collection filter"><span><Icon name="close" /></span></button
        >
      </div>{/if}
  </div>
  {#if state.catalogue.status === "error"}<AsyncState
      kind="error"
      detail={state.catalogue.message}
      onretry={() => void app.search()}
    />
  {:else if state.catalogue.status !== "ready"}<AsyncState kind="loading" />
  {:else if state.catalogue.page.items.length === 0}<AsyncState
      kind="empty"
      title="No talks match these filters"
      detail="Try a shorter search or select a different language and format."
    />
  {:else}<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
      {#each state.catalogue.page.items as track (track.id)}<TrackRow
          {track}
          {state}
          {app}
        />{/each}
    </div>{/if}
  {#if state.catalogue.status === "ready" && state.catalogue.page.total > 0}<ProgressiveControls
      shown={state.catalogue.page.items.length}
      total={state.catalogue.page.total}
      limit={state.catalogue.page.limit}
      loading={state.catalogue.loadingMore}
      message={state.catalogue.loadMoreMessage}
      exhausted={state.catalogue.exhausted}
      noun="talks"
      onloadmore={() => app.loadMoreSearchResults()}
      onlimit={async (limit: 25 | 50 | 100) => {
        app.setBrowseLimit(limit);
        await app.search();
      }}
    />{:else}<p class="text-sm text-app-muted">Search the complete audio catalogue</p>{/if}
</section>
