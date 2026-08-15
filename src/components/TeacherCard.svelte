<script lang="ts">
  import type { TeacherSummary } from "../types.js";
  import { isCuratedFeaturedTeacher, isMyanmarText, truncateTeacherCardName } from "../ui.js";
  import { teacherAvatarDataUri } from "../teacherAvatar.js";
  import Icon from "./Icon.svelte";
  let {
    teacher,
    carousel = false,
    onselect
  }: {
    teacher: TeacherSummary;
    carousel?: boolean;
    onselect: (teacher: TeacherSummary) => void | Promise<void>;
  } = $props();
  let featured = $derived(isCuratedFeaturedTeacher(teacher.id));
  let myanmar = $derived(isMyanmarText(teacher.name));
  let avatar = $derived(teacherAvatarDataUri(teacher.id));
  let displayName = $derived(truncateTeacherCardName(teacher.name));
</script>

<button
  class="group flex h-80 w-full {carousel
    ? 'min-w-72'
    : 'min-w-0'} flex-col overflow-hidden rounded-card border border-app-border bg-app-surface p-5 text-left shadow-[0_1px_2px_rgb(46_46_42_/_0.04)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-app-primary/50 hover:shadow-[0_10px_28px_rgb(46_46_42_/_0.09)] focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(teacher)}
>
  <div
    class="size-12 shrink-0 overflow-hidden rounded-full bg-app-soft ring-1 ring-app-border/60"
    aria-hidden="true"
  >
    <img src={avatar} alt="" class="block size-full object-cover" />
  </div>
  <div class="mt-4 h-[22px] shrink-0">
    {#if featured}<span
        class="inline-flex h-[22px] w-fit items-center justify-center rounded-full bg-app-primary/10 px-2 pt-0.5 pb-0 text-[10px] leading-none font-bold tracking-wide text-app-primary uppercase"
        >Featured</span
      >{/if}
  </div>
  <p
    class="mt-1 break-words font-bold leading-7 {myanmar ? 'myanmar-text' : ''}"
    lang={myanmar ? "my" : undefined}
    title={teacher.name}
    aria-label={teacher.name}
  >
    {displayName}
  </p>
  <p class="mt-2 text-sm text-app-muted tabular-nums">
    {teacher.audioCount.toLocaleString("en-US")} talks
  </p>
  <span class="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-app-primary"
    >Browse talks <span class="size-4"><Icon name="chevron" /></span></span
  >
</button>
