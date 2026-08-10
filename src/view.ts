import type { AppState, AudioTrack, Route, TeacherSummary } from "./types.js";
import { escapeHtml, formatDuration } from "./utils.js";

const CURATED_FEATURED_TEACHER_IDS = [283, 2872, 2960, 41979, 2972, 273] as const;
const CURATED_FEATURED_TEACHER_ID_SET = new Set<number>(CURATED_FEATURED_TEACHER_IDS);

function isCuratedFeaturedTeacher(id: number): boolean {
  return CURATED_FEATURED_TEACHER_ID_SET.has(id);
}

function orderTeachersFeaturedFirst(teachers: TeacherSummary[]): TeacherSummary[] {
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const featured = CURATED_FEATURED_TEACHER_IDS.flatMap((id) => {
    const teacher = teachersById.get(id);
    return teacher === undefined ? [] : [teacher];
  });
  const remaining = teachers.filter((teacher) => !isCuratedFeaturedTeacher(teacher.id));
  return [...featured, ...remaining];
}

const icons: Record<string, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  explore: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  teachers:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 15.5c.9-.9 2-1.5 3.4-1.5 2.5 0 4.6 2 4.6 4.5"/>',
  library: '<path d="M5 4h14v16H5z"/><path d="M9 4v16M9 8h10"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  play: '<path d="M8.75 6.5v11l8.5-5.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 6.5h3.25v11H8zM12.75 6.5H16v11h-3.25z" fill="currentColor" stroke="none"/>',
  backward15:
    '<path d="M8.2 7.1H4.8V3.7"/><path d="M5 7a7.5 7.5 0 1 1-1 7.5"/><text x="12" y="14.3" text-anchor="middle" fill="currentColor" stroke="none" font-size="6.2" font-weight="750">15</text>',
  forward15:
    '<path d="M15.8 7.1h3.4V3.7"/><path d="M19 7a7.5 7.5 0 1 0 1 7.5"/><text x="12" y="14.3" text-anchor="middle" fill="currentColor" stroke="none" font-size="6.2" font-weight="750">15</text>',
  next: '<path d="m7 7 7 5-7 5z" fill="currentColor" stroke="none"/><path d="M16 7v10"/>',
  volume:
    '<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.5 6.8a7.3 7.3 0 0 1 0 10.4"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  queue:
    '<path d="M4 7h10M4 12h10M4 17h7"/><path d="m16 14 4 3-4 3z" fill="currentColor" stroke="none"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  leaf: '<path d="M20 4C12 4 5 8 5 15c0 2 1 4 3 5 0-5 4-9 10-12-5 4-7 8-7 12 6-1 10-6 9-16Z"/>'
};

