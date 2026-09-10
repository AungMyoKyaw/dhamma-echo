<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TeacherCard from "../components/TeacherCard.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import type { AppState, TeacherSummary } from "../types.js";
  import { t, tError } from "../i18n.js";
  import { orderTeachersFeaturedFirst } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let locale = $derived(state.settings.locale);
  let searching = $derived(state.teacherQuery.length > 0);
  let results = $derived(
    searching ? state.teacherResults : orderTeachersFeaturedFirst(state.teachers.data)
  );
  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const query = form.get("query");
    await app.searchTeachers(typeof query === "string" ? query : "");
  }
  async function clear(): Promise<void> {
    await app.searchTeachers("");
  }
  function open(teacher: TeacherSummary): void {
    void app.openTeacher(teacher.id, "teachers");
  }
</script>

{#if state.teachers.status === "error"}<AsyncState
    {locale}
    kind="error"
    detail={tError(locale, state.teachers.message)}
    onretry={() => void app.loadTeachers()}
  />
{:else if state.teachers.status !== "ready"}<AsyncState
    {locale}
    kind="loading"
    loadingLabel={t(locale, "teachers.loading")}
    shape="cards"
  />
{:else if state.teachers.data.length === 0}<AsyncState
    {locale}
    kind="empty"
    title={t(locale, "teachers.empty.title")}
    detail={t(locale, "teachers.empty.detail")}
  />
{:else}<section class="space-y-5">
    <form
      class="flex flex-wrap items-end gap-3 rounded-card border border-app-border bg-app-surface p-4"
      onsubmit={(event) => void submit(event)}
    >
      <TextSearchField
        label={t(locale, "search.teachers.label")}
        placeholder={t(locale, "search.teachers.placeholder")}
        value={state.teacherQuery}
        visibleLabel
        className="min-w-[260px] flex-[1_1_360px]"
        clearLabel={t(locale, "search.teachers.clear")}
        onclear={clear}
      /><button
        class="inline-flex h-12 min-h-11 items-center justify-center rounded-control bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        type="submit">{t(locale, "search.submit")}</button
      >
    </form>
    {#if searching && results.length === 0}<AsyncState
        {locale}
        kind="empty"
        title={t(locale, "teachers.empty.title.query", { query: state.teacherQuery })}
        detail={t(locale, "teachers.empty.detail.query")}
        actionLabel={t(locale, "teachers.empty.clear")}
        onaction={clear}
      />{:else}<div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {#each results as teacher (teacher.id)}<TeacherCard
            {teacher}
            {state}
            onselect={open}
          />{/each}
      </div>{/if}
  </section>{/if}
