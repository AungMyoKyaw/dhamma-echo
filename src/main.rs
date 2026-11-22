#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod assets;
mod downloads;
mod i18n;
mod input;
mod library;
mod normalize;
mod platform;
mod playback;
mod state;
mod views;

use std::{
    borrow::Cow,
    collections::{HashMap, HashSet},
    path::PathBuf,
    time::{Duration, Instant},
};

use assets::NativeAssets;
use downloads::{DownloadJobState, DownloadManager, remove_download_file};
use gpui::{
    App, Application, Bounds, Context, Entity, FocusHandle, Focusable, KeyBinding, Menu, MenuItem,
    MouseButton, Rgba, ScrollHandle, SharedString, TitlebarOptions, Window, WindowAppearance,
    WindowBounds, WindowOptions, actions, div, point, prelude::*, px, rgb, size,
};
use i18n::{AppRouteKind, Locale, t};
use input::TextInput;
use library::{
    AudioSearchRequest, Category, Collection, CollectionDetail, CollectionSearchRequest, Library,
    Summary, Talk, Teacher, TeacherDetail,
};
use normalize::normalize_whitespace;
use playback::{Playback, PlaybackEvent};
use state::{
    HistoryEntry, MigrationSources, SettingsState, ThemePreference, UiState, UserStateStore,
    now_millis,
};
use views::{focus_main_if_needed, wheel_scroll_step};

actions!(
    dhamma_echo,
    [
        Quit,
        NextTalk,
        PreviousTalk,
        PlaySelected,
        TogglePlayback,
        SeekBack15,
        SeekBack60,
        SeekForward15,
        SeekForward60,
        PlayNextInQueue,
        ToggleHelp,
        ToggleSidebar,
        OpenSettings,
        FocusSearch,
        HandleEscape,
        FocusNext,
        FocusPrev,
    ]
);

pub const WHEEL_LINE_MULTIPLIER: f32 = 3.0;
const INITIAL_PROGRESSIVE_LIMIT: i64 = 100;
const MAX_PROGRESSIVE_LIMIT: i64 = 400;

#[derive(Clone, Copy)]
pub struct Palette {
    pub substrate: Rgba,
    pub page: Rgba,
    pub panel: Rgba,
    pub ink: Rgba,
    pub quiet: Rgba,
    pub rule: Rgba,
    pub primary: Rgba,
    pub primary_strong: Rgba,
    pub on_primary: Rgba,
    pub marker: Rgba,
    pub error: Rgba,
    pub hover: Rgba,
}

impl Palette {
    fn light() -> Self {
        Self {
            substrate: rgb(0xece6d4),
            page: rgb(0xf4efde),
            panel: rgb(0xe3dcc4),
            ink: rgb(0x1f2024),
            quiet: rgb(0x5a5b55),
            rule: rgb(0xcbc5b0),
            primary: rgb(0x3f6b3a),
            primary_strong: rgb(0x2c4d28),
            on_primary: rgb(0xf4efde),
            marker: rgb(0x7a5a1e),
            error: rgb(0x8d3a2c),
            hover: rgb(0xdedfca),
        }
    }

