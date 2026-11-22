use std::{
    fs::{self, File},
    io::{BufReader, Read},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, AtomicU64, Ordering},
    },
    time::{Duration, Instant},
};

use gpui::RenderImage;
use image::{Frame, RgbaImage};
use rodio::{Decoder, OutputStream, Sink, Source};
use url::Url;

use super::{PlaybackEvent, VideoFrame};

const VIDEO_WIDTH: u32 = 640;
const VIDEO_HEIGHT: u32 = 360;
const VIDEO_FPS: u32 = 24;

#[derive(Clone)]
enum MediaOrigin {
    Local(PathBuf),
    Remote(Vec<Url>),
}

enum LoadResult {
    Loading,
    ReadyAudio {
        file_path: PathBuf,
        temp_file: bool,
        duration: f64,
    },
    ReadyVideo {
        source: String,
        duration: f64,
    },
    Failed(String),
}

struct VideoWorker {
    video_child: Child,
    audio_child: Option<Child>,
    stop: Arc<AtomicBool>,
}

impl Drop for VideoWorker {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        let _ = self.video_child.kill();
        let _ = self.video_child.wait();
        if let Some(child) = self.audio_child.as_mut() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

pub struct Playback {
    origin: MediaOrigin,
    is_video: bool,
    rate: f32,
    requested_play: bool,
    emitted_end: bool,
    duration: f64,
    position: f64,
    base_position: f64,
    play_started_at: Option<Instant>,
    pending_seek: Option<f64>,
    load_state: Arc<Mutex<LoadResult>>,
    _stream: Option<OutputStream>,
    sink: Option<Sink>,
    loaded_audio_path: Option<PathBuf>,
    temp_audio_file: Option<PathBuf>,
    video_source: Option<String>,
    video_worker: Option<VideoWorker>,
    latest_frame: Arc<Mutex<Option<Arc<RenderImage>>>>,
}

impl Playback {
    pub fn open_remote(
        candidates: Vec<Url>,
        position: f64,
        rate: f32,
        is_video: bool,
    ) -> Option<Self> {
        if candidates.is_empty() {
            return None;
        }
        Some(Self::new_internal(
            MediaOrigin::Remote(candidates),
            position,
            rate,
            is_video,
        ))
    }

    pub fn open_local(path: &Path, position: f64, rate: f32, is_video: bool) -> Option<Self> {
        Some(Self::new_internal(
            MediaOrigin::Local(path.to_path_buf()),
            position,
            rate,
            is_video,
        ))
    }

    fn new_internal(origin: MediaOrigin, position: f64, rate: f32, is_video: bool) -> Self {
        let load_state = Arc::new(Mutex::new(LoadResult::Loading));
        let state_clone = Arc::clone(&load_state);
        let origin_clone = origin.clone();

        std::thread::spawn(move || {
            let result = if is_video {
                prepare_video(&origin_clone)
            } else {
                prepare_audio(&origin_clone)
            };
            if let Ok(mut guard) = state_clone.lock() {
                *guard = result;
            }
        });

        let pos = position.max(0.0);
        Self {
            origin,
            is_video,
            rate: rate.clamp(0.75, 2.0),
            requested_play: false,
            emitted_end: false,
            duration: 0.0,
            position: pos,
            base_position: pos,
            play_started_at: None,
            pending_seek: (pos > 0.0).then_some(pos),
            load_state,
            _stream: None,
            sink: None,
            loaded_audio_path: None,
            temp_audio_file: None,
            video_source: None,
            video_worker: None,
            latest_frame: Arc::new(Mutex::new(None)),
        }
    }

    pub fn play(&mut self) {
        self.requested_play = true;
        self.emitted_end = false;
        if let Some(sink) = &self.sink {
            sink.set_speed(self.rate);
            sink.play();
        }
        if self.is_video && self.video_worker.is_none() && self.video_source.is_some() {
            self.start_video_pipeline(self.position);
        }
        if self.play_started_at.is_none() {
            self.play_started_at = Some(Instant::now());
        }
    }

    pub fn pause(&mut self) {
        self.position = self.current_clock_position();
        self.base_position = self.position;
        self.play_started_at = None;
        self.requested_play = false;
        if let Some(sink) = &self.sink {
            sink.pause();
        }
        if self.is_video {
            self.video_worker = None;
        }
    }

    pub fn wants_playback(&self) -> bool {
        self.requested_play
    }

