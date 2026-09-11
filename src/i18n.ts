import type { AppLocale, Route } from "./types.js";
import { formatLocaleNumber } from "./utils.js";

/**
 * UI string catalogue. English is the source of truth: every key declared in
 * `en` must have a Burmese twin in `my` (enforced by tests/i18n.test.mjs).
 * Templates interpolate `{name}` placeholders via `t()`.
 */
const en = {
  "app.name": "Dhamma Echo",
  "app.tagline": "Listen with intention",

  "nav.primary": "Primary",
  "nav.primaryNavigation": "Primary navigation",
  "nav.home": "Home",
  "nav.explore": "Explore",
  "nav.collections": "Collections",
  "nav.teachers": "Teachers",
  "nav.library": "My library",
  "nav.settings": "Settings",
  "nav.collapse": "Collapse",
  "nav.collapseSidebar": "Collapse sidebar",
  "nav.expandSidebar": "Expand sidebar",

  "privacy.title": "A quiet library",
  "privacy.body":
    "Your catalogue stays on this device. Audio streams only when you press play; downloads stay until you remove them.",
  "privacy.body.settings":
    "Favorites, history, playback position, and settings are stored locally on this device. The bundled catalogue is read-only. Audio is requested from ",
  "privacy.body.settings.tail":
    " only when you press play. Downloads stay on this device until you remove them.",

  "route.home.eyebrow": "Home",
  "route.home.title": "Discover the Dhamma",
  "route.home.detail": "Return to recent talks and trusted teachers.",
  "route.explore.eyebrow": "Explore",
  "route.explore.title": "Explore the Dhamma library",
  "route.explore.detail": "Search talks by teacher, language, format, or collection.",
  "route.collections.eyebrow": "Collections",
  "route.collections.title": "Browse listening collections",
  "route.collections.detail": "Move through related talks without losing your place.",
  "route.collection-detail.eyebrow": "Collection",
  "route.collection-detail.title": "Collection details",
  "route.collection-detail.detail": "Listen through this collection at your own pace.",
  "route.teachers.eyebrow": "Teachers",
  "route.teachers.title": "Learn from trusted voices",
  "route.teachers.detail": "Browse teachers and continue into their available talks.",
  "route.teacher-detail.eyebrow": "Teacher",
  "route.teacher-detail.title": "Teacher details",
  "route.teacher-detail.detail": "Explore talks and collections from this teacher.",
  "route.library.eyebrow": "Your space",
  "route.library.title": "Your library",
  "route.library.detail": "Downloads, favorites, and recently played talks.",
  "route.settings.eyebrow": "Preferences",
  "route.settings.title": "Make listening yours",
  "route.settings.detail": "Adjust appearance and playback defaults for this device.",

  "back.to": "← Back to {destination}",
  "back.generic": "← Back",

  "home.continue": "Continue listening",
  "home.continue.detail": "Pick up where you left off.",
  "home.recentlyPlayed": "Recently played",
  "home.recent.error": "Could not load your recent talks",
  "home.welcome.eyebrow": "Welcome to Dhamma Echo",
  "home.welcome.title": "Find something to listen to",
  "home.welcome.body":
    "Search by title, teacher, language, or format across {talks} and {teachers}.",
  "home.welcome.explore": "Explore talks",
  "home.welcome.teachers": "Browse teachers",
  "home.featured": "Featured teachers",
  "home.featured.detail": "Curated teachers to start listening. Tap to explore their talks.",
  "home.featured.viewAll": "View all",
  "home.featured.empty": "Teacher highlights will appear here when the catalogue is ready.",
  "home.resumeAt": "Resume at {time}",
  "home.resumeTrack": "Resume {title}",
  "home.pauseTrack": "Pause {title}",
  "home.unsupportedTrack": "{title} (not supported by the macOS player)",
  "home.unsupportedHint": "This format isn't supported by the macOS player.",

  "search.talks.label": "Search talks",
  "search.talks.placeholder": "Search title or teacher",
  "search.talks.clear": "Clear talk search",
  "search.teachers.label": "Search teachers",
  "search.teachers.placeholder": "Search teacher name",
  "search.teachers.clear": "Clear teacher search",
  "search.collections.label": "Search collections",
  "search.collections.placeholder": "Search collection name",
  "search.submit": "Search",
  "search.language": "Language",
  "search.language.all": "All languages",
  "search.language.myanmar": "Myanmar",
  "search.language.english": "English",
  "search.format": "Format",
  "search.format.all": "All formats",
  "search.format.mp4": "MP4 video",
  "search.category.all": "All content",
  "search.category.legend": "Content categories",
  "search.filters.active": "Active filters",
  "search.filters.query": 'Search: "{query}"',
  "search.filters.teacher": "Teacher: {name}",
  "search.filters.category": "Category: {name}",
  "search.filters.collection": "Collection filter",
  "search.filters.selectedTeacher": "selected teacher",
  "search.filters.clearQuery": "Clear search query",
  "search.filters.clearTeacher": "Clear teacher filter",
  "search.filters.clearCategory": "Clear category filter",
  "search.filters.clearCollection": "Clear collection filter",
  "search.filters.clearAll": "Clear all filters",
  "search.collections.teacher": "Collection teacher",
  "search.collections.allTeachers": "All teachers",
  "search.collections.clearSearch": "Clear collection search",
  "search.collections.clear": "Clear filters",

  "explore.empty.title.query": "No talks match “{query}”",
  "explore.empty.title.filters": "No talks match these filters",
  "explore.empty.detail.filters":
    "Try clearing a filter, broadening the language, or removing the search terms.",
  "explore.empty.detail.catalogue":
    "The catalogue has no talks in this combination. Try resetting the filters.",
  "explore.loading": "Loading talks",

  "teachers.empty.title.query": "No teachers match “{query}”",
  "teachers.empty.detail.query": "Try a different spelling or a shorter name.",
  "teachers.empty.clear": "Clear search",
  "teachers.empty.title": "No teachers found",
  "teachers.empty.detail": "The catalogue does not currently include teacher records.",
  "teachers.loading": "Loading teachers",
  "teachers.featuredBadge": "Featured teacher",

  "collections.loading": "Loading collections",
  "collections.empty.title.query": "No collections match “{query}”",
  "collections.empty.title": "No collections match",
  "collections.empty.detail": "Try a shorter collection name or clear the teacher filter.",
  "collections.unknownTeacher": "Unknown teacher",

  "teacherDetail.explore": "Explore this teacher's talks",
  "teacherDetail.collections": "Collections",
  "teacherDetail.talks": "Talks",
  "teacherDetail.loading": "Loading teacher",
  "teacherDetail.talks.loading": "Loading talks",
  "teacherDetail.pending.title": "Loading more talks",
  "teacherDetail.pending.detail":
    "This teacher has {count} talks on file. Load more below to see them.",
  "teacherDetail.empty.title": "No talks found",
  "teacherDetail.empty.detail": "This teacher has no talks in the catalogue.",

  "collectionDetail.loading": "Loading collection",
  "collectionDetail.empty.title": "No talks in this collection",
  "collectionDetail.empty.detail": "This collection has no playable records to play.",

  "library.empty.title": "Find a talk to start your library",
  "library.empty.detail":
    "Favorite a talk or download one while exploring to keep it close for another listening session.",
  "library.empty.action": "Explore talks",
  "library.tabs": "Library sections",
  "library.downloads": "Downloads",
  "library.favorites": "Favorites",
  "library.history": "History",
  "library.downloads.hint":
    "Favorite talks while exploring to keep them close even without a download.",
  "library.downloads.loading": "Loading downloaded talks",
  "library.downloads.empty.title": "No downloads yet",
  "library.downloads.empty.detail":
    "Tap the download icon on a talk to keep it saved for offline listening.",
  "library.favorites.unresolved": "{count} unavailable in the current catalogue.",
  "library.favorites.saved.title": "Favorites saved",
  "library.favorites.saved.detail":
    "The saved talks are not available in the current catalogue. Restart the app to refresh the catalogue.",
  "library.favorites.empty.title": "No favorites yet",
  "library.favorites.empty.detail": "Tap the heart icon on a talk to save it here.",
  "library.history.count": "{count} played recently.",
  "library.history.empty.title": "No plays yet",
  "library.history.empty.detail": "Talks you start will appear here so you can return to them.",
  "library.history.empty.action": "Browse teachers",

  "settings.language": "Language",
  "settings.language.detail": "Choose the language used for the interface, numbers, and durations.",
  "settings.language.group": "App language",
  "settings.appearance": "Appearance",
  "settings.appearance.detail": "Choose light, dark, or follow your operating system.",
  "settings.appearance.group": "Color theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",
  "settings.playback": "Playback",
  "settings.playback.detail":
    "Choose the default playback speed and how many talks appear on each catalogue page.",
  "settings.playback.speed": "Default speed",
  "settings.playback.speed.reset": "Reset",
  "settings.playback.limit": "Browse limit",
  "settings.keyboard": "Keyboard",
  "settings.keyboard.detail":
    "The app responds to a small set of keyboard shortcuts while listening.",
  "settings.keyboard.view": "View shortcuts",
  "settings.privacy.title": "Privacy",
  "settings.about": "About Dhamma Echo",
  "settings.about.show": "Show",
  "settings.about.hide": "Hide",
  "settings.about.body1":
    "A quiet desktop library for Dhamma talks. PolyForm Noncommercial license. No accounts, no analytics, no telemetry.",
  "settings.about.body2":
    "The catalogue is bundled with the application and refreshed only when you update the app.",

  "player.unknownTeacher": "Unknown teacher",
  "player.region": "Audio player",
  "player.retry": "Retry",
  "player.dismiss": "Dismiss",
  "player.connecting": "Connecting…",
  "player.hint": "Space: play/pause · ←/→: seek · ?: help",
  "player.hint.compact": "Press ?",
  "player.back15": "Jump back 15 seconds",
  "player.forward15": "Jump forward 15 seconds",
  "player.play": "Play",
  "player.pause": "Pause",
  "player.connectingTo": "Connecting to audio",
  "player.speed": "Playback speed",
  "player.position": "Playback position",
  "player.position.value": "{current} of {duration}",
  "player.queue.show": "Show queue",
  "player.queue.showCount": "Show queue with {count}",

  "queue.label": "Playback queue",
  "queue.title": "Up next",
  "queue.clear": "Clear",
  "queue.empty": "Your queue is empty.",
  "queue.remove": "Remove {title} from queue",
  "queue.cleared": "{count} cleared.",
  "queue.undo": "Undo",
  "queue.undo.dismiss": "Dismiss undo notification",

  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.detail": "Move through the library without leaving the keyboard.",
  "shortcuts.close": "Close shortcuts",
  "shortcuts.playPause": "Play or pause the current talk",
  "shortcuts.back15": "Jump back 15 seconds",
  "shortcuts.back60": "Jump back 1 minute",
  "shortcuts.forward15": "Jump forward 15 seconds",
  "shortcuts.forward60": "Jump forward 1 minute",
  "shortcuts.next": "Play the next talk in the queue",
  "shortcuts.toggleHelp": "Show or hide this list",
  "shortcuts.toggleSidebar": "Collapse or expand the sidebar",
  "shortcuts.escape": "Close this dialog or the active overlay",
  "shortcuts.searchNote":
    "Search fields keep the keyboard for editing. Press {key} inside a search field to clear what you typed.",

  "track.play": "Play {title}",
  "track.pause": "Pause {title}",
  "track.connecting": "Connecting to {title}",
  "track.menu": "Talk actions",
  "track.enqueue": "Queue",
  "track.favorite.add": "Add to favorites",
  "track.favorite.remove": "Remove from favorites",
  "track.download.add": "Download for offline listening",
  "track.download.remove": "Remove from downloads",
  "track.download.progress": "Downloading",
  "track.download.progress.label": "Download in progress",
  "track.download.progress.percent": "{percent} percent downloaded",
  "track.badge.video": "Video",
  "track.badge.wma": "WMA unavailable",
  "track.badge.unavailable": "Source unavailable",
  "track.language.myanmar": "Burmese",
  "track.language.english": "English",
  "track.language.unknown": "Language",
  "track.format": "Format",
  "track.resumeAt": "Resume at {time}",

  "progress.loadMore": "Load {count} more",
  "progress.loading": "Loading…",
  "progress.showing": "Showing {shown} of {total} {noun}",
  "progress.pagination": "{noun} pagination",

  "async.loading": "Loading content",
  "async.error.title": "This view needs another try",
  "async.retry": "Try again",

  "video.nowPlaying": "Now playing · video",
  "video.close": "Close",
  "video.closePlayer": "Close video player",
  "video.preparing": "Preparing the video",
  "video.preparing.detail": "A moment of quiet before playback",
  "video.preparing.label": "Preparing video",
  "video.loading": "Loading video…",
  "video.hint": "Space to pause · ←/→ to seek",
  "video.fullscreen.enter": "Enter fullscreen",
  "video.fullscreen.exit": "Exit fullscreen",
  "video.fullscreen.exit.short": "Exit",
  "video.fullscreen.enter.short": "Fullscreen",
  "video.controls": "Video playback controls",
  "video.queue.show": "Show queue",
  "video.pauseLoading": "Pause video loading",
  "video.pause": "Pause video",
  "video.play": "Play video",

  "error.media.untrusted": "This media source is not trusted.",
  "error.media.unsupported": "This media format is not supported by the macOS player.",
  "error.video.start": "The video could not start.",
  "error.audio.start": "The audio stream could not start.",
  "error.video.unavailable": "The video is unavailable from Dhamma Download.",
  "error.audio.unavailable": "The audio stream is unavailable from Dhamma Download.",
  "error.catalogue.unavailable": "The catalogue is unavailable.",
  "error.catalogue.load": "Unable to load the Dhamma catalogue.",

  "noun.talks": "talks",
  "noun.collections": "collections",
  "noun.teachers": "teachers"
} as const;