function icon(name: keyof typeof icons): string {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

const routes: { route: Route; label: string; icon: keyof typeof icons }[] = [
  { route: "home", label: "Home", icon: "home" },
  { route: "explore", label: "Explore", icon: "explore" },
  { route: "collections", label: "Collections", icon: "library" },
  { route: "teachers", label: "Teachers", icon: "teachers" },
  { route: "library", label: "My library", icon: "library" },
  { route: "settings", label: "Settings", icon: "settings" }
];

function renderSidebar(state: AppState): string {
  const links = routes
    .map(({ route, label, icon: iconName }) => {
      const active =
        state.route === route ||
        (route === "collections" && state.route === "collection-detail") ||
        (route === "teachers" && state.route === "teacher-detail");
      return `<button class="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-app-primary text-white shadow-sm" : "text-app-muted hover:bg-app-soft hover:text-app"}" data-action="navigate" data-value="${route}" aria-current="${active ? "page" : "false"}"><span class="size-5">${icon(iconName)}</span><span>${label}</span></button>`;
    })
    .join("");
  return `<aside class="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-app-border bg-app-surface px-5 py-6">
    <div class="flex items-center gap-3 px-2">
      <img src="./logo.svg" alt="" class="size-11 rounded-2xl" />
      <div><p class="text-lg font-bold tracking-tight">Dhamma Echo</p><p class="text-xs text-app-muted">Listen with intention</p></div>
    </div>
    <nav class="mt-10 space-y-2" aria-label="Primary navigation">${links}</nav>
    <div class="mt-auto rounded-3xl bg-app-soft p-4">
      <div class="mb-3 flex size-9 items-center justify-center rounded-full bg-app-secondary/15 text-app-secondary"><span class="size-5">${icon("leaf")}</span></div>
      <p class="text-sm font-bold">A quiet library</p>
      <p class="mt-1 text-xs leading-5 text-app-muted">Your catalogue remains on this device. Audio streams only when you press play.</p>
    </div>
  </aside>`;
}

function renderHeader(state: AppState): string {
  const labels: Record<Route, { eyebrow: string; title: string }> = {
    home: { eyebrow: "Home", title: "Discover the Dhamma" },
    explore: {
      eyebrow: `${state.summary.data.totalAudio.toLocaleString("en-US")} audio talks`,
      title: "Explore the Dhamma library"
    },
    collections: { eyebrow: "Collections", title: "Browse listening collections" },
    "collection-detail": { eyebrow: "Collection", title: "Collection details" },
    teachers: { eyebrow: "Teachers", title: "Learn from trusted voices" },
    "teacher-detail": { eyebrow: "Teacher", title: "Teacher details" },
    library: { eyebrow: "Your space", title: "Continue listening" },
    settings: { eyebrow: "Preferences", title: "Make listening yours" }
  };
  const label = labels[state.route];
  return `<header class="flex items-center gap-6 px-10 pb-4 pt-8">
    <div><p class="text-xs font-bold uppercase tracking-[0.2em] text-app-primary">${label.eyebrow}</p><h1 class="mt-1 text-3xl font-bold tracking-tight">${label.title}</h1></div>
  </header>`;
}

function stat(label: string, value: number, detail: string): string {
  return `<article class="rounded-card border border-app-border bg-app-surface p-5"><p class="text-xs font-bold uppercase tracking-wider text-app-muted">${label}</p><p class="mt-2 text-3xl font-bold tracking-tight">${value.toLocaleString("en-US")}</p><p class="mt-1 text-xs text-app-muted">${detail}</p></article>`;
}

function renderTeacherCard(teacher: TeacherSummary, carousel = false): string {
  const featured = isCuratedFeaturedTeacher(teacher.id);
  return `<button class="group flex h-full w-full ${carousel ? "min-w-72" : "min-w-0"} flex-col rounded-card border border-app-border bg-app-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-app-primary/50 hover:shadow-lg" data-action="select-teacher" data-id="${teacher.id}">
    <div class="flex size-12 items-center justify-center rounded-full bg-app-secondary/15 text-lg font-bold text-app-secondary">${escapeHtml(teacher.name.charAt(0))}</div>
    ${featured ? '<span class="mt-4 w-fit rounded-full bg-app-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-app-primary">Featured</span>' : ""}
    <p class="${featured ? "mt-3" : "mt-4"} font-bold leading-7">${escapeHtml(teacher.name)}</p>
    <p class="mt-2 text-sm text-app-muted">${teacher.audioCount.toLocaleString("en-US")} talks</p>
    <span class="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-app-primary">Browse talks <span class="size-4">${icon("chevron")}</span></span>
  </button>`;
}

function renderRecent(state: AppState): string {
  const recent = state.homeRecent;
  if (recent.status === "idle" || recent.status === "error") return "";
  if (recent.status === "loading") {
    return `<section class="space-y-4"><div><p class="text-xs font-bold uppercase tracking-wider text-app-primary">Continue listening</p></div><div class="h-20 animate-pulse rounded-card bg-app-soft"></div></section>`;
  }
  const [latest, ...rest] = recent.tracks;
  if (latest === undefined) return "";
  const resume = state.library.resume[String(latest.id)] ?? 0;
  const playing = state.player.current?.id === latest.id && state.player.status === "playing";
  const rows = rest
    .filter((track) => track.playable)
    .slice(0, 4)
    .map((track) => renderTrack(track, state))
    .join("");
  return `<section class="space-y-4">
    <div><p class="text-xs font-bold uppercase tracking-wider text-app-primary">Continue listening</p><h2 class="mt-1 text-2xl font-bold">Pick up where you left off</h2></div>
    <div class="flex items-center gap-4 rounded-card border border-app-border bg-app-surface p-5">
      <button class="flex size-14 shrink-0 items-center justify-center rounded-full bg-app-primary text-white transition hover:opacity-90${latest.playable ? "" : " cursor-not-allowed opacity-50"}"${latest.playable ? ` data-action="play-track" data-id="${latest.id}"` : " disabled"} aria-label="Resume ${escapeHtml(latest.title)}"><span class="ml-0.5 size-6">${icon(playing ? "pause" : "play")}</span></button>
      <div class="min-w-0"><h3 class="truncate font-bold">${escapeHtml(latest.title)}</h3><p class="mt-1 truncate text-sm text-app-muted">${escapeHtml(latest.teacherName || "Unknown teacher")}${resume > 0 ? ` · Resume at ${formatDuration(resume)}` : ""}</p></div>
    </div>
    ${rows.length > 0 ? `<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">${rows}</div>` : ""}
  </section>`;
}

function renderHome(state: AppState): string {
  if (state.summary.status === "error") {
    return renderError(state.summary.message, "retry-summary");
  }
  const summary = state.summary.data;
  const teachersById = new Map(state.teachers.data.map((teacher) => [teacher.id, teacher]));
  const featured = CURATED_FEATURED_TEACHER_IDS.flatMap((id) => {
    const teacher = teachersById.get(id);
    return teacher === undefined ? [] : [teacher];
  });
  const hasRecentContent =
    state.homeRecent.status === "loading" ||
    (state.homeRecent.status === "ready" && state.homeRecent.tracks.length > 0);
  const teacherCards =
    state.teachers.status === "ready" && featured.length > 0
      ? featured.map((teacher) => renderTeacherCard(teacher, hasRecentContent)).join("")
      : `<div class="rounded-card border border-dashed border-app-border bg-app-soft p-6 text-sm text-app-muted">Teacher highlights will appear here when the catalogue is ready.</div>`;
  const featuredLayout = hasRecentContent
    ? "scrollbar-thin flex gap-4 overflow-x-auto pb-3"
    : "grid grid-cols-3 gap-4";
  return `<section class="space-y-8">
    ${renderRecent(state)}
    ${hasRecentContent ? "" : `<div class="grid grid-cols-4 gap-4">${stat("Audio talks", summary.totalAudio, "Ready to stream")}${stat("Teachers", summary.totalTeachers, "Across traditions")}${stat("Myanmar", summary.myanmarAudio, "Myanmar language")}${stat("English", summary.englishAudio, "English language")}</div>`}
    <div><div class="mb-4 flex items-end justify-between"><div><p class="text-xs font-bold uppercase tracking-wider text-app-primary">Browse by voice</p><h2 class="mt-1 text-2xl font-bold">Featured teachers</h2></div><button class="text-sm font-bold text-app-primary" data-action="navigate" data-value="teachers">View all</button></div><div class="${featuredLayout}" data-featured-layout="${hasRecentContent ? "carousel" : "grid"}">${teacherCards}</div></div>
  </section>`;
}

function renderFilters(state: AppState): string {
  const categories =
    state.categories.status === "ready"
      ? `<div class="col-span-full flex flex-wrap gap-2" aria-label="Audio categories"><button class="rounded-full px-3 py-2 text-xs font-bold ${state.search.categoryId === null ? "bg-app-primary text-white" : "bg-app-soft text-app-muted"}" data-action="filter-category" data-id="0" type="button">All audio</button>${state.categories.data.map((category) => `<button class="rounded-full px-3 py-2 text-xs font-bold ${state.search.categoryId === category.id ? "bg-app-primary text-white" : "bg-app-soft text-app-muted"}" data-action="filter-category" data-id="${category.id}" type="button">${escapeHtml(category.name)} · ${category.audioCount.toLocaleString("en-US")}</button>`).join("")}</div>`
      : "";
  return `<form class="search-form grid grid-cols-[minmax(0,1fr)_160px_140px_auto] gap-3 rounded-card border border-app-border bg-app-surface p-4" data-form="search">
    <label class="relative"><span class="sr-only">Search talks</span><span class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-app-muted">${icon("search")}</span><input class="h-12 w-full rounded-2xl border border-app-border bg-app-bg pl-12 pr-4 text-sm outline-none transition focus:border-app-primary" name="query" value="${escapeHtml(state.search.query)}" placeholder="Search title or teacher" /></label>
    <label><span class="sr-only">Language</span><select class="h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 text-sm" name="language"><option value="all"${state.search.language === "all" ? " selected" : ""}>All languages</option><option value="myanmar"${state.search.language === "myanmar" ? " selected" : ""}>Myanmar</option><option value="english"${state.search.language === "english" ? " selected" : ""}>English</option></select></label>
    <label><span class="sr-only">Format</span><select class="h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 text-sm" name="format"><option value="all"${state.search.format === "all" ? " selected" : ""}>All formats</option><option value="mp3"${state.search.format === "mp3" ? " selected" : ""}>MP3</option><option value="wma"${state.search.format === "wma" ? " selected" : ""}>WMA</option></select></label>
    <button class="h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white" type="submit">Search</button>${categories}
  </form>`;
}

function renderTrack(track: AudioTrack, state: AppState): string {
  const favorite = state.library.favorites.includes(track.id);
  const current = state.player.current?.id === track.id;
  const playing = current && state.player.status === "playing";
  const loading = current && state.player.status === "loading";
  const resume = state.library.resume[String(track.id)] ?? 0;
  const actionLabel = loading ? "Connecting to" : playing ? "Pause" : "Play";
  return `<article class="track-row grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-app-border px-4 py-3 last:border-0 ${current ? "is-current bg-app-primary/5" : ""}${track.playable ? " cursor-pointer transition hover:bg-app-soft/60" : ""}"${track.playable ? ` data-action="play-track" data-id="${track.id}"` : ""}>
    <button class="track-play-button ${track.playable ? "is-playable" : "is-unavailable"}${loading ? " is-loading" : ""}" data-action="play-track" data-id="${track.id}" aria-label="${actionLabel} ${escapeHtml(track.title)}" title="${actionLabel} ${escapeHtml(track.title)}" aria-pressed="${playing}" ${track.playable && !loading ? "" : "disabled"}><span class="track-play-icon ${playing ? "" : "is-play"}">${icon(playing ? "pause" : "play")}</span></button>
    <div class="min-w-0"><div class="flex items-center gap-2"><h3 class="truncate font-bold">${escapeHtml(track.title)}</h3>${track.playable ? "" : `<span class="rounded-full bg-app-soft px-2 py-0.5 text-[10px] font-bold uppercase text-app-muted">${track.format.toLowerCase() === "wma" ? "WMA unavailable" : "Unavailable"}</span>`}</div><p class="mt-1 truncate text-sm text-app-muted">${escapeHtml(track.teacherName || "Unknown teacher")} · ${escapeHtml(track.language)} · ${escapeHtml(track.format.toUpperCase())}${resume > 0 ? ` · Resume at ${formatDuration(resume)}` : ""}</p></div>
    <div class="flex items-center gap-2"><button class="row-action-button ${favorite ? "is-active" : ""}" data-action="toggle-favorite" data-id="${track.id}" aria-label="${favorite ? "Remove from" : "Add to"} favorites" title="${favorite ? "Remove from favorites" : "Add to favorites"}"><span class="size-5 ${favorite ? "fill-current text-app-primary" : ""}">${icon("heart")}</span></button><button class="row-queue-button" data-action="enqueue" data-id="${track.id}">Queue</button></div>
  </article>`;
}

function renderLoading(): string {
  return `<div class="space-y-3 rounded-card border border-app-border bg-app-surface p-4" aria-label="Loading talks">${Array.from({ length: 6 }, () => '<div class="h-16 animate-pulse rounded-2xl bg-app-soft"></div>').join("")}</div>`;
}

function renderEmpty(title: string, detail: string): string {
  return `<div class="flex min-h-80 flex-col items-center justify-center rounded-card border border-dashed border-app-border bg-app-surface p-8 text-center"><img src="./empty-library.svg" alt="" class="h-32 w-40" /><h2 class="mt-4 text-xl font-bold">${escapeHtml(title)}</h2><p class="mt-2 max-w-sm text-sm leading-6 text-app-muted">${escapeHtml(detail)}</p></div>`;
}

function renderError(message: string, action: string): string {
  return `<div class="flex min-h-64 flex-col items-center justify-center rounded-card border border-red-300/40 bg-red-50/50 p-8 text-center"><h2 class="text-xl font-bold">The library needs another try</h2><p class="mt-2 max-w-md text-sm text-app-muted">${escapeHtml(message)}</p><button class="mt-5 rounded-full bg-app-primary px-5 py-2.5 text-sm font-bold text-white" data-action="${action}">Try again</button></div>`;
}

function renderExplore(state: AppState): string {
  let content = renderLoading();
  if (state.catalogue.status === "error")
    content = renderError(state.catalogue.message, "retry-search");
  if (state.catalogue.status === "ready") {
    content =
      state.catalogue.page.items.length > 0
        ? `<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">${state.catalogue.page.items.map((track) => renderTrack(track, state)).join("")}</div>`
        : renderEmpty(
            "No talks match these filters",
            "Try a shorter search or select a different language and format."
          );
  }
  const page = state.catalogue.page;
  const teacherChip =
    state.search.teacherId !== null
      ? `<div class="flex items-center gap-2 rounded-full bg-app-primary/10 px-4 py-2 text-xs font-bold text-app-primary">Teacher: ${escapeHtml(teacherName(state))}<button class="flex size-5 items-center justify-center rounded-full hover:bg-app-primary/20" data-action="clear-teacher" aria-label="Clear teacher filter"><span class="size-3">${icon("close")}</span></button></div>`
      : "";
  const category = state.categories.data.find((item) => item.id === state.search.categoryId);
  const categoryChip =
    category === undefined
      ? ""
      : `<div class="flex items-center gap-2 rounded-full bg-app-primary/10 px-4 py-2 text-xs font-bold text-app-primary">Category: ${escapeHtml(category.name)}<button data-action="clear-category" aria-label="Clear category filter"><span class="size-3">${icon("close")}</span></button></div>`;
  const collectionChip =
    state.search.collectionId === null
      ? ""
      : `<div class="flex items-center gap-2 rounded-full bg-app-primary/10 px-4 py-2 text-xs font-bold text-app-primary">Collection filter<button data-action="clear-collection" aria-label="Clear collection filter"><span class="size-3">${icon("close")}</span></button></div>`;
  const progress =
    state.catalogue.status === "ready" && page.total > 0
      ? renderProgressiveControls(
          page.items.length,
          page.total,
          page.limit,
          state.catalogue.loadingMore,
          state.catalogue.loadMoreMessage,
          state.catalogue.exhausted,
          "load-more-search",
          "talks"
        )
      : `<p class="text-sm text-app-muted">Search the complete audio catalogue</p>`;
  return `<section class="space-y-5">${renderFilters(state)}<div class="flex flex-wrap gap-2">${teacherChip}${categoryChip}${collectionChip}</div>${content}${progress}</section>`;
}

