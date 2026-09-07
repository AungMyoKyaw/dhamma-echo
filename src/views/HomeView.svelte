<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import Icon from "../components/Icon.svelte";
  import TeacherCard from "../components/TeacherCard.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, AudioTrack, Route, TeacherSummary } from "../types.js";
  import { featuredTeachers, isMyanmarText, truncateTrackTitle } from "../ui.js";
  import { formatLocaleDuration, formatLocaleNumber, pluralize } from "../utils.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let featured = $derived(featuredTeachers(state.teachers.data));
  let recentReady = $derived(state.homeRecent.status === "ready");
  let recentCount = $derived(state.homeRecent.tracks.length);
  let isFirstLaunch = $derived(recentReady && recentCount === 0);
  let totalAudio = $derived(state.summary.data.totalAudio);
  let totalTeachers = $derived(state.summary.data.totalTeachers);
  let locale = $derived(state.settings.locale);
  let catalogueSentence = $derived(
    `Search by title, teacher, language, or format across ${pluralize(totalAudio, "talk", undefined, locale)} and ${formatLocaleNumber(totalTeachers, locale)} teachers.`
  );
  function openTeacher(teacher: TeacherSummary): void {
    void app.openTeacher(teacher.id, "home");
  }
  function go(route: Route): void {
    app.dispatch({ type: "navigate", route });
  }
  async function play(track: AudioTrack): Promise<void> {
    if (state.player.current?.id === track.id && state.player.status === "playing") {
      await app.togglePlayback();
    } else if (state.player.current?.id === track.id) {
      // Already loaded; resume from where the engine is, not from the saved
      // resume value, so the user gets back exactly what they heard.
      await app.togglePlayback();
    } else {
      await app.playTrack(track);
    }
  }
</script>

{#if state.summary.status === "error"}
  <AsyncState kind="error" detail={state.summary.message} onretry={() => void app.loadSummary()} />
{:else}
  <section class="space-y-8">
    {#if state.homeRecent.status === "loading"}
      <section class="space-y-4">
        <h2 class="text-xl font-bold">Continue listening</h2>
        <div
          class="h-20 animate-pulse rounded-card bg-app-soft motion-reduce:animate-none"
          aria-hidden="true"
        ></div>
      </section>
    {:else if state.homeRecent.status === "error"}
      <AsyncState
        kind="error"
        title="Could not load your recent talks"
        detail={state.homeRecent.message}
        onretry={() => void app.loadRecent()}
      />
    {:else if isFirstLaunch}
      <section
        class="flex flex-col gap-5 rounded-card border border-app-secondary/30 bg-app-secondary/[0.06] p-6"
      >
        <p class="text-[11px] font-bold tracking-wide text-app-secondary uppercase">
          Welcome to Dhamma Echo
        </p>
        <h2 class="text-xl font-bold">Find something to listen to</h2>
        <p class="max-w-xl text-sm leading-6 text-app-muted">{catalogueSentence}</p>
        <div class="flex flex-wrap gap-3">
          <button
            class="inline-flex min-h-11 items-center justify-center rounded-control bg-app-primary px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98]"
            type="button"
            onclick={() => go("explore")}>Explore talks</button
          >
          <button
            class="inline-flex min-h-11 items-center justify-center rounded-control border border-app-border bg-transparent px-5 pt-0.5 pb-0 text-sm leading-none font-bold text-app-primary transition-[background-color,border-color,color] duration-150 hover:border-app-primary hover:bg-app-soft"
            type="button"
            onclick={() => go("teachers")}>Browse teachers</button
          >
        </div>
      </section>
    {:else if recentCount > 0}
      {@const latest = state.homeRecent.tracks[0]}
      {#if latest !== undefined}
        {@const rest = state.homeRecent.tracks
          .slice(1)
          .filter((track) => track.playable)
          .slice(0, 4)}
        {@const resume = state.library.resume[String(latest.id)] ?? 0}
        {@const playing =
          state.player.current?.id === latest.id && state.player.status === "playing"}
        {@const resumeLabel = resume > 0 ? formatLocaleDuration(resume, locale) : ""}
        <section class="space-y-4">
          <div>
            <h2 class="text-xl font-bold">Continue listening</h2>
            <p class="mt-1 text-sm text-app-muted">Pick up where you left off.</p>
          </div>
          <div
            class="flex items-center gap-4 overflow-hidden rounded-card border border-app-primary/25 bg-app-primary/[0.04] p-5"
          >
            <button
              class="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-primary text-app-primary-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={!latest.playable}
              onclick={() => void play(latest)}
              aria-label={playing
                ? `Pause ${latest.title}`
                : !latest.playable
                  ? `${latest.title} (not supported by the macOS player)`
                  : `Resume ${latest.title}`}
              aria-pressed={playing}
              title={!latest.playable
                ? "This format isn't supported by the macOS player."
                : undefined}
              ><span class="ml-0.5 size-6"><Icon name={playing ? "pause" : "play"} /></span></button
            >
            <div class="min-w-0">
              <h3
                class="line-clamp-2 break-words font-bold {isMyanmarText(latest.title)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(latest.title) ? "my" : undefined}
              >
                {truncateTrackTitle(latest.title)}
              </h3>
              <p
                class="mt-1 truncate text-sm text-app-muted {isMyanmarText(latest.teacherName)
                  ? 'myanmar-text'
                  : ''}"
                lang={isMyanmarText(latest.teacherName) ? "my" : undefined}
              >
                {latest.teacherName || "Unknown teacher"}{resume > 0
                  ? ` · Resume at ${resumeLabel}`
                  : ""}
              </p>
            </div>
          </div>
          {#if rest.length > 0}<div class="space-y-2">
              <h3 class="text-sm font-bold tracking-wide text-app-muted uppercase">
                Recently played
              </h3>
              <div class="overflow-hidden rounded-card border border-app-border bg-app-surface">
                {#each rest as track (track.id)}<TrackRow {track} {state} {app} />{/each}
              </div>
            </div>{/if}
        </section>
      {/if}
    {/if}
    <div>
      <div class="mb-4 flex items-end justify-between">
        <div>
          <h2 class="text-xl font-bold">Featured teachers</h2>
          <p class="mt-1 text-sm text-app-muted">
            Curated teachers to start listening. Tap to explore their talks.
          </p>
        </div>
        <button
          class="text-sm font-bold text-app-primary"
          type="button"
          onclick={() => go("teachers")}>View all</button
        >
      </div>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {#if state.teachers.status === "ready" && featured.length > 0}{#each featured as teacher (teacher.id)}<TeacherCard
              {teacher}
              {state}
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