    pub fn set_rate(&mut self, rate: f32) {
        self.position = self.current_clock_position();
        self.base_position = self.position;
        if self.requested_play {
            self.play_started_at = Some(Instant::now());
        }
        self.rate = rate.clamp(0.75, 2.0);
        if let Some(sink) = &self.sink {
            sink.set_speed(self.rate);
        }
    }

    pub fn seek(&mut self, position: f64) {
        let target = if self.duration > 0.0 {
            position.clamp(0.0, self.duration)
        } else {
            position.max(0.0)
        };
        self.emitted_end = false;
        self.position = target;
        self.base_position = target;
        self.pending_seek = Some(target);
        if self.requested_play {
            self.play_started_at = Some(Instant::now());
        }
        if self.is_video {
            if self.video_source.is_some() {
                self.pending_seek = None;
                if self.requested_play {
                    self.start_video_pipeline(target);
                } else {
                    self.video_worker = None;
                }
            }
        } else if let Some(sink) = &self.sink
            && sink.try_seek(Duration::from_secs_f64(target)).is_ok()
        {
            self.pending_seek = None;
        }
    }

    pub fn duration(&self) -> f64 {
        self.duration
    }

    pub fn position(&self) -> f64 {
        self.current_clock_position()
    }

    pub fn current_frame(&self) -> Option<VideoFrame> {
        self.latest_frame
            .lock()
            .ok()
            .and_then(|guard| guard.clone())
            .map(VideoFrame::Image)
    }

    pub fn is_video(&self) -> bool {
        self.is_video
    }

    fn current_clock_position(&self) -> f64 {
        if let Some(seek) = self.pending_seek {
            return seek;
        }
        if !self.is_video
            && let Some(sink) = &self.sink
        {
            let pos = sink.get_pos().as_secs_f64();
            if pos.is_finite() {
                return pos.max(0.0);
            }
        }
        if let Some(started) = self.play_started_at {
            let elapsed = started.elapsed().as_secs_f64() * f64::from(self.rate);
            let pos = self.base_position + elapsed;
            if self.duration > 0.0 {
                pos.min(self.duration)
            } else {
                pos
            }
        } else {
            self.position
        }
    }

    fn attach_audio_file(
        &mut self,
        file_path: PathBuf,
        temp_file: bool,
        duration: f64,
    ) -> Result<(), String> {
        let (stream, handle) = OutputStream::try_default()
            .map_err(|err| format!("Audio output unavailable: {err}"))?;
        let sink = Sink::try_new(&handle).map_err(|err| format!("Audio sink failed: {err}"))?;
        let file = File::open(&file_path).map_err(|err| err.to_string())?;
        let source = Decoder::new(BufReader::new(file))
            .map_err(|err| format!("Could not decode MP3 audio: {err}"))?;
        let detected = source
            .total_duration()
            .map(|d| d.as_secs_f64())
            .filter(|d| d.is_finite() && *d > 0.0)
            .unwrap_or(duration);
        self.duration = detected;
        sink.append(source);
        sink.set_speed(self.rate);
        if let Some(target) = self.pending_seek.take() {
            let _ = sink.try_seek(Duration::from_secs_f64(target));
        }
        if self.requested_play {
            sink.play();
            self.play_started_at = Some(Instant::now());
        } else {
            sink.pause();
        }
        self._stream = Some(stream);
        self.sink = Some(sink);
        if temp_file {
            self.temp_audio_file = Some(file_path.clone());
        }
        self.loaded_audio_path = Some(file_path);
        Ok(())
    }