function teacherName(state: AppState): string {
  const fromList = state.teachers.data.find((t) => t.id === state.search.teacherId)?.name;
  if (fromList) return fromList;
  return state.player.current?.id === state.search.teacherId
    ? state.player.current.teacherName
    : "selected teacher";
}

function renderTeachers(state: AppState): string {
  if (state.teachers.status === "error")
    return renderError(state.teachers.message, "retry-teachers");
  if (state.teachers.status !== "ready") return renderLoading();
  if (state.teachers.data.length === 0)
    return renderEmpty(
      "No teachers found",
      "The catalogue does not currently include teacher records."
    );
  const searching = state.teacherQuery.length > 0;
  const results = searching
    ? state.teacherResults
    : orderTeachersFeaturedFirst(state.teachers.data);
  return `<section class="space-y-5"><form class="flex gap-3 rounded-card border border-app-border bg-app-surface p-4" data-form="teacher-search"><label class="relative flex-1"><span class="sr-only">Search teachers</span><span class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-app-muted">${icon("search")}</span><input class="h-12 w-full rounded-2xl border border-app-border bg-app-bg pl-12 pr-4 text-sm outline-none transition focus:border-app-primary" name="query" value="${escapeHtml(state.teacherQuery)}" placeholder="Search teacher name" /></label><button class="h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white" type="submit">Search</button></form>${searching && results.length === 0 ? renderEmpty("No teachers match", "Try a different spelling or a shorter name.") : `<div class="grid grid-cols-3 gap-4">${results.map((teacher) => renderTeacherCard(teacher)).join("")}</div>`}</section>`;
}

