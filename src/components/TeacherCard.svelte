<script lang="ts">
  import type { TeacherSummary } from "../types.js";
  import { isMyanmarText, truncateTeacherCardName } from "../ui.js";
  import { teacherAvatarDataUri } from "../teacherAvatar.js";
  let {
    teacher,
    onselect
  }: {
    teacher: TeacherSummary;
    onselect: (teacher: TeacherSummary) => void | Promise<void>;
  } = $props();
  let myanmar = $derived(isMyanmarText(teacher.name));
  let avatar = $derived(teacherAvatarDataUri(teacher.id));
  let displayName = $derived(truncateTeacherCardName(teacher.name));
</script>

<button
  class="group grid min-h-28 min-w-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-card border border-app-border bg-app-surface p-4 text-left transition-[border-color,background-color] duration-150 hover:border-app-primary/50 hover:bg-app-soft/35 focus-visible:border-app-primary/60"
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
</button>