export type MessageKey = keyof typeof en;

const my: Partial<Record<MessageKey, string>> = {
  "app.name": "Dhamma Echo",
  "app.tagline": "ရည်ရွယ်ချက်ဖြင့် နားထောင်ပါ",

  "nav.primary": "အဓိက",
  "nav.primaryNavigation": "အဓိက လမ်းညွှန်",
  "nav.home": "ပင်မ",
  "nav.explore": "ရှာဖွေခြင်း",
  "nav.collections": "စုစည်းမှုများ",
  "nav.teachers": "ဆရာတော်များ",
  "nav.library": "ကိုယ်ပိုင်စာကြည့်တိုက်",
  "nav.settings": "ဆက်တင်များ",
  "nav.collapse": "ခေါက်မည်",
  "nav.collapseSidebar": "ဘေးဘားကို ခေါက်မည်",
  "nav.expandSidebar": "ဘေးဘားကို ပြန်ဖွင့်မည်",

  "privacy.title": "တိတ်ဆိတ်သော စာကြည့်တိုက်",
  "privacy.body":
    "စာရင်းဇယားသည် သင့်စက်ထဲတွင်သာ ရှိသည်။ ဖွင့်နှိပ်သည့်အချိန်မှသာ အသံကို ထုတ်လွှင့်၍ ဒေါင်းလုပ်များကိုလည်း သင်မဖျက်မချင်း စက်ထဲတွင်ပင် ကျန်ရှိနေမည်။",
  "privacy.body.settings":
    "အနှစ်သက်ဆုံးများ၊ မှတ်တမ်း၊ ဖွင့်နေသောနေရာနှင့် ဆက်တင်များကို ဤစက်ထဲတွင်သာ သိမ်းသည်။ ပါရှိသော စာရင်းဇယားကို ဖတ်ရုံသာမျှ ဖြစ်သည်။ အသံကို ",
  "privacy.body.settings.tail":
    " မှ ဖွင့်နှိပ်သည့်အချိန်မှသာ တောင်းဆိုသည်။ ဒေါင်းလုပ်များကိုလည်း သင်မဖျက်မချင်း ဤစက်ထဲတွင်ပင် ရှိနေမည်။",

  "route.home.eyebrow": "ပင်မ",
  "route.home.title": "ဓမ္မကို ရှာဖွေတွေ့ရှိပါ",
  "route.home.detail": "မကြာသေးမီက တရားတော်များနှင့် ယုံကြည်ရသော ဆရာတော်များထံ ပြန်သွားပါ။",
  "route.explore.eyebrow": "ရှာဖွေခြင်း",
  "route.explore.title": "ဓမ္မစာကြည့်တိုက်ကို ရှာဖွေပါ",
  "route.explore.detail": "ဆရာတော်၊ ဘာသာစကား၊ ဖော်မက်၊ စုစည်းမှုအလိုက် တရားတော်များ ရှာဖွေပါ။",
  "route.collections.eyebrow": "စုစည်းမှုများ",
  "route.collections.title": "နားထောင်ရန် စုစည်းမှုများ",
  "route.collections.detail": "နေရာမပျက်စေဘဲ ဆက်စပ်တရားတော်များကို အစဉ်လိုက် နားထောင်ပါ။",
  "route.collection-detail.eyebrow": "စုစည်းမှု",
  "route.collection-detail.title": "စုစည်းမှု အသေးစိတ်",
  "route.collection-detail.detail": "ဤစုစည်းမှုကို ကိုယ်ပိုင်အရှိန်ဖြင့် နားထောင်ပါ။",
  "route.teachers.eyebrow": "ဆရာတော်များ",
  "route.teachers.title": "ယုံကြည်ရသော ဆရာတော်များထံမှ သင်ယူပါ",
  "route.teachers.detail": "ဆရာတော်များကို ကြည့်ရှု၍ ၎င်းတို့၏ တရားတော်များသို့ ဆက်သွားပါ။",
  "route.teacher-detail.eyebrow": "ဆရာတော်",
  "route.teacher-detail.title": "ဆရာတော် အသေးစိတ်",
  "route.teacher-detail.detail": "ဤဆရာတော်၏ တရားတော်များနှင့် စုစည်းမှုများကို ကြည့်ရှုပါ။",
  "route.library.eyebrow": "သင်၏နေရာ",
  "route.library.title": "သင်၏ စာကြည့်တိုက်",
  "route.library.detail":
    "ဒေါင်းလုပ်များ၊ အနှစ်သက်ဆုံးများနှင့် မကြာသေးမီက နားထောင်ခဲ့သော တရားတော်များ။",
  "route.settings.eyebrow": "ဦးစားပေးချက်များ",
  "route.settings.title": "နားထောင်ပုံကို ကိုယ်စဉ်းလှော်ပါ",
  "route.settings.detail": "ဤစက်အတွက် အသွင်အပြင်နှင့် ပြန်ဖွင့်ခြင်း မူလတန်ဖိုးများကို ညှိပါ။",

  "back.to": "← {destination} သို့ ပြန်သွားမည်",
  "back.generic": "← နောက်သို့",

  "home.continue": "ဆက်လက်နားထောင်မည်",
  "home.continue.detail": "ကျန်ခဲ့သော နေရာမှ ဆက်နားထောင်ပါ။",
  "home.recentlyPlayed": "မကြာသေးမီက ဖွင့်ခဲ့သည်များ",
  "home.recent.error": "မကြာသေးမီက တရားတော်များကို မရယူနိုင်ပါ",
  "home.welcome.eyebrow": "Dhamma Echo မှ ကြိုဆိုပါသည်",
  "home.welcome.title": "နားထောင်ရန် တစ်ခုခု ရှာပါ",
  "home.welcome.body":
    "{talks} နှင့် {teachers} ထဲကို ခေါင်းစဉ်၊ ဆရာတော်၊ ဘာသာစကား၊ ဖော်မက်အလိုက် ရှာဖွေပါ။",
  "home.welcome.explore": "တရားတော်များ ရှာဖွေမည်",
  "home.welcome.teachers": "ဆရာတော်များကို ကြည့်မည်",
  "home.featured": "အထူးတင်ဆက် ဆရာတော်များ",
  "home.featured.detail":
    "နားထောင်စရန် ရွေးချယ်ထားသော ဆရာတော်များ။ တရားတော်များ ရှာဖွေရန် နှိပ်ပါ။",
  "home.featured.viewAll": "အားလုံးကြည့်မည်",
  "home.featured.empty":
    "စာရင်းဇယား အဆင်သင့်ဖြစ်သောအခါ ဆရာတော်များ၏ အထူးအပိုင်းကို ဤနေရာတွင် ပြမည်။",
  "home.resumeAt": "{time} တွင် ပြန်စမည်",
  "home.resumeTrack": "{title} ကို ဆက်နားထောင်မည်",
  "home.pauseTrack": "{title} ကို ခဏရပ်မည်",
  "home.unsupportedTrack": "{title} (macOS player မှ ပံ့ပိုးမထားပါ)",
  "home.unsupportedHint": "ဤဖော်မက်ကို macOS player မှ ပံ့ပိုးမထားပါ။",

  "search.talks.label": "တရားတော် ရှာဖွေခြင်း",
  "search.talks.placeholder": "ခေါင်းစဉ် သို့မဟုတ် ဆရာတော် ရှာပါ",
  "search.talks.clear": "တရားတော် ရှာဖွေမှုကို ဖျက်မည်",
  "search.teachers.label": "ဆရာတော် ရှာဖွေခြင်း",
  "search.teachers.placeholder": "ဆရာတော် အမည် ရှာပါ",
  "search.teachers.clear": "ဆရာတော် ရှာဖွေမှုကို ဖျက်မည်",
  "search.collections.label": "စုစည်းမှု ရှာဖွေခြင်း",
  "search.collections.placeholder": "စုစည်းမှု အမည် ရှာပါ",
  "search.submit": "ရှာဖွေမည်",
  "search.language": "ဘာသာစကား",
  "search.language.all": "ဘာသာစကားအားလုံး",
  "search.language.myanmar": "မြန်မာ",
  "search.language.english": "အင်္ဂလိပ်",
  "search.format": "ဖော်မက်",
  "search.format.all": "ဖော်မက်အားလုံး",
  "search.format.mp4": "MP4 ဗီဒီယို",
  "search.category.all": "အကြောင်းအရာအားလုံး",
  "search.category.legend": "အကြောင်းအရာ အမျိုးအစားများ",
  "search.filters.active": "လက်ရှိ စစ်ထုတ်မှုများ",
  "search.filters.query": "ရှာဖွေချက် − “{query}”",
  "search.filters.teacher": "ဆရာတော် − {name}",
  "search.filters.category": "အမျိုးအစား − {name}",
  "search.filters.collection": "စုစည်းမှု စစ်ထုတ်မှု",
  "search.filters.selectedTeacher": "ရွေးချယ်ထားသော ဆရာတော်",
  "search.filters.clearQuery": "ရှာဖွေချက်ကို ဖျက်မည်",
  "search.filters.clearTeacher": "ဆရာတော် စစ်ထုတ်မှုကို ဖျက်မည်",
  "search.filters.clearCategory": "အမျိုးအစား စစ်ထုတ်မှုကို ဖျက်မည်",
  "search.filters.clearCollection": "စုစည်းမှု စစ်ထုတ်မှုကို ဖျက်မည်",
  "search.filters.clearAll": "စစ်ထုတ်မှုအားလုံး ဖျက်မည်",
  "search.collections.teacher": "စုစည်းမှု ဆရာတော်",
  "search.collections.allTeachers": "ဆရာတော်အားလုံး",
  "search.collections.clearSearch": "စုစည်းမှု ရှာဖွေမှုကို ဖျက်မည်",
  "search.collections.clear": "စစ်ထုတ်မှုများ ဖျက်မည်",

  "explore.empty.title.query": "“{query}” နှင့် ကိုက်ညီသော တရားတော် မရှိပါ",
  "explore.empty.title.filters": "ဤစစ်ထုတ်မှုများနှင့် ကိုက်ညီသော တရားတော် မရှိပါ",
  "explore.empty.detail.filters":
    "စစ်ထုတ်မှုတစ်ခု ဖျက်ခြင်း၊ ဘာသာစကား ကျယ်ပြန့်စွာ ရွေးခြင်း သို့မဟုတ် ရှာဖွေချက်စကားလုံး ဖျက်ခြင်း စမ်းကြည့်ပါ။",
  "explore.empty.detail.catalogue":
    "ဤပေါင်းစပ်မှုတွင် စာရင်းဇယားရှိ တရားတော် မရှိပါ။ စစ်ထုတ်မှုများကို ပြန်လည်သတ်မှတ်ကြည့်ပါ။",
  "explore.loading": "တရားတော်များ တင်နေသည်",

  "teachers.empty.title.query": "“{query}” နှင့် ကိုက်ညီသော ဆရာတော် မရှိပါ",
  "teachers.empty.detail.query": "အရေးအသားအခြားတစ်မျိုး သို့မဟုတ် ပိုတိုသော အမည်ဖြင့် စမ်းကြည့်ပါ။",
  "teachers.empty.clear": "ရှာဖွေမှုကို ဖျက်မည်",
  "teachers.empty.title": "ဆရာတော် မတွေ့ပါ",
  "teachers.empty.detail": "စာရင်းဇယားတွင် ဆရာတော် မှတ်တမ်းများ ယခုမရှိသေးပါ။",
  "teachers.loading": "ဆရာတော်များ တင်နေသည်",
  "teachers.featuredBadge": "အထူးတင်ဆက် ဆရာတော်",

  "collections.loading": "စုစည်းမှုများ တင်နေသည်",
  "collections.empty.title.query": "“{query}” နှင့် ကိုက်ညီသော စုစည်းမှု မရှိပါ",
  "collections.empty.title": "ကိုက်ညီသော စုစည်းမှု မရှိပါ",
  "collections.empty.detail":
    "ပိုတိုသော စုစည်းမှုအမည် စမ်းကြည့်ပါ သို့မဟုတ် ဆရာတော် စစ်ထုတ်မှုကို ဖျက်ပါ။",
  "collections.unknownTeacher": "ဆရာတော် မသိရ",

  "teacherDetail.explore": "ဤဆရာတော်၏ တရားတော်များကို ရှာဖွေမည်",
  "teacherDetail.collections": "စုစည်းမှုများ",
  "teacherDetail.talks": "တရားတော်များ",
  "teacherDetail.loading": "ဆရာတော်ကို တင်နေသည်",
  "teacherDetail.talks.loading": "တရားတော်များ တင်နေသည်",
  "teacherDetail.pending.title": "နောက်ထပ် တရားတော်များ တင်နေသည်",
  "teacherDetail.pending.detail":
    "ဤဆရာတော်တွင် တရားတော် {count} ခု မှတ်တမ်းရှိသည်။ အောက်တွင်မှ နောက်ထပ် တင်ပါ။",
  "teacherDetail.empty.title": "တရားတော် မတွေ့ပါ",
  "teacherDetail.empty.detail": "ဤဆရာတော်၏ တရားတော်များ စာရင်းဇယားတွင် မရှိပါ။",

  "collectionDetail.loading": "စုစည်းမှုကို တင်နေသည်",
  "collectionDetail.empty.title": "ဤစုစည်းမှုတွင် တရားတော် မရှိပါ",
  "collectionDetail.empty.detail": "ဤစုစည်းမှုတွင် ဖွင့်နိုင်သော မှတ်တမ်း မရှိပါ။",

  "library.empty.title": "သင်၏ စာကြည့်တိုက် စတင်ရန် တရားတော်တစ်ခု ရှာပါ",
  "library.empty.detail":
    "နောက်တစ်ကြိမ် နားထောင်ရန် အတွက် ရှာဖွေနေစဉ် တရားတော်တစ်ခုကို အနှစ်သက်ဆုံး လုပ်ပါ သို့မဟုတ် ဒေါင်းလုပ် ဆွဲပါ။",
  "library.empty.action": "တရားတော်များ ရှာဖွေမည်",
  "library.tabs": "စာကြည့်တိုက် အပိုင်းများ",
  "library.downloads": "ဒေါင်းလုပ်များ",
  "library.favorites": "အနှစ်သက်ဆုံးများ",
  "library.history": "မှတ်တမ်း",
  "library.downloads.hint":
    "ဒေါင်းလုပ်မလုပ်ဘဲ အနီးကပ် သိမ်းထားရန် ရှာဖွေနေစဉ် တရားတော်များကို အနှစ်သက်ဆုံး လုပ်ပါ။",
  "library.downloads.loading": "ဒေါင်းလုပ် တရားတော်များ တင်နေသည်",
  "library.downloads.empty.title": "ဒေါင်းလုပ် မရှိသေးပါ",
  "library.downloads.empty.detail":
    "အင်တာနက်မလို နားထောင်နိုင်ရန် တရားတော်ရှိ ဒေါင်းလုပ် သင်္ကေတကို နှိပ်ပါ။",
  "library.favorites.unresolved": "{count} လက်ရှိစာရင်းဇယားတွင် မရနိုင်ပါ။",
  "library.favorites.saved.title": "အနှစ်သက်ဆုံးများ သိမ်းပြီး",
  "library.favorites.saved.detail":
    "သိမ်းထားသော တရားတော်များကို လက်ရှိစာရင်းဇယားတွင် မရနိုင်ပါ။ စာရင်းဇယား အသစ်ရရန် အက်ပ်ကို ပြန်ဖွင့်ပါ။",
  "library.favorites.empty.title": "အနှစ်သက်ဆုံး မရှိသေးပါ",
  "library.favorites.empty.detail": "ဤနေရာတွင် သိမ်းရန် တရားတော်ရှိ နှလုံးပုံ သင်္ကေတကို နှိပ်ပါ။",
  "library.history.count": "မကြာသေးမီက {count} ဖွင့်ခဲ့သည်။",
  "library.history.empty.title": "ဖွင့်ဖူးခြင်း မရှိသေးပါ",
  "library.history.empty.detail": "သင်စတင်ဖွင့်သော တရားတော်များကို ပြန်သွားရန် ဤနေရာတွင် ပြမည်။",
  "library.history.empty.action": "ဆရာတော်များကို ကြည့်မည်",

  "settings.language": "ဘာသာစကား",
  "settings.language.detail":
    "အသုံးပြုမှုမျက်နှာပြင်၊ ဂဏန်းများနှင့် ကြာချိန်များအတွက် ဘာသာစကား ရွေးပါ။",
  "settings.language.group": "အက်ပ် ဘာသာစကား",
  "settings.appearance": "အသွင်အပြင်",
  "settings.appearance.detail": "အလင်း၊ အမှောင် သို့မဟုတ် လည်ပတ်ရေးစနစ် အလိုက် ရွေးပါ။",
  "settings.appearance.group": "အရောင် အပြင်အဆင်",
  "settings.theme.light": "အလင်း",
  "settings.theme.dark": "အမှောင်",
  "settings.theme.system": "စနစ်အလိုက်",
  "settings.playback": "ပြန်ဖွင့်ခြင်း",
  "settings.playback.detail":
    "မူလ ပြန်ဖွင့်နှုန်းနှင့် စာရင်းဇယား စာမျက်နှာတစ်ခုစီတွင် ပြသမည့် တရားတော် အရေအတွက်ကို ရွေးပါ။",
  "settings.playback.speed": "မူလ အရှိန်",
  "settings.playback.speed.reset": "မူလသို့",
  "settings.playback.limit": "တစ်မျက်နှာလျှင် ပြသမှု အကန့်အသတ်",
  "settings.keyboard": "ကီးဘုတ်",
  "settings.keyboard.detail": "နားထောင်နေစဉ် ကီးဘုတ် ဖြတ်လမ်းအနည်းငယ်ကို အက်ပ်က တုံ့ပြန်သည်။",
  "settings.keyboard.view": "ဖြတ်လမ်းများ ကြည့်မည်",
  "settings.privacy.title": "ကိုယ်ရေးကိုယ်တာ",
  "settings.about": "Dhamma Echo အကြောင်း",
  "settings.about.show": "ပြမည်",
  "settings.about.hide": "ဖျောက်မည်",
  "settings.about.body1":
    "တရားတော်များအတွက် တိတ်ဆိတ်သော ကွန်ပျူတာ စာကြည့်တိုက်။ PolyForm Noncommercial လိုင်စင်။ အကောင့်များ၊ analytics များ၊ telemetry မရှိပါ။",
  "settings.about.body2":
    "စာရင်းဇယားသည် အက်ပ်နှင့်အတူ ပါရှိပြီး အက်ပ်ကို အသစ်ထုတ်သောအခါမှသာ ပြန်လည်လတ်ဆန်းသည်။",

  "player.unknownTeacher": "ဆရာတော် မသိရ",
  "player.region": "အသံ player",
  "player.retry": "ပြန်ကြိုးစားမည်",
  "player.dismiss": "ပိတ်မည်",
  "player.connecting": "ချိတ်ဆက်နေသည်…",
  "player.hint": "Space − ဖွင့်/ရပ် · ←/→ − ရှေ့/နောက် · ? − အကူအညီ",
  "player.hint.compact": "? နှိပ်ပါ",
  "player.back15": "စက္ကန့် ၁၅ နောက်ပြန်သွားမည်",
  "player.forward15": "စက္ကန့် ၁၅ ရှေ့သွားမည်",
  "player.play": "ဖွင့်မည်",
  "player.pause": "ခဏရပ်မည်",
  "player.connectingTo": "အသံသို့ ချိတ်ဆက်နေသည်",
  "player.speed": "ပြန်ဖွင့်နှုန်း",
  "player.position": "ဖွင့်နေသော နေရာ",
  "player.position.value": "{duration} ထဲက {current}",
  "player.queue.show": "အစဉ်စာရင်း ကြည့်မည်",
  "player.queue.showCount": "{count} ပါသော အစဉ်စာရင်း ကြည့်မည်",

  "queue.label": "ဖွင့်မည့် အစဉ်စာရင်း",
  "queue.title": "နောက်တစ်ခု",
  "queue.clear": "ရှင်းလင်းမည်",
  "queue.empty": "သင်၏ အစဉ်စာရင်း ဗလာဖြစ်နေသည်။",
  "queue.remove": "{title} ကို အစဉ်စာရင်းမှ ဖယ်မည်",
  "queue.cleared": "{count} ရှင်းလင်းပြီး။",
  "queue.undo": "ပြန်ရယူမည်",
  "queue.undo.dismiss": "ပြန်ရယူမှု အသိပေးချက်ကို ပိတ်မည်",

  "shortcuts.title": "ကီးဘုတ် ဖြတ်လမ်းများ",
  "shortcuts.detail": "ကီးဘုတ်ကိုမထားဘဲ စာကြည့်တိုက်တစ်ခုလုံး လှုပ်ရှားပါ။",
  "shortcuts.close": "ဖြတ်လမ်းစာရင်း ပိတ်မည်",
  "shortcuts.playPause": "လက်ရှိ တရားတော်ကို ဖွင့်မည် သို့မဟုတ် ရပ်မည်",
  "shortcuts.back15": "စက္ကန့် ၁၅ နောက်ပြန်သွားမည်",
  "shortcuts.back60": "တစ်မိနစ် နောက်ပြန်သွားမည်",
  "shortcuts.forward15": "စက္ကန့် ၁၅ ရှေ့သွားမည်",
  "shortcuts.forward60": "တစ်မိနစ် ရှေ့သွားမည်",
  "shortcuts.next": "အစဉ်စာရင်းရှိ နောက်တစ်ခုကို ဖွင့်မည်",
  "shortcuts.toggleHelp": "ဤစာရင်းကို ပြမည် သို့မဟုတ် ဖျောက်မည်",
  "shortcuts.toggleSidebar": "ဘေးဘားကို ခေါက်မည် သို့မဟုတ် ပြန်ဖွင့်မည်",
  "shortcuts.escape": "ဤဒိုင်ယာလော့ သို့မဟုတ် လက်ရှိ ဝင်းဒိုးကို ပိတ်မည်",
  "shortcuts.searchNote":
    "ရှာဖွေမှုကွက်လပ်များတွင် တည်းဖြတ်ရန် ကီးဘုတ်ကို ဆက်လက် အသုံးပြုနိုင်သည်။ ရိုက်ထားသည်ကို ဖျက်ရန် ရှာဖွေမှုကွက်လပ်အတွင်းတွင် {key} ကို နှိပ်ပါ။",

  "track.play": "{title} ကို ဖွင့်မည်",
  "track.pause": "{title} ကို ခဏရပ်မည်",
  "track.connecting": "{title} သို့ ချိတ်ဆက်နေသည်",
  "track.menu": "တရားတော် လုပ်ဆောင်ချက်များ",
  "track.enqueue": "အစဉ်ထည့်မည်",
  "track.favorite.add": "အနှစ်သက်ဆုံးများ ထည့်မည်",
  "track.favorite.remove": "အနှစ်သက်ဆုံးများမှ ဖယ်မည်",
  "track.download.add": "အင်တာနက်မလို နားထောင်ရန် ဒေါင်းလုပ် ဆွဲမည်",
  "track.download.remove": "ဒေါင်းလုပ်များမှ ဖယ်မည်",
  "track.download.progress": "ဒေါင်းလုပ် ဆွဲနေသည်",
  "track.download.progress.label": "ဒေါင်းလုပ် ဆွဲနေသည်",
  "track.download.progress.percent": "{percent} ရာခိုင်နှုန်း ဒေါင်းလုပ် ဆွဲပြီး",
  "track.badge.video": "ဗီဒီယို",
  "track.badge.wma": "WMA ဖွင့်မရ",
  "track.badge.unavailable": "ရင်းမြစ် မရနိုင်",
  "track.language.myanmar": "မြန်မာ",
  "track.language.english": "အင်္ဂလိပ်",
  "track.language.unknown": "ဘာသာစကား",
  "track.format": "ပုံစံ",
  "track.resumeAt": "{time} တွင် ပြန်စမည်",

  "progress.loadMore": "နောက်ထပ် {count} ခု ထပ်ပြမည်",
  "progress.loading": "တင်နေသည်…",
  "progress.showing": "{noun} {total} ခုအနက် {shown} ခု ပြထားသည်",
  "progress.pagination": "{noun} စာမျက်နှာသွားလာမှု",

  "async.loading": "အကြောင်းအရာ တင်နေသည်",
  "async.error.title": "ဤစာမျက်နှာကို ထပ်မံ ကြိုးစားရန် လိုအပ်သည်",
  "async.retry": "ထပ်ကြိုးစားကြည့်မည်",

  "video.nowPlaying": "ဖွင့်နေသည် · ဗီဒီယို",
  "video.close": "ပိတ်မည်",
  "video.closePlayer": "ဗီဒီယို player ကို ပိတ်မည်",
  "video.preparing": "ဗီဒီယို ပြင်ဆင်နေသည်",
  "video.preparing.detail": "ဖွင့်ခြမီ အသံတိတ်ဆိတ် ခဏလေးပါ",
  "video.preparing.label": "ဗီဒီယို ပြင်ဆင်နေသည်",
  "video.loading": "ဗီဒီယို တင်နေသည်…",
  "video.hint": "Space − ရပ် · ←/→ − ရှေ့/နောက်",
  "video.fullscreen.enter": "မျက်နှာပြင်အပြည့် ကြည့်မည်",
  "video.fullscreen.exit": "မျက်နှာပြင်အပြည့်မှ ထွက်မည်",
  "video.fullscreen.exit.short": "ထွက်မည်",
  "video.fullscreen.enter.short": "အပြည့်ကြည့်မည်",
  "video.controls": "ဗီဒီယို ထိန်းချုပ်ခလုတ်များ",
  "video.queue.show": "အစဉ်စာရင်း ကြည့်မည်",
  "video.pauseLoading": "ဗီဒီယို တင်ခြင်းကို ခဏရပ်မည်",
  "video.pause": "ဗီဒီယို ခဏရပ်မည်",
  "video.play": "ဗီဒီယို ဖွင့်မည်",

  "error.media.untrusted": "ဤမီဒီယာ ရင်းမြစ်ကို ယုံကြည်မရပါ။",
  "error.media.unsupported": "ဤမီဒီယာ ဖော်မက်ကို macOS player မှ ပံ့ပိုးမထားပါ။",
  "error.video.start": "ဗီဒီယိုကို စဖွင့်မရပါ။",
  "error.audio.start": "အသံကို စဖွင့်မရပါ။",
  "error.video.unavailable": "ဗီဒီယိုကို Dhamma Download မှ မရနိုင်ပါ။",
  "error.audio.unavailable": "အသံကို Dhamma Download မှ မရနိုင်ပါ။",
  "error.catalogue.unavailable": "စာရင်းဇယားကို မရနိုင်ပါ။",
  "error.catalogue.load": "စာရင်းဇယားကို မတင်နိုင်ပါ။",

  "noun.talks": "တရားတော်",
  "noun.collections": "စုစည်းမှု",
  "noun.teachers": "ဆရာတော်"
};

