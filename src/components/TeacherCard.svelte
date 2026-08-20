<script lang="ts">
  import type { TeacherSummary } from "../types.js";
  import { isMyanmarText, truncateTeacherCardName } from "../ui.js";
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
  let myanmar = $derived(isMyanmarText(teacher.name));
  let avatar = $derived(teacherAvatarDataUri(teacher.id));
  let displayName = $derived(truncateTeacherCardName(teacher.name));
</script>

<button
  class="group {carousel
    ? 'flex min-h-56 min-w-72 flex-col'
    : 'grid min-h-28 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3'} h-full w-full overflow-hidden rounded-card border border-app-border bg-app-surface p-4 text-left transition-[border-color,background-color] duration-150 hover:border-app-primary/50 hover:bg-app-soft/35 focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(teacher)}
>
  {#if carousel}
    <div
      class="size-12 shrink-0 overflow-hidden rounded-full bg-app-soft ring-1 ring-app-border/60"
      aria-hidden="true"
    >
      <img src={avatar} alt="" class="block size-full object-cover" />
    </div>
    <div class="min-w-0">
      <p
        class="mt-4 break-words font-bold leading-6 {myanmar ? 'myanmar-text' : ''}"
        lang={myanmar ? "my" : undefined}
        title={teacher.name}
        aria-label={teacher.name}
      >
        {displayName}
      </p>
      <p class="mt-1 text-sm text-app-muted tabular-nums">
        {teacher.audioCount.toLocaleString("en-US")} talks
      </p>
    </div>
    <span class="mt-auto inline-flex items-center gap-1 pt-0.5 text-xs font-bold text-app-primary"
      >Browse talks <span class="size-4"><Icon name="chevron" /></span></span
    >
  {:else}
    <div
      class="size-12 shrink-0 overflow-hidden rounded-full bg-app-soft ring-1 ring-app-border/60"
      aria-hidden="true"
    >
      <img src={avatar} alt="" class="block size-full object-cover" />
    </div>
    <div class="min-w-0">
      <p
        class="break-words font-bold leading-6 {myanmar ? 'myanmar-text' : ''}"
        lang={myanmar ? "my" : undefined}
        title={teacher.name}
        aria-label={teacher.name}
      >
        {displayName}
      </p>
      <p class="mt-1 text-sm text-app-muted tabular-nums">
        {teacher.audioCount.toLocaleString("en-US")} talks
      </p>
    </div>
    <span class="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-app-primary"
      >Browse talks <span class="size-4"><Icon name="chevron" /></span></span
    >
  {/if}
</button>
