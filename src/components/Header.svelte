<script lang="ts">
  import type { AppState } from "../types.js";
  import { isMyanmarText, routeLabel } from "../ui.js";
  let { state }: { state: AppState } = $props();
  let label = $derived(routeLabel(state.route, state.settings.locale));
  let eyebrowMyanmar = $derived(isMyanmarText(label.eyebrow));
  let titleMyanmar = $derived(isMyanmarText(label.title));
  let detailMyanmar = $derived(isMyanmarText(label.detail));
</script>

<header class="px-10 pt-8 pb-5 max-[1040px]:px-6 max-[1040px]:pt-6">
  <div class="mx-auto max-w-[1520px]">
    <p
      class="text-xs font-bold tracking-[0.04em] text-app-muted uppercase {eyebrowMyanmar
        ? 'myanmar-text'
        : ''}"
      lang={eyebrowMyanmar ? "my" : undefined}
    >
      {label.eyebrow}
    </p>
    <h1
      class="mt-2 text-3xl font-semibold tracking-[-0.01em] max-[1040px]:text-[1.75rem] {titleMyanmar
        ? 'myanmar-text'
        : ''}"
      lang={titleMyanmar ? "my" : undefined}
    >
      {label.title}
    </h1>
    <p
      class="mt-2 max-w-2xl text-sm leading-6 text-app-muted {detailMyanmar ? 'myanmar-text' : ''}"
      lang={detailMyanmar ? "my" : undefined}
    >
      {label.detail}
    </p>
  </div>
</header>
