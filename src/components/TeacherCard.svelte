<script lang="ts">
  import type { AppState, TeacherSummary } from "../types.js";
  import { countLabel, t } from "../i18n.js";
  import { isCuratedFeaturedTeacher, isMyanmarText, truncateTeacherCardName } from "../ui.js";
  import { teacherAvatarDataUri } from "../teacherAvatar.js";
  let {
    teacher,
    state,
    onselect
  }: {
    teacher: TeacherSummary;
    state: AppState;
    onselect: (teacher: TeacherSummary) => void | Promise<void>;
  } = $props();
  let myanmar = $derived(isMyanmarText(teacher.name));
  let avatar = $derived(teacherAvatarDataUri(teacher.id));
  let displayName = $derived(truncateTeacherCardName(teacher.name));
  let featured = $derived(isCuratedFeaturedTeacher(teacher.id));
  let locale = $derived(state.settings.locale);
</script>

<button
  class="group grid min-h-28 min-w-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-card border p-4 text-left transition-[border-color,background-color] duration-150 {featured
    ? 'border-app-tertiary/40 bg-app-tertiary/[0.06] hover:border-app-tertiary/70'
    : 'border-app-border bg-app-surface hover:border-app-primary/50 hover:bg-app-soft/35'} focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(teacher)}
>
  <div
    class="size-12 shrink-0 overflow-hidden rounded-full bg-app-soft ring-1 ring-app-border/60"
    aria-hidden="true"
  >
    <img src={avatar} alt="" class="block size-full object-cover" />
  </div>
  <div class="min-w-0">
    {#if featured}<p class="text-[10px] font-bold tracking-wide text-app-tertiary uppercase">
        {t(locale, "teachers.featuredBadge")}
      </p>{/if}
    <p
      class="break-words font-bold leading-6 {myanmar ? 'myanmar-text' : ''}"
      lang={myanmar ? "my" : undefined}
      title={teacher.name}
      aria-label={teacher.name}
    >
      {displayName}
    </p>
    <p class="mt-1 text-sm text-app-muted tabular-nums">
      {countLabel(locale, "talk", teacher.audioCount)}
    </p>
  </div>
</button>
