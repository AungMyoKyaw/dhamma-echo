<script lang="ts">
  import { t, type MessageKey } from "../i18n.js";
  import type { AppLocale } from "../types.js";
  import Icon from "./Icon.svelte";
  let { locale, onclose }: { locale: AppLocale; onclose: () => void } = $props();
  let dialog: HTMLDialogElement;
  // `data-platform` is set on <html> by `applyPlatformClass()` in runtime.ts.
  // macOS shows the ⌘ glyph in keycaps; Windows and Linux show "Ctrl".
  let platform = $state<string>("browser");
  let modifier = $derived(platform === "macos" ? "⌘" : "Ctrl");
  type Shortcut =
    | { kind: "single"; keys: string[]; action: MessageKey }
    | { kind: "modifier"; modifier: string; key: string; action: MessageKey };
  const shortcuts: Shortcut[] = $derived([
    { kind: "single", keys: ["Space"], action: "shortcuts.playPause" },
    { kind: "single", keys: ["←"], action: "shortcuts.back15" },
    { kind: "single", keys: ["Shift", "←"], action: "shortcuts.back60" },
    { kind: "single", keys: ["→"], action: "shortcuts.forward15" },
    { kind: "single", keys: ["Shift", "→"], action: "shortcuts.forward60" },
    { kind: "single", keys: ["N"], action: "shortcuts.next" },
    { kind: "single", keys: ["?"], action: "shortcuts.toggleHelp" },
    { kind: "single", keys: ["["], action: "shortcuts.toggleSidebar" },
    { kind: "modifier", modifier, key: "F", action: "shortcuts.focusSearch" },
    { kind: "modifier", modifier, key: ",", action: "shortcuts.openSettings" },
    { kind: "single", keys: ["Esc"], action: "shortcuts.escape" }
  ]);
  $effect(() => {
    platform = document.documentElement.dataset.platform ?? "browser";
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  });
  function backdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) onclose();
  }
  function handleClose(): void {
    onclose();
  }
</script>

<dialog
  bind:this={dialog}
  class="m-auto max-h-full max-w-full border-0 bg-transparent p-4 backdrop:bg-[color-mix(in_srgb,var(--color-app)_45%,transparent)]"
  onclick={backdrop}
  onclose={handleClose}
>
  <div
    class="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-card border border-app-border bg-app-surface p-6"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 id="keyboard-shortcuts-title" class="text-lg font-semibold">
          {t(locale, "shortcuts.title")}
        </h2>
        <p class="mt-1 text-sm text-app-muted">
          {t(locale, "shortcuts.detail")}
        </p>
      </div>
      <button
        class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app"
        type="button"
        onclick={onclose}
        aria-label={t(locale, "shortcuts.close")}
        ><span class="block size-4"><Icon name="close" /></span></button
      >
    </div>
    <dl class="mt-5 space-y-3">
      {#each shortcuts as shortcut (shortcut.action)}
        <div class="flex items-center justify-between gap-3">
          <dt class="text-sm text-app">{t(locale, shortcut.action)}</dt>
          <dd class="flex shrink-0 items-center gap-1">
            {#if shortcut.kind === "single"}
              {#each shortcut.keys as key (key)}<kbd
                  class="inline-flex h-7 min-w-7 items-center justify-center rounded-control border border-app-border bg-app-soft px-2 font-mono text-xs font-bold text-app"
                  >{key}</kbd
                >{/each}
            {:else}
              <kbd
                class="inline-flex h-7 min-w-7 items-center justify-center rounded-control border border-app-border bg-app-soft px-2 font-mono text-xs font-bold text-app"
                >{shortcut.modifier}</kbd
              ><kbd
                class="inline-flex h-7 min-w-7 items-center justify-center rounded-control border border-app-border bg-app-soft px-2 font-mono text-xs font-bold text-app"
                >{shortcut.key}</kbd
              >
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
    <p class="mt-5 border-t border-app-border pt-4 text-xs text-app-muted">
      {t(locale, "shortcuts.searchNote", { key: "Esc" })}
    </p>
  </div>
</dialog>
