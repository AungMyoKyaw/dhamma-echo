(() => {
  const document = globalThis.document;
  const { tracks, teachers, collections, categories } = globalThis.PROTOTYPE_DATA;
  const messages = globalThis.PROTOTYPE_MESSAGES;
  const storageKey = "dhamma-echo:prototype:v1";
  const routes = ["home", "explore", "collections", "teachers", "library", "settings"];
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const state = {
    route: "home",
    detailId: null,
    back: [],
    query: "",
    teacherQuery: "",
    collectionQuery: "",
    collectionTeacher: "",
    language: "",
    format: "",
    category: "",
    teacherId: "",
    collectionId: "",
    libraryTab: "downloads",
    theme: "system",
    locale: "en-US",
    rate: 1,
    browseLimit: 50,
    collapsed: false,
    volume: 1,
    muted: false,
    favorites: [1, 2, 4],
    history: [1, 3, 2],
    resume: { 1: 1122, 3: 418, 2: 240 },
    downloads: [2],
    current: 1,
    playing: false,
    position: 1122,
    queue: [],
    downloadJobs: {},
    downloadErrors: [],
    preview: "ready",
    playerPreview: "ready",
    shown: 50,
    nextSize: 50,
    loadingMore: false,
    undo: [],
    undoUntil: 0
  };
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
    );
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
  const trackById = (id) => tracks.find((track) => track.id === Number(id));
  const t = (key, parameters = {}) =>
    (messages[state.locale === "my-MM" ? "my" : "en"][key] ?? messages.en[key] ?? key).replace(
      /\{(\w+)\}/g,
      (_, name) => String(parameters[name] ?? `{${name}}`)
    );
  const number = (value) => new Intl.NumberFormat(state.locale).format(value);
  const durationSeconds = (track = trackById(state.current)) =>
    track
      ? (track.previewDuration ??
        track.duration.split(":").reduce((total, part) => total * 60 + Number(part), 0))
      : 0;
  const formatTime = (seconds) => {
    const parts = [Math.floor(Math.max(0, seconds) / 60), Math.floor(Math.max(0, seconds) % 60)];
    return parts
      .map((part, index) =>
        new Intl.NumberFormat(state.locale, {
          useGrouping: false,
          minimumIntegerDigits: index ? 2 : 1
        }).format(part)
      )
      .join(":");
  };
  const label = (key) => escape(t(key));
  let toastTimer;
  let undoTimer;
  let downloadTimer;
  let playerTimer;
  let retryTimer;
  let moreTimer;
  const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");

  function restore() {
    try {
      const saved = JSON.parse(globalThis.localStorage.getItem(storageKey));
      if (!saved || saved.version !== 1) return;
      for (const key of ["favorites", "history", "downloads"]) {
        if (Array.isArray(saved[key]))
          state[key] = [
            ...new Set(saved[key].filter((id) => Number.isInteger(id) && trackById(id)))
          ];
      }
      if (saved.resume && typeof saved.resume === "object")
        state.resume = Object.fromEntries(
          Object.entries(saved.resume)
            .filter(([id, position]) => trackById(id) && Number.isFinite(position) && position >= 0)
            .map(([id, position]) => [id, Math.min(position, durationSeconds(trackById(id)))])
        );
      if (["light", "dark", "system"].includes(saved.theme)) state.theme = saved.theme;
      if (["en-US", "my-MM"].includes(saved.locale)) state.locale = saved.locale;
      if (rates.includes(saved.rate)) state.rate = saved.rate;
      if ([25, 50, 100].includes(saved.browseLimit)) state.browseLimit = saved.browseLimit;
      state.collapsed = saved.collapsed === true;
      state.current = state.history[0] ?? null;
      state.position = state.resume[state.current] ?? 0;
      state.shown = state.browseLimit;
    } catch {
      /* The preview still works with disabled storage or malformed sample data. */
    }
  }
  function persist() {
    try {
      const saved = Object.fromEntries(
        [
          "favorites",
          "history",
          "resume",
          "downloads",
          "theme",
          "locale",
          "rate",
          "browseLimit",
          "collapsed"
        ].map((key) => [key, state[key]])
      );
      globalThis.localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...saved }));
    } catch {
      /* Storage is optional; never fall back to production application keys. */
    }
  }
  function notice(message) {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("visible");
    globalThis.clearTimeout(toastTimer);
    toastTimer = globalThis.setTimeout(() => toast.classList.remove("visible"), 2600);
  }
  function resetPaging() {
    state.shown = state.browseLimit;
    state.nextSize = 50;
    state.loadingMore = false;
    globalThis.clearTimeout(moreTimer);
  }
  function snapshotRoute() {
    return {
      route: state.route,
      detailId: state.detailId,
      scroll: globalThis.scrollY,
      shown: state.shown
    };
  }
  function navigate(route, id = null, remember = false) {
    if (remember) state.back.push(snapshotRoute());
    else state.back = [];
    state.route = route;
    state.detailId = id === null ? null : Number(id);
    state.preview = "ready";
    resetPaging();
    const hash = `${route}${id === null ? "" : `/${id}`}`;
    globalThis.history.replaceState(null, "", `#${hash}`);
    document.querySelector(".mobile-menu").open = false;
    render();
    globalThis.scrollTo(0, 0);
    document.querySelector("#view").focus({ preventScroll: true });
  }
  function back() {
    const previous = state.back.pop();
    if (!previous)
      return navigate(
        state.route === "watch"
          ? "explore"
          : state.route === "teacher-detail"
            ? "teachers"
            : "collections"
      );
    Object.assign(state, {
      route: previous.route,
      detailId: previous.detailId,
      shown: previous.shown,
      preview: "ready"
    });
    globalThis.history.replaceState(
      null,
      "",
      `#${state.route}${state.detailId === null ? "" : `/${state.detailId}`}`
    );
    render();
    globalThis.scrollTo(0, previous.scroll);
    document.querySelector("#view").focus({ preventScroll: true });
  }
  function applyAppearance() {
    document.documentElement.dataset.theme =
      state.theme === "system" ? (mediaQuery.matches ? "dark" : "light") : state.theme;
    document.documentElement.lang = state.locale === "my-MM" ? "my" : "en";
    document.documentElement.classList.toggle("locale-my", state.locale === "my-MM");
    document.documentElement.dataset.sidebarCollapsed = String(state.collapsed);
    document.querySelector(".sidebar").dataset.collapsed = String(state.collapsed);
    document
      .querySelector("#collapse-sidebar")
      .setAttribute("aria-expanded", String(!state.collapsed));
    document
      .querySelector("#collapse-sidebar")
      .setAttribute("aria-label", t(state.collapsed ? "nav.expandSidebar" : "nav.collapseSidebar"));
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
  }
  function renderNav() {
    const names = ["home", "search", "collection", "teachers", "library", "settings"];
    const currentRoute =
      state.route === "watch"
        ? (state.back.at(-1)?.route ?? "explore").replace("-detail", "s")
        : state.route.replace("-detail", "s");
    const html = routes
      .map(
        (route, index) =>
          `<a class="nav-button" href="#${route}" ${route === currentRoute ? 'aria-current="page"' : ""} title="${label(`nav.${route}`)}">${icon(names[index])}<span class="nav-label">${label(`nav.${route}`)}</span></a>`
      )
      .join("");
    document.querySelector("#desktop-nav").innerHTML = html;
    document.querySelector("#mobile-nav").innerHTML = html;
  }
  function previewTools() {
    const options = [
      ["ready", "Normal"],
      ["loading", "Loading"],
      ["error", "Catalogue error"],
      ["empty", "Empty results"],
      ["first", "First launch (clear sample library)"]
    ];
    return `<details class="prototype-tools"><summary>Sample prototype · Preview states</summary><div class="preview-controls"><label>View state<select data-setting="preview">${options.map(([value, text]) => `<option value="${value}" ${state.preview === value ? "selected" : ""}>${text}</option>`).join("")}</select></label><label>Media / downloads<select data-setting="playerPreview"><option value="ready" ${state.playerPreview === "ready" ? "selected" : ""}>Normal simulation</option><option value="loading" ${state.playerPreview === "loading" ? "selected" : ""}>Preparing media</option><option value="error" ${state.playerPreview === "error" ? "selected" : ""}>Media / download error</option></select></label><button type="button" class="secondary-button" data-action="reset">Reset sample session</button><small>Sample catalogue and download badges. Video uses a bundled silent clip; no remote media or talk downloads.</small></div></details>`;
  }
  function heading() {
    const teacher = teachers.find((item) => item.id === state.detailId);
    const collection = collections.find((item) => item.id === state.detailId);
    const title =
      state.route === "home"
        ? state.locale === "en-US"
          ? "A little space to listen."
          : t("route.home.title")
        : state.route === "teacher-detail"
          ? teacher?.name
          : state.route === "collection-detail"
            ? collection?.title
            : t(`route.${state.route}.title`);
    return `<header class="page-heading"><div><div class="eyebrow">${label(`route.${state.route}.eyebrow`)}</div><h1>${escape(title ?? "Not found")}</h1><p class="page-description">${label(`route.${state.route}.detail`)}</p></div>${previewTools()}</header>`;
  }
  function empty(title, detail, action = "explore", actionLabel = t("library.empty.action")) {
    return `<div class="empty-state"><strong>${escape(title)}</strong><p>${escape(detail)}</p>${action ? `<button type="button" class="secondary-button" data-action="${action}">${escape(actionLabel)}</button>` : ""}</div>`;
  }
  function asyncPreview() {
    if (state.preview === "loading")
      return `<div class="loading-preview" role="status"><span class="loading-dot"></span>${label("async.loading")}<div class="skeleton-line"></div><div class="skeleton-line"></div><button class="secondary-button" data-action="ready">Finish loading preview</button></div>`;
    if (state.preview === "error")
      return `<div role="alert">${empty(t("async.error.title"), t("error.catalogue.unavailable"), "retry", t("async.retry"))}</div>`;
    if (state.preview === "empty")
      return empty(
        t("explore.empty.title.filters"),
        t("explore.empty.detail.filters"),
        "ready",
        t("search.filters.clearAll")
      );
    return null;
  }
  function playButton(track, extra = "") {
    const current = track.id === state.current;
    const key =
      current && state.playerPreview === "loading"
        ? "track.connecting"
        : current && state.playing
          ? "track.pause"
          : "track.play";
    return `<button type="button" class="play-button track-play ${current ? "is-current" : ""} ${extra}" data-action="play" data-id="${track.id}" aria-label="${escape(track.mediaType === "video" ? `${video.copy("watch")}: ${track.title}` : t(key, { title: track.title }))}" aria-pressed="${current && state.playing}" ${track.playable ? "" : `disabled title="${label("error.media.unsupported")}"`}>${icon(current && state.playing && track.mediaType !== "video" ? "pause" : "play")}</button>`;
  }
  function row(track) {
    const favorite = state.favorites.includes(track.id);
    const downloaded = state.downloads.includes(track.id);
    const progress = state.downloadJobs[track.id];
    const failed = state.downloadErrors.includes(track.id);
    const resume = state.resume[track.id];
    const downloading = progress !== undefined;
    const downloadLabel = downloading
      ? t("track.download.progress.percent", { percent: number(progress) })
      : t(downloaded ? "track.download.remove" : "track.download.add");
    return `<div class="track-row" data-track="${track.id}" data-current="${track.id === state.current}">${playButton(track)}<div class="track-copy"><button type="button" class="track-title ${track.language === "Myanmar" ? "myanmar-text" : ""}" ${track.language === "Myanmar" ? 'lang="my"' : ""} data-action="play" data-id="${track.id}" ${track.playable ? "" : "disabled"}>${escape(track.title)}</button><div class="track-meta"><button class="text-link" data-action="teacher" data-id="${track.teacherId}">${escape(track.teacher)}</button><span> · ${label(track.language === "Myanmar" ? "track.language.myanmar" : "track.language.english")} · ${track.format}${track.mediaType === "video" ? ` · ${label("track.badge.video")}` : ""}</span>${resume > 0 ? `<span class="resume-marker">${escape(t("track.resumeAt", { time: formatTime(resume) }))}</span>` : ""}${failed ? '<span class="download-error" role="alert">Simulated download failed. Retry with the download button.</span>' : ""}${downloaded ? '<span class="download-marker">Sample saved · no file</span>' : ""}</div></div><div class="track-timing"><span class="track-duration">${formatTime(durationSeconds(track))}</span><span class="track-state" data-status="${track.id}">${!track.playable ? "Unavailable" : track.id === state.current ? (state.playing ? "Playing" : "Paused") : ""}</span></div><div class="row-actions"><button type="button" class="icon-button" data-action="favorite" data-id="${track.id}" aria-label="${label(favorite ? "track.favorite.remove" : "track.favorite.add")}" aria-pressed="${favorite}">${icon("heart")}</button><button type="button" class="icon-button" data-action="download" data-id="${track.id}" aria-label="${escape(downloadLabel)}" title="${escape(downloadLabel)} · simulated" ${!track.playable || downloading ? "disabled" : ""}>${downloading ? `<span class="download-progress" data-progress="${track.id}">${number(progress)}%</span>` : icon(downloaded ? "check" : "download")}</button><details class="track-menu"><summary class="icon-button" aria-label="${label("track.menu")}" title="${label("track.menu")}">${icon("more")}</summary><div class="track-menu-content"><button data-action="enqueue" data-id="${track.id}" ${track.playable ? "" : "disabled"}>${icon("queue")}${label("track.enqueue")}</button><button data-action="collection" data-id="${track.collectionId}">${icon("collection")}${label("nav.collections")}</button><button data-action="teacher" data-id="${track.teacherId}">${icon("teachers")}${label("nav.teachers")}</button></div></details></div></div>`;
  }
  function list(items) {
    return `<div class="catalogue-list">${items.map(row).join("")}</div>`;
  }
  function teacherCard(teacher, compact = false) {
    const count = tracks.filter((track) => track.teacherId === teacher.id).length;
    return `<button class="${compact ? "teacher-row" : "tile"}" data-action="teacher" data-id="${teacher.id}"><span class="teacher-initial" aria-hidden="true">${escape(
      teacher.name
        .replace(/Dr\.|Ashin/g, "")
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
    )}</span><span><strong class="teacher-name">${escape(teacher.name)}</strong><small class="teacher-count">${number(count)} ${label("noun.talks")} · ${escape(teacher.role)}</small></span>${compact ? icon("chevron") : ""}</button>`;
  }
  function collectionCard(collection) {
    const teacher = teachers.find((item) => item.id === collection.teacherId);
    const count = tracks.filter((track) => track.collectionId === collection.id).length;
    return `<button class="tile" data-action="collection" data-id="${collection.id}"><span class="tile-mark">${icon("collection")}</span><span><strong>${escape(collection.title)}</strong><small>${escape(teacher.name)} · ${number(count)} ${label("noun.talks")}</small></span></button>`;
  }
  function pagination(total, noun = "talks") {
    const shown = Math.min(state.shown, total);
    return `<div class="pagination" aria-live="polite">${shown < total ? `<button type="button" class="primary-button" data-action="more" ${state.loadingMore ? "disabled" : ""}>${state.loadingMore ? label("progress.loading") : escape(t("progress.loadMore", { count: number(Math.min(state.nextSize, total - shown)) }))}</button>` : ""}<p>${escape(t("progress.showing", { shown: number(shown), total: number(total), noun: t(`noun.${noun}`) }))}</p></div>`;
  }
  function home() {
    const recent = state.history.map(trackById).filter(Boolean);
    const resume = recent.find((track) => (state.resume[track.id] ?? 0) > 0 && track.playable);
    const resumeHtml = resume
      ? `<section class="resume-section"><div class="section-heading"><h2>${label("home.continue")}</h2></div><div class="resume-card"><div class="resume-copy"><div class="eyebrow">${label("home.resumeAt").replace("{time}", formatTime(state.resume[resume.id]))}</div><button class="resume-title" data-action="play" data-id="${resume.id}">${escape(resume.title)}</button><p>${escape(resume.teacher)}</p><div class="resume-context"><button class="text-link" data-action="collection" data-id="${resume.collectionId}">${escape(collections.find((item) => item.id === resume.collectionId).title)}</button><span> · ${resume.format}</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, (state.resume[resume.id] / durationSeconds(resume)) * 100)}%"></div></div></div>${playButton(resume, "resume-control")}</div></section>`
      : `<section class="welcome-card"><h2>${label("home.welcome.title")}</h2><p>${escape(t("home.welcome.body", { talks: `${number(tracks.length)} sample talks`, teachers: `${number(teachers.length)} sample teachers` }))}</p><button class="primary-button" data-action="explore">${label("home.welcome.explore")}</button></section>`;
    return `<div class="home-layout"><div class="main-stack">${resumeHtml}<section><div class="section-heading"><h2>${label("home.recentlyPlayed")}</h2><a href="#library">${label("nav.library")} ${icon("chevron")}</a></div>${recent.length ? list(recent.slice(0, 4)) : empty(t("library.history.empty.title"), t("library.history.empty.detail"))}</section></div><div class="side-stack"><section><div class="section-heading"><h2>${label("home.featured")}</h2><a href="#teachers">${label("home.featured.viewAll")}</a></div><div class="teacher-list">${teachers.map((teacher) => teacherCard(teacher, true)).join("")}</div></section><section><div class="section-heading"><h2>${label("nav.explore")}</h2></div><div class="browse-links"><a class="browse-link" href="#collections"><span>${label("nav.collections")}<small>${number(collections.length)} sample collections</small></span>${icon("chevron")}</a><a class="browse-link" href="#explore"><span>${label("home.welcome.explore")}<small>${number(tracks.length)} illustrative records</small></span>${icon("chevron")}</a><button class="browse-link" data-action="library-downloads"><span>${label("library.downloads")}<small>${number(state.downloads.length)} sample saved</small></span>${icon("chevron")}</button></div></section></div></div>`;
  }
  function select(name, title, options, value = state[name]) {
    return `<label class="filter-select"><span>${escape(title)}</span><select name="${name}" data-filter="${name}">${options.map(([id, text]) => `<option value="${id}" ${String(value) === String(id) ? "selected" : ""}>${escape(text)}</option>`).join("")}</select></label>`;
  }
  function searchField(name, key, value) {
    return `<div class="search-box">${icon("search")}<input name="query" type="search" data-search="${name}" aria-label="${label(`search.${key}.label`)}" placeholder="${label(`search.${key}.placeholder`)}" value="${escape(value)}" autocomplete="off" /><button class="icon-button" type="button" data-action="clear-query" data-key="${name}" aria-label="${label(key === "collections" ? "search.collections.clearSearch" : `search.${key}.clear`)}" ${value ? "" : "hidden"}>${icon("close")}</button></div>`;
  }
  function filteredTracks() {
    const query = state.query.trim().toLocaleLowerCase();
    return tracks.filter(
      (track) =>
        (!query || `${track.title} ${track.teacher}`.toLocaleLowerCase().includes(query)) &&
        (!state.language || track.language === state.language) &&
        (!state.format || track.format === state.format) &&
        (!state.category ||
          track.category === state.category ||
          (state.category === "Audio" && track.mediaType === "audio") ||
          (state.category === "Video" && track.mediaType === "video")) &&
        (!state.teacherId || track.teacherId === Number(state.teacherId)) &&
        (!state.collectionId || track.collectionId === Number(state.collectionId))
    );
  }
  function exploreResults() {
    const results = filteredTracks();
    return results.length
      ? list(results.slice(0, state.shown)) + pagination(results.length)
      : empty(
          state.query
            ? t("explore.empty.title.query", { query: state.query })
            : t("explore.empty.title.filters"),
          t("explore.empty.detail.filters"),
          "clear-filters",
          t("search.filters.clearAll")
        );
  }
  function activeFilters() {
    const keys = ["query", "language", "format", "teacherId", "collectionId", "category"].filter(
      (key) => state[key]
    );
    if (!keys.length) return "";
    return `<span>${label("search.filters.active")}:</span>${keys
      .map((key) => {
        const value =
          key === "teacherId"
            ? teachers.find((teacher) => teacher.id === Number(state[key]))?.name
            : key === "collectionId"
              ? collections.find((collection) => collection.id === Number(state[key]))?.title
              : state[key];
        return `<button class="filter-chip" data-action="clear-filter" data-key="${key}" aria-label="Clear ${key} filter">${escape(value)} ×</button>`;
      })
      .join(
        ""
      )}<button class="text-link" data-action="clear-filters">${label("search.filters.clearAll")}</button>`;
  }
  function explore() {
    return `${searchField("query", "talks", state.query)}<div class="filter-grid">${select(
      "language",
      t("search.language"),
      [
        ["", t("search.language.all")],
        ["Myanmar", t("search.language.myanmar")],
        ["English", t("search.language.english")]
      ]
    )}${select("format", t("search.format"), [["", t("search.format.all")], ...["MP3", "WMA", "MP4", "WMV"].map((format) => [format, format])])}${select("teacherId", t("search.collections.teacher"), [["", t("search.collections.allTeachers")], ...teachers.map((teacher) => [teacher.id, teacher.name])])}${select("collectionId", t("nav.collections"), [["", "All collections"], ...collections.map((collection) => [collection.id, collection.title])])}</div><div class="filter-row" role="group" aria-label="${label("search.category.legend")}">${["", ...categories].map((category) => `<button class="filter-chip" type="button" data-action="category" data-value="${category}" aria-pressed="${state.category === category}">${escape(category || t("search.category.all"))}</button>`).join("")}</div><div id="active-filters" class="active-filters">${activeFilters()}</div><div id="results" aria-live="polite">${exploreResults()}</div>`;
  }
  function collectionResults() {
    const results = collections.filter(
      (collection) =>
        (!state.collectionQuery ||
          collection.title.toLowerCase().includes(state.collectionQuery.toLowerCase())) &&
        (!state.collectionTeacher || collection.teacherId === Number(state.collectionTeacher))
    );
    if (!results.length)
      return empty(
        t("collections.empty.title"),
        t("collections.empty.detail"),
        "clear-collections",
        t("search.collections.clear")
      );
    const groups = state.collectionTeacher
      ? [{ items: results, title: "" }]
      : teachers
          .map((teacher) => ({
            title: teacher.name,
            items: results.filter((collection) => collection.teacherId === teacher.id)
          }))
          .filter((group) => group.items.length);
    return (
      groups
        .map(
          (group) =>
            `<section class="collection-group">${group.title ? `<h2>${escape(group.title)}</h2>` : ""}<div class="tile-grid">${group.items.map(collectionCard).join("")}</div></section>`
        )
        .join("") + pagination(results.length, "collections")
    );
  }
  function collectionsView() {
    return `${searchField("collectionQuery", "collections", state.collectionQuery)}<div class="filter-grid collection-filters">${select("collectionTeacher", t("search.collections.teacher"), [["", t("search.collections.allTeachers")], ...teachers.map((teacher) => [teacher.id, teacher.name])])}<button class="secondary-button" data-action="clear-collections">${label("search.collections.clear")}</button></div><div id="results" aria-live="polite">${collectionResults()}</div>`;
  }
  function teacherResults() {
    const results = teachers.filter((teacher) =>
      teacher.name.toLowerCase().includes(state.teacherQuery.toLowerCase())
    );
    return results.length
      ? `<div class="tile-grid">${results.map((teacher) => teacherCard(teacher)).join("")}</div>`
      : empty(
          t("teachers.empty.title.query", { query: state.teacherQuery }),
          t("teachers.empty.detail.query"),
          "clear-teachers",
          t("teachers.empty.clear")
        );
  }
  function detail() {
    const teacherDetail = state.route === "teacher-detail";
    const record = (teacherDetail ? teachers : collections).find(
      (item) => item.id === state.detailId
    );
    if (!record)
      return empty(
        "Sample record not found",
        "Return to the catalogue to select another record.",
        "back",
        t("back.generic")
      );
    const items = tracks.filter(
      (track) => (teacherDetail ? track.teacherId : track.collectionId) === record.id
    );
    const teacher = teacherDetail ? record : teachers.find((item) => item.id === record.teacherId);
    return `<button type="button" class="secondary-button back-button" data-action="back">${label("back.generic")}</button><section class="detail-intro">${
      teacherDetail
        ? `<span class="detail-portrait" aria-hidden="true">${escape(
            teacher.name
              .replace(/Dr\.|Ashin/g, "")
              .trim()
              .split(/\s+/)
              .map((word) => word[0])
              .slice(0, 2)
              .join("")
          )}</span><div><p>${escape(teacher.role)}</p><p>${number(items.length)} ${label("noun.talks")} · sample catalogue</p></div>`
        : `<div><p>${escape(record.detail)}</p><button class="text-link" data-action="teacher" data-id="${teacher.id}">${escape(teacher.name)}</button></div>`
    }</section>${
      teacherDetail
        ? `<button class="primary-button" data-action="teacher-explore" data-id="${record.id}">${label("teacherDetail.explore")}</button><section class="collection-group"><h2>${label("teacherDetail.collections")}</h2><div class="tile-grid">${collections
            .filter((collection) => collection.teacherId === record.id)
            .map(collectionCard)
            .join("")}</div></section>`
        : ""
    }<section><div class="section-heading"><h2>${label("teacherDetail.talks")}</h2><span>${number(items.length)} ${label("noun.talks")}</span></div>${list(items.slice(0, state.shown))}${pagination(items.length)}</section>`;
  }
  function library() {
    const ids = state[state.libraryTab];
    const items = ids.map(trackById).filter(Boolean);
    const emptyKeys = {
      downloads: ["library.downloads.empty.title", "library.downloads.empty.detail"],
      favorites: ["library.favorites.empty.title", "library.favorites.empty.detail"],
      history: ["library.history.empty.title", "library.history.empty.detail"]
    };
    return `<nav class="library-tabs" aria-label="${label("library.tabs")}">${["downloads", "favorites", "history"].map((tab) => `<button class="filter-chip" data-action="library-tab" data-value="${tab}" aria-pressed="${state.libraryTab === tab}">${label(`library.${tab}`)} <span>${number(state[tab].length)}</span></button>`).join("")}</nav>${state.libraryTab === "downloads" ? '<p class="simulation-note">Download workflow preview. Saved badges are local sample state; no files are downloaded and offline playback is not provided.</p>' : ""}${items.length ? list(items) : empty(t(emptyKeys[state.libraryTab][0]), t(emptyKeys[state.libraryTab][1]))}`;
  }
  function settingSelect(name, title, options) {
    return `<label><span class="sr-only">${escape(title)}</span><select data-setting="${name}" aria-label="${escape(title)}">${options.map(([value, text]) => `<option value="${value}" ${String(state[name]) === String(value) ? "selected" : ""}>${escape(text)}</option>`).join("")}</select></label>`;
  }
  function settings() {
    return `<div class="setting-group"><div class="setting-row"><div><strong>${label("settings.language")}</strong><small>${label("settings.language.detail")}</small></div>${settingSelect(
      "locale",
      t("settings.language.group"),
      [
        ["en-US", "English"],
        ["my-MM", "မြန်မာ"]
      ]
    )}</div><div class="setting-row"><div><strong>${label("settings.appearance")}</strong><small>${label("settings.appearance.detail")}</small></div>${settingSelect(
      "theme",
      t("settings.appearance.group"),
      ["light", "dark", "system"].map((value) => [value, t(`settings.theme.${value}`)])
    )}</div><div class="setting-row"><div><strong>${label("settings.playback.speed")}</strong><small>${label("settings.playback.detail")}</small></div><div class="setting-actions">${settingSelect(
      "rate",
      t("settings.playback.speed"),
      rates.map((rate) => [rate, `${number(rate)}×`])
    )}<button class="secondary-button" data-action="reset-rate">${label("settings.playback.speed.reset")}</button></div></div><div class="setting-row"><strong>${label("settings.playback.limit")}</strong>${settingSelect(
      "browseLimit",
      t("settings.playback.limit"),
      [25, 50, 100].map((value) => [value, number(value)])
    )}</div><div class="setting-row"><div><strong>${label("settings.keyboard")}</strong><small>${label("settings.keyboard.detail")}</small></div><button class="secondary-button" data-action="help">${label("settings.keyboard.view")}</button></div></div><section class="privacy-detail"><h2>${label("settings.privacy.title")}</h2><p>This prototype stores sample favorites, history, resume positions, settings, and saved-download badges locally in a separate browser storage namespace. Nothing is sent to a server. Media and native downloads are simulated.</p></section><details class="about-section"><summary>${label("settings.about")}</summary><p>${label("settings.about.body1")}</p><p>${label("settings.about.body2")}</p><p>Prototype only: illustrative data, no SQLite catalogue or native file access.</p></details>`;
  }
  function focusToken(root) {
    const active = document.activeElement;
    if (!active || !root.contains(active)) return null;
    if (active.hasAttribute("data-seek")) return "[data-seek]";
    if (active.hasAttribute("data-volume")) return "[data-volume]";
    const keys = ["action", "id", "value", "key", "slot", "setting", "filter", "search"].filter(
      (key) => active.dataset[key] !== undefined
    );
    return keys.length
      ? keys.map((key) => `[data-${key}="${globalThis.CSS.escape(active.dataset[key])}"]`).join("")
      : null;
  }
  function restoreFocus(root, token) {
    if (token)
      (root.querySelector(token) ?? root.querySelector("button:not([disabled])"))?.focus({
        preventScroll: true
      });
  }
  function renderView() {
    const view = document.querySelector("#view");
    const token = focusToken(view);
    const toolsOpen = view.querySelector(".prototype-tools")?.open;
    if (state.route === "watch") {
      const track = trackById(state.current);
      if (!track || track.mediaType !== "video") {
        video.park();
        view.innerHTML = empty("Video not found", "Choose a video from Explore.");
        return;
      }
      if (view.dataset.surface !== "watch" || view.dataset.watchTrack !== String(track.id)) {
        video.park();
        view.innerHTML = video.page(track, "");
        view.dataset.surface = "watch";
        view.dataset.watchTrack = String(track.id);
      }
      video.attachWatch(track);
      restoreFocus(view, token);
      return;
    }
    video.park();
    view.dataset.surface = state.route;
    const views = {
      home,
      explore,
      collections: collectionsView,
      teachers: () =>
        `${searchField("teacherQuery", "teachers", state.teacherQuery)}<div id="results" class="search-results" aria-live="polite">${teacherResults()}</div>`,
      library,
      settings,
      "teacher-detail": detail,
      "collection-detail": detail
    };
    view.innerHTML = heading() + (asyncPreview() ?? views[state.route]());
    view.querySelector(".prototype-tools").open = Boolean(toolsOpen);
    restoreFocus(view, token);
  }
  function updateResults() {
    const results = document.querySelector("#results");
    if (results)
      results.innerHTML =
        state.route === "teachers"
          ? teacherResults()
          : state.route === "collections"
            ? collectionResults()
            : exploreResults();
    const filters = document.querySelector("#active-filters");
    if (state.route === "explore" && filters) filters.innerHTML = activeFilters();
    const input = document.querySelector("[data-search]");
    if (input)
      input.parentElement.querySelector("[data-action='clear-query']").hidden = !input.value;
  }
  function queueButton() {
    return `<button class="icon-button queue-button" type="button" data-action="queue" aria-label="${label("player.queue.show")}" aria-expanded="${document.querySelector("#queue-dialog").open}">${icon("queue")}<span class="queue-count ${state.queue.length ? "visible" : ""}">${number(state.queue.length)}</span></button>`;
  }
  function transport() {
    return `<div class="transport-controls"><button class="icon-button" type="button" data-action="seek-back" aria-label="${label("player.back15")}">${icon("back")}</button><button class="play-button" type="button" data-action="toggle-play" aria-keyshortcuts="Space" aria-pressed="${state.playing}" aria-label="${label(state.playing ? "player.pause" : "player.play")}">${icon(state.playing ? "pause" : "play")}</button><button class="icon-button" type="button" data-action="seek-forward" aria-label="${label("player.forward15")}">${icon("forward")}</button><button class="icon-button" type="button" data-action="next" aria-label="${label("shortcuts.next")}" ${state.queue.length ? "" : "disabled"}>${icon("next")}</button></div><div class="scrubber"><span data-time="current">${formatTime(state.position)}</span><input id="playback-position" data-seek type="range" min="0" max="${durationSeconds()}" step="1" value="${state.position}" aria-label="${label("player.position")}" /><span data-time="duration">${formatTime(durationSeconds())}</span></div>`;
  }
  function mediaNotice() {
    return state.playerPreview === "error"
      ? `<div class="media-notice" role="alert">Simulated media unavailable.<button class="text-link" data-action="retry-player">${label("player.retry")}</button><button class="text-link" data-action="dismiss-player">${label("player.dismiss")}</button></div>`
      : state.playerPreview === "loading"
        ? `<div class="media-notice" role="status">${label("video.preparing")} · simulation<button class="text-link" data-action="retry-player">Finish preview</button></div>`
        : "";
  }
  function renderPlayer() {
    const track = trackById(state.current);
    const player = document.querySelector("#player");
    const token = focusToken(player);
    player.setAttribute(
      "aria-label",
      t(track?.mediaType === "video" ? "video.controls" : "player.region")
    );
    player.hidden = !track || (track.mediaType === "video" && state.route === "watch");
    player.classList.toggle("video-dock", track?.mediaType === "video");
    document.body.classList.toggle("watch-open", state.route === "watch");
    if (!track) {
      video.park();
      player.innerHTML = "";
      return;
    }
    if (track.mediaType === "video" && state.route === "watch") {
      player.innerHTML = "";
      video.refresh();
      return;
    }
    if (track.mediaType === "audio") {
      video.park();
      delete player.dataset.videoTrack;
      player.innerHTML = `<div class="player-track"><strong>${escape(track.title)}</strong><span>${escape(track.teacher)}</span><small>${state.playing ? "Playing" : "Paused"} · simulated audio</small>${mediaNotice()}</div><div class="transport">${transport()}</div><div class="player-actions">${settingSelect(
        "rate",
        t("player.speed"),
        rates.map((rate) => [rate, `${number(rate)}×`])
      )}${queueButton()}<button class="icon-button" data-action="help" aria-label="${label("shortcuts.title")}">?</button></div>`;
    } else {
      if (
        player.dataset.videoTrack !== String(track.id) ||
        !player.querySelector("[data-dock-media]")
      ) {
        video.park();
        player.innerHTML = video.dock(track);
        player.dataset.videoTrack = String(track.id);
      }
      video.attachDock(track);
      video.refreshDock();
    }
    syncProgress();
    restoreFocus(player, token);
  }
  function syncProgress() {
    document.querySelectorAll("[data-time='current']").forEach((element) => {
      element.textContent = formatTime(state.position);
    });
    document.querySelectorAll("[data-dock-time]").forEach((element) => {
      element.textContent = `${formatTime(state.position)} / ${formatTime(durationSeconds())} · ${video.copy("sample")}`;
    });
    document.querySelectorAll("[data-seek]").forEach((element) => {
      if (!state.seeking) element.value = String(state.position);
      element.setAttribute(
        "aria-valuetext",
        t("player.position.value", {
          current: formatTime(state.position),
          duration: formatTime(durationSeconds())
        })
      );
    });
  }
  function syncPlayback() {
    document.querySelectorAll("[data-action='play']").forEach((button) => {
      const track = trackById(button.dataset.id);
      if (!track || !button.classList.contains("play-button")) return;
      const active = track.id === state.current;
      button.classList.toggle("is-current", active);
      button.setAttribute("aria-pressed", String(active && state.playing));
      button.setAttribute(
        "aria-label",
        track.mediaType === "video"
          ? `${video.copy("watch")}: ${track.title}`
          : t(active && state.playing ? "track.pause" : "track.play", { title: track.title })
      );
      button.innerHTML = icon(
        active && state.playing && track.mediaType !== "video" ? "pause" : "play"
      );
    });
    document.querySelectorAll("[data-track]").forEach((element) => {
      element.dataset.current = String(Number(element.dataset.track) === state.current);
    });
    document.querySelectorAll("[data-status]").forEach((element) => {
      const track = trackById(element.dataset.status);
      element.textContent = !track.playable
        ? "Unavailable"
        : track.id === state.current
          ? state.playing
            ? "Playing"
            : "Paused"
          : "";
    });
    renderPlayer();
  }
  function render() {
    applyAppearance();
    renderNav();
    renderView();
    renderPlayer();
    if (document.querySelector("#queue-dialog").open) renderQueue();
  }
  function setPlaying(playing) {
    state.playing = Boolean(playing && state.current !== null && state.playerPreview === "ready");
    if (trackById(state.current)?.mediaType === "video") {
      if (state.playing) video.play();
      else video.pause();
    }
    syncPlayback();
  }
  function openWatch() {
    const track = trackById(state.current);
    if (!track || track.mediaType !== "video") return;
    if (state.route !== "watch") state.back.push(snapshotRoute());
    state.route = "watch";
    state.detailId = track.id;
    state.preview = "ready";
    globalThis.history.replaceState(null, "", `#watch/${track.id}`);
    render();
    globalThis.scrollTo(0, 0);
    document.querySelector("#view").focus({ preventScroll: true });
  }
  function playTrack(id, force = false) {
    const track = trackById(id);
    if (!track?.playable) return;
    if (state.current === track.id && !force) {
      if (track.mediaType === "video" && state.route !== "watch") {
        openWatch();
        setPlaying(true);
        return;
      }
      return setPlaying(!state.playing);
    }
    video.pause();
    state.current = track.id;
    state.position = state.resume[track.id] ?? 0;
    if (state.position >= durationSeconds(track)) state.position = 0;
    state.history = [track.id, ...state.history.filter((entry) => entry !== track.id)].slice(
      0,
      100
    );
    state.playing = state.playerPreview === "ready";
    persist();
    if (track.mediaType === "video") {
      video.prepare(track);
      openWatch();
      if (state.playing) video.play();
    } else if (state.route === "watch") back();
    else if (
      state.route === "home" ||
      (state.route === "library" && state.libraryTab === "history")
    )
      renderView();
    syncPlayback();
  }
  function seek(seconds) {
    if (state.current === null || !Number.isFinite(seconds)) return;
    state.position = Math.max(0, Math.min(durationSeconds(), seconds));
    state.resume[state.current] = state.position;
    if (trackById(state.current)?.mediaType === "video") video.seek(state.position);
    persist();
    syncProgress();
  }
  function enqueue(id) {
    const track = trackById(id);
    if (!track?.playable || state.queue.includes(track.id)) return;
    state.queue.push(track.id);
    renderPlayer();
    if (document.querySelector("#queue-dialog").open) renderQueue();
    notice(`${t("queue.title")}: ${track.title}`);
  }
  function playNext() {
    const next = state.queue.shift();
    if (next === undefined) setPlaying(false);
    else playTrack(next, true);
    if (document.querySelector("#queue-dialog").open) renderQueue();
  }
  function renderQueue() {
    const dialog = document.querySelector("#queue-dialog");
    const token = focusToken(dialog);
    const undo = document.querySelector("#undo");
    if (undo) document.body.append(undo);
    document.querySelector("#queue-dialog").innerHTML =
      `<div class="dialog-heading"><h2 id="queue-title">${label("queue.title")} <small>${number(state.queue.length)}</small></h2><div><button class="secondary-button" data-action="clear-queue" ${state.queue.length ? "" : "disabled"}>${label("queue.clear")}</button><button class="icon-button" data-action="close-dialog" aria-label="Close queue">${icon("close")}</button></div></div>${
        state.queue.length
          ? `<ol class="queue-list">${state.queue
              .map((id) => {
                const track = trackById(id);
                return `<li><button class="text-link" data-action="queue-play" data-id="${id}">${escape(track.title)}<small>${escape(track.teacher)}</small></button><button class="icon-button" data-action="remove-queue" data-id="${id}" aria-label="${escape(t("queue.remove", { title: track.title }))}">${icon("close")}</button></li>`;
              })
              .join("")}</ol>`
          : `<p>${label("queue.empty")}</p>`
      }`;
    if (undo && !undo.hidden) dialog.append(undo);
    restoreFocus(dialog, token);
  }
  function openQueue() {
    renderQueue();
    document.querySelector("#queue-dialog").showModal();
    renderPlayer();
  }
  function clearQueue() {
    state.undo = [...state.queue];
    state.queue = [];
    state.undoUntil = Date.now() + 6000;
    const undo = document.querySelector("#undo");
    undo.innerHTML = `${escape(t("queue.cleared", { count: number(state.undo.length) }))}<button class="text-link" data-action="undo">${label("queue.undo")}</button><button class="icon-button" data-action="dismiss-undo" aria-label="${label("queue.undo.dismiss")}">${icon("close")}</button>`;
    undo.hidden = false;
    // Keep undo inside the modal's focus boundary while the queue is open.
    renderQueue();
    renderPlayer();
    undo.querySelector("[data-action='undo']")?.focus({ preventScroll: true });
    globalThis.clearTimeout(undoTimer);
    undoTimer = globalThis.setTimeout(dismissUndo, 6000);
  }
  function dismissUndo() {
    state.undo = [];
    state.undoUntil = 0;
    const undo = document.querySelector("#undo");
    if (undo) {
      undo.hidden = true;
      document.body.append(undo);
    }
  }
  function undoQueue() {
    if (Date.now() < state.undoUntil) state.queue = [...new Set([...state.undo, ...state.queue])];
    dismissUndo();
    renderQueue();
    renderPlayer();
  }
  function openHelp() {
    const entries = [
      ["Space", "playPause"],
      ["←", "back15"],
      ["Shift + ←", "back60"],
      ["→", "forward15"],
      ["Shift + →", "forward60"],
      ["N", "next"],
      ["?", "toggleHelp"],
      ["[", "toggleSidebar"],
      ["⌘ / Ctrl + F", "focusSearch"],
      ["⌘ / Ctrl + ,", "openSettings"],
      ["Esc", "escape"]
    ];
    document.querySelector("#help-dialog").innerHTML =
      `<div class="dialog-heading"><h2 id="help-title">${label("shortcuts.title")}</h2><button class="icon-button" data-action="close-dialog" aria-label="${label("shortcuts.close")}">${icon("close")}</button></div><p>${label("shortcuts.detail")}</p><dl class="shortcut-list">${entries.map(([keys, key]) => `<div><dt>${label(`shortcuts.${key}`)}</dt><dd><kbd>${keys}</kbd></dd></div>`).join("")}</dl><p>${escape(t("shortcuts.searchNote", { key: "Esc" }))}</p>`;
    document.querySelector("#help-dialog").showModal();
  }
  function download(id) {
    const track = trackById(id);
    if (!track?.playable || state.downloadJobs[track.id] !== undefined) return;
    if (state.downloads.includes(track.id)) {
      state.downloads = state.downloads.filter((item) => item !== track.id);
      persist();
      renderView();
      notice("Sample download removed. No file was deleted.");
      return;
    }
    state.downloadErrors = state.downloadErrors.filter((item) => item !== track.id);
    if (state.playerPreview === "error") {
      state.downloadErrors.push(track.id);
      renderView();
      return;
    }
    state.downloadJobs[track.id] = 0;
    renderView();
    if (downloadTimer) return;
    downloadTimer = globalThis.setInterval(() => {
      for (const key of Object.keys(state.downloadJobs)) {
        state.downloadJobs[key] += 25;
        if (state.downloadJobs[key] >= 100) {
          delete state.downloadJobs[key];
          if (!state.downloads.includes(Number(key))) state.downloads.push(Number(key));
          persist();
          notice("Sample download saved. No media file was downloaded.");
          renderView();
        } else
          document.querySelectorAll(`[data-progress='${key}']`).forEach((element) => {
            element.textContent = `${number(state.downloadJobs[key])}%`;
            element
              .closest("button")
              .setAttribute(
                "aria-label",
                t("track.download.progress.percent", { percent: number(state.downloadJobs[key]) })
              );
          });
      }
      if (!Object.keys(state.downloadJobs).length) {
        globalThis.clearInterval(downloadTimer);
        downloadTimer = null;
      }
    }, 400);
  }
  function changeSetting(key, value) {
    if (key === "preview") {
      if (value === "first") {
        video.stop();
        state.favorites = [];
        state.history = [];
        state.resume = {};
        state.downloads = [];
        state.current = null;
        state.playing = false;
        persist();
      }
      state.preview = value;
      renderView();
      renderPlayer();
      return;
    }
    if (key === "playerPreview") {
      state.playerPreview = value;
      if (value !== "ready") {
        state.playing = false;
        video.pause();
      }
      syncPlayback();
      return;
    }
    if (key === "theme" && ["light", "dark", "system"].includes(value)) state.theme = value;
    if (key === "locale" && ["en-US", "my-MM"].includes(value)) state.locale = value;
    if (key === "rate" && rates.includes(Number(value))) state.rate = Number(value);
    if (key === "browseLimit" && [25, 50, 100].includes(Number(value))) {
      state.browseLimit = Number(value);
      resetPaging();
    }
    video.setRate();
    persist();
    render();
  }
  function closeVideo() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    video.stop();
    state.playing = false;
    state.current = null;
    state.position = 0;
    if (state.route === "watch") back();
    renderPlayer();
    syncPlayback();
  }
  function retry() {
    state.preview = "loading";
    renderView();
    globalThis.clearTimeout(retryTimer);
    retryTimer = globalThis.setTimeout(() => {
      state.preview = "ready";
      renderView();
    }, 450);
  }
  function loadMore() {
    if (state.loadingMore) return;
    state.loadingMore = true;
    if (state.route === "explore") updateResults();
    else renderView();
    moreTimer = globalThis.setTimeout(() => {
      state.shown += state.nextSize;
      state.nextSize = Math.min(500, state.nextSize * 2);
      state.loadingMore = false;
      if (state.route === "explore") updateResults();
      else renderView();
    }, 300);
  }
  function reset() {
    globalThis.clearInterval(downloadTimer);
    globalThis.clearInterval(playerTimer);
    globalThis.clearTimeout(retryTimer);
    globalThis.clearTimeout(moreTimer);
    globalThis.clearTimeout(undoTimer);
    try {
      globalThis.localStorage.removeItem(storageKey);
    } catch {
      /* Optional storage. */
    }
    globalThis.location.replace(`${globalThis.location.pathname}#home`);
    globalThis.location.reload();
  }
  const actions = {
    play: (element) => playTrack(element.dataset.id),
    "toggle-play": () => (state.current === null ? undefined : setPlaying(!state.playing)),
    favorite: (element) => {
      const id = Number(element.dataset.id);
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((item) => item !== id)
        : [...state.favorites, id];
      persist();
      renderView();
    },
    teacher: (element) => navigate("teacher-detail", element.dataset.id, true),
    collection: (element) => navigate("collection-detail", element.dataset.id, true),
    back,
    "teacher-explore": (element) => {
      state.teacherId = element.dataset.id;
      state.query = "";
      state.language = "";
      state.format = "";
      state.category = "";
      state.collectionId = "";
      navigate("explore", null, true);
    },
    explore: () => navigate("explore"),
    "library-downloads": () => {
      state.libraryTab = "downloads";
      navigate("library");
    },
    "library-tab": (element) => {
      state.libraryTab = element.dataset.value;
      renderView();
    },
    "clear-query": (element) => {
      state[element.dataset.key] = "";
      resetPaging();
      renderView();
      document.querySelector("[data-search]")?.focus();
    },
    "clear-filters": () => {
      for (const key of ["query", "language", "format", "teacherId", "collectionId", "category"])
        state[key] = "";
      resetPaging();
      renderView();
    },
    "clear-filter": (element) => {
      state[element.dataset.key] = "";
      resetPaging();
      renderView();
    },
    "clear-collections": () => {
      state.collectionQuery = "";
      state.collectionTeacher = "";
      resetPaging();
      renderView();
    },
    "clear-teachers": () => {
      state.teacherQuery = "";
      renderView();
      document.querySelector("[data-search]")?.focus();
    },
    category: (element) => {
      state.category = element.dataset.value;
      resetPaging();
      renderView();
    },
    enqueue: (element) => enqueue(element.dataset.id),
    queue: openQueue,
    "clear-queue": clearQueue,
    undo: undoQueue,
    "dismiss-undo": dismissUndo,
    "remove-queue": (element) => {
      state.queue = state.queue.filter((id) => id !== Number(element.dataset.id));
      renderQueue();
      renderPlayer();
    },
    "queue-play": (element) => {
      state.queue = state.queue.filter((id) => id !== Number(element.dataset.id));
      playTrack(element.dataset.id, true);
      renderQueue();
    },
    next: playNext,
    "seek-back": () => seek(state.position - 15),
    "seek-forward": () => seek(state.position + 15),
    download: (element) => download(element.dataset.id),
    help: openHelp,
    "close-dialog": (element) => element.closest("dialog").close(),
    collapse: () => {
      state.collapsed = !state.collapsed;
      persist();
      applyAppearance();
    },
    more: loadMore,
    retry,
    ready: () => {
      state.preview = "ready";
      renderView();
    },
    "retry-player": () => {
      state.playerPreview = "ready";
      video.retry();
      setPlaying(true);
    },
    "dismiss-player": () => {
      state.playerPreview = "ready";
      setPlaying(false);
    },
    "stop-video": closeVideo,
    "open-watch": openWatch,
    fullscreen: () => video.fullscreen(),
    mute: () => video.toggleMuted(),
    "reset-rate": () => changeSetting("rate", 1),
    reset
  };
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action && !action.disabled) {
      event.preventDefault();
      const menu = action.closest(".track-menu");
      if (menu) menu.open = false;
      actions[action.dataset.action]?.(action);
      return;
    }
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash !== "#view") {
      event.preventDefault();
      const [route, id] = link.hash.slice(1).split("/");
      if (routes.includes(route)) navigate(route, id);
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target.matches("[data-seek]")) state.seeking = true;
  });
  document.addEventListener("pointerup", () => {
    state.seeking = false;
    syncProgress();
  });
  document.addEventListener("pointercancel", () => {
    state.seeking = false;
    syncProgress();
  });
  document.addEventListener("input", (event) => {
    const input = event.target;
    if (input.matches("[data-seek]")) {
      seek(Number(input.value));
      return;
    }
    if (input.matches("[data-volume]")) {
      video.setVolume(input.value);
      return;
    }
    if (input.dataset.search) {
      state[input.dataset.search] = input.value;
      resetPaging();
      updateResults();
    }
  });
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (input.dataset.setting) changeSetting(input.dataset.setting, input.value);
    if (input.dataset.filter) {
      state[input.dataset.filter] = input.value;
      resetPaging();
      renderView();
      document.querySelector(`[data-filter='${input.dataset.filter}']`)?.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    const dialog = document.querySelector("dialog[open]");
    const editable = event.target.closest("input, select, textarea, [contenteditable='true']");
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f" && !dialog) {
      event.preventDefault();
      document.querySelector('input[name="query"]')?.focus();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "," && !dialog) {
      event.preventDefault();
      navigate("settings");
      return;
    }
    if (editable) {
      if (event.key === "Escape" && event.target.dataset.search) {
        event.preventDefault();
        event.target.value = "";
        state[event.target.dataset.search] = "";
        resetPaging();
        updateResults();
      }
      return;
    }
    if (dialog) {
      if (event.key === "?" && dialog.id === "help-dialog") {
        event.preventDefault();
        dialog.close();
      }
      return;
    }
    if (event.key === "Escape" && state.route === "watch" && !document.fullscreenElement) {
      event.preventDefault();
      back();
      return;
    }
    if (
      event.key.toLowerCase() === "f" &&
      !event.metaKey &&
      !event.ctrlKey &&
      state.route === "watch"
    ) {
      event.preventDefault();
      void video.fullscreen();
      return;
    }
    if (
      event.key.toLowerCase() === "m" &&
      state.current &&
      trackById(state.current).mediaType === "video"
    ) {
      event.preventDefault();
      video.toggleMuted();
      return;
    }
    if (event.key === "?") {
      event.preventDefault();
      openHelp();
    } else if (event.code === "Space") {
      // Native Space activates the focused control once; don't also toggle transport.
      if (event.target.closest("button, summary, a")) return;
      event.preventDefault();
      actions["toggle-play"]();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      seek(state.position + (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 60 : 15));
    } else if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      playNext();
    } else if (event.key === "[") {
      event.preventDefault();
      actions.collapse();
    }
  });
  for (const dialog of document.querySelectorAll("dialog")) {
    dialog.addEventListener("close", () => {
      const undo = document.querySelector("#undo");
      if (undo && dialog.contains(undo)) document.body.append(undo);
      renderPlayer();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
  }
  mediaQuery.addEventListener("change", () => {
    if (state.theme === "system") applyAppearance();
  });
  globalThis.addEventListener("beforeunload", persist);
  globalThis.addEventListener("hashchange", () => {
    const [route, id] = globalThis.location.hash.slice(1).split("/");
    if (routes.includes(route) || ["teacher-detail", "collection-detail"].includes(route))
      navigate(route, id ?? null);
  });
  const video = globalThis.createPrototypeVideo({
    document,
    state,
    trackById,
    icon,
    escape,
    label,
    t,
    number,
    formatTime,
    durationSeconds,
    persist,
    notice,
    settingSelect,
    focusToken,
    restoreFocus,
    onPlaybackChange: syncPlayback,
    onProgress: syncProgress,
    onEnded: playNext,
    onToggle: () => setPlaying(!state.playing)
  });
  restore();
  const [initialRoute, initialId] = globalThis.location.hash.slice(1).split("/");
  if (
    routes.includes(initialRoute) ||
    ["teacher-detail", "collection-detail"].includes(initialRoute)
  ) {
    state.route = initialRoute;
    state.detailId = initialId ? Number(initialId) : null;
  }
  if (
    initialRoute === "watch" &&
    trackById(initialId)?.mediaType === "video" &&
    trackById(initialId).playable
  ) {
    state.current = Number(initialId);
    state.route = "watch";
    state.detailId = state.current;
    state.position = state.resume[state.current] ?? 0;
  }
  render();
  playerTimer = globalThis.setInterval(() => {
    if (!state.playing || state.current === null || trackById(state.current).mediaType === "video")
      return;
    seek(state.position + state.rate);
    if (state.position >= durationSeconds()) playNext();
  }, 1000);
  // Explicit test/debug surface. This browser-only state is not the Tauri app store.
  globalThis.DhammaPrototype = {
    state,
    storageKey,
    playTrack,
    setPlaying,
    seek,
    enqueue,
    playNext,
    download,
    filteredTracks,
    changeSetting,
    navigate,
    back,
    openWatch,
    closeVideo,
    clearQueue,
    undoQueue,
    render,
    durationSeconds,
    formatTime
  };
})();
