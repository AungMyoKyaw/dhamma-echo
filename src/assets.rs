use std::borrow::Cow;

use gpui::{AssetSource, SharedString};

pub struct NativeAssets;

macro_rules! embedded {
    ($path:literal) => {
        Cow::Borrowed(include_bytes!(concat!("../assets/", $path)) as &'static [u8])
    };
}

impl AssetSource for NativeAssets {
    fn load(&self, path: &str) -> anyhow::Result<Option<Cow<'static, [u8]>>> {
        let asset = match path {
            "logo.svg" => embedded!("logo.svg"),
            "logo.png" => embedded!("logo.png"),
            "assets/brand.png" => embedded!("brand.png"),
            "icons/backward15.svg" => embedded!("icons/backward15.svg"),
            "icons/book.svg" => embedded!("icons/book.svg"),
            "icons/bookmark.svg" => embedded!("icons/bookmark.svg"),
            "icons/chevron-down.svg" => embedded!("icons/chevron-down.svg"),
            "icons/chevron-left.svg" => embedded!("icons/chevron-left.svg"),
            "icons/chevron-right.svg" => embedded!("icons/chevron-right.svg"),
            "icons/close.svg" => embedded!("icons/close.svg"),
            "icons/download.svg" => embedded!("icons/download.svg"),
            "icons/exit-fullscreen.svg" => embedded!("icons/exit-fullscreen.svg"),
            "icons/explore.svg" => embedded!("icons/explore.svg"),
            "icons/forward15.svg" => embedded!("icons/forward15.svg"),
            "icons/fullscreen.svg" => embedded!("icons/fullscreen.svg"),
            "icons/heart.svg" => embedded!("icons/heart.svg"),
            "icons/heart-filled.svg" => embedded!("icons/heart-filled.svg"),
            "icons/home.svg" => embedded!("icons/home.svg"),
            "icons/leaf.svg" => embedded!("icons/leaf.svg"),
            "icons/library.svg" => embedded!("icons/library.svg"),
            "icons/more.svg" => embedded!("icons/more.svg"),
            "icons/next.svg" => embedded!("icons/next.svg"),
            "icons/pause.svg" => embedded!("icons/pause.svg"),
            "icons/play.svg" => embedded!("icons/play.svg"),
            "icons/queue.svg" => embedded!("icons/queue.svg"),
            "icons/search.svg" => embedded!("icons/search.svg"),
            "icons/settings.svg" => embedded!("icons/settings.svg"),
            "icons/teachers.svg" => embedded!("icons/teachers.svg"),
            "teachers/8.svg" => embedded!("teachers/8.svg"),
            "teachers/8.png" => embedded!("teachers/8.png"),
            "teachers/16.svg" => embedded!("teachers/16.svg"),
            "teachers/16.png" => embedded!("teachers/16.png"),
            "teachers/40.svg" => embedded!("teachers/40.svg"),
            "teachers/40.png" => embedded!("teachers/40.png"),
            "teachers/42.svg" => embedded!("teachers/42.svg"),
            "teachers/42.png" => embedded!("teachers/42.png"),
            "teachers/53.svg" => embedded!("teachers/53.svg"),
            "teachers/53.png" => embedded!("teachers/53.png"),
            "teachers/55.svg" => embedded!("teachers/55.svg"),
            "teachers/55.png" => embedded!("teachers/55.png"),
            "teachers/61.svg" => embedded!("teachers/61.svg"),
            "teachers/61.png" => embedded!("teachers/61.png"),
            "teachers/1307.svg" => embedded!("teachers/1307.svg"),
            "teachers/1307.png" => embedded!("teachers/1307.png"),
            _ => return Ok(None),
        };
        Ok(Some(asset))
    }

    fn list(&self, _path: &str) -> anyhow::Result<Vec<SharedString>> {
        Ok(Vec::new())
    }
}
