use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::Duration,
};

use url::Url;

#[derive(Debug, Clone)]
pub enum DownloadJobState {
    InProgress { downloaded: u64, total: Option<u64> },
    Completed { path: PathBuf },
    Failed { message: String },
}

#[derive(Clone, Default)]
pub struct DownloadManager {
    jobs: Arc<Mutex<HashMap<i64, DownloadJobState>>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn snapshot(&self) -> HashMap<i64, DownloadJobState> {
        self.jobs
            .lock()
            .map(|guard| guard.clone())
            .unwrap_or_default()
    }

    pub fn clear_terminal(&self, talk_id: i64) {
        if let Ok(mut guard) = self.jobs.lock()
            && !matches!(
                guard.get(&talk_id),
                Some(DownloadJobState::InProgress { .. })
            )
        {
            guard.remove(&talk_id);
        }
    }

    pub fn start_download(
        &self,
        talk_id: i64,
        candidates: Vec<Url>,
        downloads_dir: PathBuf,
    ) -> Result<(), String> {
        let valid_candidates: Vec<Url> = candidates
            .into_iter()
            .filter_map(|url| validate_download_url(talk_id, url.as_str()).ok())
            .collect();
        if valid_candidates.is_empty() {
            return Err("Only approved HTTPS MP3 sources can be downloaded.".to_string());
        }

        {
            let mut guard = self
                .jobs
                .lock()
                .map_err(|_| "Download state lock poisoned.".to_string())?;
            if matches!(
                guard.get(&talk_id),
                Some(DownloadJobState::InProgress { .. })
            ) {
                return Ok(());
            }
            guard.insert(
                talk_id,
                DownloadJobState::InProgress {
                    downloaded: 0,
                    total: None,
                },
            );
        }

        let jobs = Arc::clone(&self.jobs);
        std::thread::spawn(move || {
            let result = download_with_fallback(talk_id, &valid_candidates, &downloads_dir, &jobs);
            if let Ok(mut guard) = jobs.lock() {
                match result {
                    Ok(path) => {
                        guard.insert(talk_id, DownloadJobState::Completed { path });
                    }
                    Err(message) => {
                        guard.insert(talk_id, DownloadJobState::Failed { message });
                    }
                }
            }
        });
        Ok(())
    }
}

pub fn validate_download_url(id: i64, raw_url: &str) -> Result<Url, String> {
    if id <= 0 {
        return Err("Audio id must be positive.".to_string());
    }
    let parsed = Url::parse(raw_url).map_err(|error| error.to_string())?;
    if parsed.scheme() != "https"
        || !matches!(
            parsed.host_str(),
            Some("dhammadownload.com" | "www.dhammadownload.com")
        )
        || !parsed.path().to_ascii_lowercase().ends_with(".mp3")
        || !parsed.username().is_empty()
        || parsed.password().is_some()
        || parsed.port().is_some()
    {
        return Err("Only approved HTTPS MP3 sources can be downloaded.".to_string());
    }
    Ok(parsed)
}

pub fn remove_download_file(
    talk_id: i64,
    path: &Path,
    allowed_dirs: &[PathBuf],
) -> Result<(), String> {
    if talk_id <= 0 {
        return Err("Audio id must be positive.".to_string());
    }
    let expected_name = format!("favorite-{talk_id}.mp3");
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or_default();
    if file_name != expected_name {
        return Err("Refusing to remove unexpected download filename.".to_string());
    }
    let parent = path
        .parent()
        .ok_or_else(|| "Invalid download path.".to_string())?;
    let in_allowed_dir = allowed_dirs.iter().any(|dir| {
        if parent == dir {
            return true;
        }
        match (fs::canonicalize(parent), fs::canonicalize(dir)) {
            (Ok(a), Ok(b)) => a == b,
            _ => false,
        }
    });
    if !in_allowed_dir {
        return Err("Refusing to remove file outside download directories.".to_string());
    }
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

fn download_with_fallback(
    talk_id: i64,
    candidates: &[Url],
    downloads_dir: &Path,
    jobs: &Arc<Mutex<HashMap<i64, DownloadJobState>>>,
) -> Result<PathBuf, String> {
    fs::create_dir_all(downloads_dir).map_err(|error| error.to_string())?;
    let final_path = downloads_dir.join(format!("favorite-{talk_id}.mp3"));
    let part_path = downloads_dir.join(format!("favorite-{talk_id}.mp3.part"));
    let client = reqwest::blocking::Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|error| error.to_string())?;

    let mut last_error = "The audio stream is unavailable from Dhamma Download.".to_string();
    for url in candidates {
        let _ = fs::remove_file(&part_path);
        match download_single(&client, talk_id, url, &part_path, &final_path, jobs) {
            Ok(path) => return Ok(path),
            Err(error) => {
                let _ = fs::remove_file(&part_path);
                last_error = error;
            }
        }
    }
    Err(last_error)
}

fn download_single(
    client: &reqwest::blocking::Client,
    talk_id: i64,
    url: &Url,
    part_path: &Path,
    final_path: &Path,
    jobs: &Arc<Mutex<HashMap<i64, DownloadJobState>>>,
) -> Result<PathBuf, String> {
    let mut response = client
        .get(url.clone())
        .send()
        .map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("server returned {}", response.status()));
    }
    let total = response.content_length();
    let mut file = fs::File::create(part_path).map_err(|error| error.to_string())?;
    let mut downloaded = 0_u64;
    let mut buffer = [0_u8; 32 * 1024];
    loop {
        let read = response
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if read == 0 {
            break;
        }
        file.write_all(&buffer[..read])
            .map_err(|error| error.to_string())?;
        downloaded += read as u64;
        if let Ok(mut guard) = jobs.lock() {
            guard.insert(talk_id, DownloadJobState::InProgress { downloaded, total });
        }
    }
    file.flush().map_err(|error| error.to_string())?;
    drop(file);
    fs::rename(part_path, final_path).map_err(|error| error.to_string())?;
    Ok(final_path.to_path_buf())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_only_approved_https_mp3_sources() {
        assert!(validate_download_url(7, "https://dhammadownload.com/talk.mp3").is_ok());
        assert!(validate_download_url(7, "https://www.dhammadownload.com/talk.MP3").is_ok());
        assert!(validate_download_url(0, "https://dhammadownload.com/talk.mp3").is_err());
        assert!(validate_download_url(7, "http://dhammadownload.com/talk.mp3").is_err());
        assert!(validate_download_url(7, "https://dhammadownload.com/talk.wma").is_err());
        assert!(validate_download_url(7, "https://dhammadownload.com.evil.test/talk.mp3").is_err());
    }

    #[test]
    fn enforces_safe_download_file_removal() {
        let dir = std::env::temp_dir().join(format!("de-dl-test-{}", std::process::id()));
        fs::create_dir_all(&dir).expect("create temp dir");
        let file = dir.join("favorite-42.mp3");
        fs::write(&file, b"mp3").expect("write dummy");
        let wrong_name = dir.join("other.mp3");
        fs::write(&wrong_name, b"mp3").expect("write other");

        assert!(remove_download_file(42, &wrong_name, std::slice::from_ref(&dir)).is_err());
        assert!(remove_download_file(42, &file, &[PathBuf::from("/tmp/nowhere")]).is_err());
        assert!(remove_download_file(42, &file, std::slice::from_ref(&dir)).is_ok());
        assert!(!file.exists());
        let _ = fs::remove_dir_all(&dir);
    }
}
