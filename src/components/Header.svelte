<script lang="ts">
  import type { AppState } from "../types.js";
  import { routeLabel } from "../ui.js";
  let { state }: { state: AppState } = $props();
  let label = $derived(routeLabel(state.route));
  let breadcrumb = $derived(buildBreadcrumb(state));
  function buildBreadcrumb(state: AppState): string | null {
    if (state.route === "collection-detail") {
      const teacherName = state.collectionDetail.data?.teacherName ?? "Collection";
      return `Collections › ${teacherName}`;
    }
    if (state.route === "teacher-detail") {
      const teacherName = state.teacherDetail.data?.name ?? "Teacher";
      return `Teachers › ${teacherName}`;
    }
    return null;
  }
</script>

<header class="px-10 pt-8 pb-5 max-[1040px]:px-6 max-[1040px]:pt-6">
  <div class="mx-auto max-w-[1520px]">
    {#if breadcrumb !== null}
      <nav aria-label="Breadcrumb" class="mb-2">
        <ol class="flex flex-wrap items-center gap-1 text-xs text-app-muted">
          {#each breadcrumb.split(" › ") as crumb, index (crumb + index)}
            <li class="flex items-center gap-1">
              <span class="font-bold text-app-muted">{crumb}</span>
              {#if index < breadcrumb.split(" › ").length - 1}<span aria-hidden="true">›</span>{/if}
            </li>
          {/each}
        </ol>
      </nav>
    {/if}
    <p class="text-xs font-bold tracking-wide text-app-secondary uppercase">{label.eyebrow}</p>
    <h1 class="mt-2 text-3xl font-bold tracking-tight max-[1040px]:text-[1.75rem]">
      {label.title}
    </h1>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-app-muted">{label.detail}</p>
  </div>
</header>