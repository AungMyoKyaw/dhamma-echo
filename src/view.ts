import type { AppState, AudioTrack, Route, TeacherSummary } from "./types.js";
import { escapeHtml, formatDuration } from "./utils.js";

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
  leaf: '<path d="M20 4C12 4 5 8 5 15c0 2 1 4 3 5 0-5 4-9 10-12-5 4-7 8-7 12 6-1 10-6 9-16Z"/>',
  moon: '<path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};

function icon(name: keyof typeof icons): string {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

const routes: { route: Route; label: string; icon: keyof typeof icons }[] = [
  { route: "home", label: "Home", icon: "home" },
  { route: "explore", label: "Explore", icon: "explore" },
  { route: "teachers", label: "Teachers", icon: "teachers" },
  { route: "library", label: "My library", icon: "library" },
  { route: "settings", label: "Settings", icon: "settings" }
];

function renderSidebar(state: AppState): string {
  const links = routes
    .map(({ route, label, icon: iconName }) => {
      const active = state.route === route;
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
    home: { eyebrow: "Welcome back", title: "Find a moment of clarity" },
    explore: { eyebrow: "21,402 audio talks", title: "Explore the Dhamma library" },
    teachers: { eyebrow: "Teachers", title: "Learn from trusted voices" },
    library: { eyebrow: "Your space", title: "Continue listening" },
    settings: { eyebrow: "Preferences", title: "Make listening yours" }
  };
  const label = labels[state.route];
  return `<header class="flex items-center justify-between gap-6 px-10 pb-4 pt-8">
    <div><p class="text-xs font-bold uppercase tracking-[0.2em] text-app-primary">${label.eyebrow}</p><h1 class="mt-1 text-3xl font-bold tracking-tight">${label.title}</h1></div>
    <button class="flex size-11 items-center justify-center rounded-2xl border border-app-border bg-app-surface text-app-muted transition hover:text-app" data-action="cycle-theme" aria-label="Change color theme"><span class="size-5">${icon(state.settings.theme === "dark" ? "sun" : "moon")}</span></button>
  </header>`;
}

function stat(label: string, value: number, detail: string): string {
  return `<article class="rounded-card border border-app-border bg-app-surface p-5"><p class="text-xs font-bold uppercase tracking-wider text-app-muted">${label}</p><p class="mt-2 text-3xl font-bold tracking-tight">${value.toLocaleString("en-US")}</p><p class="mt-1 text-xs text-app-muted">${detail}</p></article>`;
}

function renderTeacherCard(teacher: TeacherSummary): string {
  return `<button class="group min-w-60 rounded-card border border-app-border bg-app-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-app-primary/50 hover:shadow-lg" data-action="select-teacher" data-id="${teacher.id}">
    <div class="flex size-12 items-center justify-center rounded-full bg-app-secondary/15 text-lg font-bold text-app-secondary">${escapeHtml(teacher.name.charAt(0))}</div>
    <p class="mt-4 line-clamp-2 font-bold">${escapeHtml(teacher.name)}</p><p class="mt-1 text-sm text-app-muted">${teacher.audioCount.toLocaleString("en-US")} talks</p>
    <span class="mt-5 inline-flex items-center gap-1 text-xs font-bold text-app-primary">Browse talks <span class="size-4">${icon("chevron")}</span></span>
  </button>`;
}

function renderHome(state: AppState): string {
  if (state.summary.status === "error") {
    return renderError(state.summary.message, "retry-summary");
  }
  const summary = state.summary.data;
  const teacherCards =
    state.teachers.status === "ready" && state.teachers.data.length > 0
      ? state.teachers.data.slice(0, 6).map(renderTeacherCard).join("")
      : `<div class="rounded-card border border-dashed border-app-border bg-app-soft p-6 text-sm text-app-muted">Teacher highlights will appear here when the catalogue is ready.</div>`;
  return `<section class="space-y-8">
    <div class="relative overflow-hidden rounded-[2rem] bg-app-primary px-8 py-9 text-white shadow-lg">
      <div class="relative z-10 max-w-xl"><p class="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Dhamma for daily life</p><h2 class="mt-3 text-4xl font-bold leading-tight">A calmer way to discover and hear timeless teachings.</h2><p class="mt-4 max-w-lg text-sm leading-6 text-white/75">Search thousands of talks by title, teacher, language, or format. Your favorites and listening position stay local.</p><button class="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-app-primary transition hover:bg-white/90" data-action="navigate" data-value="explore">Explore talks</button></div>
      <div class="absolute -bottom-24 -right-16 size-80 rounded-full border-[48px] border-white/10"></div><div class="absolute right-24 top-8 size-24 rounded-full bg-white/10"></div>
    </div>
    <div class="grid grid-cols-4 gap-4">${stat("Audio talks", summary.totalAudio, "Ready to stream")}${stat("Teachers", summary.totalTeachers, "Across traditions")}${stat("Myanmar", summary.myanmarAudio, "Myanmar language")}${stat("English", summary.englishAudio, "English language")}</div>
    <div><div class="mb-4 flex items-end justify-between"><div><p class="text-xs font-bold uppercase tracking-wider text-app-primary">Browse by voice</p><h2 class="mt-1 text-2xl font-bold">Featured teachers</h2></div><button class="text-sm font-bold text-app-primary" data-action="navigate" data-value="teachers">View all</button></div><div class="scrollbar-thin flex gap-4 overflow-x-auto pb-3">${teacherCards}</div></div>
  </section>`;
}

function renderFilters(state: AppState): string {
  return `<form class="search-form grid grid-cols-[1fr_160px_140px_auto] gap-3 rounded-card border border-app-border bg-app-surface p-4" data-form="search">
    <label class="relative"><span class="sr-only">Search talks</span><span class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-app-muted">${icon("search")}</span><input class="h-12 w-full rounded-2xl border border-app-border bg-app-bg pl-12 pr-4 text-sm outline-none transition focus:border-app-primary" name="query" value="${escapeHtml(state.search.query)}" placeholder="Search title or teacher" /></label>
    <label><span class="sr-only">Language</span><select class="h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 text-sm" name="language"><option value="all"${state.search.language === "all" ? " selected" : ""}>All languages</option><option value="myanmar"${state.search.language === "myanmar" ? " selected" : ""}>Myanmar</option><option value="english"${state.search.language === "english" ? " selected" : ""}>English</option></select></label>
    <label><span class="sr-only">Format</span><select class="h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 text-sm" name="format"><option value="all"${state.search.format === "all" ? " selected" : ""}>All formats</option><option value="mp3"${state.search.format === "mp3" ? " selected" : ""}>MP3</option><option value="wma"${state.search.format === "wma" ? " selected" : ""}>WMA</option></select></label>
    <button class="h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white" type="submit">Search</button>
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
  return `<div class="flex min-h-64 flex-col items-center justify-center rounded-card border border-red-300/40 bg-red-50/50 p-8 text-center dark:bg-red-950/20"><h2 class="text-xl font-bold">The library needs another try</h2><p class="mt-2 max-w-md text-sm text-app-muted">${escapeHtml(message)}</p><button class="mt-5 rounded-full bg-app-primary px-5 py-2.5 text-sm font-bold text-white" data-action="${action}">Try again</button></div>`;
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
  const from = page.total === 0 ? 0 : page.offset + 1;
  const to = Math.min(page.offset + page.limit, page.total);
  const teacherChip =
    state.search.teacherId !== null
      ? `<div class="flex items-center gap-2 rounded-full bg-app-primary/10 px-4 py-2 text-xs font-bold text-app-primary">Teacher: ${escapeHtml(teacherName(state))}<button class="flex size-5 items-center justify-center rounded-full hover:bg-app-primary/20" data-action="clear-teacher" aria-label="Clear teacher filter"><span class="size-3">${icon("close")}</span></button></div>`
      : "";
  return `<section class="space-y-5">${renderFilters(state)}${teacherChip}<div class="flex items-center justify-between"><p class="text-sm text-app-muted">${page.total > 0 ? `${from.toLocaleString("en-US")}–${to.toLocaleString("en-US")} of ${page.total.toLocaleString("en-US")} talks` : "Search the complete audio catalogue"}</p><div class="flex gap-2"><button class="rounded-full border border-app-border px-4 py-2 text-xs font-bold" data-action="previous-page" ${page.offset === 0 ? "disabled" : ""}>Previous</button><button class="rounded-full border border-app-border px-4 py-2 text-xs font-bold" data-action="next-page" ${page.offset + page.limit >= page.total ? "disabled" : ""}>Next</button></div></div>${content}</section>`;
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
  const results = searching ? state.teacherResults : state.teachers.data;
  return `<section class="space-y-5"><form class="flex gap-3 rounded-card border border-app-border bg-app-surface p-4" data-form="teacher-search"><label class="relative flex-1"><span class="sr-only">Search teachers</span><span class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-app-muted">${icon("search")}</span><input class="h-12 w-full rounded-2xl border border-app-border bg-app-bg pl-12 pr-4 text-sm outline-none transition focus:border-app-primary" name="query" value="${escapeHtml(state.teacherQuery)}" placeholder="Search teacher name" /></label><button class="h-12 rounded-2xl bg-app-primary px-5 text-sm font-bold text-white" type="submit">Search</button></form>${searching && results.length === 0 ? renderEmpty("No teachers match", "Try a different spelling or a shorter name.") : `<div class="grid grid-cols-3 gap-4">${results.map(renderTeacherCard).join("")}</div>`}</section>`;
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
  return `<section class="mx-auto max-w-3xl space-y-4"><div class="rounded-card border border-app-border bg-app-surface p-6"><h2 class="text-lg font-bold">Appearance</h2><p class="mt-1 text-sm text-app-muted">Choose how Dhamma Echo looks on this device.</p><label class="mt-5 block text-sm font-bold">Theme<select class="mt-2 h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 font-normal" data-setting="theme">${option("system", "Follow system", state.settings.theme)}${option("light", "Light", state.settings.theme)}${option("dark", "Dark", state.settings.theme)}</select></label></div>
  <div class="rounded-card border border-app-border bg-app-surface p-6"><h2 class="text-lg font-bold">Playback</h2><div class="mt-5 grid grid-cols-2 gap-4"><label class="text-sm font-bold">Default speed<select class="mt-2 h-12 w-full rounded-2xl border border-app-border bg-app-bg px-4 font-normal" data-setting="rate">${[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => option(String(rate), `${rate}×`, String(state.settings.playbackRate))).join("")}</select></label><label class="text-sm font-bold">Default volume<span class="mt-2 flex h-12 items-center rounded-2xl border border-app-border bg-app-bg px-4"><input class="range-accent w-full" type="range" min="0" max="1" step="0.05" value="${state.settings.volume}" data-setting="volume" aria-label="Default volume" /></span></label></div></div>
  <div class="rounded-card border border-app-border bg-app-soft p-6"><h2 class="text-sm font-bold">Privacy</h2><p class="mt-2 text-sm leading-6 text-app-muted">Favorites, history, playback position, and settings are stored locally. The bundled catalogue is read-only. Audio is requested from dhammadownload.com only when played.</p></div></section>`;
}

function renderMain(state: AppState): string {
  switch (state.route) {
    case "home":
      return renderHome(state);
    case "explore":
      return renderExplore(state);
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
