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
  let stats = $derived([
    { label: "Audio talks", value: state.summary.data.totalAudio, detail: "Ready to stream" },
    { label: "Teachers", value: state.summary.data.totalTeachers, detail: "Across traditions" },
    { label: "Myanmar", value: state.summary.data.myanmarAudio, detail: "Myanmar language" },
    { label: "English", value: state.summary.data.englishAudio, detail: "English language" }
  ]);
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
        <p class="text-xs font-bold uppercase tracking-wider text-app-primary">
          Continue listening
        </p>
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
            <p class="text-xs font-bold uppercase tracking-wider text-app-primary">
              Continue listening
            </p>
            <h2 class="mt-1 text-2xl font-bold">Pick up where you left off</h2>
          </div>
          <div
            class="relative flex items-center gap-4 overflow-hidden rounded-card border border-app-border bg-app-surface p-5 shadow-[0_1px_2px_rgb(46_46_42_/_0.04)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-app-primary"
          >
            <button
              class="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-primary text-white transition hover:opacity-90 {latest.playable
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
    {#if !hasRecent}<div class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        {#each stats as stat (stat.label)}<article
            class="rounded-card border border-app-border bg-app-surface p-5"
          >
            <p class="text-xs font-bold uppercase tracking-wider text-app-muted">{stat.label}</p>
            <p class="mt-2 text-3xl font-bold tracking-tight">
              {stat.value.toLocaleString("en-US")}
            </p>
            <p class="mt-1 text-xs text-app-muted">{stat.detail}</p>
          </article>{/each}
      </div>{/if}
    <div>
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-app-primary">Browse by voice</p>
          <h2 class="mt-1 text-2xl font-bold">Featured teachers</h2>
        </div>
        <button
          class="text-sm font-bold text-app-primary"
          type="button"
          onclick={() => app.dispatch({ type: "navigate", route: "teachers" })}>View all</button
        >
      </div>
      <div
        class={hasRecent
          ? "-mx-2 flex gap-4 overflow-x-auto px-2 pt-2 pb-4 [scrollbar-color:var(--color-app-border)_transparent] [scrollbar-width:thin]"
          : "grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"}
        data-featured-layout={hasRecent ? "carousel" : "grid"}
      >
        {#if state.teachers.status === "ready" && featured.length > 0}{#each featured as teacher (teacher.id)}<TeacherCard
              {teacher}
              carousel={hasRecent}
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
