<script lang="ts">
  import { tick } from "svelte";
  import Icon from "./Icon.svelte";
  let { label, placeholder, value, className = "", onclear }: { label: string; placeholder: string; value: string; className?: string; onclear: () => void | Promise<void> } = $props();
  let input: HTMLInputElement;
  async function clear(): Promise<void> { await onclear(); await tick(); input.focus(); }
</script>
<label class="relative {className}">
  <span class="sr-only">{label}</span>
  <span class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-app-muted"><Icon name="search" /></span>
  <input bind:this={input} class="h-12 w-full rounded-2xl border border-app-border bg-app-bg pl-12 {value ? 'pr-12' : 'pr-4'} text-sm outline-none transition focus:border-app-primary" name="query" {value} {placeholder} />
  {#if value}<button class="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-app-muted hover:bg-app-soft hover:text-app" type="button" onclick={() => void clear()} aria-label="Clear {label.toLowerCase()}"><span class="size-4"><Icon name="close" /></span></button>{/if}
</label>
