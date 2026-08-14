<script lang="ts">
  import Icon from "./Icon.svelte";
  let { onclose }: { onclose: () => void } = $props();
  const shortcuts = [
    { keys: ["Space"], action: "Play or pause the current talk" },
    { keys: ["←"], action: "Jump back 15 seconds" },
    { keys: ["→"], action: "Jump forward 15 seconds" },
    { keys: ["N"], action: "Play the next talk in the queue" },
    { keys: ["Esc"], action: "Clear the active search field" },
    { keys: ["?"], action: "Show or hide this list" }
  ];
  function backdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) onclose();
  }
  function onKey(event: KeyboardEvent): void {
    if (event.key === "Escape") onclose();
  }
</script>

<svelte:window onkeydown={onKey} />
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-app)_45%,transparent)] p-4"
  role="dialog"
  aria-modal="true"
  aria-label="Keyboard shortcuts"
  tabindex="-1"
  onclick={backdrop}
  onkeydown={onKey}
>
  <div
    class="w-full max-w-md rounded-card border border-app-border bg-app-surface p-6 shadow-[0_24px_60px_rgb(46_46_42_/_0.25)]"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold">Keyboard shortcuts</h2>
        <p class="mt-1 text-sm text-app-muted">
          Move through the library without leaving the keyboard.
        </p>
      </div>
      <button
        class="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app"
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
                class="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-app-border bg-app-soft px-2 font-mono text-xs font-bold text-app"
                >{key}</kbd
              >{/each}
          </dd>
        </div>
      {/each}
    </dl>
  </div>
</div>
