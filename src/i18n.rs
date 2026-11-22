use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum Locale {
    #[default]
    #[serde(rename = "en-US")]
    EnUs,
    #[serde(rename = "my-MM")]
    MyMm,
}

impl Locale {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::EnUs => "en-US",
            Self::MyMm => "my-MM",
        }
    }

    pub fn from_code(value: &str) -> Self {
        if value.to_ascii_lowercase().starts_with("my") {
            Self::MyMm
        } else {
            Self::EnUs
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CountKind {
    Talk,
    DownloadedTalk,
    SavedTalk,
    SavedTalkAre,
    Teacher,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppRouteKind {
    Home,
    Explore,
    Collections,
    CollectionDetail,
    Teachers,
    TeacherDetail,
    Library,
    Settings,
}

pub fn to_burmese_digits(input: &str) -> String {
    const DIGITS: [char; 10] = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    input
        .chars()
        .map(|ch| {
            if let Some(d) = ch.to_digit(10) {
                DIGITS[d as usize]
            } else {
                ch
            }
        })
        .collect()
}

pub fn format_locale_number(number: i64, locale: Locale) -> String {
    let safe = number.max(0);
    let digits = safe.to_string();
    let mut grouped = String::with_capacity(digits.len() + digits.len() / 3);
    for (index, ch) in digits.chars().enumerate() {
        if index > 0 && (digits.len() - index).is_multiple_of(3) {
            grouped.push(',');
        }
        grouped.push(ch);
    }
    match locale {
        Locale::EnUs => grouped,
        Locale::MyMm => to_burmese_digits(&grouped),
    }
}

pub fn format_locale_duration(seconds: f64, locale: Locale) -> String {
    let total = if seconds.is_finite() && seconds > 0.0 {
        seconds.floor() as u64
    } else {
        0
    };
    let hours = total / 3600;
    let minutes = (total % 3600) / 60;
    let secs = total % 60;
    let raw = if hours > 0 {
        format!("{hours}:{minutes:02}:{secs:02}")
    } else {
        format!("{minutes}:{secs:02}")
    };
    match locale {
        Locale::EnUs => raw,
        Locale::MyMm => to_burmese_digits(&raw),
    }
}

pub fn count_label(locale: Locale, kind: CountKind, count: i64) -> String {
    let safe = count.max(0);
    let formatted = format_locale_number(safe, locale);
    let template = match (locale, kind, safe == 1) {
        (Locale::EnUs, CountKind::Talk, true) => "{count} talk",
        (Locale::EnUs, CountKind::Talk, false) => "{count} talks",
        (Locale::MyMm, CountKind::Talk, _) => "တရားတော် {count} ခု",
        (Locale::EnUs, CountKind::DownloadedTalk, true) => "{count} downloaded talk",
        (Locale::EnUs, CountKind::DownloadedTalk, false) => "{count} downloaded talks",
        (Locale::MyMm, CountKind::DownloadedTalk, _) => "ဒေါင်းလုပ် ဆွဲထားသော တရားတော် {count} ခု",
        (Locale::EnUs, CountKind::SavedTalk, true) => "{count} saved talk",
        (Locale::EnUs, CountKind::SavedTalk, false) => "{count} saved talks",
        (Locale::MyMm, CountKind::SavedTalk, _) => "သိမ်းထားသော တရားတော် {count} ခု",
        (Locale::EnUs, CountKind::SavedTalkAre, true) => "{count} saved talk is",
        (Locale::EnUs, CountKind::SavedTalkAre, false) => "{count} saved talks are",
        (Locale::MyMm, CountKind::SavedTalkAre, _) => "သိမ်းထားသော တရားတော် {count} ခုသည်",
        (Locale::EnUs, CountKind::Teacher, true) => "{count} teacher",
        (Locale::EnUs, CountKind::Teacher, false) => "{count} teachers",
        (Locale::MyMm, CountKind::Teacher, _) => "ဆရာတော် {count} ပါး",
    };
    template.replace("{count}", &formatted)
}

pub fn route_heading(
    locale: Locale,
    route: AppRouteKind,
) -> (&'static str, &'static str, &'static str) {
    match (locale, route) {
        (Locale::EnUs, AppRouteKind::Home) => (
            "HOME",
            "Discover the Dhamma",
            "Return to recent talks and trusted teachers.",
        ),
        (Locale::MyMm, AppRouteKind::Home) => (
            "ပင်မ",
            "ဓမ္မကို ရှာဖွေတွေ့ရှိပါ",
            "မကြာသေးမီက တရားတော်များနှင့် ယုံကြည်ရသော ဆရာတော်များထံ ပြန်သွားပါ။",
        ),
        (Locale::EnUs, AppRouteKind::Explore) => (
            "EXPLORE",
            "Explore the Dhamma library",
            "Search talks by teacher, language, format, or collection.",
        ),
        (Locale::MyMm, AppRouteKind::Explore) => (
            "ရှာဖွေခြင်း",
            "ဓမ္မစာကြည့်တိုက်ကို ရှာဖွေပါ",
            "ဆရာတော်၊ ဘာသာစကား၊ ဖော်မက်၊ စုစည်းမှုအလိုက် တရားတော်များ ရှာဖွေပါ။",
        ),
        (Locale::EnUs, AppRouteKind::Collections) => (
            "COLLECTIONS",
            "Browse listening collections",
            "Move through related talks without losing your place.",
        ),
        (Locale::MyMm, AppRouteKind::Collections) => (
            "စုစည်းမှုများ",
            "နားထောင်ရန် စုစည်းမှုများ",
            "နေရာမပျက်စေဘဲ ဆက်စပ်တရားတော်များကို အစဉ်လိုက် နားထောင်ပါ။",
        ),
        (Locale::EnUs, AppRouteKind::CollectionDetail) => (
            "COLLECTION",
            "Collection details",
            "Listen through this collection at your own pace.",
        ),
        (Locale::MyMm, AppRouteKind::CollectionDetail) => {
            ("စုစည်းမှု", "စုစည်းမှု အသေးစိတ်", "ဤစုစည်းမှုကို ကိုယ်ပိုင်အရှိန်ဖြင့် နားထောင်ပါ။")
        }
        (Locale::EnUs, AppRouteKind::Teachers) => (
            "TEACHERS",
            "Learn from trusted voices",
            "Browse teachers and continue into their available talks.",
        ),
        (Locale::MyMm, AppRouteKind::Teachers) => (
            "ဆရာတော်များ",
            "ယုံကြည်ရသော ဆရာတော်များထံမှ သင်ယူပါ",
            "ဆရာတော်များကို ကြည့်ရှု၍ ၎င်းတို့၏ တရားတော်များသို့ ဆက်သွားပါ။",
        ),
        (Locale::EnUs, AppRouteKind::TeacherDetail) => (
            "TEACHER",
            "Teacher details",
            "Explore talks and collections from this teacher.",
        ),
        (Locale::MyMm, AppRouteKind::TeacherDetail) => (
            "ဆရာတော်",
            "ဆရာတော် အသေးစိတ်",
            "ဤဆရာတော်၏ တရားတော်များနှင့် စုစည်းမှုများကို ကြည့်ရှုပါ။",
        ),
        (Locale::EnUs, AppRouteKind::Library) => (
            "YOUR SPACE",
            "Your library",
            "Downloads, favorites, and recently played talks.",
        ),
        (Locale::MyMm, AppRouteKind::Library) => (
            "သင်၏နေရာ",
            "သင်၏ စာကြည့်တိုက်",
            "ဒေါင်းလုပ်များ၊ အနှစ်သက်ဆုံးများနှင့် မကြာသေးမီက နားထောင်ခဲ့သော တရားတော်များ။",
        ),
        (Locale::EnUs, AppRouteKind::Settings) => (
            "PREFERENCES",
            "Make listening yours",
            "Adjust appearance and playback defaults for this device.",
        ),
        (Locale::MyMm, AppRouteKind::Settings) => (
            "ဦးစားပေးချက်များ",
            "နားထောင်ပုံကို ကိုယ်စဉ်းလှော်ပါ",
            "ဤစက်အတွက် အသွင်အပြင်နှင့် ပြန်ဖွင့်ခြင်း မူလတန်ဖိုးများကို ညှိပါ။",
        ),
    }
}

pub fn back_label(locale: Locale, return_route: Option<AppRouteKind>) -> String {
    match return_route {
        None | Some(AppRouteKind::CollectionDetail | AppRouteKind::TeacherDetail) => {
            t(locale, "back.generic").to_string()
        }
        Some(route) => {
            let destination = match (locale, route) {
                (Locale::EnUs, AppRouteKind::Home) => "Home",
                (Locale::EnUs, AppRouteKind::Explore) => "Explore",
                (Locale::EnUs, AppRouteKind::Collections) => "Collections",
                (Locale::EnUs, AppRouteKind::Teachers) => "Teachers",
                (Locale::EnUs, AppRouteKind::Library) => "Library",
                (Locale::EnUs, AppRouteKind::Settings) => "Settings",
                _ => route_heading(locale, route).0,
            };
            t(locale, "back.to").replace("{destination}", destination)
        }
    }
}

pub fn t(locale: Locale, key: &'static str) -> &'static str {
    let translated = match locale {
        Locale::EnUs => lookup_en(key),
        Locale::MyMm => lookup_my(key).or_else(|| lookup_en(key)),
    };
    translated.unwrap_or(key)
}

pub fn tf(locale: Locale, key: &'static str, vars: &[(&str, String)]) -> String {
    let mut out = t(locale, key).to_string();
    for (name, value) in vars {
        let placeholder = format!("{{{name}}}");
        out = out.replace(&placeholder, value);
    }
    out
}

pub fn t_error(locale: Locale, message: &str) -> String {
    let key = match message {
        "This media source is not trusted." => Some("error.media.untrusted"),
        "This media format is not supported by the macOS player." => {
            Some("error.media.unsupported")
        }
        "The video could not start." => Some("error.video.start"),
        "The audio stream could not start." => Some("error.audio.start"),
        "The video is unavailable from Dhamma Download." => Some("error.video.unavailable"),
        "The audio stream is unavailable from Dhamma Download." => Some("error.audio.unavailable"),
        "The catalogue is unavailable." => Some("error.catalogue.unavailable"),
        "Unable to load the Dhamma catalogue." => Some("error.catalogue.load"),
        _ => None,
    };
    key.map(|k| t(locale, k).to_string())
        .unwrap_or_else(|| message.to_string())
}

fn lookup_en(key: &str) -> Option<&'static str> {
    Some(match key {
        "app.name" => "Dhamma Echo",
        "app.tagline" => "Listen with intention",
        "nav.home" => "Home",
        "nav.explore" => "Explore",
        "nav.collections" => "Collections",
        "nav.teachers" => "Teachers",
        "nav.library" => "My library",
        "nav.settings" => "Settings",
        "nav.collapse" => "Collapse",
        "privacy.title" => "A quiet library",
        "privacy.body" => {
            "Your catalogue stays on this device. Audio streams only when you press play; downloads stay until you remove them."
        }
        "privacy.body.settings" => {
            "Favorites, history, playback position, and settings are stored locally on this device. The bundled catalogue is read-only. Audio is requested from dhammadownload.com only when you press play. Downloads stay on this device until you remove them."
        }
        "back.to" => "← Back to {destination}",
        "back.generic" => "← Back",
        "home.continue" => "Continue listening",
        "home.continue.detail" => "Pick up where you left off.",
        "home.recentlyPlayed" => "Recently played",
        "home.welcome.eyebrow" => "WELCOME TO DHAMMA ECHO",
        "home.welcome.title" => "Find something to listen to",
        "home.welcome.body" => {
            "Search by title, teacher, language, or format across {talks} and {teachers}."
        }
        "home.welcome.explore" => "Explore talks",
        "home.welcome.teachers" => "Browse teachers",
        "home.featured" => "Featured teachers",
        "home.featured.detail" => {
            "Curated teachers to start listening. Tap to explore their talks."
        }
        "home.featured.viewAll" => "View all",
        "home.featured.empty" => "Teacher highlights will appear here when the catalogue is ready.",
        "home.resumeAt" => "Resume at {time}",
        "home.unsupportedHint" => "This format isn't supported by the macOS player.",
        "search.talks.placeholder" => "Search title or teacher",
        "search.talks.clear" => "Clear talk search",
        "search.teachers.placeholder" => "Search teacher name",
        "search.teachers.clear" => "Clear teacher search",
        "search.collections.placeholder" => "Search collection name",
        "search.collections.clearSearch" => "Clear collection search",
        "search.collections.allTeachers" => "All teachers",
        "search.collections.clear" => "Clear filters",
        "search.language.all" => "All languages",
        "search.language.myanmar" => "Myanmar",
        "search.language.english" => "English",
        "search.format.all" => "All formats",
        "search.format.mp4" => "MP4 video",
        "search.category.all" => "All content",
        "search.filters.query" => "Search: \"{query}\"",
        "search.filters.teacher" => "Teacher: {name}",
        "search.filters.category" => "Category: {name}",
        "search.filters.collection" => "Collection filter",
        "search.filters.selectedTeacher" => "selected teacher",
        "search.filters.clearAll" => "Clear all filters",
        "explore.empty.title.query" => "No talks match “{query}”",
        "explore.empty.title.filters" => "No talks match these filters",
        "explore.empty.detail.filters" => {
            "Try clearing a filter, broadening the language, or removing the search terms."
        }
        "explore.empty.detail.catalogue" => {
            "The catalogue has no talks in this combination. Try resetting the filters."
        }
        "teachers.empty.title.query" => "No teachers match “{query}”",
        "teachers.empty.detail.query" => "Try a different spelling or a shorter name.",
        "teachers.empty.clear" => "Clear search",
        "teachers.empty.title" => "No teachers found",
        "teachers.empty.detail" => "The catalogue does not currently include teacher records.",
        "collections.empty.title.query" => "No collections match “{query}”",
        "collections.empty.title" => "No collections match",
        "collections.empty.detail" => "Try a shorter collection name or clear the teacher filter.",
        "collections.unknownTeacher" => "Unknown teacher",
        "teacherDetail.explore" => "Explore this teacher's talks",
        "teacherDetail.collections" => "Collections",
        "teacherDetail.talks" => "Talks",
        "teacherDetail.empty.title" => "No talks found",
        "teacherDetail.empty.detail" => "This teacher has no talks in the catalogue.",
        "collectionDetail.empty.title" => "No talks in this collection",
        "collectionDetail.empty.detail" => "This collection has no playable records to play.",
        "library.empty.title" => "Find a talk to start your library",
        "library.empty.detail" => {
            "Favorite a talk or download one while exploring to keep it close for another listening session."
        }
        "library.empty.action" => "Explore talks",
        "library.downloads" => "Downloads",
        "library.favorites" => "Favorites",
        "library.history" => "History",
        "library.downloads.hint" => {
            "Favorite talks while exploring to keep them close even without a download."
        }
        "library.downloads.empty.title" => "No downloads yet",
        "library.downloads.empty.detail" => {
            "Tap the download icon on a talk to keep it saved for offline listening."
        }
        "library.favorites.unresolved" => "{count} unavailable in the current catalogue.",
        "library.favorites.empty.title" => "No favorites yet",
        "library.favorites.empty.detail" => "Tap the heart icon on a talk to save it here.",
        "library.history.count" => "{count} played recently.",
        "library.history.empty.title" => "No plays yet",
        "library.history.empty.detail" => {
            "Talks you start will appear here so you can return to them."
        }
        "library.history.empty.action" => "Browse teachers",
        "settings.language" => "Language",
        "settings.language.detail" => {
            "Choose the language used for the interface, numbers, and durations."
        }
        "settings.appearance" => "Appearance",
        "settings.appearance.detail" => "Choose light, dark, or follow your operating system.",
        "settings.theme.light" => "Light",
        "settings.theme.dark" => "Dark",
        "settings.theme.system" => "System",
        "settings.playback" => "Playback",
        "settings.playback.detail" => {
            "Choose the default playback speed and how many talks appear on each catalogue page."
        }
        "settings.playback.speed" => "Default speed",
        "settings.playback.speed.reset" => "Reset",
        "settings.playback.limit" => "Browse limit",
        "settings.keyboard" => "Keyboard",
        "settings.keyboard.detail" => {
            "The app responds to a small set of keyboard shortcuts while listening."
        }
        "settings.keyboard.view" => "View shortcuts",
        "settings.privacy.title" => "Privacy",
        "settings.about" => "About Dhamma Echo",
        "settings.about.show" => "Show",
        "settings.about.hide" => "Hide",
        "settings.about.body1" => {
            "A quiet desktop library for Dhamma talks. PolyForm Noncommercial license. No accounts, no analytics, no telemetry."
        }
        "settings.about.body2" => {
            "The catalogue is bundled with the application and refreshed only when you update the app."
        }
        "player.unknownTeacher" => "Unknown teacher",
        "player.retry" => "Retry",
        "player.dismiss" => "Dismiss",
        "player.connecting" => "Connecting…",
        "player.hint" => "Space: play/pause · ←/→: seek · ?: help",
        "player.hint.compact" => "Press ?",
        "queue.title" => "Up next",
        "queue.clear" => "Clear",
        "queue.empty" => "Your queue is empty.",
        "queue.cleared" => "{count} cleared.",
        "queue.undo" => "Undo",
        "shortcuts.title" => "Keyboard shortcuts",
        "shortcuts.detail" => "Move through the library without leaving the keyboard.",
        "shortcuts.playPause" => "Play or pause the current talk",
        "shortcuts.back15" => "Jump back 15 seconds",
        "shortcuts.back60" => "Jump back 1 minute",
        "shortcuts.forward15" => "Jump forward 15 seconds",
        "shortcuts.forward60" => "Jump forward 1 minute",
        "shortcuts.next" => "Play the next talk in the queue",
        "shortcuts.toggleHelp" => "Show or hide this list",
        "shortcuts.toggleSidebar" => "Collapse or expand the sidebar",
        "shortcuts.escape" => "Close this dialog or the active overlay",
        "shortcuts.focusSearch" => "Focus the search field",
        "shortcuts.openSettings" => "Open Settings",
        "shortcuts.searchNote" => {
            "Search fields keep the keyboard for editing. Press Esc inside a search field to clear what you typed."
        }
        "track.enqueue" => "Queue",
        "track.favorite.add" => "Add to favorites",
        "track.favorite.remove" => "Remove from favorites",
        "track.download.add" => "Download for offline listening",
        "track.download.remove" => "Remove from downloads",
        "track.download.progress" => "Downloading",
        "track.download.offline" => "Saved offline",
        "track.badge.video" => "Video",
        "track.badge.wma" => "WMA unavailable",
        "track.badge.unavailable" => "Source unavailable",
        "progress.loadMore" => "Load {count} more",
        "progress.showing" => "Showing {shown} of {total} {noun}",
        "video.nowPlaying" => "Now playing · video",
        "video.close" => "Close",
        "video.preparing" => "Preparing the video",
        "video.preparing.detail" => "A moment of quiet before playback",
        "video.loading" => "Loading video…",
        "video.hint" => "Space to pause · ←/→ to seek",
        "video.fullscreen.exit.short" => "Exit",
        "video.fullscreen.enter.short" => "Fullscreen",
        "error.media.untrusted" => "This media source is not trusted.",
        "error.media.unsupported" => "This media format is not supported by the macOS player.",
        "error.video.start" => "The video could not start.",
        "error.audio.start" => "The audio stream could not start.",
        "error.video.unavailable" => "The video is unavailable from Dhamma Download.",
        "error.audio.unavailable" => "The audio stream is unavailable from Dhamma Download.",
        "error.catalogue.unavailable" => "The catalogue is unavailable.",
        "error.catalogue.load" => "Unable to load the Dhamma catalogue.",
        "noun.talks" => "talks",
        "noun.collections" => "collections",
        "noun.teachers" => "teachers",
        _ => return None,
    })
}

fn lookup_my(key: &str) -> Option<&'static str> {
    Some(match key {
        "app.name" => "Dhamma Echo",
        "app.tagline" => "ရည်ရွယ်ချက်ဖြင့် နားထောင်ပါ",
        "nav.home" => "ပင်မ",
        "nav.explore" => "ရှာဖွေခြင်း",
        "nav.collections" => "စုစည်းမှုများ",
        "nav.teachers" => "ဆရာတော်များ",
        "nav.library" => "ကိုယ်ပိုင်စာကြည့်တိုက်",
        "nav.settings" => "ဆက်တင်များ",
        "nav.collapse" => "ခေါက်မည်",
        "privacy.title" => "တိတ်ဆိတ်သော စာကြည့်တိုက်",
        "privacy.body" => {
            "စာရင်းဇယားသည် သင့်စက်ထဲတွင်သာ ရှိသည်။ ဖွင့်နှိပ်သည့်အချိန်မှသာ အသံကို ထုတ်လွှင့်၍ ဒေါင်းလုပ်များကိုလည်း သင်မဖျက်မချင်း စက်ထဲတွင်ပင် ကျန်ရှိနေမည်။"
        }
        "privacy.body.settings" => {
            "အနှစ်သက်ဆုံးများ၊ မှတ်တမ်း၊ ဖွင့်နေသောနေရာနှင့် ဆက်တင်များကို ဤစက်ထဲတွင်သာ သိမ်းသည်။ ပါရှိသော စာရင်းဇယားကို ဖတ်ရုံသာမျှ ဖြစ်သည်။ အသံကို dhammadownload.com မှ ဖွင့်နှိပ်သည့်အချိန်မှသာ တောင်းဆိုသည်။ ဒေါင်းလုပ်များကိုလည်း သင်မဖျက်မချင်း ဤစက်ထဲတွင်ပင် ရှိနေမည်။"
        }
        "back.to" => "← {destination} သို့ ပြန်သွားမည်",
        "back.generic" => "← နောက်သို့",
        "home.continue" => "ဆက်လက်နားထောင်မည်",
        "home.continue.detail" => "ကျန်ခဲ့သော နေရာမှ ဆက်နားထောင်ပါ။",
        "home.recentlyPlayed" => "မကြာသေးမီက ဖွင့်ခဲ့သည်များ",
        "home.welcome.eyebrow" => "Dhamma Echo မှ ကြိုဆိုပါသည်",
        "home.welcome.title" => "နားထောင်ရန် တစ်ခုခု ရှာပါ",
        "home.welcome.body" => {
            "{talks} နှင့် {teachers} ထဲကို ခေါင်းစဉ်၊ ဆရာတော်၊ ဘာသာစကား၊ ဖော်မက်အလိုက် ရှာဖွေပါ။"
        }
        "home.welcome.explore" => "တရားတော်များ ရှာဖွေမည်",
        "home.welcome.teachers" => "ဆရာတော်များကို ကြည့်မည်",
        "home.featured" => "အထူးတင်ဆက် ဆရာတော်များ",
        "home.featured.detail" => "နားထောင်စရန် ရွေးချယ်ထားသော ဆရာတော်များ။ တရားတော်များ ရှာဖွေရန် နှိပ်ပါ။",
        "home.featured.viewAll" => "အားလုံးကြည့်မည်",
        "home.featured.empty" => "စာရင်းဇယား အဆင်သင့်ဖြစ်သောအခါ ဆရာတော်များ၏ အထူးအပိုင်းကို ဤနေရာတွင် ပြမည်။",
        "home.resumeAt" => "{time} တွင် ပြန်စမည်",
        "home.unsupportedHint" => "ဤဖော်မက်ကို macOS player မှ ပံ့ပိုးမထားပါ။",
        "search.talks.placeholder" => "ခေါင်းစဉ် သို့မဟုတ် ဆရာတော် ရှာပါ",
        "search.talks.clear" => "တရားတော် ရှာဖွေမှုကို ဖျက်မည်",
        "search.teachers.placeholder" => "ဆရာတော် အမည် ရှာပါ",
        "search.teachers.clear" => "ဆရာတော် ရှာဖွေမှုကို ဖျက်မည်",
        "search.collections.placeholder" => "စုစည်းမှု အမည် ရှာပါ",
        "search.collections.clearSearch" => "စုစည်းမှု ရှာဖွေမှုကို ဖျက်မည်",
        "search.collections.allTeachers" => "ဆရာတော်အားလုံး",
        "search.collections.clear" => "စစ်ထုတ်မှုများ ဖျက်မည်",
        "search.language.all" => "ဘာသာစကားအားလုံး",
        "search.language.myanmar" => "မြန်မာ",
        "search.language.english" => "အင်္ဂလိပ်",
        "search.format.all" => "ဖော်မက်အားလုံး",
        "search.format.mp4" => "MP4 ဗီဒီယို",
        "search.category.all" => "အကြောင်းအရာအားလုံး",
        "search.filters.query" => "ရှာဖွေချက် − “{query}”",
        "search.filters.teacher" => "ဆရာတော် − {name}",
        "search.filters.category" => "အမျိုးအစား − {name}",
        "search.filters.collection" => "စုစည်းမှု စစ်ထုတ်မှု",
        "search.filters.selectedTeacher" => "ရွေးချယ်ထားသော ဆရာတော်",
        "search.filters.clearAll" => "စစ်ထုတ်မှုအားလုံး ဖျက်မည်",
        "explore.empty.title.query" => "“{query}” နှင့် ကိုက်ညီသော တရားတော် မရှိပါ",
        "explore.empty.title.filters" => "ဤစစ်ထုတ်မှုများနှင့် ကိုက်ညီသော တရားတော် မရှိပါ",
        "explore.empty.detail.filters" => {
            "စစ်ထုတ်မှုတစ်ခု ဖျက်ခြင်း၊ ဘာသာစကား ကျယ်ပြန့်စွာ ရွေးခြင်း သို့မဟုတ် ရှာဖွေချက်စကားလုံး ဖျက်ခြင်း စမ်းကြည့်ပါ။"
        }
        "explore.empty.detail.catalogue" => {
            "ဤပေါင်းစပ်မှုတွင် စာရင်းဇယားရှိ တရားတော် မရှိပါ။ စစ်ထုတ်မှုများကို ပြန်လည်သတ်မှတ်ကြည့်ပါ။"
        }
        "teachers.empty.title.query" => "“{query}” နှင့် ကိုက်ညီသော ဆရာတော် မရှိပါ",
        "teachers.empty.detail.query" => "အရေးအသားအခြားတစ်မျိုး သို့မဟုတ် ပိုတိုသော အမည်ဖြင့် စမ်းကြည့်ပါ။",
        "teachers.empty.clear" => "ရှာဖွေမှုကို ဖျက်မည်",
        "teachers.empty.title" => "ဆရာတော် မတွေ့ပါ",
        "teachers.empty.detail" => "စာရင်းဇယားတွင် ဆရာတော် မှတ်တမ်းများ ယခုမရှိသေးပါ။",
        "collections.empty.title.query" => "“{query}” နှင့် ကိုက်ညီသော စုစည်းမှု မရှိပါ",
        "collections.empty.title" => "ကိုက်ညီသော စုစည်းမှု မရှိပါ",
        "collections.empty.detail" => "ပိုတိုသော စုစည်းမှုအမည် စမ်းကြည့်ပါ သို့မဟုတ် ဆရာတော် စစ်ထုတ်မှုကို ဖျက်ပါ။",
        "collections.unknownTeacher" => "ဆရာတော် မသိရ",
        "teacherDetail.explore" => "ဤဆရာတော်၏ တရားတော်များကို ရှာဖွေမည်",
        "teacherDetail.collections" => "စုစည်းမှုများ",
        "teacherDetail.talks" => "တရားတော်များ",
        "teacherDetail.empty.title" => "တရားတော် မတွေ့ပါ",
        "teacherDetail.empty.detail" => "ဤဆရာတော်၏ တရားတော်များ စာရင်းဇယားတွင် မရှိပါ။",
        "collectionDetail.empty.title" => "ဤစုစည်းမှုတွင် တရားတော် မရှိပါ",
        "collectionDetail.empty.detail" => "ဤစုစည်းမှုတွင် ဖွင့်နိုင်သော မှတ်တမ်း မရှိပါ။",
        "library.empty.title" => "သင်၏ စာကြည့်တိုက် စတင်ရန် တရားတော်တစ်ခု ရှာပါ",
        "library.empty.detail" => {
            "နောက်တစ်ကြိမ် နားထောင်ရန် အတွက် ရှာဖွေနေစဉ် တရားတော်တစ်ခုကို အနှစ်သက်ဆုံး လုပ်ပါ သို့မဟုတ် ဒေါင်းလုပ် ဆွဲပါ။"
        }
        "library.empty.action" => "တရားတော်များ ရှာဖွေမည်",
        "library.downloads" => "ဒေါင်းလုပ်များ",
        "library.favorites" => "အနှစ်သက်ဆုံးများ",
        "library.history" => "မှတ်တမ်း",
        "library.downloads.hint" => {
            "ဒေါင်းလုပ်မလုပ်ဘဲ အနီးကပ် သိမ်းထားရန် ရှာဖွေနေစဉ် တရားတော်များကို အနှစ်သက်ဆုံး လုပ်ပါ။"
        }
        "library.downloads.empty.title" => "ဒေါင်းလုပ် မရှိသေးပါ",
        "library.downloads.empty.detail" => "အင်တာနက်မလို နားထောင်နိုင်ရန် တရားတော်ရှိ ဒေါင်းလုပ် သင်္ကေတကို နှိပ်ပါ။",
        "library.favorites.unresolved" => "{count} လက်ရှိစာရင်းဇယားတွင် မရနိုင်ပါ။",
        "library.favorites.empty.title" => "အနှစ်သက်ဆုံး မရှိသေးပါ",
        "library.favorites.empty.detail" => "ဤနေရာတွင် သိမ်းရန် တရားတော်ရှိ နှလုံးပုံ သင်္ကေတကို နှိပ်ပါ။",
        "library.history.count" => "မကြာသေးမီက {count} ဖွင့်ခဲ့သည်။",
        "library.history.empty.title" => "ဖွင့်ဖူးခြင်း မရှိသေးပါ",
        "library.history.empty.detail" => "သင်စတင်ဖွင့်သော တရားတော်များကို ပြန်သွားရန် ဤနေရာတွင် ပြမည်။",
        "library.history.empty.action" => "ဆရာတော်များကို ကြည့်မည်",
        "settings.language" => "ဘာသာစကား",
        "settings.language.detail" => "အသုံးပြုမှုမျက်နှာပြင်၊ ဂဏန်းများနှင့် ကြာချိန်များအတွက် ဘာသာစကား ရွေးပါ။",
        "settings.appearance" => "အသွင်အပြင်",
        "settings.appearance.detail" => "အလင်း၊ အမှောင် သို့မဟုတ် လည်ပတ်ရေးစနစ် အလိုက် ရွေးပါ။",
        "settings.theme.light" => "အလင်း",
        "settings.theme.dark" => "အမှောင်",
        "settings.theme.system" => "စနစ်အလိုက်",
        "settings.playback" => "ပြန်ဖွင့်ခြင်း",
        "settings.playback.detail" => {
            "မူလ ပြန်ဖွင့်နှုန်းနှင့် စာရင်းဇယား စာမျက်နှာတစ်ခုစီတွင် ပြသမည့် တရားတော် အရေအတွက်ကို ရွေးပါ။"
        }
        "settings.playback.speed" => "မူလ အရှိန်",
        "settings.playback.speed.reset" => "မူလသို့",
        "settings.playback.limit" => "တစ်မျက်နှာလျှင် ပြသမှု အကန့်အသတ်",
        "settings.keyboard" => "ကီးဘုတ်",
        "settings.keyboard.detail" => "နားထောင်နေစဉ် ကီးဘုတ် ဖြတ်လမ်းအနည်းငယ်ကို အက်ပ်က တုံ့ပြန်သည်။",
        "settings.keyboard.view" => "ဖြတ်လမ်းများ ကြည့်မည်",
        "settings.privacy.title" => "ကိုယ်ရေးကိုယ်တာ",
        "settings.about" => "Dhamma Echo အကြောင်း",
        "settings.about.show" => "ပြမည်",
        "settings.about.hide" => "ဖျောက်မည်",
        "settings.about.body1" => {
            "တရားတော်များအတွက် တိတ်ဆိတ်သော ကွန်ပျူတာ စာကြည့်တိုက်။ PolyForm Noncommercial လိုင်စင်။ အကောင့်များ၊ analytics များ၊ telemetry မရှိပါ။"
        }
        "settings.about.body2" => "စာရင်းဇယားသည် အက်ပ်နှင့်အတူ ပါရှိပြီး အက်ပ်ကို အသစ်ထုတ်သောအခါမှသာ ပြန်လည်လတ်ဆန်းသည်။",
        "player.unknownTeacher" => "ဆရာတော် မသိရ",
        "player.retry" => "ပြန်ကြိုးစားမည်",
        "player.dismiss" => "ပိတ်မည်",
        "player.connecting" => "ချိတ်ဆက်နေသည်…",
        "player.hint" => "Space − ဖွင့်/ရပ် · ←/→ − ရှေ့/နောက် · ? − အကူအညီ",
        "player.hint.compact" => "? နှိပ်ပါ",
        "queue.title" => "နောက်တစ်ခု",
        "queue.clear" => "ရှင်းလင်းမည်",
        "queue.empty" => "သင်၏ အစဉ်စာရင်း ဗလာဖြစ်နေသည်။",
        "queue.cleared" => "{count} ရှင်းလင်းပြီး။",
        "queue.undo" => "ပြန်ရယူမည်",
        "shortcuts.title" => "ကီးဘုတ် ဖြတ်လမ်းများ",
        "shortcuts.detail" => "ကီးဘုတ်ကိုမထားဘဲ စာကြည့်တိုက်တစ်ခုလုံး လှုပ်ရှားပါ။",
        "shortcuts.playPause" => "လက်ရှိ တရားတော်ကို ဖွင့်မည် သို့မဟုတ် ရပ်မည်",
        "shortcuts.back15" => "စက္ကန့် ၁၅ နောက်ပြန်သွားမည်",
        "shortcuts.back60" => "တစ်မိနစ် နောက်ပြန်သွားမည်",
        "shortcuts.forward15" => "စက္ကန့် ၁၅ ရှေ့သွားမည်",
        "shortcuts.forward60" => "တစ်မိနစ် ရှေ့သွားမည်",
        "shortcuts.next" => "အစဉ်စာရင်းရှိ နောက်တစ်ခုကို ဖွင့်မည်",
        "shortcuts.toggleHelp" => "ဤစာရင်းကို ပြမည် သို့မဟုတ် ဖျောက်မည်",
        "shortcuts.toggleSidebar" => "ဘေးဘားကို ခေါက်မည် သို့မဟုတ် ပြန်ဖွင့်မည်",
        "shortcuts.escape" => "ဤဒိုင်ယာလော့ သို့မဟုတ် လက်ရှိ ဝင်းဒိုးကို ပိတ်မည်",
        "shortcuts.focusSearch" => "ရှာဖွေမှုကွက်လပ်ကို အာရုံစိုက်မည်",
        "shortcuts.openSettings" => "ဆက်တင်များကို ဖွင့်မည်",
        "shortcuts.searchNote" => {
            "ရှာဖွေမှုကွက်လပ်များတွင် တည်းဖြတ်ရန် ကီးဘုတ်ကို ဆက်လက် အသုံးပြုနိုင်သည်။ ရိုက်ထားသည်ကို ဖျက်ရန် ရှာဖွေမှုကွက်လပ်အတွင်းတွင် Esc ကို နှိပ်ပါ။"
        }
        "track.enqueue" => "အစဉ်ထည့်မည်",
        "track.favorite.add" => "အနှစ်သက်ဆုံးများ ထည့်မည်",
        "track.favorite.remove" => "အနှစ်သက်ဆုံးများမှ ဖယ်မည်",
        "track.download.add" => "အင်တာနက်မလို နားထောင်ရန် ဒေါင်းလုပ် ဆွဲမည်",
        "track.download.remove" => "ဒေါင်းလုပ်များမှ ဖယ်မည်",
        "track.download.progress" => "ဒေါင်းလုပ် ဆွဲနေသည်",
        "track.download.offline" => "အော့ဖ်လိုင်း သိမ်းပြီး",
        "track.badge.video" => "ဗီဒီယို",
        "track.badge.wma" => "WMA ဖွင့်မရ",
        "track.badge.unavailable" => "ရင်းမြစ် မရနိုင်",
        "progress.loadMore" => "နောက်ထပ် {count} ခု ထပ်ပြမည်",
        "progress.showing" => "{noun} {total} ခုအနက် {shown} ခု ပြထားသည်",
        "video.nowPlaying" => "ဖွင့်နေသည် · ဗီဒီယို",
        "video.close" => "ပိတ်မည်",
        "video.preparing" => "ဗီဒီယို ပြင်ဆင်နေသည်",
        "video.preparing.detail" => "ဖွင့်ခြမီ အသံတိတ်ဆိတ် ခဏလေးပါ",
        "video.loading" => "ဗီဒီယို တင်နေသည်…",
        "video.hint" => "Space − ရပ် · ←/→ − ရှေ့/နောက်",
        "video.fullscreen.exit.short" => "ထွက်မည်",
        "video.fullscreen.enter.short" => "အပြည့်ကြည့်မည်",
        "error.media.untrusted" => "ဤမီဒီယာ ရင်းမြစ်ကို ယုံကြည်မရပါ။",
        "error.media.unsupported" => "ဤမီဒီယာ ဖော်မက်ကို macOS player မှ ပံ့ပိုးမထားပါ။",
        "error.video.start" => "ဗီဒီယိုကို စဖွင့်မရပါ။",
        "error.audio.start" => "အသံကို စဖွင့်မရပါ။",
        "error.video.unavailable" => "ဗီဒီယိုကို Dhamma Download မှ မရနိုင်ပါ။",
        "error.audio.unavailable" => "အသံကို Dhamma Download မှ မရနိုင်ပါ။",
        "error.catalogue.unavailable" => "စာရင်းဇယားကို မရနိုင်ပါ။",
        "error.catalogue.load" => "စာရင်းဇယားကို မတင်နိုင်ပါ။",
        "noun.talks" => "တရားတော်",
        "noun.collections" => "စုစည်းမှု",
        "noun.teachers" => "ဆရာတော်",
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_numbers_and_durations_per_locale() {
        assert_eq!(format_locale_number(30_563, Locale::EnUs), "30,563");
        assert_eq!(format_locale_number(30_563, Locale::MyMm), "၃၀,၅၆၃");
        assert_eq!(format_locale_duration(124.9, Locale::EnUs), "2:04");
        assert_eq!(format_locale_duration(3725.0, Locale::MyMm), "၁:၀၂:၀၅");
        assert_eq!(count_label(Locale::EnUs, CountKind::Talk, 1), "1 talk");
        assert_eq!(count_label(Locale::EnUs, CountKind::Talk, 3), "3 talks");
        assert_eq!(count_label(Locale::MyMm, CountKind::Talk, 3), "တရားတော် ၃ ခု");
    }

    #[test]
    fn every_english_key_has_burmese_translation() {
        let keys = [
            "app.name",
            "nav.home",
            "nav.explore",
            "nav.collections",
            "nav.teachers",
            "nav.library",
            "nav.settings",
            "home.welcome.title",
            "library.downloads",
            "library.favorites",
            "library.history",
            "settings.language",
            "settings.appearance",
            "settings.playback",
            "settings.keyboard",
            "settings.privacy.title",
            "settings.about",
            "queue.title",
            "shortcuts.title",
            "video.nowPlaying",
            "error.audio.unavailable",
        ];
        for key in keys {
            assert!(lookup_en(key).is_some(), "missing en {key}");
            assert!(lookup_my(key).is_some(), "missing my {key}");
        }
    }
}
