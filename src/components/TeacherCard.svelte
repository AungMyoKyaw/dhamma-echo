<script lang="ts">
  import type { TeacherSummary } from "../types.js";
  import { isCuratedFeaturedTeacher, isMyanmarText } from "../ui.js";
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
</script>

<button
  class="group flex h-full w-full {carousel
    ? 'min-w-64'
    : 'min-w-0'} min-h-[13rem] flex-col rounded-card border border-app-border bg-app-surface p-5 text-left shadow-[0_1px_2px_rgb(46_46_42_/_0.04)] transition-[transform,border-color,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:border-app-primary/50 hover:shadow-[0_10px_28px_rgb(46_46_42_/_0.09)] focus-visible:-translate-y-0.5 focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(teacher)}
>
  <div
    class="flex size-12 items-center justify-center rounded-full bg-app-secondary/15 text-lg font-bold text-app-secondary"
  >
    {teacher.name.charAt(0)}
  </div>
  {#if featured}<span
      class="mt-4 inline-flex min-h-[22px] w-fit items-center justify-center rounded-full bg-app-primary/10 px-2 pt-0.5 pb-0 align-middle text-[10px] leading-none font-bold tracking-wide text-app-primary uppercase"
      >Featured</span
    >{/if}
  <p
    class="{featured ? 'mt-3' : 'mt-4'} font-bold leading-7 {myanmar ? 'myanmar-text' : ''}"
    lang={myanmar ? "my" : undefined}
  >
    {teacher.name}
  </p>
  <p class="mt-2 text-sm text-app-muted tabular-nums">
    {teacher.audioCount.toLocaleString("en-US")} talks
  </p>
  <span class="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-app-primary"
    >Browse talks <span class="size-4"><Icon name="chevron" /></span></span
  >
</button>
