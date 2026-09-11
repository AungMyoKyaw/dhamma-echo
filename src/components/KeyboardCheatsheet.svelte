<script lang="ts">
  import { t, type MessageKey } from "../i18n.js";
  import type { AppLocale } from "../types.js";
  import Icon from "./Icon.svelte";
  let { locale, onclose }: { locale: AppLocale; onclose: () => void } = $props();
  let dialog: HTMLDialogElement;
  const shortcuts: { keys: string[]; action: MessageKey }[] = [
    { keys: ["Space"], action: "shortcuts.playPause" },
    { keys: ["←"], action: "shortcuts.back15" },
    { keys: ["Shift", "←"], action: "shortcuts.back60" },
    { keys: ["→"], action: "shortcuts.forward15" },
    { keys: ["Shift", "→"], action: "shortcuts.forward60" },
    { keys: ["N"], action: "shortcuts.next" },
    { keys: ["?"], action: "shortcuts.toggleHelp" },
    { keys: ["["], action: "shortcuts.toggleSidebar" },
    { keys: ["Esc"], action: "shortcuts.escape" }
  ];
  $effect(() => {
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
  <div class="w-full max-w-md rounded-card border border-app-border bg-app-surface p-6">
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
            {#each shortcut.keys as key (key)}<kbd
                class="inline-flex h-7 min-w-7 items-center justify-center rounded-control border border-app-border bg-app-soft px-2 font-mono text-xs font-bold text-app"
                >{key}</kbd
              >{/each}
          </dd>
        </div>
      {/each}
    </dl>
    <p class="mt-5 border-t border-app-border pt-4 text-xs text-app-muted">
      {t(locale, "shortcuts.searchNote", { key: "Esc" })}
    </p>
  </div>
</dialog>