    fn start_video_pipeline(&mut self, start_sec: f64) {
        self.video_worker = None;
        let Some(source) = self.video_source.clone() else {
            return;
        };
        let Some(ffmpeg) = find_binary("ffmpeg") else {
            return;
        };
        let vf = format!(
            "scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2,fps={VIDEO_FPS}"
        );
        let mut video_cmd = Command::new(&ffmpeg);
        video_cmd
            .args([
                "-nostdin",
                "-loglevel",
                "error",
                "-re",
                "-ss",
                &format!("{start_sec:.2}"),
                "-i",
                &source,
                "-an",
                "-vf",
                &vf,
                "-f",
                "rawvideo",
                "-pix_fmt",
                "bgra",
                "pipe:1",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            video_cmd.creation_flags(0x0800_0000);
        }
        let Ok(mut video_child) = video_cmd.spawn() else {
            return;
        };
        let Some(mut stdout) = video_child.stdout.take() else {
            let _ = video_child.kill();
            return;
        };

        // Optional audio track decoded to raw s16le stereo 44.1 kHz PCM and played through rodio
        let mut audio_cmd = Command::new(&ffmpeg);
        audio_cmd
            .args([
                "-nostdin",
                "-loglevel",
                "error",
                "-ss",
                &format!("{start_sec:.2}"),
                "-i",
                &source,
                "-vn",
                "-f",
                "s16le",
                "-ac",
                "2",
                "-ar",
                "44100",
                "pipe:1",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            audio_cmd.creation_flags(0x0800_0000);
        }
        let mut audio_child = audio_cmd.spawn().ok();
        if let Some(child) = audio_child.as_mut()
            && let Some(audio_out) = child.stdout.take()
            && let Ok((stream, handle)) = OutputStream::try_default()
            && let Ok(sink) = Sink::try_new(&handle)
        {
            let rate = self.rate;
            sink.append(PcmStreamSource::new(audio_out, 2, 44_100));
            sink.set_speed(rate);
            sink.play();
            self._stream = Some(stream);
            self.sink = Some(sink);
        }

        let stop = Arc::new(AtomicBool::new(false));
        let stop_clone = Arc::clone(&stop);
        let frame_slot = Arc::clone(&self.latest_frame);
        let frame_bytes = (VIDEO_WIDTH * VIDEO_HEIGHT * 4) as usize;
        std::thread::spawn(move || {
            let mut buf = vec![0_u8; frame_bytes];
            while !stop_clone.load(Ordering::Relaxed) {
                if stdout.read_exact(&mut buf).is_err() {
                    break;
                }
                if let Some(img) = RgbaImage::from_raw(VIDEO_WIDTH, VIDEO_HEIGHT, buf.clone()) {
                    let render_image = Arc::new(RenderImage::new(vec![Frame::new(img)]));
                    if let Ok(mut guard) = frame_slot.lock() {
                        *guard = Some(render_image);
                    }
                }
            }
        });

        self.video_worker = Some(VideoWorker {
            video_child,
            audio_child,
            stop,
        });
        self.base_position = start_sec;
        self.play_started_at = Some(Instant::now());
    }

    pub fn update(&mut self) -> PlaybackEvent {
        let ready_action = self
            .load_state
            .lock()
            .ok()
            .map(|mut guard| std::mem::replace(&mut *guard, LoadResult::Loading));

        match ready_action {
            Some(LoadResult::ReadyAudio {
                file_path,
                temp_file,
                duration,
            }) => {
                if let Err(err) = self.attach_audio_file(file_path, temp_file, duration) {
                    self.requested_play = false;
                    return PlaybackEvent::Failed(err);
                }
            }
            Some(LoadResult::ReadyVideo { source, duration }) => {
                self.video_source = Some(source);
                self.duration = duration;
                let start = self.pending_seek.take().unwrap_or(self.position);
                if self.requested_play {
                    self.start_video_pipeline(start);
                }
            }
            Some(LoadResult::Failed(message)) => {
                self.requested_play = false;
                return PlaybackEvent::Failed(message);
            }
            Some(LoadResult::Loading) | None => {}
        }

        let is_ready = if self.is_video {
            self.video_source.is_some()
        } else {
            self.sink.is_some()
        };

        if !is_ready {
            return if self.requested_play {
                PlaybackEvent::Buffering
            } else {
                PlaybackEvent::Paused
            };
        }

        if !self.is_video
            && let Some(sink) = &self.sink
            && self.requested_play
            && !self.emitted_end
            && sink.empty()
        {
            self.requested_play = false;
            self.emitted_end = true;
            return PlaybackEvent::Ended;
        }

        if self.is_video && self.requested_play && !self.emitted_end && self.duration > 0.5 {
            let pos = self.current_clock_position();
            if pos >= self.duration - 0.35 {
                self.requested_play = false;
                self.emitted_end = true;
                self.video_worker = None;
                return PlaybackEvent::Ended;
            }
        }

        let _ = &self.origin;
        if self.requested_play {
            PlaybackEvent::Playing
        } else {
            PlaybackEvent::Paused
        }
    }
}

impl Drop for Playback {
    fn drop(&mut self) {
        self.video_worker = None;
        if let Some(sink) = self.sink.take() {
            sink.stop();
        }
        if let Some(path) = self.temp_audio_file.take() {
            let _ = fs::remove_file(path);
        }
    }
}

fn prepare_audio(origin: &MediaOrigin) -> LoadResult {
    match origin {
        MediaOrigin::Local(path) => {
            if !path.is_file() {
                return LoadResult::Failed("The downloaded audio file is missing.".to_string());
            }
            LoadResult::ReadyAudio {
                file_path: path.clone(),
                temp_file: false,
                duration: 0.0,
            }
        }
        MediaOrigin::Remote(candidates) => {
            static SEQ: AtomicU64 = AtomicU64::new(0);
            let client = match reqwest::blocking::Client::builder()
                .connect_timeout(Duration::from_secs(12))
                .timeout(Duration::from_secs(300))
                .build()
            {
                Ok(c) => c,
                Err(err) => return LoadResult::Failed(err.to_string()),
            };
            for url in candidates {
                let Ok(mut resp) = client.get(url.clone()).send() else {
                    continue;
                };
                if !resp.status().is_success() {
                    continue;
                }
                let seq = SEQ.fetch_add(1, Ordering::Relaxed);
                let tmp = std::env::temp_dir().join(format!(
                    "dhamma-echo-stream-{}-{seq}.mp3",
                    std::process::id()
                ));
                let Ok(mut file) = File::create(&tmp) else {
                    continue;
                };
                if std::io::copy(&mut resp, &mut file).is_ok() {
                    return LoadResult::ReadyAudio {
                        file_path: tmp,
                        temp_file: true,
                        duration: 0.0,
                    };
                }
                let _ = fs::remove_file(&tmp);
            }
            LoadResult::Failed("The audio stream is unavailable from Dhamma Download.".to_string())
        }
    }
}

fn prepare_video(origin: &MediaOrigin) -> LoadResult {
    if find_binary("ffmpeg").is_none() {
        return LoadResult::Failed(
            "Install ffmpeg on PATH to play MP4 video on this platform.".to_string(),
        );
    }
    let source = match origin {
        MediaOrigin::Local(path) => path.to_string_lossy().into_owned(),
        MediaOrigin::Remote(candidates) => {
            let client = reqwest::blocking::Client::builder()
                .connect_timeout(Duration::from_secs(8))
                .timeout(Duration::from_secs(12))
                .build()
                .ok();
            let chosen = candidates.iter().find(|url| {
                client
                    .as_ref()
                    .and_then(|c| c.head((*url).clone()).send().ok())
                    .is_some_and(|r| r.status().is_success())
            });
            chosen
                .or_else(|| candidates.first())
                .map(|u| u.as_str().to_string())
                .unwrap_or_default()
        }
    };
    if source.is_empty() {
        return LoadResult::Failed("The video is unavailable from Dhamma Download.".to_string());
    }
    let duration = probe_duration(&source).unwrap_or(0.0);
    LoadResult::ReadyVideo { source, duration }
}

fn probe_duration(source: &str) -> Option<f64> {
    let ffprobe = find_binary("ffprobe")?;
    let mut cmd = Command::new(ffprobe);
    cmd.args([
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        source,
    ]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }
    let out = cmd.output().ok()?;
    let text = String::from_utf8_lossy(&out.stdout);
    text.trim()
        .parse::<f64>()
        .ok()
        .filter(|d| d.is_finite() && *d > 0.0)
}

fn find_binary(name: &str) -> Option<PathBuf> {
    let exe_name = if cfg!(target_os = "windows") {
        format!("{name}.exe")
    } else {
        name.to_string()
    };
    if let Ok(exe) = std::env::current_exe()
        && let Some(dir) = exe.parent()
    {
        let adjacent = dir.join(&exe_name);
        if adjacent.is_file() {
            return Some(adjacent);
        }
    }
    let path_var = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path_var) {
        let candidate = dir.join(&exe_name);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

struct PcmStreamSource<R: Read + Send + 'static> {
    reader: BufReader<R>,
    channels: u16,
    sample_rate: u32,
}

impl<R: Read + Send + 'static> PcmStreamSource<R> {
    fn new(reader: R, channels: u16, sample_rate: u32) -> Self {
        Self {
            reader: BufReader::new(reader),
            channels,
            sample_rate,
        }
    }
}

impl<R: Read + Send + 'static> Iterator for PcmStreamSource<R> {
    type Item = i16;

    fn next(&mut self) -> Option<Self::Item> {
        let mut bytes = [0_u8; 2];
        self.reader
            .read_exact(&mut bytes)
            .ok()
            .map(|()| i16::from_le_bytes(bytes))
    }
}

impl<R: Read + Send + 'static> Source for PcmStreamSource<R> {
    fn current_frame_len(&self) -> Option<usize> {
        None
    }

    fn channels(&self) -> u16 {
        self.channels
    }

    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn total_duration(&self) -> Option<Duration> {
        None
    }
}
