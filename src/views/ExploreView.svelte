<script lang="ts">
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
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(state.settings.locale);
  let category = $derived(
    state.categories.data.find((item) => item.id === state.search.categoryId)
  );
  let hasFilters = $derived(
    state.search.query.length > 0 ||
      state.search.language !== "all" ||
      state.search.format !== "all" ||
      state.search.categoryId !== null ||
      state.search.teacherId !== null ||
      state.search.collectionId !== null
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
    const previous = state.search.query;
    app.dispatch({ type: "set-query", query: "" });
    try {
      await app.search();
    } catch (error) {
      // Restore the previous query so the user is not silently left in an
      // empty state after a network failure.
      app.dispatch({ type: "set-query", query: previous });
      throw error;
    }
  }
  async function clearAll(): Promise<void> {
    app.dispatch({ type: "set-query", query: "" });
    app.dispatch({ type: "set-language", language: "all" });
    app.dispatch({ type: "set-format", format: "all" });
    app.dispatch({ type: "set-teacher", teacherId: null });
    app.dispatch({ type: "clear-category" });
    app.dispatch({ type: "clear-collection" });
    await app.search();
  }
  function setCategory(id: number | null): void {
    app.dispatch({ type: "set-category", categoryId: id });
    void app.search();
  }
</script>

<section class="space-y-5">
  <form
    class="flex flex-wrap items-end gap-3 rounded-card border border-app-border bg-app-surface p-4"
    onsubmit={(event) => void submit(event)}
  >
    <TextSearchField
      label={t(locale, "search.talks.label")}
      placeholder={t(locale, "search.talks.placeholder")}
      value={state.search.query}
      visibleLabel
      className="min-w-[280px] flex-[1_1_360px]"
      clearLabel={t(locale, "search.talks.clear")}
      onclear={clearQuery}
    />
    <label class="min-w-40 flex-[1_1_160px]"
      ><span class="mb-1.5 block text-xs font-bold tracking-wide text-app-muted uppercase"
        >{t(locale, "search.language")}</span
      ><select
        class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="language"
        value={state.search.language}
        ><option value="all">{t(locale, "search.language.all")}</option><option value="myanmar"
          >{t(locale, "search.language.myanmar")}</option
        ><option value="english">{t(locale, "search.language.english")}</option></select
      ></label
    >
    <label class="min-w-36 flex-[1_1_140px]"
      ><span class="mb-1.5 block text-xs font-bold tracking-wide text-app-muted uppercase">
        {t(locale, "search.format")}</span
      ><select
        class="field-select h-12 w-full rounded-control border border-app-border bg-app-bg px-4 text-sm"
        name="format"
        value={state.search.format}
        ><option value="all">{t(locale, "search.format.all")}</option><option value="mp3"
          >MP3</option
        ><option value="wma">WMA</option><option value="mp4"
          >{t(locale, "search.format.mp4")}</option
        ><option value="wmv">WMV</option></select
      ></label
    >
    <button
      class="inline-flex h-12 min-h-11 items-center justify-center rounded-control bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      type="submit">{t(locale, "search.submit")}</button
    >
    {#if state.categories.status === "ready"}<fieldset class="basis-full flex flex-wrap gap-2">
        <legend class="sr-only">{t(locale, "search.category.legend")}</legend>
        <button
          class="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 align-middle text-xs leading-normal font-bold transition-[background-color,color,border-color] duration-150 hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] {state
            .search.categoryId === null
            ? 'bg-app-primary text-app-primary-ink'
            : 'bg-app-soft text-app-muted'}"
          type="button"
          aria-pressed={state.search.categoryId === null}
          onclick={() => setCategory(null)}>{t(locale, "search.category.all")}</button
        >{#each state.categories.data as item (item.id)}<button
            class="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 align-middle text-xs leading-normal font-bold transition-[background-color,color,border-color] duration-150 hover:border-[color-mix(in_srgb,var(--color-app-primary)_45%,var(--color-app-border))] {state
              .search.categoryId === item.id
              ? 'bg-app-primary text-app-primary-ink'
              : 'bg-app-soft text-app-muted'}"
            type="button"
            aria-pressed={state.search.categoryId === item.id}
            onclick={() => setCategory(item.id)}
            >{item.name} · {formatLocaleNumber(item.count, locale)}</button
          >{/each}
      </fieldset>{/if}
  </form>
  {#if hasFilters}<div
      class="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={t(locale, "search.filters.active")}
    >
      {#if state.search.query.length > 0}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full bg-app-primary/10 px-4 text-xs leading-normal font-bold text-app-primary"
        >
          {t(locale, "search.filters.query", { query: state.search.query })}<button
            type="button"
            onclick={() => void clearQuery()}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--color-app-primary)_14%,transparent)]"
            aria-label={t(locale, "search.filters.clearQuery")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      {#if state.search.teacherId !== null}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full bg-app-primary/10 px-4 text-xs leading-normal font-bold text-app-primary"
        >
          {t(locale, "search.filters.teacher", { name: teacherFilterName(state) })}<button
            type="button"
            onclick={() => {
              app.dispatch({ type: "set-teacher", teacherId: null });
              void app.search();
            }}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--color-app-primary)_14%,transparent)]"
            aria-label={t(locale, "search.filters.clearTeacher")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      {#if category !== undefined}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full bg-app-primary/10 px-4 text-xs leading-normal font-bold text-app-primary"
        >
          {t(locale, "search.filters.category", { name: category.name })}<button
            type="button"
            onclick={() => {
              app.dispatch({ type: "clear-category" });
              void app.search();
            }}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--color-app-primary)_14%,transparent)]"
            aria-label={t(locale, "search.filters.clearCategory")}
            ><span class="block size-3"><Icon name="close" /></span></button
          >
        </div>{/if}
      {#if state.search.collectionId !== null}<div
          class="inline-flex min-h-11 items-center gap-2 rounded-full bg-app-primary/10 px-4 text-xs leading-normal font-bold text-app-primary"
        >
          {t(locale, "search.filters.collection")}<button
            type="button"
            onclick={() => {
              app.dispatch({ type: "clear-collection" });
              void app.search();
            }}
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--color-app-primary)_14%,transparent)]"
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
  {#if state.catalogue.status === "error"}<AsyncState
      {locale}
      kind="error"
      detail={tError(locale, state.catalogue.message)}
      onretry={() => void app.search()}
    />
  {:else if state.catalogue.status !== "ready"}<AsyncState
      {locale}
      kind="loading"
      loadingLabel={t(locale, "explore.loading")}
      shape="rows"
    />
  {:else if state.catalogue.page.items.length === 0}<AsyncState
      {locale}
      kind="empty"
      title={state.search.query.length > 0
        ? t(locale, "explore.empty.title.query", { query: state.search.query })
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
      {#each state.catalogue.page.items as track (track.id)}<TrackRow
          {track}
          {state}
          {app}
        />{/each}
    </div>{/if}
  {#if state.catalogue.status === "ready" && state.catalogue.page.total > 0}<ProgressiveControls
      shown={state.catalogue.page.items.length}
      total={state.catalogue.page.total}
      nextLimit={state.catalogue.nextLoadSize}
      loading={state.catalogue.loadingMore}
      message={state.catalogue.loadMoreMessage}
      exhausted={state.catalogue.exhausted}
      noun="talks"
      locale={state.settings.locale}
      onloadmore={() => app.loadMoreSearchResults()}
    />{/if}
</section>
