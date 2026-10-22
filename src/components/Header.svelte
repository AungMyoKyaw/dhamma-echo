<script lang="ts">
  import type { AppState } from "../types.js";
  import { t } from "../i18n.js";
  import { detectPlatform } from "../runtime.js";
  import { isMyanmarText, routeLabel } from "../ui.js";
  import Icon from "./Icon.svelte";

  let { state, onsearch }: { state: AppState; onsearch: () => void | Promise<void> } = $props();
  let label = $derived(routeLabel(state.route, state.settings.locale));
  let titleMyanmar = $derived(isMyanmarText(label.title));
  let detailMyanmar = $derived(isMyanmarText(label.detail));
  const shortcut = detectPlatform() === "macos" ? "⌘ F" : "Ctrl F";
</script>

<header class="px-9 pt-9 pb-5 max-[1040px]:px-6 max-[1040px]:pt-6">
  <div class="mx-auto flex max-w-[1520px] flex-wrap items-start justify-between gap-5">
    <div class="min-w-0">
      <h1
        class="max-w-3xl text-[clamp(1.65rem,2.4vw,2.55rem)] font-semibold leading-[1.2] tracking-[-0.025em] {titleMyanmar
          ? 'myanmar-text'
          : ''}"
        lang={titleMyanmar ? "my" : undefined}
      >
        {label.title}
      </h1>
      <p
        class="mt-2 max-w-2xl text-sm leading-6 text-app-muted {detailMyanmar
          ? 'myanmar-text'
          : ''}"
        lang={detailMyanmar ? "my" : undefined}
      >
        {label.detail}
      </p>
    </div>
    <button
      type="button"
      onclick={() => void onsearch()}
      class="group inline-flex min-h-11 shrink-0 items-center gap-3 rounded-control border border-app-border bg-app-surface px-3.5 py-2 text-sm font-medium text-app-muted transition-colors hover:border-app-primary/50 hover:text-app focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-app-primary"
      aria-label={t(state.settings.locale, "nav.explore")}
    >
      <span class="size-[18px]"><Icon name="explore" /></span>
      <span>{t(state.settings.locale, "nav.explore")}</span>
      <kbd
        class="rounded border border-app-border bg-app-soft px-1.5 py-0.5 font-sans text-[11px] leading-4 max-[1040px]:hidden"
        >{shortcut}</kbd
      >
    </button>
  </div>
</header>
