<script lang="ts">
  type IconName =
    | "home"
    | "explore"
    | "teachers"
    | "library"
    | "settings"
    | "play"
    | "pause"
    | "backward15"
    | "forward15"
    | "next"
    | "volume"
    | "heart"
    | "queue"
    | "search"
    | "close"
    | "chevron"
    | "download"
    | "leaf";
  let { name, filled = false }: { name: IconName; filled?: boolean } = $props();
</script>

<svg
  class="icon"
  aria-hidden="true"
  viewBox="0 0 24 24"
  fill={name === "heart" && filled ? "currentColor" : "none"}
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if name === "home"}<path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  {:else if name === "explore"}<circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
  {:else if name === "teachers"}<circle cx="9" cy="8" r="3" /><circle
      cx="17"
      cy="10"
      r="2.5"
    /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 15.5c.9-.9 2-1.5 3.4-1.5 2.5 0 4.6 2 4.6 4.5" />
  {:else if name === "library"}<path d="M5 4h14v16H5z" /><path d="M9 4v16M9 8h10" />
  {:else if name === "settings"}<circle cx="12" cy="12" r="3" /><path
      d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"
    />
  {:else if name === "play"}<path d="M8.75 6.5v11l8.5-5.5z" fill="currentColor" stroke="none" />
  {:else if name === "pause"}<path
      d="M8 6.5h3.25v11H8zM12.75 6.5H16v11h-3.25z"
      fill="currentColor"
      stroke="none"
    />
  {:else if name === "backward15"}<path d="M8.2 7.1H4.8V3.7" /><path
      d="M5 7a7.5 7.5 0 1 1-1 7.5"
    /><text
      x="12"
      y="14.3"
      text-anchor="middle"
      fill="currentColor"
      stroke="none"
      font-size="6.2"
      font-weight="750">15</text
    >
  {:else if name === "forward15"}<path d="M15.8 7.1h3.4V3.7" /><path
      d="M19 7a7.5 7.5 0 1 0 1 7.5"
    /><text
      x="12"
      y="14.3"
      text-anchor="middle"
      fill="currentColor"
      stroke="none"
      font-size="6.2"
      font-weight="750">15</text
    >
  {:else if name === "next"}<path d="m7 7 7 5-7 5z" fill="currentColor" stroke="none" /><path
      d="M16 7v10"
    />
  {:else if name === "volume"}<path d="M5 10v4h3l4 3V7l-4 3H5Z" /><path
      d="M15 9.2a4 4 0 0 1 0 5.6M17.5 6.8a7.3 7.3 0 0 1 0 10.4"
    />
  {:else if name === "heart"}<path
      d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
      fill={filled ? "currentColor" : "none"}
    />
  {:else if name === "queue"}<path d="M4 7h10M4 12h10M4 17h7" /><path
      d="m16 14 4 3-4 3z"
      fill="currentColor"
      stroke="none"
    />
  {:else if name === "search"}<circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />
  {:else if name === "close"}<path d="m7 7 10 10M17 7 7 17" />
  {:else if name === "chevron"}<path d="m9 18 6-6-6-6" />
  {:else if name === "download"}<path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  {:else}<path d="M20 4C12 4 5 8 5 15c0 2 1 4 3 5 0-5 4-9 10-12-5 4-7 8-7 12 6-1 10-6 9-16Z" />{/if}
</svg>