function renderCollectionCard(
  collection: AppState["collections"]["page"]["items"][number]
): string {
  return `<button class="group flex min-w-0 flex-col rounded-card border border-app-border bg-app-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-app-primary/50 hover:shadow-lg" data-action="open-collection" data-id="${collection.id}"><p class="font-bold leading-7">${escapeHtml(collection.name)}</p><p class="mt-2 text-sm text-app-muted">${escapeHtml(collection.teacherName || "Unknown teacher")}</p><p class="mt-4 text-xs font-bold text-app-primary">${collection.audioCount.toLocaleString("en-US")} talks</p></button>`;
}

function renderCollections(state: AppState): string {
  const collectionState = state.collections;
  let content = renderLoading();
  if (collectionState.status === "error")
    content = renderError(collectionState.message, "retry-collections");
  if (collectionState.status === "ready") {
    content =
      collectionState.page.items.length === 0
        ? renderEmpty(
            "No collections match",
            "Try a shorter collection name or clear the teacher filter."
          )
        : `<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">${collectionState.page.items.map(renderCollectionCard).join("")}</div>`;
  }
  const page = collectionState.page;
  const teacherOptions = state.teachers.data
    .map(
      (teacher) =>
        `<option value="${teacher.id}"${state.collectionSearch.teacherId === teacher.id ? " selected" : ""}>${escapeHtml(teacher.name)}</option>`
    )
    .join("");
  const progress =
    collectionState.status === "ready"
      ? renderProgressiveControls(
          page.items.length,
          page.total,
          page.limit,
          collectionState.loadingMore,
          collectionState.loadMoreMessage,
          collectionState.exhausted,
          "load-more-collections",
          "collections"
        )
      : "";
  return `<section class="space-y-5"><form class="flex flex-wrap gap-3 rounded-card border border-app-border bg-app-surface p-4" data-form="collection-search"><label class="relative min-w-64 flex-1"><span class="sr-only">Search collections</span><span class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-app-muted">${icon("search")}</span><input class="h-12 w-full rounded-2xl border border-app-border bg-app-bg pl-12 pr-4 text-sm" name="query" value="${escapeHtml(state.collectionSearch.query)}" placeholder="Search collection name" /></label><label><span class="sr-only">Collection teacher</span><select class="h-12 max-w-64 rounded-2xl border border-app-border bg-app-bg px-4 text-sm" name="teacherId"><option value="">All teachers</option>${teacherOptions}</select></label><button class="h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white" type="submit">Search</button></form>${content}${progress}</section>`;
}