const dictionaries: Record<AppLocale, Partial<Record<MessageKey, string>>> = {
  "en-US": en,
  "my-MM": my
};

/** Interpolates `{name}` placeholders; numbers are formatted per locale. */
export function t(
  locale: AppLocale,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const template = dictionaries[locale][key] ?? en[key] ?? key;
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/gu, (match, name: string) => {
    const value = vars[name];
    if (value === undefined) return match;
    return typeof value === "number" ? formatLocaleNumber(value, locale) : value;
  });
}

/** Full locale dictionaries, exposed for completeness checks in tests. */
export function dictionaryKeys(locale: AppLocale): MessageKey[] {
  return Object.keys(dictionaries[locale]) as MessageKey[];
}

export function sourceKeyCount(): number {
  return Object.keys(en).length;
}

/** Plural-aware count phrase, e.g. "1 talk" / "2 talks" / "တရားတော် ၂ ခု". */
const countPhrases = {
  talk: {
    en: ["{count} talk", "{count} talks"],
    my: "တရားတော် {count} ခု"
  },
  downloadedTalk: {
    en: ["{count} downloaded talk", "{count} downloaded talks"],
    my: "ဒေါင်းလုပ် ဆွဲထားသော တရားတော် {count} ခု"
  },
  savedTalk: {
    en: ["{count} saved talk", "{count} saved talks"],
    my: "သိမ်းထားသော တရားတော် {count} ခု"
  },
  savedTalkAre: {
    en: ["{count} saved talk is", "{count} saved talks are"],
    my: "သိမ်းထားသော တရားတော် {count} ခုသည်"
  },
  collection: {
    en: ["{count} collection", "{count} collections"],
    my: "စုစည်းမှု {count} ခု"
  },
  teacher: {
    en: ["{count} teacher", "{count} teachers"],
    my: "ဆရာတော် {count} ပါး"
  }
} as const;

