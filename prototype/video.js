// A dedicated watch task and a compact browse dock share one HTMLVideoElement.
// The bundled silent clip is an interface sample, never a teacher recording.
globalThis.createPrototypeVideo = (dependencies) => {
  const {
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
    onPlaybackChange,
    onProgress,
    onEnded
  } = dependencies;
  const media = document.querySelector("#video-media");
  const words = {
    en: {
      watch: "Watch video",
      return: "Return to video",
      back: "Back to {route}",
      stop: "Stop video",
      volume: "Volume",
      mute: "Mute",
      unmute: "Unmute",
      replay: "Replay video",
      sample: "24-second silent sample. Not a recorded talk.",
      emptyTitle: "Choose what plays next",
      emptyDetail: "Queue a talk from Explore. It appears here.",
      browse: "Browse talks",
      queueHint: "Starts when this video ends.",
      add: "Add to queue",
      added: "In queue",
      loading: "Preparing the video…",
      error: "This video could not play.",
      denied: "Press Play to start the sample video.",
      finish: "Finish loading preview",
      fullscreen: "Fullscreen",
      exit: "Exit fullscreen",
      continue: "Video continues while you browse."
    },
    my: {
      watch: "ဗီဒီယို ကြည့်မည်",
      return: "ဗီဒီယိုသို့ ပြန်မည်",
      back: "{route} သို့ ပြန်မည်",
      stop: "ဗီဒီယို ရပ်မည်",
      volume: "အသံအတိုးအကျယ်",
      mute: "အသံပိတ်မည်",
      unmute: "အသံဖွင့်မည်",
      replay: "ဗီဒီယို ပြန်ဖွင့်မည်",
      sample: "၂၄ စက္ကန့် အသံမပါသော နမူနာ။ တရားဟော မှတ်တမ်း မဟုတ်ပါ။",
      emptyTitle: "နောက်ဖွင့်မည့် တရားတော်ကို ရွေးပါ",
      emptyDetail: "ရှာဖွေခြင်းမှ တရားတော်ကို တန်းစီစာရင်းထဲ ထည့်ပါ။ ဤနေရာတွင် ပေါ်လာမည်။",
      browse: "တရားတော်များ ရှာမည်",
      queueHint: "ဗီဒီယို ပြီးလျှင် ဆက်ဖွင့်မည်။",
      add: "တန်းစီစာရင်းထဲ ထည့်မည်",
      added: "တန်းစီစာရင်းထဲ ရှိသည်",
      loading: "ဗီဒီယို ပြင်ဆင်နေသည်…",
      error: "ဤဗီဒီယိုကို ဖွင့်၍ မရပါ။",
      denied: "နမူနာ ဗီဒီယို စတင်ရန် ဖွင့် ခလုတ်ကို နှိပ်ပါ။",
      finish: "နမူနာ တင်ခြင်း ပြီးမည်",
      fullscreen: "မျက်နှာပြင်အပြည့်",
      exit: "မျက်နှာပြင်အပြည့်မှ ထွက်မည်",
      continue: "ရှာဖွေနေစဉ် ဗီဒီယို ဆက်ဖွင့်နေမည်။"
    }
  };
  const copy = (key, parameters = {}) =>
    words[state.locale === "my-MM" ? "my" : "en"][key].replace(/\{(\w+)\}/g, (_, name) =>
      String(parameters[name] ?? "")
    );
  let generation = 0;
  let playWanted = false;
  let mediaError = "";
  const currentVideo = () => trackById(state.current)?.mediaType === "video";

  function park() {
    const host = document.querySelector("#media-parking");
    if (media.parentElement !== host) host.append(media);
  }
  function prepare(track) {
    if (media.dataset.sourceTrack === String(track.id)) return;
    generation += 1;
    mediaError = "";
    media.dataset.sourceTrack = String(track.id);
    media.src = "./assets/video-sample.mp4";
    media.setAttribute("aria-label", `${track.title}. ${copy("sample")}`);
    media.load();
    media.playbackRate = state.rate;
    media.volume = state.volume;
    media.muted = state.muted;
  }
  function seek(seconds) {
    if (!currentVideo() || media.readyState < 1) return;
    media.currentTime = Math.max(
      0,
      Math.min(Number.isFinite(media.duration) ? media.duration : 24, seconds)
    );
  }
  function play() {
    if (!currentVideo()) return;
    prepare(trackById(state.current));
    if (state.playerPreview !== "ready") {
      pause();
      return;
    }
    if (state.position >= durationSeconds() || media.ended) {
      state.position = 0;
      seek(0);
    }
    playWanted = true;
    const request = generation;
    media.playbackRate = state.rate;
    const result = media.play();
    result?.catch((error) => {
      if (request !== generation || !playWanted || error.name === "AbortError") return;
      state.playing = false;
      state.playerPreview = "error";
      mediaError = error.name === "NotAllowedError" ? copy("denied") : copy("error");
      onPlaybackChange();
    });
  }
  function pause() {
    playWanted = false;
    media.pause();
  }
  function retry() {
    mediaError = "";
    if (media.error) {
      generation += 1;
      media.load();
    }
  }
  function setRate() {
    media.playbackRate = state.rate;
  }
  function setVolume(value) {
    state.volume = Math.max(0, Math.min(1, Number(value)));
    if (!Number.isFinite(state.volume)) state.volume = 1;
    state.muted = state.volume === 0;
    media.volume = state.volume;
    media.muted = state.muted;
    const button = document.querySelector("#watch-controls [data-action='mute']");
    if (button) {
      button.setAttribute("aria-label", copy(state.muted ? "unmute" : "mute"));
      button.setAttribute("aria-pressed", String(state.muted));
      button.title = copy(state.muted ? "unmute" : "mute");
      button.innerHTML = icon(state.muted ? "muted" : "volume");
    }
  }
  function toggleMuted() {
    state.muted = !state.muted;
    media.muted = state.muted;
    refresh();
  }

  function controls() {
    const ended = state.position >= durationSeconds();
    const playLabel = state.playing ? t("video.pause") : ended ? copy("replay") : t("video.play");
    return `<div class="watch-scrubber"><span data-time="current">${formatTime(state.position)}</span><input id="playback-position" data-seek type="range" min="0" max="${durationSeconds()}" step="0.1" value="${state.position}" aria-label="${label("player.position")}" /><span data-time="duration">${formatTime(durationSeconds())}</span></div><div class="watch-control-row"><div class="transport-controls"><button class="play-button" type="button" data-action="toggle-play" data-slot="transport" aria-label="${escape(playLabel)}" aria-pressed="${state.playing}" aria-keyshortcuts="Space">${icon(state.playing ? "pause" : "play")}</button><button class="icon-button" data-action="seek-back" aria-label="${label("player.back15")}" title="${label("player.back15")}">${icon("back")}</button><button class="icon-button" data-action="seek-forward" aria-label="${label("player.forward15")}" title="${label("player.forward15")}">${icon("forward")}</button><button class="icon-button" data-action="next" aria-label="${label("shortcuts.next")}" title="${label("shortcuts.next")}" ${state.queue.length ? "" : "disabled"}>${icon("next")}</button></div><div class="watch-options"><div class="watch-volume"><button class="icon-button" data-action="mute" aria-label="${escape(copy(state.muted ? "unmute" : "mute"))}" title="${escape(copy(state.muted ? "unmute" : "mute"))}" aria-pressed="${state.muted}">${icon(state.muted ? "muted" : "volume")}</button><input data-volume type="range" min="0" max="1" step="0.05" value="${state.muted ? 0 : state.volume}" aria-label="${escape(copy("volume"))}" /></div>${settingSelect(
      "rate",
      t("player.speed"),
      [0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => [rate, `${number(rate)}×`])
    )}<button class="icon-button watch-fullscreen" data-action="fullscreen" aria-label="${escape(copy(document.fullscreenElement ? "exit" : "fullscreen"))}" title="${escape(copy(document.fullscreenElement ? "exit" : "fullscreen"))}">${icon(document.fullscreenElement ? "exit-fullscreen" : "fullscreen")}</button></div></div>`;
  }
  function details(track) {
    const favorite = state.favorites.includes(track.id);
    const queued = state.queue.includes(track.id);
    return `<div class="watch-title-row"><div><h1>${escape(track.title)}</h1><button class="text-link watch-teacher" data-action="teacher" data-id="${track.teacherId}">${escape(track.teacher)}</button></div><div class="watch-track-actions"><button class="icon-button" data-action="favorite" data-id="${track.id}" aria-label="${label(favorite ? "track.favorite.remove" : "track.favorite.add")}" title="${label(favorite ? "track.favorite.remove" : "track.favorite.add")}" aria-pressed="${favorite}">${icon("heart")}</button><button class="secondary-button" data-action="enqueue" data-id="${track.id}" ${queued ? "disabled" : ""}>${icon("queue")}<span>${escape(copy(queued ? "added" : "add"))}</span></button></div></div><p class="watch-sample-note">${escape(copy("sample"))}</p><button class="text-link watch-collection" data-action="collection" data-id="${track.collectionId}">${label("nav.collections")} ${icon("chevron")}</button>`;
  }
  function queue() {
    return `<div class="watch-queue-heading"><h2>${label("queue.title")} <small>${number(state.queue.length)}</small></h2>${state.queue.length ? `<button class="text-link" data-action="clear-queue">${label("queue.clear")}</button>` : ""}</div>${
      state.queue.length
        ? `<p class="watch-queue-hint">${escape(copy("queueHint"))}</p><ol class="watch-queue-list">${state.queue
            .map((id, index) => {
              const track = trackById(id);
              return `<li><button class="watch-queue-play" data-action="queue-play" data-id="${id}" aria-label="${escape(t("track.play", { title: track.title }))}"><span class="watch-queue-index">${number(index + 1)}</span><span><strong>${escape(track.title)}</strong><small>${escape(track.teacher)} · ${track.format}</small></span></button><button class="icon-button" data-action="remove-queue" data-id="${id}" aria-label="${escape(t("queue.remove", { title: track.title }))}">${icon("close")}</button></li>`;
            })
            .join("")}</ol>`
        : `<div class="watch-queue-empty"><strong>${escape(copy("emptyTitle"))}</strong><p>${escape(copy("emptyDetail"))}</p><button class="secondary-button" data-action="explore">${escape(copy("browse"))}</button></div>`
    }`;
  }
  function message() {
    return state.playerPreview === "error"
      ? `<div class="watch-message-content" role="alert"><strong>${escape(mediaError || copy("error"))}</strong><button class="secondary-button" data-action="retry-player">${label("player.retry")}</button></div>`
      : state.playerPreview === "loading"
        ? `<div class="watch-message-content" role="status"><strong>${escape(copy("loading"))}</strong><button class="secondary-button" data-action="retry-player">${escape(copy("finish"))}</button></div>`
        : "";
  }
  function backDestination() {
    const previous = state.back.at(-1)?.route ?? "explore";
    const route = previous.replace("-detail", "s");
    return ["home", "explore", "teachers", "collections", "library", "settings"].includes(route)
      ? t(`nav.${route}`)
      : t("nav.explore");
  }
  function page(track, tools) {
    const destination = backDestination();
    return `<div class="watch-topbar"><button class="watch-back" data-action="back" title="${escape(copy("continue"))}">${icon("collapse")}<span>${escape(copy("back", { route: destination }))}</span></button>${tools || `<button class="secondary-button watch-stop" data-action="stop-video">${icon("stop")}<span>${escape(copy("stop"))}</span></button>`}</div><div class="watch-layout"><section class="watch-main" aria-label="${escape(copy("watch"))}"><div id="watch-screen" class="watch-screen"><div class="watch-picture" data-watch-media></div><div id="watch-message" class="watch-message">${message()}</div><div id="watch-controls" class="watch-controls">${controls()}</div></div><div id="watch-details" class="watch-details">${details(track)}</div></section><aside id="watch-upnext" class="watch-upnext" aria-label="${label("queue.label")}">${queue()}</aside></div>`;
  }
  function refresh() {
    if (state.route !== "watch" || !currentVideo()) return;
    const root = document.querySelector("#view");
    const token = focusToken(root);
    const backButton = document.querySelector(".watch-back");
    backButton.title = copy("continue");
    backButton.querySelector("span").textContent = copy("back", { route: backDestination() });
    document.querySelector(".watch-stop span").textContent = copy("stop");
    document.querySelector(".watch-main").setAttribute("aria-label", copy("watch"));
    document.querySelector("#watch-upnext").setAttribute("aria-label", t("queue.label"));
    const undo = document.querySelector("#undo");
    if (undo && root.contains(undo)) document.body.append(undo);
    document.querySelector("#watch-controls").innerHTML = controls();
    document.querySelector("#watch-message").innerHTML = message();
    document.querySelector("#watch-message").hidden = state.playerPreview === "ready";
    document.querySelector("#watch-details").innerHTML = details(trackById(state.current));
    document.querySelector("#watch-upnext").innerHTML = queue();
    if (undo && !undo.hidden && !document.querySelector("#queue-dialog").open)
      document.querySelector("#watch-upnext").append(undo);
    restoreFocus(root, token);
    onProgress();
  }
  function attachWatch(track) {
    const host = document.querySelector("[data-watch-media]");
    if (media.parentElement !== host) host.append(media);
    prepare(track);
    refresh();
  }
  function dockActions() {
    return `<button class="icon-button" data-action="toggle-play" aria-label="${label(state.playing ? "video.pause" : "video.play")}" aria-pressed="${state.playing}" aria-keyshortcuts="Space">${icon(state.playing ? "pause" : "play")}</button><button class="secondary-button" data-action="open-watch">${escape(copy("return"))}</button><button class="icon-button" data-action="stop-video" aria-label="${escape(copy("stop"))}" title="${escape(copy("stop"))}">${icon("stop")}</button>`;
  }
  function dock(track) {
    return `<button class="video-dock-preview" data-action="open-watch" data-slot="preview" aria-label="${escape(copy("return"))}"><span data-dock-media></span></button><div class="player-track video-dock-track"><button class="video-dock-title" data-action="open-watch" data-slot="title">${escape(track.title)}</button><span>${escape(track.teacher)}</span><small data-dock-time>${formatTime(state.position)} / ${formatTime(durationSeconds())} · ${escape(copy("sample"))}</small></div><div class="video-dock-actions">${dockActions()}</div>`;
  }
  function refreshDock() {
    const player = document.querySelector("#player");
    const token = focusToken(player);
    player.querySelector(".video-dock-actions").innerHTML = dockActions();
    restoreFocus(player, token);
  }
  function attachDock(track) {
    const host = document.querySelector("[data-dock-media]");
    if (media.parentElement !== host) host.append(media);
    prepare(track);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector("#watch-screen").requestFullscreen();
    } catch {
      notice("Fullscreen is unavailable in this browser.");
    }
  }
  function stop() {
    generation += 1;
    pause();
    park();
    media.removeAttribute("src");
    delete media.dataset.sourceTrack;
    media.load();
  }
  media.addEventListener("loadedmetadata", () => {
    if (currentVideo()) {
      seek(state.position);
      onProgress();
    }
  });
  media.addEventListener("timeupdate", () => {
    if (!currentVideo()) return;
    state.position = media.currentTime;
    state.resume[state.current] = state.position;
    persist();
    onProgress();
  });
  for (const event of ["play", "pause"])
    media.addEventListener(event, () => {
      if (!currentVideo() || media.readyState < 1) return;
      state.playing = !media.paused && state.playerPreview === "ready";
      onPlaybackChange();
    });
  media.addEventListener("ended", () => {
    if (currentVideo()) {
      state.playing = false;
      onEnded();
    }
  });
  media.addEventListener("error", () => {
    if (!currentVideo() || !media.dataset.sourceTrack) return;
    state.playing = false;
    state.playerPreview = "error";
    mediaError = copy("error");
    onPlaybackChange();
  });
  media.addEventListener("click", () => {
    if (state.route === "watch") dependencies.onToggle();
  });
  document.addEventListener("fullscreenchange", refresh);
  return {
    copy,
    page,
    refresh,
    attachWatch,
    dock,
    attachDock,
    refreshDock,
    park,
    prepare,
    play,
    pause,
    seek,
    retry,
    setRate,
    setVolume,
    toggleMuted,
    fullscreen,
    stop
  };
};