function renderProgressiveControls(
  shown: number,
  total: number,
  limit: number,
  loading: boolean,
  message: string,
  exhausted: boolean,
  action: string,
  noun: string
): string {
  const remaining = Math.max(0, total - shown);
  const nextCount = Math.min(limit, remaining);
  const label = loading
    ? "Loading more…"
    : message
      ? "Retry"
      : `Load ${nextCount.toLocaleString("en-US")} more ${noun}`;
  const button =
    remaining > 0 && !exhausted
      ? `<button class="rounded-full border border-app-border px-5 py-2 text-sm font-bold text-app-primary disabled:opacity-50" data-action="${action}" ${loading ? "disabled" : ""}>${label}</button>`
      : "";
  return `<div class="flex flex-col items-center gap-2" role="status"><p class="text-sm text-app-muted">Showing ${shown.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} ${noun}</p>${message ? `<p class="text-sm text-red-700">${escapeHtml(message)}</p>` : ""}${button}</div>`;
}

function renderBackButton(): string {
  return `<button class="rounded-full border border-app-border px-4 py-2 text-sm font-bold text-app-primary" data-action="back-to-list">Back</button>`;
}

function renderCollectionDetail(state: AppState): string {
  if (state.collectionDetail.status === "error")
    return `${renderBackButton()}${renderError(state.collectionDetail.message, "retry-collection")}`;
  const detail = state.collectionDetail.data;
  if (state.collectionDetail.status !== "ready" || detail === null) return renderLoading();
  const tracks =
    detail.tracks.length === 0
      ? renderEmpty(
          "No audio talks in this collection",
          "This collection has no audio records to play."
        )
      : `<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">${detail.tracks.map((track) => renderTrack(track, state)).join("")}</div>`;
  return `<section class="space-y-5">${renderBackButton()}<div class="rounded-card border border-app-border bg-app-surface p-6"><p class="text-xs font-bold uppercase tracking-wider text-app-primary">${detail.audioCount.toLocaleString("en-US")} talks</p><h2 class="mt-2 text-2xl font-bold">${escapeHtml(detail.name)}</h2><p class="mt-2 text-sm text-app-muted">${escapeHtml(detail.teacherName || "Unknown teacher")}</p>${detail.description === null ? "" : `<p class="mt-4 text-sm leading-6 text-app-muted">${escapeHtml(detail.description)}</p>`}</div>${tracks}</section>`;
}

