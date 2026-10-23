<script lang="ts">
  import { onDestroy } from "svelte";
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import Icon from "../components/Icon.svelte";
  import ProgressiveControls from "../components/ProgressiveControls.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, FormatFilter, LanguageFilter } from "../types.js";
  import { t, tError } from "../i18n.js";
  import { teacherFilterName } from "../ui.js";
  import { formatLocaleNumber } from "../utils.js";
  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(appState.settings.locale);
  let draftQuery = $derived(appState.search.query);
  let queryPending = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  function cancelPending(): void {
    if (searchTimer !== null) clearTimeout(searchTimer);
    searchTimer = null;
    queryPending = false;
  }
  function changeQuery(value: string): void {
    draftQuery = value;
    cancelPending();
    queryPending = true;
    searchTimer = setTimeout(() => {
      searchTimer = null;
      queryPending = false;
      app.dispatch({ type: "set-query", query: draftQuery });
      void app.search();
    }, 250);
  }
  onDestroy(() => {
    if (searchTimer !== null) {
      cancelPending();
      app.dispatch({ type: "set-query", query: draftQuery });
    }
  });
  let category = $derived(
    appState.categories.data.find((item) => item.id === appState.search.categoryId)
  );
  let hasFilters = $derived(
    appState.search.query.length > 0 ||
      appState.search.language !== "all" ||
      appState.search.format !== "all" ||
      appState.search.categoryId !== null ||
      appState.search.teacherId !== null ||
      appState.search.collectionId !== null
  );
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    cancelPending();
    const query = form.get("query");
    const language = form.get("language");
    const format = form.get("format");
    draftQuery = typeof query === "string" ? query : "";
    app.dispatch({ type: "set-query", query: draftQuery });
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
    cancelPending();
    draftQuery = "";
    app.dispatch({ type: "set-query", query: "" });
    await app.search();
  }
  async function clearAll(): Promise<void> {
    cancelPending();
    draftQuery = "";
    app.dispatch({ type: "set-query", query: "" });
    app.dispatch({ type: "set-language", language: "all" });
    app.dispatch({ type: "set-format", format: "all" });
    app.dispatch({ type: "set-teacher", teacherId: null });
    app.dispatch({ type: "clear-category" });
    app.dispatch({ type: "clear-collection" });
    await app.search();
  }
  function changeFilter(kind: "language" | "format", value: string): void {
    cancelPending();
    if (draftQuery !== appState.search.query) {
      app.dispatch({ type: "set-query", query: draftQuery });
    }
    if (kind === "language") {
      app.dispatch({ type: "set-language", language: value as LanguageFilter });
    } else {
      app.dispatch({ type: "set-format", format: value as FormatFilter });
    }
    void app.search();
  }
  function setCategory(id: number | null): void {
    cancelPending();
    if (draftQuery !== appState.search.query) {
      app.dispatch({ type: "set-query", query: draftQuery });
    }
    app.dispatch({ type: "set-category", categoryId: id });
    void app.search();
  }
</script>