export type CountKind = keyof typeof countPhrases;

export function countLabel(locale: AppLocale, kind: CountKind, count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const formatted = formatLocaleNumber(safe, locale);
  const phrase = countPhrases[kind];
  const template = locale === "my-MM" ? phrase.my : safe === 1 ? phrase.en[0] : phrase.en[1];
  return template.replace("{count}", formatted);
}

/** Route eyebrow/title/detail in the active locale. */
export function routeLabels(
  route: Route,
  locale: AppLocale
): { eyebrow: string; title: string; detail: string } {
  const keys: Record<Route, [MessageKey, MessageKey, MessageKey]> = {
    home: ["route.home.eyebrow", "route.home.title", "route.home.detail"],
    explore: ["route.explore.eyebrow", "route.explore.title", "route.explore.detail"],
    collections: [
      "route.collections.eyebrow",
      "route.collections.title",
      "route.collections.detail"
    ],
    "collection-detail": [
      "route.collection-detail.eyebrow",
      "route.collection-detail.title",
      "route.collection-detail.detail"
    ],
    teachers: ["route.teachers.eyebrow", "route.teachers.title", "route.teachers.detail"],
    "teacher-detail": [
      "route.teacher-detail.eyebrow",
      "route.teacher-detail.title",
      "route.teacher-detail.detail"
    ],
    library: ["route.library.eyebrow", "route.library.title", "route.library.detail"],
    settings: ["route.settings.eyebrow", "route.settings.title", "route.settings.detail"]
  };
  const [eyebrow, title, detail] = keys[route];
  return { eyebrow: t(locale, eyebrow), title: t(locale, title), detail: t(locale, detail) };
}

