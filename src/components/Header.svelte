<script lang="ts">
  import type { AppState } from "../types.js";
  import { routeLabel } from "../ui.js";
  let { state }: { state: AppState } = $props();
  let label = $derived(routeLabel(state.route, state.summary.data.totalAudio));
</script>

<header class="px-10 pt-8 pb-5 max-[1040px]:px-6 max-[1040px]:pt-6">
  <div class="mx-auto max-w-[1520px]">
    <p class="text-xs font-bold uppercase tracking-[0.2em] text-app-primary">{label.eyebrow}</p>
    <h1 class="mt-1 text-3xl font-bold tracking-tight max-[1040px]:text-[1.75rem]">
      {label.title}
    </h1>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-app-muted">{label.detail}</p>
  </div>
</header>
