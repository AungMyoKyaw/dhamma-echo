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
  class="group flex {carousel
    ? 'min-h-56 min-w-72'
    : 'min-h-48 min-w-0'} h-full w-full flex-col overflow-hidden rounded-card border border-app-border bg-app-surface p-4 text-left transition-[border-color,background-color] duration-150 hover:border-app-primary/50 hover:bg-app-soft/35 focus-visible:border-app-primary/60"
  type="button"
  onclick={() => void onselect(teacher)}
>
  <div
    class="size-12 shrink-0 overflow-hidden rounded-full bg-app-soft ring-1 ring-app-border/60"
    aria-hidden="true"
  >
    <img src={avatar} alt="" class="block size-full object-cover" />
  </div>
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
  <span class="mt-auto inline-flex items-center gap-1 pt-0.5 text-xs font-bold text-app-primary"
    >Browse talks <span class="size-4"><Icon name="chevron" /></span></span
  >
</button>
