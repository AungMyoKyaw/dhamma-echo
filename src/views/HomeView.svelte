<script lang="ts">
  import type { DhammaApp } from "../app.js";
  import AsyncState from "../components/AsyncState.svelte";
  import Icon from "../components/Icon.svelte";
  import TeacherCard from "../components/TeacherCard.svelte";
  import TrackRow from "../components/TrackRow.svelte";
  import type { AppState, AudioTrack, Route, TeacherSummary } from "../types.js";
  import { countLabel, t, tError } from "../i18n.js";
  import { featuredTeachers, isMyanmarText, truncateTrackTitle } from "../ui.js";
  import { formatLocaleDuration } from "../utils.js";
  let { state, app }: { state: AppState; app: DhammaApp } = $props();
  let featured = $derived(featuredTeachers(state.teachers.data));
  let recentReady = $derived(state.homeRecent.status === "ready");
  let recentCount = $derived(state.homeRecent.tracks.length);
  let isFirstLaunch = $derived(recentReady && recentCount === 0);
  let totalAudio = $derived(state.summary.data.totalAudio);
  let totalTeachers = $derived(state.summary.data.totalTeachers);
  let locale = $derived(state.settings.locale);
  let catalogueSentence = $derived(
    t(locale, "home.welcome.body", {
      talks: countLabel(locale, "talk", totalAudio),
      teachers: countLabel(locale, "teacher", totalTeachers)
    })
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
  <AsyncState
    {locale}
    kind="error"
    detail={tError(locale, state.summary.message)}
    onretry={() => void app.loadSummary()}
  />
{:else}
  <section class="space-y-8">
    {#if state.homeRecent.status === "loading"}
      <section class="space-y-4">
        <h2 class="text-xl font-bold">{t(locale, "home.continue")}</h2>
        <div
          class="h-20 animate-pulse rounded-card bg-app-soft motion-reduce:animate-none"
          aria-hidden="true"
        ></div>
      </section>
    {:else if state.homeRecent.status === "error"}
      <AsyncState
        {locale}
        kind="error"
        title={t(locale, "home.recent.error")}
        detail={tError(locale, state.homeRecent.message)}
        onretry={() => void app.loadRecent()}
      />
    {:else if isFirstLaunch}
      <section class="flex flex-col gap-5 rounded-card border border-app-border bg-app-soft p-6">
        <p class="text-[11px] font-bold tracking-wide text-app-muted uppercase">
          {t(locale, "home.welcome.eyebrow")}
        </p>
        <h2 class="text-xl font-bold">{t(locale, "home.welcome.title")}</h2>
        <p class="max-w-xl text-sm leading-6 text-app-muted">{catalogueSentence}</p>
        <div class="flex flex-wrap gap-3">
          <button
            class="inline-flex min-h-11 items-center justify-center rounded-control bg-app-primary px-5 text-sm leading-normal font-bold text-app-primary-ink transition-[background-color,color,transform] duration-150 enabled:hover:bg-app-primary-strong enabled:active:scale-[0.98]"
            type="button"
            onclick={() => go("explore")}>{t(locale, "home.welcome.explore")}</button
          >
          <button
            class="inline-flex min-h-11 items-center justify-center rounded-control border border-app-border bg-transparent px-5 text-sm leading-normal font-bold text-app transition-[background-color,border-color,color] duration-150 hover:border-app-primary hover:bg-app-soft"
            type="button"
            onclick={() => go("teachers")}>{t(locale, "home.welcome.teachers")}</button
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
            <h2 class="text-xl font-bold">{t(locale, "home.continue")}</h2>
            <p class="mt-1 text-sm text-app-muted">{t(locale, "home.continue.detail")}</p>
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
                ? t(locale, "home.pauseTrack", { title: latest.title })
                : !latest.playable
                  ? t(locale, "home.unsupportedTrack", { title: latest.title })
                  : t(locale, "home.resumeTrack", { title: latest.title })}
              aria-pressed={playing}
              title={!latest.playable ? t(locale, "home.unsupportedHint") : undefined}
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
                {latest.teacherName || t(locale, "player.unknownTeacher")}{resume > 0
                  ? ` · ${t(locale, "home.resumeAt", { time: resumeLabel })}`
                  : ""}
              </p>
            </div>
          </div>
          {#if rest.length > 0}<div class="space-y-2">
              <h3 class="text-sm font-bold tracking-wide text-app-muted uppercase">
                {t(locale, "home.recentlyPlayed")}
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
          <h2 class="text-xl font-bold">{t(locale, "home.featured")}</h2>
          <p class="mt-1 text-sm text-app-muted">
            {t(locale, "home.featured.detail")}
          </p>
        </div>
        <button
          class="inline-flex min-h-11 items-center text-sm font-bold text-app underline-offset-4 hover:underline"
          type="button"
          onclick={() => go("teachers")}>{t(locale, "home.featured.viewAll")}</button
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
            {t(locale, "home.featured.empty")}
          </div>{/if}
      </div>
    </div>
  </section>
{/if}
