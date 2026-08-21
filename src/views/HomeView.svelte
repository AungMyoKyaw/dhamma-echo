<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import Icon from "../components/Icon.svelte";
  import TeacherCard from "../components/TeacherCard.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, AudioTrack, TeacherSummary } from "../types.js";
  import { featuredTeachers, isMyanmarText } from "../ui.js";
  import { formatDuration } from "../utils.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let featured = $derived(featuredTeachers(state.teachers.data));
  let hasRecent = $derived(
    state.homeRecent.status === "loading" ||
      (state.homeRecent.status === "ready" && state.homeRecent.tracks.length > 0)
  );
  let totalAudio = $derived(state.summary.data.totalAudio);
  let totalTeachers = $derived(state.summary.data.totalTeachers);
  let catalogueSentence = $derived(
    `Search by title, teacher, language, or format across ${totalAudio.toLocaleString("en-US")} talks and ${totalTeachers.toLocaleString("en-US")} teachers.`
  );
  function openTeacher(teacher: TeacherSummary): void {
    void app.openTeacher(teacher.id, "home");
  }
  async function play(track: AudioTrack): Promise<void> {
    if (state.player.current?.id === track.id) await app.togglePlayback();
    else await app.playTrack(track);
  }
</script>

{#if state.summary.status === "error"}
  <AsyncState kind="error" detail={state.summary.message} onretry={() => void app.loadSummary()} />
{:else}
  <section class="space-y-8">
    {#if state.homeRecent.status === "loading"}
      <section class="space-y-4">
        <h2 class="text-xl font-bold">Continue listening</h2>
        <div class="h-20 animate-pulse rounded-card bg-app-soft motion-reduce:animate-none"></div>
      </section>
    {:else if state.homeRecent.status === "ready" && state.homeRecent.tracks.length > 0}
      {@const latest = state.homeRecent.tracks[0]}
      {#if latest !== undefined}
        {@const rest = state.homeRecent.tracks
          .slice(1)
          .filter((track) => track.playable)
          .slice(0, 4)}
        {@const resume = state.library.resume[String(latest.id)] ?? 0}
        {@const playing =
          state.player.current?.id === latest.id && state.player.status === "playing"}
        <section class="space-y-4">
          <div>
            <h2 class="text-2xl font-bold">Continue listening</h2>
            <p class="mt-1 text-sm text-app-muted">Pick up where you left off.</p>
          </div>
          <div
            class="flex items-center gap-4 overflow-hidden rounded-card border border-app-primary/25 bg-app-primary/[0.04] p-5"
          >
            <button
              class="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-primary text-app-primary-ink transition hover:opacity-90 {latest.playable
                ? ''
                : 'cursor-not-allowed opacity-50'}"
              type="button"
              disabled={!latest.playable}
              onclick={() => void play(latest)}
              aria-label="Resume {latest.title}"
              ><span class="ml-0.5 size-6"><Icon name={playing ? "pause" : "play"} /></span></button
            >
            <div class="min-w-0">
              <h3
                class="truncate font-bold {isMyanmarText(latest.title) ? 'myanmar-text' : ''}"
                lang={isMyanmarText(latest.title) ? "my" : undefined}
              >
                {latest.title}
              </h3>
              <p
                class="mt-1 truncate text-sm text-app-muted {isMyanmarText(latest.teacherName)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(latest.teacherName) ? "my" : undefined}
              >
                {latest.teacherName || "Unknown teacher"}{resume > 0
                  ? ` · Resume at ${formatDuration(resume)}`
                  : ""}
              </p>
            </div>
          </div>
          {#if rest.length > 0}<div
              class="overflow-hidden rounded-card border border-app-border bg-app-surface"
            >
              {#each rest as track (track.id)}<TrackRow {track} {state} {app} />{/each}
            </div>{/if}
        </section>
      {/if}
    {/if}
    {#if !hasRecent}<section
        class="flex flex-wrap items-center justify-between gap-4 rounded-card border border-app-border bg-app-surface p-5"
      >
        <div>
          <h2 class="text-xl font-bold">Find something to listen to</h2>
          <p class="mt-1 max-w-xl text-sm leading-6 text-app-muted">{catalogueSentence}</p>
        </div>
        <button
          class="inline-flex min-h-11 items-center justify-center rounded-control bg-app-primary px-4 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98]"
          type="button"
          onclick={() => app.dispatch({ type: "navigate", route: "explore" })}>Explore talks</button
        >
      </section>
    {/if}
    <div>
      <div class="mb-4 flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-bold">Featured teachers</h2>
        </div>
        <button
          class="text-sm font-bold text-app-primary"
          type="button"
          onclick={() => app.dispatch({ type: "navigate", route: "teachers" })}>View all</button
        >
      </div>
      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
        data-featured-layout="grid"
      >
        {#if state.teachers.status === "ready" && featured.length > 0}{#each featured as teacher (teacher.id)}<TeacherCard
              {teacher}
              onselect={openTeacher}
            />{/each}{:else}<div
            class="rounded-card border border-dashed border-app-border bg-app-soft p-6 text-sm text-app-muted"
          >
            Teacher highlights will appear here when the catalogue is ready.
          </div>{/if}
      </div>
    </div>
  </section>
{/if}