/** "Back to X" for list routes, generic "Back" for detail routes. */
export function backLabel(locale: AppLocale, returnRoute: Route | undefined): string {
  if (returnRoute === undefined || returnRoute.endsWith("-detail"))
    return t(locale, "back.generic");
  return t(locale, "back.to", { destination: routeLabels(returnRoute, locale).eyebrow });
}

/** Translates known engine/API error messages; unknown text passes through. */
const errorKeyByMessage: Record<string, MessageKey> = {
  "This media source is not trusted.": "error.media.untrusted",
  "This media format is not supported by the macOS player.": "error.media.unsupported",
  "The video could not start.": "error.video.start",
  "The audio stream could not start.": "error.audio.start",
  "The video is unavailable from Dhamma Download.": "error.video.unavailable",
  "The audio stream is unavailable from Dhamma Download.": "error.audio.unavailable",
  "The catalogue is unavailable.": "error.catalogue.unavailable",
  "Unable to load the Dhamma catalogue.": "error.catalogue.load"
};

export function tError(locale: AppLocale, message: string): string {
  const key = errorKeyByMessage[message];
  return key === undefined ? message : t(locale, key);
}

/** BCP-47 language tag for the document root. */
export function documentLanguage(locale: AppLocale): string {
  return locale === "my-MM" ? "my" : "en";
}
