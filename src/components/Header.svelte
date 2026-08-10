<script lang="ts">
  import type { AppState } from "../types.js";
  import { routeLabel } from "../ui.js";
  let { state }: { state: AppState } = $props();
  let label = $derived(routeLabel(state.route, state.summary.data.totalAudio));
</script>
<header class="flex items-center gap-6 px-10 pb-4 pt-8"><div><p class="text-xs font-bold uppercase tracking-[0.2em] text-app-primary">{label.eyebrow}</p><h1 class="mt-1 text-3xl font-bold tracking-tight">{label.title}</h1></div></header>