    fn dark() -> Self {
        Self {
            substrate: rgb(0x16180f),
            page: rgb(0x1d1f15),
            panel: rgb(0x252820),
            ink: rgb(0xe6e3d3),
            quiet: rgb(0x9e9d8a),
            rule: rgb(0x3a3b32),
            primary: rgb(0x7fa572),
            primary_strong: rgb(0xa4c69b),
            on_primary: rgb(0x16180f),
            marker: rgb(0x9c7d4d),
            error: rgb(0xd68b7a),
            hover: rgb(0x303528),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Route {
    Home,
    Explore,
    Collections,
    CollectionDetail,
    Teachers,
    TeacherDetail,
    Library,
    Settings,
}

impl Route {
    pub const NAVIGATION: [Route; 6] = [
        Route::Home,
        Route::Explore,
        Route::Collections,
        Route::Teachers,
        Route::Library,
        Route::Settings,
    ];

    pub fn id_slug(self) -> &'static str {
        match self {
            Route::Home => "home",
            Route::Explore => "explore",
            Route::Collections => "collections",
            Route::CollectionDetail => "collection-detail",
            Route::Teachers => "teachers",
            Route::TeacherDetail => "teacher-detail",
            Route::Library => "library",
            Route::Settings => "settings",
        }
    }

    pub fn kind(self) -> AppRouteKind {
        match self {
            Route::Home => AppRouteKind::Home,
            Route::Explore => AppRouteKind::Explore,
            Route::Collections => AppRouteKind::Collections,
            Route::CollectionDetail => AppRouteKind::CollectionDetail,
            Route::Teachers => AppRouteKind::Teachers,
            Route::TeacherDetail => AppRouteKind::TeacherDetail,
            Route::Library => AppRouteKind::Library,
            Route::Settings => AppRouteKind::Settings,
        }
    }

    pub fn nav_key(self) -> &'static str {
        match self {
            Route::Home => "nav.home",
            Route::Explore => "nav.explore",
            Route::Collections | Route::CollectionDetail => "nav.collections",
            Route::Teachers | Route::TeacherDetail => "nav.teachers",
            Route::Library => "nav.library",
            Route::Settings => "nav.settings",
        }
    }

    pub fn icon(self) -> &'static str {
        match self {
            Route::Home => "home",
            Route::Explore => "explore",
            Route::Collections | Route::CollectionDetail => "library",
            Route::Teachers | Route::TeacherDetail => "teachers",
            Route::Library => "bookmark",
            Route::Settings => "settings",
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum LanguageFilter {
    All,
    Myanmar,
    English,
}

impl LanguageFilter {
    pub fn label_key(self) -> &'static str {
        match self {
            Self::All => "search.language.all",
            Self::Myanmar => "search.language.myanmar",
            Self::English => "search.language.english",
        }
    }

    pub fn value(self) -> Option<&'static str> {
        match self {
            Self::All => None,
            Self::Myanmar => Some("myanmar"),
            Self::English => Some("english"),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum FormatFilter {
    All,
    Mp3,
    Wma,
    Mp4,
    Wmv,
}

impl FormatFilter {
    pub fn label_key(self) -> &'static str {
        match self {
            Self::All => "search.format.all",
            Self::Mp3 => "MP3",
            Self::Wma => "WMA",
            Self::Mp4 => "search.format.mp4",
            Self::Wmv => "WMV",
        }
    }

    pub fn value(self) -> Option<&'static str> {
        match self {
            Self::All => None,
            Self::Mp3 => Some("mp3"),
            Self::Wma => Some("wma"),
            Self::Mp4 => Some("mp4"),
            Self::Wmv => Some("wmv"),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum LibraryTab {
    Downloads,
    Favorites,
    History,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum AppDropdown {
    ExploreLanguage,
    ExploreFormat,
    CollectionTeacher,
    SettingsSpeed,
    SettingsLimit,
    PlayerSpeed,
}

pub struct Echo {
    library: Library,
    store: UserStateStore,
    downloads_dir: PathBuf,
    allowed_download_dirs: Vec<PathBuf>,
    download_manager: DownloadManager,
    download_jobs: HashMap<i64, DownloadJobState>,
    input: Entity<TextInput>,
    syncing_input: bool,
    main_focus: FocusHandle,
    route: Route,
    return_route: Option<Route>,
    system_dark: bool,
    settings: SettingsState,
    ui: UiState,
    summary: Summary,
    all_teachers: Vec<Teacher>,
    teacher_results: Vec<Teacher>,
    categories: Vec<Category>,
    explore_query: String,
    teacher_query: String,
    collection_query: String,
    language: LanguageFilter,
    format: FormatFilter,
    category: i64,
    explore_teacher_id: Option<i64>,
    explore_collection_id: Option<i64>,
    results: Vec<Talk>,
    results_total: i64,
    results_next_limit: i64,
    selection: usize,
    collections: Vec<Collection>,
    collections_total: i64,
    collections_next_limit: i64,
    collection_teacher_id: Option<i64>,
    collection_detail: Option<CollectionDetail>,
    teacher_detail: Option<TeacherDetail>,
    teacher_talks: Vec<Talk>,
    teacher_talks_total: i64,
    teacher_talks_next_limit: i64,
    favorite_ids: Vec<i64>,
    favorite_tracks: Vec<Talk>,
    history_entries: Vec<HistoryEntry>,
    history_tracks: Vec<Talk>,
    recent_tracks: Vec<Talk>,
    downloads_map: HashMap<i64, PathBuf>,
    downloaded_tracks: Vec<Talk>,
    resume_map: HashMap<i64, (f64, f64)>,
    queue_tracks: Vec<Talk>,
    queue_open: bool,
    queue_undo: Option<(Vec<Talk>, Instant)>,
    library_tab: LibraryTab,
    open_dropdown: Option<AppDropdown>,
    open_track_menu: Option<(&'static str, i64)>,
    content_scroll: ScrollHandle,
    talk: Option<Talk>,
    audio: Option<Playback>,
    status: SharedString,
    error: Option<String>,
    position: f64,
    duration: f64,
    last_saved: f64,
    scrubbing: bool,
    help_open: bool,
    about_expanded: bool,
}

impl Echo {
    pub(crate) fn is_dark(&self) -> bool {
        match self.settings.theme {
            ThemePreference::Light => false,
            ThemePreference::Dark => true,
            ThemePreference::System => self.system_dark,
        }
    }

    pub(crate) fn palette(&self) -> Palette {
        if self.is_dark() {
            Palette::dark()
        } else {
            Palette::light()
        }
    }

    fn sync_input_theme(&self, cx: &mut Context<Self>) {
        let dark = self.is_dark();
        self.input.update(cx, |input, _| input.set_dark(dark));
    }

    fn sync_input_for_route(&mut self, route: Route, cx: &mut Context<Self>) {
        let locale = self.settings.locale;
        let (query, placeholder) = match route {
            Route::Teachers => (
                self.teacher_query.clone(),
                t(locale, "search.teachers.placeholder"),
            ),
            Route::Collections => (
                self.collection_query.clone(),
                t(locale, "search.collections.placeholder"),
            ),
            _ => (
                self.explore_query.clone(),
                t(locale, "search.talks.placeholder"),
            ),
        };
        self.syncing_input = true;
        self.input.update(cx, |input, _| {
            input.set_placeholder(placeholder);
            input.set_query(&query);
        });
        self.syncing_input = false;
    }

    fn search_changed(&mut self, cx: &mut Context<Self>) {
        if self.syncing_input {
            return;
        }
        let raw = self.input.read(cx).query().to_owned();
        let query = normalize_whitespace(&raw);
        match self.route {
            Route::Teachers if query != self.teacher_query => {
                self.teacher_query = query;
                self.run_teachers_search(cx);
            }
            Route::Collections if query != self.collection_query => {
                self.collection_query = query;
                self.run_collections_search(cx);
            }
            Route::Explore if query != self.explore_query => {
                self.explore_query = query;
                self.run_explore_search(cx);
            }
            _ => {}
        }
    }

    pub(crate) fn clear_active_search_query(&mut self, cx: &mut Context<Self>) {
        self.syncing_input = true;
        self.input.update(cx, |input, _| input.set_query(""));
        self.syncing_input = false;
        match self.route {
            Route::Teachers => {
                self.teacher_query.clear();
                self.run_teachers_search(cx);
            }
            Route::Collections => {
                self.collection_query.clear();
                self.run_collections_search(cx);
            }
            _ => {
                self.explore_query.clear();
                self.run_explore_search(cx);
            }
        }
    }

    pub(crate) fn run_explore_search(&mut self, cx: &mut Context<Self>) {
        self.selection = 0;
        self.results_next_limit = INITIAL_PROGRESSIVE_LIMIT;
        match self.library.search_audio(&AudioSearchRequest {
            query: self.explore_query.clone(),
            language: self.language.value().map(str::to_string),
            format: self.format.value().map(str::to_string),
            teacher_id: self.explore_teacher_id,
            category_id: (self.category > 0).then_some(self.category),
            collection_id: self.explore_collection_id,
            limit: self.settings.browse_limit,
            offset: 0,
        }) {
            Ok(page) => {
                self.results = page.items;
                self.results_total = page.total;
            }
            Err(error) => {
                self.error = Some(error.to_string());
                self.results.clear();
                self.results_total = 0;
            }
        }
        cx.notify();
    }

    pub(crate) fn load_more_explore(&mut self, cx: &mut Context<Self>) {
        let offset = self.results.len() as i64;
        if offset >= self.results_total {
            return;
        }
        let limit = self.results_next_limit.min(self.results_total - offset);
        if let Ok(page) = self.library.search_audio(&AudioSearchRequest {
            query: self.explore_query.clone(),
            language: self.language.value().map(str::to_string),
            format: self.format.value().map(str::to_string),
            teacher_id: self.explore_teacher_id,
            category_id: (self.category > 0).then_some(self.category),
            collection_id: self.explore_collection_id,
            limit,
            offset,
        }) {
            let existing: HashSet<i64> = self.results.iter().map(|t| t.id).collect();
            self.results
                .extend(page.items.into_iter().filter(|t| !existing.contains(&t.id)));
            self.results_total = page.total;
            self.results_next_limit = (self.results_next_limit * 2).min(MAX_PROGRESSIVE_LIMIT);
        }
        cx.notify();
    }

    pub(crate) fn clear_explore_filters(&mut self, cx: &mut Context<Self>) {
        self.explore_query.clear();
        self.language = LanguageFilter::All;
        self.format = FormatFilter::All;
        self.category = 0;
        self.explore_teacher_id = None;
        self.explore_collection_id = None;
        self.sync_input_for_route(Route::Explore, cx);
        self.run_explore_search(cx);
    }

    pub(crate) fn run_teachers_search(&mut self, cx: &mut Context<Self>) {
        self.teacher_results = self
            .library
            .teachers(&self.teacher_query, 500)
            .unwrap_or_default();
        cx.notify();
    }

    pub(crate) fn run_collections_search(&mut self, cx: &mut Context<Self>) {
        self.collections_next_limit = INITIAL_PROGRESSIVE_LIMIT;
        match self.library.search_collections(&CollectionSearchRequest {
            query: self.collection_query.clone(),
            teacher_id: self.collection_teacher_id,
            limit: self.settings.browse_limit.max(24),
            offset: 0,
        }) {
            Ok(page) => {
                self.collections = page.items;
                self.collections_total = page.total;
            }
            Err(error) => {
                self.error = Some(error.to_string());
                self.collections.clear();
                self.collections_total = 0;
            }
        }
        cx.notify();
    }

    pub(crate) fn load_more_collections(&mut self, cx: &mut Context<Self>) {
        let offset = self.collections.len() as i64;
        if offset >= self.collections_total {
            return;
        }
        let limit = self
            .collections_next_limit
            .min(self.collections_total - offset);
        if let Ok(page) = self.library.search_collections(&CollectionSearchRequest {
            query: self.collection_query.clone(),
            teacher_id: self.collection_teacher_id,
            limit,
            offset,
        }) {
            let existing: HashSet<i64> = self.collections.iter().map(|c| c.id).collect();
            self.collections
                .extend(page.items.into_iter().filter(|c| !existing.contains(&c.id)));
            self.collections_total = page.total;
            self.collections_next_limit =
                (self.collections_next_limit * 2).min(MAX_PROGRESSIVE_LIMIT);
        }
        cx.notify();
    }

    pub(crate) fn clear_collection_filters(&mut self, cx: &mut Context<Self>) {
        self.collection_query.clear();
        self.collection_teacher_id = None;
        self.sync_input_for_route(Route::Collections, cx);
        self.run_collections_search(cx);
    }

    pub(crate) fn navigate(&mut self, route: Route, window: &mut Window, cx: &mut Context<Self>) {
        self.route = route;
        self.open_dropdown = None;
        self.open_track_menu = None;
        self.content_scroll.set_offset(point(px(0.), px(0.)));
        self.sync_input_for_route(route, cx);
        focus_main_if_needed(&self.main_focus, window);
        cx.notify();
    }

    pub(crate) fn open_teacher_by_id(
        &mut self,
        teacher_id: i64,
        return_route: Route,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.return_route = Some(return_route);
        self.teacher_detail = self.library.get_teacher(teacher_id).ok().flatten();
        self.teacher_talks_next_limit = INITIAL_PROGRESSIVE_LIMIT;
        match self.library.search_audio(&AudioSearchRequest {
            teacher_id: Some(teacher_id),
            limit: self.settings.browse_limit,
            offset: 0,
            ..Default::default()
        }) {
            Ok(page) => {
                self.teacher_talks = page.items;
                self.teacher_talks_total = page.total;
            }
            Err(_) => {
                self.teacher_talks.clear();
                self.teacher_talks_total = 0;
            }
        }
        self.route = Route::TeacherDetail;
        self.open_dropdown = None;
        self.open_track_menu = None;
        self.content_scroll.set_offset(point(px(0.), px(0.)));
        focus_main_if_needed(&self.main_focus, window);
        cx.notify();
    }

    pub(crate) fn load_more_teacher_talks(&mut self, cx: &mut Context<Self>) {
        let Some(detail) = &self.teacher_detail else {
            return;
        };
        let offset = self.teacher_talks.len() as i64;
        if offset >= self.teacher_talks_total {
            return;
        }
        let limit = self
            .teacher_talks_next_limit
            .min(self.teacher_talks_total - offset);
        if let Ok(page) = self.library.search_audio(&AudioSearchRequest {
            teacher_id: Some(detail.id),
            limit,
            offset,
            ..Default::default()
        }) {
            let existing: HashSet<i64> = self.teacher_talks.iter().map(|t| t.id).collect();
            self.teacher_talks
                .extend(page.items.into_iter().filter(|t| !existing.contains(&t.id)));
            self.teacher_talks_total = page.total;
            self.teacher_talks_next_limit =
                (self.teacher_talks_next_limit * 2).min(MAX_PROGRESSIVE_LIMIT);
        }
        cx.notify();
    }

    pub(crate) fn explore_teacher(
        &mut self,
        teacher_id: i64,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.explore_query.clear();
        self.language = LanguageFilter::All;
        self.format = FormatFilter::All;
        self.category = 0;
        self.explore_collection_id = None;
        self.explore_teacher_id = Some(teacher_id);
        self.navigate(Route::Explore, window, cx);
        self.run_explore_search(cx);
    }

    pub(crate) fn open_collection(
        &mut self,
        collection_id: i64,
        return_route: Route,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.return_route = Some(return_route);
        self.collection_detail = self.library.get_collection(collection_id).ok().flatten();
        self.route = Route::CollectionDetail;
        self.open_dropdown = None;
        self.open_track_menu = None;
        self.content_scroll.set_offset(point(px(0.), px(0.)));
        focus_main_if_needed(&self.main_focus, window);
        cx.notify();
    }

    pub(crate) fn go_back(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let target = self.return_route.take().unwrap_or(Route::Home);
        self.navigate(target, window, cx);
    }

    pub(crate) fn play_talk_resumed(&mut self, talk: Talk, cx: &mut Context<Self>) {
        let resume_pos = self.resume_map.get(&talk.id).map(|r| r.0).unwrap_or(0.0);
        self.open_talk(talk, resume_pos, true, cx);
    }

    fn open_talk(&mut self, talk: Talk, position: f64, play: bool, cx: &mut Context<Self>) {
        if !talk.playable {
            self.error = Some("This media format is not supported by the macOS player.".into());
            cx.notify();
            return;
        }
        let local_path = self.downloads_map.get(&talk.id).filter(|p| p.is_file());
        let rate = self.settings.playback_rate;
        let playback = if let Some(path) = local_path {
            Playback::open_local(path, position, rate, talk.is_video())
        } else {
            let candidates = talk.media_url_candidates();
            if candidates.is_empty() {
                None
            } else {
                Playback::open_remote(candidates, position, rate, talk.is_video())
            }
        };

        if let Some(mut audio) = playback {
            if let Some(previous) = self.audio.as_mut() {
                previous.pause();
            }
            if play {
                audio.play();
                let now = now_millis();
                let _ = self.store.record_history(talk.id, now);
                self.refresh_history_cache();
            }
            self.position = position;
            self.duration = self.resume_map.get(&talk.id).map(|r| r.1).unwrap_or(0.0);
            self.ui.current_talk_id = Some(talk.id);
            let _ = self.store.save_ui(&self.ui);
            self.talk = Some(talk);
            self.audio = Some(audio);
            self.status = if play { "Buffering…" } else { "Paused" }.into();
            self.error = None;
            if play {
                self.save_current_resume();
            }
        } else {
            self.error = Some("This media source is not trusted.".into());
        }
        cx.notify();
    }

    pub(crate) fn retry_playback(&mut self, cx: &mut Context<Self>) {
        let Some(talk) = self.talk.clone() else {
            return;
        };
        let resume = self
            .position
            .max(self.resume_map.get(&talk.id).map(|r| r.0).unwrap_or(0.0));
        self.open_talk(talk, resume, true, cx);
    }

    pub(crate) fn close_video_player(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if window.is_fullscreen() {
            window.toggle_fullscreen();
        }
        self.save_current_resume();
        if let Some(audio) = self.audio.as_mut() {
            audio.pause();
        }
        self.audio = None;
        self.talk = None;
        self.queue_open = false;
        self.error = None;
        self.ui.current_talk_id = None;
        let _ = self.store.save_ui(&self.ui);
        cx.notify();
    }

    fn save_current_resume(&mut self) {
        let Some(talk) = &self.talk else {
            return;
        };
        if self
            .store
            .save_resume(talk.id, self.position, self.duration)
            .is_ok()
        {
            self.last_saved = self.position;
            self.resume_map
                .insert(talk.id, (self.position, self.duration));
        }
    }

    pub(crate) fn toggle(&mut self, cx: &mut Context<Self>) {
        if let Some(audio) = &mut self.audio {
            if audio.wants_playback() {
                audio.pause();
                self.position = audio.position();
                self.save_current_resume();
            } else if let Some(talk) = self
                .talk
                .clone()
                .filter(|_| self.status.as_ref() == "Playback failed")
            {
                self.open_talk(talk, self.position, true, cx);
                return;
            } else {
                audio.play();
            }
            cx.notify();
        }
    }

    pub(crate) fn seek(&mut self, offset: f64, cx: &mut Context<Self>) {
        self.seek_to(self.position + offset, cx);
    }

    pub(crate) fn seek_to(&mut self, target: f64, cx: &mut Context<Self>) {
        if let Some(audio) = &mut self.audio {
            let max_pos = if self.duration > 0.0 {
                self.duration
            } else {
                f64::INFINITY
            };
            let clamped = target.clamp(0.0, max_pos);
            audio.seek(clamped);
            self.position = audio.position();
            self.save_current_resume();
            cx.notify();
        }
    }

    pub(crate) fn play_next(&mut self, cx: &mut Context<Self>) {
        if self.queue_tracks.is_empty() {
            if let Some(audio) = self.audio.as_mut() {
                audio.pause();
            }
            self.status = "Paused".into();
            cx.notify();
            return;
        }
        let next = self.queue_tracks.remove(0);
        self.persist_queue();
        self.play_talk_resumed(next, cx);
    }

    pub(crate) fn enqueue_talk(&mut self, talk: Talk, cx: &mut Context<Self>) {
        if !self.queue_tracks.iter().any(|t| t.id == talk.id) {
            self.queue_tracks.push(talk);
            self.persist_queue();
            cx.notify();
        }
    }

    pub(crate) fn remove_from_queue(&mut self, talk_id: i64, cx: &mut Context<Self>) {
        self.queue_tracks.retain(|t| t.id != talk_id);
        self.persist_queue();
        cx.notify();
    }

    pub(crate) fn clear_queue_with_undo(&mut self, cx: &mut Context<Self>) {
        if self.queue_tracks.is_empty() {
            return;
        }
        let snapshot = std::mem::take(&mut self.queue_tracks);
        self.queue_undo = Some((snapshot, Instant::now()));
        self.persist_queue();
        cx.notify();
    }

    pub(crate) fn restore_queue_undo(&mut self, cx: &mut Context<Self>) {
        if let Some((tracks, _)) = self.queue_undo.take() {
            for track in tracks {
                if !self.queue_tracks.iter().any(|t| t.id == track.id) {
                    self.queue_tracks.push(track);
                }
            }
            self.persist_queue();
            cx.notify();
        }
    }

    fn persist_queue(&mut self) {
        let ids: Vec<i64> = self.queue_tracks.iter().map(|t| t.id).collect();
        let _ = self.store.save_queue_ids(&ids);
    }

    pub(crate) fn toggle_favorite(&mut self, talk_id: i64, cx: &mut Context<Self>) {
        if self.store.toggle_favorite(talk_id).is_ok() {
            self.favorite_ids = self.store.load_favorites().unwrap_or_default();
            self.favorite_tracks = self
                .library
                .get_tracks_by_ids(&self.favorite_ids)
                .unwrap_or_default();
            cx.notify();
        }
    }

    pub(crate) fn start_download(&mut self, talk: &Talk, cx: &mut Context<Self>) {
        if self.downloads_map.contains_key(&talk.id) {
            return;
        }
        let candidates = talk.download_candidates();
        if let Err(err) =
            self.download_manager
                .start_download(talk.id, candidates, self.downloads_dir.clone())
        {
            self.error = Some(err);
        }
        self.download_jobs = self.download_manager.snapshot();
        cx.notify();
    }

    pub(crate) fn remove_download(&mut self, talk_id: i64, cx: &mut Context<Self>) {
        let Some(path) = self.downloads_map.remove(&talk_id) else {
            return;
        };
        if let Err(err) = remove_download_file(talk_id, &path, &self.allowed_download_dirs) {
            self.downloads_map.insert(talk_id, path);
            self.error = Some(err);
            cx.notify();
            return;
        }
        let _ = self.store.remove_download(talk_id);
        self.refresh_downloads_cache();
        cx.notify();
    }

    fn refresh_history_cache(&mut self) {
        self.history_entries = self.store.load_history().unwrap_or_default();
        let ids: Vec<i64> = self.history_entries.iter().map(|h| h.talk_id).collect();
        self.history_tracks = self.library.get_tracks_by_ids(&ids).unwrap_or_default();
        self.recent_tracks = self.history_tracks.iter().take(5).cloned().collect();
    }

    fn refresh_downloads_cache(&mut self) {
        self.downloads_map = self.store.load_downloads().unwrap_or_default();
        let mut ids: Vec<i64> = self.downloads_map.keys().copied().collect();
        ids.sort_unstable_by(|a, b| b.cmp(a));
        self.downloaded_tracks = self.library.get_tracks_by_ids(&ids).unwrap_or_default();
    }

    pub(crate) fn set_theme(&mut self, theme: ThemePreference, cx: &mut Context<Self>) {
        self.settings.theme = theme;
        let _ = self.store.save_settings(&self.settings);
        self.sync_input_theme(cx);
        cx.notify();
    }

    pub(crate) fn set_locale(&mut self, locale: Locale, cx: &mut Context<Self>) {
        self.settings.locale = locale;
        let _ = self.store.save_settings(&self.settings);
        self.sync_input_for_route(self.route, cx);
        cx.notify();
    }

    pub(crate) fn set_rate(&mut self, rate: f32, cx: &mut Context<Self>) {
        self.settings.playback_rate = rate.clamp(0.75, 2.0);
        self.settings.sanitize();
        let _ = self.store.save_settings(&self.settings);
        if let Some(audio) = self.audio.as_mut() {
            audio.set_rate(self.settings.playback_rate);
        }
        cx.notify();
    }

    pub(crate) fn set_browse_limit(&mut self, limit: i64, cx: &mut Context<Self>) {
        self.settings.browse_limit = limit;
        self.settings.sanitize();
        let _ = self.store.save_settings(&self.settings);
        self.run_explore_search(cx);
        self.run_collections_search(cx);
        if let Some(detail) = &self.teacher_detail {
            let tid = detail.id;
            if let Ok(page) = self.library.search_audio(&AudioSearchRequest {
                teacher_id: Some(tid),
                limit: self.settings.browse_limit,
                offset: 0,
                ..Default::default()
            }) {
                self.teacher_talks = page.items;
                self.teacher_talks_total = page.total;
            }
        }
        cx.notify();
    }

    pub(crate) fn toggle_sidebar(&mut self, cx: &mut Context<Self>) {
        self.ui.sidebar_collapsed = !self.ui.sidebar_collapsed;
        let _ = self.store.save_ui(&self.ui);
        cx.notify();
    }

    pub(crate) fn toggle_dropdown(&mut self, kind: AppDropdown, cx: &mut Context<Self>) {
        self.open_track_menu = None;
        self.open_dropdown = if self.open_dropdown == Some(kind) {
            None
        } else {
            Some(kind)
        };
        cx.notify();
    }

    pub(crate) fn toggle_track_menu(
        &mut self,
        prefix: &'static str,
        talk_id: i64,
        cx: &mut Context<Self>,
    ) {
        self.open_dropdown = None;
        let target = (prefix, talk_id);
        self.open_track_menu = if self.open_track_menu == Some(target) {
            None
        } else {
            Some(target)
        };
        cx.notify();
    }

    fn poll_downloads(&mut self) -> bool {
        let snap = self.download_manager.snapshot();
        if snap.is_empty() && self.download_jobs.is_empty() {
            return false;
        }
        let mut completed = Vec::new();
        let mut failed = Vec::new();
        for (&id, state) in &snap {
            match state {
                DownloadJobState::Completed { path } => completed.push((id, path.clone())),
                DownloadJobState::Failed { message } => failed.push((id, message.clone())),
                DownloadJobState::InProgress { .. } => {}
            }
        }
        for (id, path) in completed {
            let _ = self.store.record_download(id, &path);
            self.download_manager.clear_terminal(id);
            self.refresh_downloads_cache();
        }
        for (id, message) in failed {
            self.download_manager.clear_terminal(id);
            self.error = Some(message);
        }
        self.download_jobs = self.download_manager.snapshot();
        true
    }

    fn tick(&mut self, cx: &mut Context<Self>) {
        let mut dirty = false;

        if let Some((_, created_at)) = &self.queue_undo
            && created_at.elapsed() >= Duration::from_secs(6)
        {
            self.queue_undo = None;
            dirty = true;
        }

        if self.poll_downloads() {
            dirty = true;
        }

        if let Some(audio) = &mut self.audio {
            let prev_frame = audio.current_frame().is_some();
            let event = audio.update();
            let position = audio.position();
            let duration = audio.duration();
            if duration > 0.0 {
                self.duration = duration;
            }
            match event {
                PlaybackEvent::Playing => {
                    if self.status.as_ref() != "Playing" {
                        self.status = "Playing".into();
                        dirty = true;
                    }
                    if audio.is_video() {
                        dirty = true;
                    }
                }
                PlaybackEvent::Buffering => {
                    if self.status.as_ref() != "Buffering…" {
                        self.status = "Buffering…".into();
                        dirty = true;
                    }
                }
                PlaybackEvent::Paused => {
                    if self.status.as_ref() != "Paused" {
                        self.status = "Paused".into();
                        dirty = true;
                    }
                }
                PlaybackEvent::Ended => {
                    if let Some(talk) = &self.talk {
                        let _ = self.store.save_resume(talk.id, 0.0, self.duration);
                        self.resume_map.insert(talk.id, (0.0, self.duration));
                    }
                    self.position = 0.0;
                    self.play_next(cx);
                    return;
                }
                PlaybackEvent::Failed(err) => {
                    self.error = Some(err);
                    self.status = "Playback failed".into();
                    dirty = true;
                }
            }
            if !prev_frame && audio.current_frame().is_some() {
                dirty = true;
            }
            if position.floor() != self.position.floor() {
                dirty = true;
            }
            self.position = position;
            if (position - self.last_saved).abs() >= 5.0 {
                self.save_current_resume();
            }
        }

        if dirty {
            cx.notify();
        }
    }

    fn is_video_active(&self) -> bool {
        self.talk.as_ref().is_some_and(Talk::is_video)
            && self.audio.as_ref().is_some_and(Playback::wants_playback)
    }

    fn active_list_len(&self) -> usize {
        match self.route {
            Route::Explore => self.results.len(),
            Route::TeacherDetail => self.teacher_talks.len(),
            Route::CollectionDetail => self
                .collection_detail
                .as_ref()
                .map_or(0, |d| d.tracks.len()),
            _ => 0,
        }
    }

    fn selected_talk_in_active_list(&self) -> Option<Talk> {
        match self.route {
            Route::Explore => self.results.get(self.selection).cloned(),
            Route::TeacherDetail => self.teacher_talks.get(self.selection).cloned(),
            Route::CollectionDetail => self
                .collection_detail
                .as_ref()
                .and_then(|d| d.tracks.get(self.selection))
                .cloned(),
            _ => None,
        }
    }
}

impl Render for Echo {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let p = self.palette();
        let viewport = window.viewport_size();
        let compact = viewport.width <= px(1040.);
        let sidebar_width = if self.ui.sidebar_collapsed {
            72.0
        } else if compact {
            224.0
        } else {
            256.0
        };
        let horizontal_padding = if compact { 48.0 } else { 80.0 };
        let inner_width = (viewport.width - px(sidebar_width + horizontal_padding)).max(px(280.));
        let inner_width = inner_width.min(px(1440.));
        let columns = ((inner_width + px(16.)) / px(296.)).floor().max(1.0) as usize;
        let card_width =
            (inner_width - px(16.0 * columns.saturating_sub(1) as f32)) * (1.0 / columns as f32);

        let route_view = match self.route {
            Route::Home => self.render_home(card_width, cx).into_any_element(),
            Route::Explore => self.render_explore(cx).into_any_element(),
            Route::Collections => self.render_collections(card_width, cx).into_any_element(),
            Route::CollectionDetail => self.render_collection_detail(cx).into_any_element(),
            Route::Teachers => self.render_teachers(card_width, cx).into_any_element(),
            Route::TeacherDetail => self
                .render_teacher_detail(card_width, cx)
                .into_any_element(),
            Route::Library => self.render_library(cx).into_any_element(),
            Route::Settings => self.render_settings(cx).into_any_element(),
        };

        let bottom_spacer = if self.talk.as_ref().is_some_and(Talk::is_video) {
            px(380.)
        } else {
            px(32.)
        };
        let content_scroll = self.content_scroll.clone();
        let content = div()
            .id("content")
            .flex()
            .flex_col()
            .flex_1()
            .min_h_0()
            .overflow_y_scroll()
            .track_scroll(&self.content_scroll)
            .on_scroll_wheel(move |event, window, _cx| {
                if let Some(extra) = wheel_scroll_step(event.delta, window) {
                    content_scroll.set_offset(content_scroll.offset() + extra);
                }
            })
            .child(self.render_header(compact))
            .child(
                div()
                    .w_full()
                    .max_w(px(1520.))
                    .mx_auto()
                    .px(if compact { px(24.) } else { px(40.) })
                    .pt_4()
                    .pb(bottom_spacer)
                    .child(route_view),
            );

        let right = div()
            .flex()
            .flex_col()
            .flex_1()
            .min_w_0()
            .h_full()
            .child(content)
            .children(self.render_player(compact, viewport.width - px(sidebar_width), cx));
        let body = div()
            .flex()
            .flex_1()
            .min_h_0()
            .w_full()
            .child(
                div()
                    .flex_none()
                    .w(px(sidebar_width))
                    .h_full()
                    .child(self.render_sidebar(px(sidebar_width), compact, cx)),
            )
            .child(right);
        let titlebar = platform::uses_overlay_titlebar().then(|| {
            div()
                .id("titlebar")
                .flex()
                .flex_none()
                .h(px(36.))
                .w_full()
                .border_b_1()
                .border_color(p.rule)
                .bg(p.substrate)
                .on_mouse_down(MouseButton::Left, |_, window, _| window.start_window_move())
        });

        let search_focused = self.input.read(cx).focus_handle(cx).is_focused(window);
        let root = div()
            .id("dhamma-echo-root")
            .size_full()
            .flex()
            .flex_col()
            .relative()
            .bg(p.substrate)
            .text_color(p.ink)
            .track_focus(&self.main_focus)
            .key_context(if search_focused {
                "DhammaEcho"
            } else {
                "DhammaEchoBrowse"
            });

        root.on_mouse_down(
            MouseButton::Left,
            cx.listener(|view, _, window, cx| {
                if view.open_dropdown.is_some() || view.open_track_menu.is_some() {
                    view.open_dropdown = None;
                    view.open_track_menu = None;
                    cx.notify();
                }
                if !view.input.read(cx).focus_handle(cx).is_focused(window) {
                    focus_main_if_needed(&view.main_focus, window);
                }
            }),
        )
        .on_action(cx.listener(|view, _: &TogglePlayback, _, cx| {
            view.toggle(cx);
        }))
        .on_action(cx.listener(|view, _: &SeekBack15, _, cx| {
            view.seek(-15.0, cx);
        }))
        .on_action(cx.listener(|view, _: &SeekBack60, _, cx| {
            view.seek(-60.0, cx);
        }))
        .on_action(cx.listener(|view, _: &SeekForward15, _, cx| {
            view.seek(15.0, cx);
        }))
        .on_action(cx.listener(|view, _: &SeekForward60, _, cx| {
            view.seek(60.0, cx);
        }))
        .on_action(cx.listener(|view, _: &PlayNextInQueue, _, cx| {
            view.play_next(cx);
        }))
        .on_action(cx.listener(|view, _: &ToggleHelp, _, cx| {
            view.help_open = !view.help_open;
            cx.notify();
        }))
        .on_action(cx.listener(|view, _: &NextTalk, _, cx| {
            let max = view.active_list_len().saturating_sub(1);
            view.selection = (view.selection + 1).min(max);
            cx.notify();
        }))
        .on_action(cx.listener(|view, _: &PreviousTalk, _, cx| {
            view.selection = view.selection.saturating_sub(1);
            cx.notify();
        }))
        .on_action(cx.listener(|view, _: &PlaySelected, _, cx| {
            if let Some(talk) = view.selected_talk_in_active_list() {
                view.play_talk_resumed(talk, cx);
            }
        }))
        .on_action(cx.listener(|view, _: &ToggleSidebar, _, cx| {
            view.toggle_sidebar(cx);
        }))
        .on_action(cx.listener(|view, _: &OpenSettings, window, cx| {
            view.navigate(Route::Settings, window, cx);
        }))
        .on_action(cx.listener(|view, _: &FocusSearch, window, cx| {
            if !matches!(
                view.route,
                Route::Explore | Route::Collections | Route::Teachers
            ) {
                view.navigate(Route::Explore, window, cx);
            }
            let handle = view.input.read(cx).focus_handle(cx);
            window.focus(&handle);
        }))
        .on_action(cx.listener(|_, _: &FocusNext, window, _| {
            window.focus_next();
        }))
        .on_action(cx.listener(|_, _: &FocusPrev, window, _| {
            window.focus_prev();
        }))
        .on_action(cx.listener(|view, _: &HandleEscape, window, cx| {
            if view.input.read(cx).focus_handle(cx).is_focused(window) {
                if !view.input.read(cx).query().is_empty() {
                    view.clear_active_search_query(cx);
                } else {
                    focus_main_if_needed(&view.main_focus, window);
                    cx.notify();
                }
                return;
            }
            if window.is_fullscreen() {
                window.toggle_fullscreen();
            } else if view.help_open {
                view.help_open = false;
            } else if view.open_dropdown.is_some() || view.open_track_menu.is_some() {
                view.open_dropdown = None;
                view.open_track_menu = None;
            } else if view.queue_open {
                view.queue_open = false;
            } else if view.talk.as_ref().is_some_and(Talk::is_video) {
                view.close_video_player(window, cx);
                return;
            }
            cx.notify();
        }))
        .children(titlebar)
        .child(body)
        .children(self.render_video_overlay(window, sidebar_width, cx))
        .children(self.render_queue_panel(cx))
        .children(self.render_shortcuts_modal(cx))
        .when_some(self.error.clone(), |root, error| {
            if self.talk.is_some() {
                root
            } else {
                root.child(
                    div()
                        .absolute()
                        .bottom_4()
                        .right_6()
                        .rounded(px(8.))
                        .border_1()
                        .border_color(p.error)
                        .bg(p.page)
                        .p_3()
                        .text_sm()
                        .text_color(p.error)
                        .child(error),
                )
            }
        })
    }
}

fn resolve_catalogue_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut skip_next = false;
    for arg in &args {
        if skip_next {
            skip_next = false;
            continue;
        }
        if arg == "--route" {
            skip_next = true;
            continue;
        }
        if arg.starts_with("--") {
            continue;
        }
        let p = PathBuf::from(arg);
        if p.is_file() {
            return Ok(p);
        }
    }
    if let Ok(exe) = std::env::current_exe()
        && let Some(exe_dir) = exe.parent()
    {
        for candidate in platform::bundled_catalogue_candidates(exe_dir) {
            if candidate.is_file() {
                return Ok(candidate);
            }
        }
    }
    Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/dhamma.db"))
}

fn initial_route_from_args() -> Route {
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        if arg == "--route"
            && let Some(slug) = args.next()
        {
            return match slug.as_str() {
                "explore" => Route::Explore,
                "collections" => Route::Collections,
                "teachers" => Route::Teachers,
                "library" => Route::Library,
                "settings" => Route::Settings,
                _ => Route::Home,
            };
        }
    }
    Route::Home
}

fn appearance_is_dark(appearance: WindowAppearance) -> bool {
    matches!(
        appearance,
        WindowAppearance::Dark | WindowAppearance::VibrantDark
    )
}

#[cfg(target_os = "macos")]
fn run_self_test() -> Result<(), Box<dyn std::error::Error>> {
    use core_video::pixel_buffer::kCVPixelFormatType_420YpCbCr8BiPlanarFullRange;
    use objc2_foundation::{NSDate, NSRunLoop};
    use playback::VideoFrame;

    let catalogue = resolve_catalogue_path()?;
    let library = Library::open_read_only(&catalogue)?;
    let summary = library.summary()?;
    println!(
        "self-test: catalogue ok ({} audio, {} teachers)",
        summary.total_audio, summary.total_teachers
    );

    if let Some(tauri_dir) = platform::tauri_app_data_dir() {
        let tauri_mp3 = tauri_dir.join("favorite-15951.mp3");
        if tauri_mp3.is_file() {
            let mut pb = Playback::open_local(&tauri_mp3, 12.0, 1.5, false)
                .ok_or("open local mp3 failed")?;
            pb.play();
            let start = Instant::now();
            let mut ready_dur = 0.0;
            while start.elapsed() < Duration::from_secs(6) {
                let _ = pb.update();
                let d = pb.duration();
                if d > 0.0 {
                    ready_dur = d;
                    break;
                }
                let run_loop = NSRunLoop::mainRunLoop();
                let until = NSDate::dateWithTimeIntervalSinceNow(0.05);
                run_loop.runUntilDate(&until);
            }
            pb.set_rate(1.25);
            pb.seek(25.0);
            pb.pause();
            if ready_dur <= 0.0 {
                return Err("local MP3 did not report positive duration".into());
            }
            println!(
                "self-test: local MP3 ok (duration={ready_dur:.1}s, pos={:.1}s)",
                pb.position()
            );
        }
    }

    let videos = library.search_audio(&AudioSearchRequest {
        format: Some("mp4".into()),
        limit: 3,
        offset: 0,
        ..Default::default()
    })?;
    let video = videos
        .items
        .into_iter()
        .find(|t| t.playable && t.is_video())
        .ok_or("no playable mp4 in catalogue")?;
    let mut vpb = Playback::open_remote(video.media_url_candidates(), 2.0, 1.0, true)
        .ok_or("open remote mp4 failed")?;
    vpb.play();
    let start = Instant::now();
    let mut got_frame = false;
    while start.elapsed() < Duration::from_secs(15) {
        let ev = vpb.update();
        if let PlaybackEvent::Failed(err) = ev {
            return Err(format!("remote MP4 playback failed: {err}").into());
        }
        if let Some(VideoFrame::Surface(frame)) = vpb.current_frame() {
            assert_eq!(
                frame.get_pixel_format(),
                kCVPixelFormatType_420YpCbCr8BiPlanarFullRange
            );
            println!(
                "self-test: remote MP4 ok (id={}, {}x{}, format=420f, duration={:.1}s)",
                video.id,
                frame.get_width(),
                frame.get_height(),
                vpb.duration()
            );
            got_frame = true;
            break;
        }
        let run_loop = NSRunLoop::mainRunLoop();
        let until = NSDate::dateWithTimeIntervalSinceNow(0.05);
        run_loop.runUntilDate(&until);
    }
    vpb.pause();
    if !got_frame {
        return Err("remote MP4 did not yield a 420f CVPixelBuffer frame within 15s".into());
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn run_self_test() -> Result<(), Box<dyn std::error::Error>> {
    let catalogue = resolve_catalogue_path()?;
    let library = Library::open_read_only(&catalogue)?;
    let summary = library.summary()?;
    println!(
        "self-test: catalogue ok ({} audio, {} teachers)",
        summary.total_audio, summary.total_teachers
    );
    let data_dir = platform::native_data_dir()?;
    println!("self-test: data_dir={}", data_dir.display());
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    if std::env::args().any(|arg| arg == "--self-test") {
        return run_self_test();
    }
    let catalogue = resolve_catalogue_path()?;
    let native_dir = platform::native_data_dir()?;
    std::fs::create_dir_all(&native_dir)?;
    let downloads_dir = native_dir.join("downloads");
    std::fs::create_dir_all(&downloads_dir)?;
    let mut allowed_download_dirs = vec![downloads_dir.clone()];
    if let Some(tauri_dir) = platform::tauri_app_data_dir() {
        allowed_download_dirs.push(tauri_dir);
    }

    let library = Library::open_read_only(&catalogue)?;
    let sources = MigrationSources::platform_defaults(&native_dir);
    let store = UserStateStore::open(&native_dir.join("state.sqlite"), &sources)?;

    let settings = store.load_settings()?;
    let ui = store.load_ui()?;
    let favorite_ids = store.load_favorites()?;
    let favorite_tracks = library.get_tracks_by_ids(&favorite_ids)?;
    let history_entries = store.load_history()?;
    let history_ids: Vec<i64> = history_entries.iter().map(|h| h.talk_id).collect();
    let history_tracks = library.get_tracks_by_ids(&history_ids)?;
    let recent_tracks = history_tracks.iter().take(5).cloned().collect();
    let downloads_map = store.load_downloads()?;
    let mut dl_ids: Vec<i64> = downloads_map.keys().copied().collect();
    dl_ids.sort_unstable_by(|a, b| b.cmp(a));
    let downloaded_tracks = library.get_tracks_by_ids(&dl_ids)?;
    let resume_map = store.load_resume_map()?;
    let queue_ids = store.load_queue_ids()?;
    let queue_tracks = library.get_tracks_by_ids(&queue_ids)?;

    let summary = library.summary()?;
    let all_teachers = library.teachers("", 500)?;
    let categories = library.categories()?;
    let initial_audio = library.search_audio(&AudioSearchRequest {
        limit: settings.browse_limit,
        offset: 0,
        ..Default::default()
    })?;
    let initial_collections = library.search_collections(&CollectionSearchRequest {
        limit: settings.browse_limit.max(24),
        offset: 0,
        ..Default::default()
    })?;

    let initial_route = initial_route_from_args();
    let saved_current = ui
        .current_talk_id
        .and_then(|id| library.get_track(id).ok().flatten())
        .or_else(|| history_tracks.first().cloned());

    Application::new()
        .with_assets(NativeAssets)
        .run(move |cx: &mut App| {
            cx.text_system()
                .add_fonts(vec![Cow::Borrowed(include_bytes!(
                    "../assets/fonts/source-serif-4-latin.ttf"
                ) as &'static [u8])])
                .expect("load embedded Source Serif 4 font");
            TextInput::bind_keys(cx);
            cx.bind_keys([
                KeyBinding::new("secondary-q", Quit, None),
                KeyBinding::new("secondary-enter", TogglePlayback, None),
                KeyBinding::new("secondary-,", OpenSettings, None),
                KeyBinding::new("secondary-f", FocusSearch, None),
                KeyBinding::new("escape", HandleEscape, None),
                KeyBinding::new("tab", FocusNext, None),
                KeyBinding::new("shift-tab", FocusPrev, None),
                KeyBinding::new("space", TogglePlayback, Some("DhammaEchoBrowse")),
                KeyBinding::new("left", SeekBack15, Some("DhammaEchoBrowse")),
                KeyBinding::new("shift-left", SeekBack60, Some("DhammaEchoBrowse")),
                KeyBinding::new("right", SeekForward15, Some("DhammaEchoBrowse")),
                KeyBinding::new("shift-right", SeekForward60, Some("DhammaEchoBrowse")),
                KeyBinding::new("n", PlayNextInQueue, Some("DhammaEchoBrowse")),
                KeyBinding::new("?", ToggleHelp, Some("DhammaEchoBrowse")),
                KeyBinding::new("shift-/", ToggleHelp, Some("DhammaEchoBrowse")),
                KeyBinding::new("[", ToggleSidebar, Some("DhammaEchoBrowse")),
                KeyBinding::new("down", NextTalk, Some("DhammaEchoBrowse")),
                KeyBinding::new("up", PreviousTalk, Some("DhammaEchoBrowse")),
                KeyBinding::new("enter", PlaySelected, Some("DhammaEchoBrowse")),
            ]);
            cx.on_action(|_: &Quit, cx| cx.quit());
            cx.set_menus(vec![Menu {
                name: "Dhamma Echo".into(),
                items: vec![MenuItem::action("Quit Dhamma Echo", Quit)],
            }]);
            let bounds = Bounds::centered(None, size(px(1280.), px(820.)), cx);
            cx.open_window(
                WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(bounds)),
                    window_min_size: Some(size(px(860.), px(620.))),
                    titlebar: platform::uses_overlay_titlebar().then(|| TitlebarOptions {
                        title: None,
                        appears_transparent: true,
                        traffic_light_position: Some(point(px(12.), px(12.))),
                    }),
                    ..Default::default()
                },
                move |window, cx| {
                    window.set_window_title("Dhamma Echo");
                    window.on_window_should_close(cx, |_, cx| {
                        if platform::hides_on_window_close() {
                            cx.hide();
                            false
                        } else {
                            cx.quit();
                            true
                        }
                    });
                    let initial_system_dark = appearance_is_dark(window.appearance());
                    let input = cx.new(TextInput::new);
                    let main_focus = cx.focus_handle();
                    window.focus(&main_focus);

                    cx.new(|cx: &mut Context<Echo>| {
                        cx.observe(&input, |view, _, cx| view.search_changed(cx))
                            .detach();
                        cx.observe_window_appearance(window, |view, window, cx| {
                            view.system_dark = appearance_is_dark(window.appearance());
                            view.sync_input_theme(cx);
                            cx.notify();
                        })
                        .detach();

                        let executor = cx.background_executor().clone();
                        cx.spawn(async move |this, cx| {
                            loop {
                                let video_active = this
                                    .update(cx, |view, _| view.is_video_active())
                                    .unwrap_or(false);
                                let step = if video_active {
                                    Duration::from_millis(16)
                                } else {
                                    Duration::from_millis(250)
                                };
                                executor.timer(step).await;
                                if this.update(cx, |view, cx| view.tick(cx)).is_err() {
                                    break;
                                }
                            }
                        })
                        .detach();

                        cx.on_app_quit(|view, _| {
                            if let Some(audio) = &view.audio {
                                view.position = audio.position();
                                view.save_current_resume();
                            }
                            std::future::ready(())
                        })
                        .detach();

                        let mut view = Echo {
                            library,
                            store,
                            downloads_dir,
                            allowed_download_dirs,
                            download_manager: DownloadManager::new(),
                            download_jobs: HashMap::new(),
                            input,
                            syncing_input: false,
                            main_focus,
                            route: initial_route,
                            return_route: None,
                            system_dark: initial_system_dark,
                            settings,
                            ui,
                            summary,
                            teacher_results: all_teachers.clone(),
                            all_teachers,
                            categories,
                            explore_query: String::new(),
                            teacher_query: String::new(),
                            collection_query: String::new(),
                            language: LanguageFilter::All,
                            format: FormatFilter::All,
                            category: 0,
                            explore_teacher_id: None,
                            explore_collection_id: None,
                            results: initial_audio.items,
                            results_total: initial_audio.total,
                            results_next_limit: INITIAL_PROGRESSIVE_LIMIT,
                            selection: 0,
                            collections: initial_collections.items,
                            collections_total: initial_collections.total,
                            collections_next_limit: INITIAL_PROGRESSIVE_LIMIT,
                            collection_teacher_id: None,
                            collection_detail: None,
                            teacher_detail: None,
                            teacher_talks: Vec::new(),
                            teacher_talks_total: 0,
                            teacher_talks_next_limit: INITIAL_PROGRESSIVE_LIMIT,
                            favorite_ids,
                            favorite_tracks,
                            history_entries,
                            history_tracks,
                            recent_tracks,
                            downloads_map,
                            downloaded_tracks,
                            resume_map,
                            queue_tracks,
                            queue_open: false,
                            queue_undo: None,
                            library_tab: LibraryTab::Downloads,
                            open_dropdown: None,
                            open_track_menu: None,
                            content_scroll: ScrollHandle::new(),
                            talk: None,
                            audio: None,
                            status: "".into(),
                            error: None,
                            position: 0.0,
                            duration: 0.0,
                            last_saved: 0.0,
                            scrubbing: false,
                            help_open: false,
                            about_expanded: false,
                        };
                        view.sync_input_theme(cx);
                        view.sync_input_for_route(initial_route, cx);
                        if let Some(talk) = saved_current.filter(|t| t.playable && !t.is_video()) {
                            let (pos, dur) =
                                view.resume_map.get(&talk.id).copied().unwrap_or((0.0, 0.0));
                            view.last_saved = pos;
                            view.open_talk(talk, pos, false, cx);
                            if dur > 0.0 {
                                view.duration = dur;
                            }
                        }
                        view
                    })
                },
            )
            .expect("open Dhamma Echo window");
            cx.activate(true);
        });
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use i18n::format_locale_duration;

    #[test]
    fn route_labels_match_the_tauri_shell() {
        assert_eq!(Route::NAVIGATION.len(), 6);
        assert_eq!(
            i18n::route_heading(Locale::EnUs, Route::Home.kind()).1,
            "Discover the Dhamma"
        );
        assert_eq!(t(Locale::EnUs, Route::Library.nav_key()), "My library");
        assert_eq!(Route::TeacherDetail.icon(), "teachers");
        assert_eq!(Route::CollectionDetail.icon(), "library");
        assert_eq!(format_locale_duration(124.9, Locale::EnUs), "2:04");
    }
}