<section class="space-y-5">
  <form class="flex flex-wrap items-center gap-3" onsubmit={(event) => void submit(event)}>
    <TextSearchField
      label={t(locale, "search.talks.label")}
      placeholder={t(locale, "search.talks.placeholder")}
      value={draftQuery}
      onquerychange={changeQuery}
      className="min-w-[280px] flex-[1_1_360px]"
      clearLabel={t(locale, "search.talks.clear")}
      onclear={clearQuery}
    />
    <label class="min-w-40 flex-[1_1_160px]"
      ><span class="sr-only">{t(locale, "search.language")}</span><select
        class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="language"
        value={appState.search.language}
        onchange={(event) => changeFilter("language", event.currentTarget.value)}
        ><option value="all">{t(locale, "search.language.all")}</option><option value="myanmar"
          >{t(locale, "search.language.myanmar")}</option
        ><option value="english">{t(locale, "search.language.english")}</option></select
      ></label
    >
    <label class="min-w-36 flex-[1_1_140px]"
      ><span class="sr-only">{t(locale, "search.format")}</span><select
        class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="format"
        value={appState.search.format}
        onchange={(event) => changeFilter("format", event.currentTarget.value)}
        ><option value="all">{t(locale, "search.format.all")}</option><option value="mp3"
          >MP3</option
        ><option value="wma">WMA</option><option value="mp4"
          >{t(locale, "search.format.mp4")}</option
        ><option value="wmv">WMV</option></select
      ></label
    >
    {#if appState.categories.status === "ready"}<details
        class="group basis-full rounded-control border border-app-border/70 bg-app-surface/70 px-3 py-2"
      >
        <summary
          class="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-app-muted [&::-webkit-details-marker]:hidden"
          ><span>{t(locale, "search.category.browse")}</span><span
            class="size-4 transition-transform group-open:rotate-180"
            ><Icon name="chevron-down" /></span
          ></summary
        >
        <fieldset class="mt-3 flex flex-wrap gap-2 border-t border-app-border pt-3">
          <legend class="sr-only">{t(locale, "search.category.legend")}</legend>
          <button
            class="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 align-middle text-xs leading-normal font-bold transition-[background-color,color,border-color] duration-150 hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] {appState
              .search.categoryId === null
              ? 'bg-app-primary text-app-primary-ink'
              : 'bg-app-soft text-app-muted'}"
            type="button"
            aria-pressed={appState.search.categoryId === null}
            onclick={() => setCategory(null)}>{t(locale, "search.category.all")}</button
          >{#each appState.categories.data as item (item.id)}<button
              class="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 align-middle text-xs leading-normal font-bold transition-[background-color,color,border-color] duration-150 hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] {appState
                .search.categoryId === item.id
                ? 'bg-app-primary text-app-primary-ink'
                : 'bg-app-soft text-app-muted'}"
              type="button"
              aria-pressed={appState.search.categoryId === item.id}
              onclick={() => setCategory(item.id)}
              >{item.name} · {formatLocaleNumber(item.count, locale)}</button
            >{/each}
        </fieldset>
      </details>{/if}
  </form>
  {#if queryPending}<p class="text-sm text-app-muted" role="status">
      {t(locale, "explore.loading")}
    </p>{/if}
  {#if hasFilters}<div
      class="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={t(locale, "search.filters.active")}
    >
      {#if appState.search.query.length > 0}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border bg-app-soft px-4 text-xs leading-normal font-bold text-app-muted"
        >
          {t(locale, "search.filters.query", { query: appState.search.query })}<button
            type="button"
            onclick={() => void clearQuery()}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-app-surface"
            aria-label={t(locale, "search.filters.clearQuery")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      {#if appState.search.teacherId !== null}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border bg-app-soft px-4 text-xs leading-normal font-bold text-app-muted"
        >
          {t(locale, "search.filters.teacher", { name: teacherFilterName(appState) })}<button
            type="button"
            onclick={() => {
              app.dispatch({ type: "set-teacher", teacherId: null });
              void app.search();
            }}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-app-surface"
            aria-label={t(locale, "search.filters.clearTeacher")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      {#if category !== undefined}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border bg-app-soft px-4 text-xs leading-normal font-bold text-app-muted"
        >
          {t(locale, "search.filters.category", { name: category.name })}<button
            type="button"
            onclick={() => {
              app.dispatch({ type: "clear-category" });
              void app.search();
            }}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-app-surface"
            aria-label={t(locale, "search.filters.clearCategory")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      {#if appState.search.collectionId !== null}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border bg-app-soft px-4 text-xs leading-normal font-bold text-app"
        >
          {t(locale, "search.filters.collection")}<button
            type="button"
            onclick={() => {
              app.dispatch({ type: "clear-collection" });
              void app.search();
            }}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-app-surface"
            aria-label={t(locale, "search.filters.clearCollection")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      <button
        type="button"
        onclick={() => void clearAll()}
        class="inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border bg-transparent px-3 text-xs leading-normal font-bold text-app-muted hover:bg-app-soft hover:text-app"
        >{t(locale, "search.filters.clearAll")}</button
      >
    </div>{/if}
  {#if appState.catalogue.status === "error"}<AsyncState
      {locale}
      kind="error"
      detail={tError(locale, appState.catalogue.message)}
      onretry={() => void app.search()}
    />
  {:else if appState.catalogue.status !== "ready"}<AsyncState
      {locale}
      kind="loading"
      loadingLabel={t(locale, "explore.loading")}
      shape="rows"
    />
  {:else if appState.catalogue.page.items.length === 0}<AsyncState
      {locale}
      kind="empty"
      title={appState.search.query.length > 0
        ? t(locale, "explore.empty.title.query", { query: appState.search.query })
        : t(locale, "explore.empty.title.filters")}
      detail={hasFilters
        ? t(locale, "explore.empty.detail.filters")
        : t(locale, "explore.empty.detail.catalogue")}
      actionLabel={hasFilters ? t(locale, "search.filters.clearAll") : ""}
      onaction={hasFilters
        ? () => {
            void clearAll();
          }
        : undefined}
    />
  {:else}<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
      {#each appState.catalogue.page.items as track (track.id)}<TrackRow
          {track}
          state={appState}
          {app}
        />{/each}
    </div>{/if}
  {#if appState.catalogue.status === "ready" && appState.catalogue.page.total > 0}<ProgressiveControls
      shown={appState.catalogue.page.items.length}
      total={appState.catalogue.page.total}
      nextLimit={appState.catalogue.nextLoadSize}
      loading={appState.catalogue.loadingMore}
      message={appState.catalogue.loadMoreMessage}
      exhausted={appState.catalogue.exhausted}
      noun="talks"
      locale={appState.settings.locale}
      onloadmore={() => app.loadMoreSearchResults()}
    />{/if}
</section>
