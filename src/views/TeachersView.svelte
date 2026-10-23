<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TeacherCard from "../components/TeacherCard.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import type { AppState, TeacherSummary } from "../types.js";
  import { t, tError } from "../i18n.js";
  import { orderTeachersFeaturedFirst } from "../ui.js";
  let { state: appState, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(appState.settings.locale);
  let draftQuery = $state("");
  onMount(() => {
    draftQuery = appState.teacherQuery;
  });
  let pending = $state(false);
  let searchError = $state(false);
  let searchGeneration = 0;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let searching = $derived(appState.teacherQuery.length > 0);
  let results = $derived(
    searching ? appState.teacherResults : orderTeachersFeaturedFirst(appState.teachers.data)
  );
  function cancelPending(): void {
    if (searchTimer !== null) clearTimeout(searchTimer);
    searchTimer = null;
    pending = false;
  }
  async function runSearch(query: string): Promise<void> {
    const generation = ++searchGeneration;
    const outcome = await app.searchTeachers(query);
    if (generation !== searchGeneration) return;
    pending = false;
    searchError = outcome === "error";
  }
  function changeQuery(query: string): void {
    draftQuery = query;
    cancelPending();
    pending = true;
    searchError = false;
    searchTimer = setTimeout(() => {
      searchTimer = null;
      void runSearch(draftQuery);
    }, 250);
  }
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    cancelPending();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const query = form.get("query");
    draftQuery = typeof query === "string" ? query : "";
    pending = true;
    searchError = false;
    await runSearch(draftQuery);
  }
  async function clear(): Promise<void> {
    cancelPending();
    draftQuery = "";
    pending = true;
    searchError = false;
    await runSearch("");
  }
  onDestroy(() => {
    searchGeneration += 1;
    if (searchTimer !== null) {
      cancelPending();
      // Preserve pending query and results if navigation interrupts debounce.
      void app.searchTeachers(draftQuery);
    }
  });
  function open(teacher: TeacherSummary): void {
    void app.openTeacher(teacher.id, "teachers");
  }
</script>

{#if appState.teachers.status === "error"}<AsyncState
    {locale}
    kind="error"
    detail={tError(locale, appState.teachers.message)}
    onretry={() => void app.loadTeachers()}
  />
{:else if appState.teachers.status !== "ready"}<AsyncState
    {locale}
    kind="loading"
    loadingLabel={t(locale, "teachers.loading")}
    shape="cards"
  />
{:else if appState.teachers.data.length === 0}<AsyncState
    {locale}
    kind="empty"
    title={t(locale, "teachers.empty.title")}
    detail={t(locale, "teachers.empty.detail")}
  />
{:else}<section class="space-y-5">
    <form class="flex flex-wrap items-center gap-3" onsubmit={(event) => void submit(event)}>
      <TextSearchField
        label={t(locale, "search.teachers.label")}
        placeholder={t(locale, "search.teachers.placeholder")}
        value={draftQuery}
        onquerychange={changeQuery}
        className="min-w-[260px] flex-[1_1_360px]"
        clearLabel={t(locale, "search.teachers.clear")}
        onclear={clear}
      />
    </form>
    {#if pending}<p class="text-sm text-app-muted" role="status">
        {t(locale, "teachers.loading")}
      </p>{/if}
    {#if !pending && searchError}<AsyncState
        {locale}
        kind="error"
        detail={t(locale, "teachers.search.error")}
        onretry={() => {
          pending = true;
          void runSearch(draftQuery);
        }}
      />
    {:else if !pending && searching && results.length === 0}<AsyncState
        {locale}
        kind="empty"
        title={t(locale, "teachers.empty.title.query", { query: appState.teacherQuery })}
        detail={t(locale, "teachers.empty.detail.query")}
        actionLabel={t(locale, "teachers.empty.clear")}
        onaction={clear}
      />{:else if !pending}<div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {#each results as teacher (teacher.id)}<TeacherCard
            {teacher}
            state={appState}
            onselect={open}
          />{/each}
      </div>{/if}
  </section>{/if}