function renderTeacherDetail(state: AppState): string {
  if (state.teacherDetail.status === "error")
    return `${renderBackButton()}${renderError(state.teacherDetail.message, "retry-teacher-detail")}`;
  const detail = state.teacherDetail.data;
  if (state.teacherDetail.status !== "ready" || detail === null) return renderLoading();
  let talks = renderLoading();
  if (state.teacherTalks.status === "error")
    talks = renderError(state.teacherTalks.message, "retry-teacher-detail");
  if (state.teacherTalks.status === "ready") {
    talks =
      state.teacherTalks.page.items.length === 0
        ? renderEmpty("No talks found", "This teacher has no audio talks in the catalogue.")
        : `<div class="overflow-hidden rounded-card border border-app-border bg-app-surface">${state.teacherTalks.page.items.map((track) => renderTrack(track, state)).join("")}</div>`;
  }
  const collectionCards = detail.collections.map(renderCollectionCard).join("");
  const page = state.teacherTalks.page;
  const shown = page.items.length;
  const remaining = Math.max(0, page.total - shown);
  const nextCount = Math.min(page.limit, remaining);
  const canLoadMore = remaining > 0 && !state.teacherTalks.exhausted;
  const buttonLabel = state.teacherTalks.loadingMore
    ? "Loading more…"
    : state.teacherTalks.loadMoreMessage
      ? "Retry"
      : `Load ${nextCount.toLocaleString("en-US")} more talks`;
  const loadMore = canLoadMore
    ? `<button class="rounded-full border border-app-border px-5 py-2 text-sm font-bold text-app-primary disabled:opacity-50" data-action="load-more-teacher-talks" ${state.teacherTalks.loadingMore ? "disabled" : ""}>${buttonLabel}</button>`
    : "";
  const progress =
    state.teacherTalks.status === "ready"
      ? `<div class="mt-4 flex flex-col items-center gap-2" role="status"><p class="text-sm text-app-muted">Showing ${shown.toLocaleString("en-US")} of ${page.total.toLocaleString("en-US")} talks</p>${state.teacherTalks.loadMoreMessage ? `<p class="text-sm text-red-700">${escapeHtml(state.teacherTalks.loadMoreMessage)}</p>` : ""}${loadMore}</div>`
      : "";
  return `<section class="space-y-6">${renderBackButton()}<div class="rounded-card border border-app-border bg-app-surface p-6"><p class="text-xs font-bold uppercase tracking-wider text-app-primary">${detail.audioCount.toLocaleString("en-US")} talks</p><h2 class="mt-2 text-2xl font-bold">${escapeHtml(detail.name)}</h2><button class="mt-4 rounded-full bg-app-primary px-4 py-2 text-xs font-bold text-white" data-action="filter-teacher" data-id="${detail.id}">Explore this teacher</button></div>${collectionCards.length === 0 ? "" : `<div><h3 class="mb-3 text-lg font-bold">Collections</h3><div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">${collectionCards}</div></div>`}<div><h3 class="mb-3 text-lg font-bold">Talks</h3>${talks}${progress}</div></section>`;
}

