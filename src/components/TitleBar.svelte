<script lang="ts">
  import { detectPlatform, getNativeChrome } from "../runtime.js";
  import Icon from "./Icon.svelte";

  let platform = $derived(detectPlatform());
  let showCustomControls = $derived(platform === "windows" || platform === "linux");
  let maximized = $state(false);

  $effect(() => {
    if (!showCustomControls) return;
    const chrome = getNativeChrome();
    if (chrome === null) return;

    let cancelled = false;
    const check = async (): Promise<void> => {
      if (cancelled) return;
      try {
        maximized = await chrome.isMaximized();
      } catch {
        // Window query failures are non-fatal; the icon keeps its last
        // known state and the next poll will try again.
      }
    };

    void check();
    const interval = setInterval(check, 100);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  });

  async function closeWindow(): Promise<void> {
    await getNativeChrome()?.close();
  }
  async function minimizeWindow(): Promise<void> {
    await getNativeChrome()?.minimize();
  }
  async function toggleMaximize(): Promise<void> {
    const chrome = getNativeChrome();
    if (chrome === null) return;
    maximized = await chrome.toggleMaximize();
  }
</script>

<div
  data-tauri-drag-region
  class="fixed inset-x-0 top-0 z-30 flex h-(--titlebar-height) items-stretch bg-app-bg select-none"
>
  <div class="flex-1" data-tauri-drag-region aria-hidden="true"></div>
  {#if showCustomControls}
    <div class="flex items-center gap-0.5 pr-2 max-[1040px]:pr-1">
      <button
        type="button"
        onclick={minimizeWindow}
        class="inline-flex size-9 items-center justify-center rounded-control text-app-muted transition-colors duration-150 hover:bg-app-soft hover:text-app focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[color-mix(in_srgb,var(--color-app-primary)_55%,transparent)]"
        aria-label="Minimize window"
      >
        <span class="block size-3.5"><Icon name="chrome-minimize" /></span>
      </button>
      <button
        type="button"
        onclick={toggleMaximize}
        class="inline-flex size-9 items-center justify-center rounded-control text-app-muted transition-colors duration-150 hover:bg-app-soft hover:text-app focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[color-mix(in_srgb,var(--color-app-primary)_55%,transparent)]"
        aria-label={maximized ? "Restore window" : "Maximize window"}
      >
        <span class="block size-3.5">
          <Icon name={maximized ? "chrome-restore" : "chrome-maximize"} />
        </span>
      </button>
      <button
        type="button"
        onclick={closeWindow}
        class="inline-flex size-9 items-center justify-center rounded-control text-app-muted transition-colors duration-150 hover:bg-error-quiet hover:text-error focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[color-mix(in_srgb,var(--color-app-primary)_55%,transparent)]"
        aria-label="Close window"
      >
        <span class="block size-3.5"><Icon name="close" /></span>
      </button>
    </div>
  {/if}
</div>
