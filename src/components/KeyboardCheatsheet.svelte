<script lang="ts">
  import Icon from "./Icon.svelte";
  let { onclose }: { onclose: () => void } = $props();
  let dialog: HTMLDialogElement;
  const shortcuts = [
    { keys: ["Space"], action: "Play or pause the current talk" },
    { keys: ["←"], action: "Jump back 15 seconds" },
    { keys: ["Shift", "←"], action: "Jump back 1 minute" },
    { keys: ["→"], action: "Jump forward 15 seconds" },
    { keys: ["Shift", "→"], action: "Jump forward 1 minute" },
    { keys: ["N"], action: "Play the next talk in the queue" },
    { keys: ["?"], action: "Show or hide this list" },
    { keys: ["Shift", "/"], action: "Same as ? — open or close this list" },
    { keys: ["["], action: "Collapse or expand the sidebar" },
    { keys: ["Esc"], action: "Close this dialog or the active overlay" }
  ] as const;
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
  class="m-0 max-h-full max-w-full border-0 bg-transparent p-4 backdrop:bg-[color-mix(in_srgb,var(--color-app)_45%,transparent)]"
  onclick={backdrop}
  onclose={handleClose}
>
  <div class="w-full max-w-md rounded-card border border-app-border bg-app-surface p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 id="keyboard-shortcuts-title" class="text-lg font-bold">Keyboard shortcuts</h2>
        <p class="mt-1 text-sm text-app-muted">
          Move through the library without leaving the keyboard.
        </p>
      </div>
      <button
        class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app"
        type="button"
        onclick={onclose}
        aria-label="Close shortcuts"><span class="block size-4"><Icon name="close" /></span></button
      >
    </div>
    <dl class="mt-5 space-y-3">
      {#each shortcuts as shortcut (shortcut.action)}
        <div class="flex items-center justify-between gap-3">
          <dt class="text-sm text-app">{shortcut.action}</dt>
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
      Search fields keep the keyboard for editing. Press <kbd
        class="mx-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-control border border-app-border bg-app-soft px-1.5 font-mono text-[11px] font-bold"
        >Esc</kbd
      >
      inside a search field to clear what you typed.
    </p>
  </div>
</dialog>