function renderLibrary(state: AppState): string {
  const knownTracks = [state.player.current, ...state.player.queue].filter(
    (track): track is AudioTrack => track !== null
  );
  const favorites = knownTracks.filter(
    (track, index, list) =>
      state.library.favorites.includes(track.id) &&
      list.findIndex((item) => item.id === track.id) === index
  );
  if (state.library.favorites.length === 0)
    return renderEmpty(
      "Your library is ready",
      "Favorite a talk while exploring to keep it close for another listening session."
    );
  if (favorites.length === 0)
    return renderEmpty(
      "Favorites saved",
      "Open Explore to load the saved talks from the catalogue."
    );
  return `<section class="space-y-4"><div><h2 class="text-xl font-bold">Favorites</h2><p class="mt-1 text-sm text-app-muted">${state.library.favorites.length} saved talks</p></div><div class="overflow-hidden rounded-card border border-app-border bg-app-surface">${favorites.map((track) => renderTrack(track, state)).join("")}</div></section>`;
}

function option(value: string, label: string, selected: string): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`;
}

function renderSettings(state: AppState): string {
  return `<section class="mx-auto max-w-3xl space-y-4"><div class="rounded-card border border-app-border bg-app-surface p-6"><h2 class="text-lg font-bold">Playback</h2><div class="mt-5 grid grid-cols-2 gap-4"><label class="text-sm font-bold">Default speed<select class="mt-2 h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 font-normal" data-setting="rate">${[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => option(String(rate), `${rate}×`, String(state.settings.playbackRate))).join("")}</select></label><label class="text-sm font-bold">Default volume<span class="mt-2 flex h-12 items-center rounded-2xl border border-app-border bg-app-bg px-4"><input class="range-accent w-full" type="range" min="0" max="1" step="0.05" value="${state.settings.volume}" data-setting="volume" aria-label="Default volume" /></span></label></div></div>
  <div class="rounded-card border border-app-border bg-app-soft p-6"><h2 class="text-sm font-bold">Privacy</h2><p class="mt-2 text-sm leading-6 text-app-muted">Favorites, history, playback position, and settings are stored locally. The bundled catalogue is read-only. Audio is requested from dhammadownload.com only when played.</p></div></section>`;
}

function renderMain(state: AppState): string {
  switch (state.route) {
    case "home":
      return renderHome(state);
    case "explore":
      return renderExplore(state);
    case "collections":
      return renderCollections(state);
    case "collection-detail":
      return renderCollectionDetail(state);
    case "teacher-detail":
      return renderTeacherDetail(state);
    case "teachers":
      return renderTeachers(state);
    case "library":
      return renderLibrary(state);
    case "settings":
      return renderSettings(state);
  }
}

function renderQueue(state: AppState): string {
  if (!state.player.queueOpen) return "";
  const rows =
    state.player.queue.length === 0
      ? '<p class="p-6 text-center text-sm text-app-muted">Your queue is empty.</p>'
      : state.player.queue
          .map(
            (track) =>
              `<div class="flex items-center gap-3 border-b border-app-border p-3 last:border-0"><div class="min-w-0 flex-1"><p class="truncate text-sm font-bold">${escapeHtml(track.title)}</p><p class="truncate text-xs text-app-muted">${escapeHtml(track.teacherName)}</p></div><button class="flex size-8 items-center justify-center rounded-full hover:bg-app-soft" data-action="remove-queue" data-id="${track.id}" aria-label="Remove ${escapeHtml(track.title)} from queue"><span class="size-4">${icon("close")}</span></button></div>`
          )
          .join("");
  return `<aside class="fixed bottom-28 right-6 z-40 w-96 overflow-hidden rounded-card border border-app-border bg-app-surface shadow-2xl"><div class="flex items-center justify-between border-b border-app-border p-4"><div><p class="font-bold">Up next</p><p class="text-xs text-app-muted">${state.player.queue.length} talks</p></div><button class="text-xs font-bold text-app-primary" data-action="clear-queue">Clear</button></div><div class="scrollbar-thin max-h-80 overflow-y-auto">${rows}</div></aside>`;
}

function renderPlayer(state: AppState): string {
  const track = state.player.current;
  if (track === null) return "";
  const playing = state.player.status === "playing";
  const loading = state.player.status === "loading";
  const max = state.player.duration > 0 ? state.player.duration : 1;
  const status = state.player.error
    ? `<span class="player-status player-status-error" role="alert"><span class="truncate">${escapeHtml(state.player.error)}</span><button class="player-retry-button" data-action="retry-playback">Retry</button></span>`
    : loading
      ? '<span class="player-status text-app-primary" role="status"><span class="size-2 animate-pulse rounded-full bg-app-primary"></span>Connecting…</span>'
      : '<span class="player-status player-status-hint text-app-muted">Space: play/pause · ←/→: seek</span>';
  return `${renderQueue(state)}<footer class="player-shell fixed bottom-0 left-64 right-0 z-30 border-t border-app-border bg-app-surface/95 px-5 py-3 shadow-player backdrop-blur-xl" aria-label="Audio player">
    <div class="player-grid">
      <div class="player-track min-w-0" aria-live="polite"><p class="truncate text-sm font-bold">${escapeHtml(track.title)}</p><p class="truncate text-xs text-app-muted">${escapeHtml(track.teacherName || "Unknown teacher")}</p><div class="mt-1 min-h-4">${status}</div></div>
      <div class="player-center">
        <div class="player-controls" aria-label="Playback controls">
          <button class="transport-button" data-action="seek-backward" aria-label="Jump back 15 seconds" title="Jump back 15 seconds"><span>${icon("backward15")}</span></button>
          <button class="transport-button transport-button-primary" data-action="toggle-play" aria-label="${loading ? "Connecting to audio" : playing ? "Pause" : "Play"}" title="${loading ? "Connecting to audio" : playing ? "Pause" : "Play"}" aria-pressed="${playing}" ${loading ? "disabled" : ""}><span class="transport-primary-icon ${playing ? "" : "is-play"}">${icon(playing ? "pause" : "play")}</span></button>
          <button class="transport-button" data-action="seek-forward" aria-label="Jump forward 15 seconds" title="Jump forward 15 seconds"><span>${icon("forward15")}</span></button>
        </div>
        <div class="player-timeline"><span>${formatDuration(state.player.currentTime)}</span><input class="range-accent" type="range" min="0" max="${max}" step="1" value="${Math.min(state.player.currentTime, max)}" data-action="seek" aria-label="Playback position" /><span>${formatDuration(state.player.duration)}</span></div>
      </div>
      <div class="player-session-controls">
        <label class="player-rate-control" title="Playback speed"><span class="sr-only">Playback speed</span><select data-setting="rate" aria-label="Playback speed">${[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => option(String(rate), `${rate}×`, String(state.settings.playbackRate))).join("")}</select></label>
        <label class="player-volume-control" title="Volume"><span class="player-volume-icon">${icon("volume")}</span><input class="player-volume range-accent" type="range" min="0" max="1" step="0.05" value="${state.settings.volume}" data-setting="volume" aria-label="Volume" /></label>
        <button class="queue-button" data-action="toggle-queue" aria-label="Show queue" title="Show queue" aria-expanded="${state.player.queueOpen}"><span>${icon("queue")}</span>${state.player.queue.length > 0 ? `<span class="queue-count">${state.player.queue.length}</span>` : ""}</button>
      </div>
    </div>
  </footer>`;
}

export function renderApp(state: AppState): string {
  const contentPadding = state.player.current === null ? "pb-8" : "pb-40";
  return `<div class="min-h-screen bg-app-bg text-app">${renderSidebar(state)}<div class="ml-64 ${contentPadding}">${renderHeader(state)}<main class="px-10 py-4">${renderMain(state)}</main></div>${renderPlayer(state)}</div>`;
}
