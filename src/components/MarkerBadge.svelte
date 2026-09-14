<script lang="ts">
  import { isMyanmarText } from "../ui.js";
  let { label }: { label: string } = $props();
  let myanmar = $derived(isMyanmarText(label));
</script>

<span
  class="inline-flex items-center rounded-full bg-app-marker-quiet px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-app-marker uppercase {myanmar
    ? 'myanmar-text'
    : ''}"
  lang={myanmar ? 'my' : undefined}
>
  {label}
</span>