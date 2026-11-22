use std::path::{Path, PathBuf};

pub const TAURI_IDENTIFIER: &str = "com.aungmyokyaw.dhammaecho";

pub fn native_data_dir() -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    {
        let home = std::env::var_os("HOME").ok_or_else(|| "HOME is unavailable".to_string())?;
        Ok(PathBuf::from(home).join("Library/Application Support/Dhamma Echo Native"))
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            return Ok(PathBuf::from(appdata).join("Dhamma Echo Native"));
        }
        let profile = std::env::var_os("USERPROFILE")
            .ok_or_else(|| "APPDATA and USERPROFILE are unavailable".to_string())?;
        Ok(PathBuf::from(profile).join("AppData/Roaming/Dhamma Echo Native"))
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        if let Some(xdg) = std::env::var_os("XDG_DATA_HOME")
            && !xdg.is_empty()
        {
            return Ok(PathBuf::from(xdg).join("dhamma-echo-native"));
        }
        let home = std::env::var_os("HOME").ok_or_else(|| "HOME is unavailable".to_string())?;
        Ok(PathBuf::from(home).join(".local/share/dhamma-echo-native"))
    }
}

pub fn tauri_app_data_dir() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        Some(
            PathBuf::from(std::env::var_os("HOME")?)
                .join("Library/Application Support")
                .join(TAURI_IDENTIFIER),
        )
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            return Some(PathBuf::from(appdata).join(TAURI_IDENTIFIER));
        }
        Some(
            PathBuf::from(std::env::var_os("USERPROFILE")?)
                .join("AppData/Roaming")
                .join(TAURI_IDENTIFIER),
        )
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        if let Some(xdg) = std::env::var_os("XDG_DATA_HOME")
            && !xdg.is_empty()
        {
            return Some(PathBuf::from(xdg).join(TAURI_IDENTIFIER));
        }
        Some(
            PathBuf::from(std::env::var_os("HOME")?)
                .join(".local/share")
                .join(TAURI_IDENTIFIER),
        )
    }
}

pub fn tauri_webkit_dir() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        Some(
            PathBuf::from(std::env::var_os("HOME")?)
                .join("Library/WebKit")
                .join(TAURI_IDENTIFIER),
        )
    }
    #[cfg(not(target_os = "macos"))]
    {
        None
    }
}

pub fn bundled_catalogue_candidates(exe_dir: &Path) -> Vec<PathBuf> {
    vec![
        exe_dir.join("../Resources/dhamma.db"),
        exe_dir.join("resources/dhamma.db"),
        exe_dir.join("../share/dhamma-echo/dhamma.db"),
        exe_dir.join("dhamma.db"),
    ]
}

pub fn primary_modifier_label() -> &'static str {
    if cfg!(target_os = "macos") {
        "⌘"
    } else {
        "Ctrl"
    }
}

pub fn uses_overlay_titlebar() -> bool {
    cfg!(target_os = "macos")
}

pub fn hides_on_window_close() -> bool {
    cfg!(target_os = "macos")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_platform_dirs_and_catalogue_candidates() {
        let dir = native_data_dir().expect("native data dir");
        assert!(!dir.as_os_str().is_empty());
        let candidates = bundled_catalogue_candidates(Path::new("/opt/dhamma-echo/bin"));
        assert!(candidates.iter().any(|p| p.ends_with("dhamma.db")));
        assert!(!primary_modifier_label().is_empty());
    }
}
