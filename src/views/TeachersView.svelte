<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import TeacherCard from "../components/TeacherCard.svelte";
  import TextSearchField from "../components/TextSearchField.svelte";
  import type { AppState, TeacherSummary } from "../types.js";
  import { orderTeachersFeaturedFirst } from "../ui.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
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
    kind="error"
    detail={state.teachers.message}
    onretry={() => void app.loadTeachers()}
  />
{:else if state.teachers.status !== "ready"}<AsyncState kind="loading" />
{:else if state.teachers.data.length === 0}<AsyncState
    kind="empty"
    title="No teachers found"
    detail="The catalogue does not currently include teacher records."
  />
{:else}<section class="space-y-5">
    <form
      class="flex gap-3 rounded-card border border-app-border bg-app-surface p-4"
      onsubmit={(event) => void submit(event)}
    >
      <TextSearchField
        label="Search teachers"
        placeholder="Search teacher name"
        value={state.teacherQuery}
        className="flex-1"
        onclear={clear}
      /><button
        class="primary-button h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white"
        type="submit">Search</button
      >
    </form>
    {#if searching && results.length === 0}<AsyncState
        kind="empty"
        title="No teachers match"
        detail="Try a different spelling or a shorter name."
      />{:else}<div class="grid grid-cols-3 gap-4">
        {#each results as teacher (teacher.id)}<TeacherCard {teacher} onselect={open} />{/each}
      </div>{/if}
  </section>{/if}
