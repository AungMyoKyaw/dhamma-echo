use std::{
    path::Path,
    time::{Duration, Instant},
};

use core_foundation::base::TCFType;
use core_video::pixel_buffer::{
    CVPixelBuffer, CVPixelBufferRef, kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
};
use objc2::{AnyThread, MainThreadMarker, rc::Retained, runtime::AnyObject};
use objc2_av_foundation::{
    AVPlayer, AVPlayerItem, AVPlayerItemOutput, AVPlayerItemStatus, AVPlayerItemVideoOutput,
    AVPlayerTimeControlStatus,
};
use objc2_core_media::CMTime;
use objc2_foundation::{NSDictionary, NSNumber, NSString, NSURL};
use url::Url;

use super::{PlaybackEvent, VideoFrame};

const CANDIDATE_TIMEOUT: Duration = Duration::from_secs(8);

pub struct Playback {
    player: Retained<AVPlayer>,
    candidates: Vec<Url>,
    candidate_index: usize,
    is_local: bool,
    is_video: bool,
    rate: f32,
    pending_seek: Option<f64>,
    requested_play: bool,
    emitted_end: bool,
    load_started_at: Option<Instant>,
    video_output: Option<Retained<AVPlayerItemVideoOutput>>,
    latest_frame: Option<CVPixelBuffer>,
}

impl Playback {
    pub fn open_remote(
        candidates: Vec<Url>,
        position: f64,
        rate: f32,
        is_video: bool,
    ) -> Option<Self> {
        let first = candidates.first()?;
        let ns_url = NSURL::URLWithString(&NSString::from_str(first.as_str()))?;
        Self::open_nsurl(&ns_url, candidates, false, position, rate, is_video)
    }

    pub fn open_local(path: &Path, position: f64, rate: f32, is_video: bool) -> Option<Self> {
        let ns_path = NSString::from_str(&path.to_string_lossy());
        let ns_url = NSURL::fileURLWithPath(&ns_path);
        Self::open_nsurl(&ns_url, Vec::new(), true, position, rate, is_video)
    }

    fn open_nsurl(
        url: &NSURL,
        candidates: Vec<Url>,
        is_local: bool,
        position: f64,
        rate: f32,
        is_video: bool,
    ) -> Option<Self> {
        let main = MainThreadMarker::new()?;
        let item = unsafe { AVPlayerItem::playerItemWithURL(url, main) };
        let video_output = if is_video {
            attach_video_output(&item)
        } else {
            None
        };
        let player = unsafe { AVPlayer::playerWithPlayerItem(Some(&item), main) };
        Some(Self {
            player,
            candidates,
            candidate_index: 0,
            is_local,
            is_video,
            rate: rate.clamp(0.75, 2.0),
            pending_seek: (position > 0.0).then_some(position),
            requested_play: false,
            emitted_end: false,
            load_started_at: Some(Instant::now()),
            video_output,
            latest_frame: None,
        })
    }

    pub fn play(&mut self) {
        self.requested_play = true;
        self.emitted_end = false;
        if self.load_started_at.is_none() {
            self.load_started_at = Some(Instant::now());
        }
        if self.pending_seek.is_none() {
            unsafe { self.player.setRate(self.rate) };
        }
    }

    pub fn pause(&mut self) {
        self.requested_play = false;
        unsafe { self.player.pause() };
    }

    pub fn wants_playback(&self) -> bool {
        self.requested_play
    }

    pub fn set_rate(&mut self, rate: f32) {
        self.rate = rate.clamp(0.75, 2.0);
        if self.requested_play && self.pending_seek.is_none() {
            unsafe { self.player.setRate(self.rate) };
        }
    }

    pub fn seek(&mut self, position: f64) {
        self.emitted_end = false;
        self.pending_seek = Some(position.max(0.0));
        self.apply_seek();
    }

    fn apply_seek(&mut self) {
        let Some(position) = self.pending_seek else {
            return;
        };
        if let Some(item) = unsafe { self.player.currentItem() }
            && unsafe { item.status() } == AVPlayerItemStatus::ReadyToPlay
        {
            let duration = unsafe { item.duration().seconds() };
            let position = if duration.is_finite() && duration > 0.0 {
                position.min(duration)
            } else {
                position
            };
            let time = unsafe { CMTime::new((position * 1000.0) as i64, 1000) };
            let tolerance = unsafe { CMTime::new(100, 1000) };
            unsafe {
                self.player
                    .seekToTime_toleranceBefore_toleranceAfter(time, tolerance, tolerance)
            };
            self.pending_seek = None;
            if self.requested_play {
                unsafe { self.player.setRate(self.rate) };
            }
        }
    }

    pub fn duration(&self) -> f64 {
        unsafe { self.player.currentItem() }
            .map(|item| {
                let duration = unsafe { item.duration().seconds() };
                if duration.is_finite() && duration > 0.0 {
                    duration
                } else {
                    unsafe { item.asset().duration().seconds() }
                }
            })
            .filter(|duration| duration.is_finite() && *duration > 0.0)
            .unwrap_or(0.0)
    }

    pub fn position(&self) -> f64 {
        self.pending_seek.unwrap_or_else(|| {
            let position = unsafe { self.player.currentTime().seconds() };
            if position.is_finite() {
                position.max(0.0)
            } else {
                0.0
            }
        })
    }

    pub fn current_frame(&self) -> Option<VideoFrame> {
        self.latest_frame.clone().map(VideoFrame::Surface)
    }

    pub fn is_video(&self) -> bool {
        self.is_video
    }

    fn poll_video_frame(&mut self) -> bool {
        if !self.is_video {
            return false;
        }
        let Some(output) = &self.video_output else {
            return false;
        };
        let time = unsafe { self.player.currentTime() };
        if !unsafe { output.hasNewPixelBufferForItemTime(time) } {
            return false;
        }
        let copied = unsafe {
            output.copyPixelBufferForItemTime_itemTimeForDisplay(time, std::ptr::null_mut())
        };
        let Some(objc_buffer) = copied else {
            return false;
        };
        let raw = Retained::into_raw(objc_buffer) as CVPixelBufferRef;
        let buffer = unsafe { <CVPixelBuffer as TCFType>::wrap_under_create_rule(raw) };
        if buffer.get_pixel_format() == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange {
            self.latest_frame = Some(buffer);
            true
        } else {
            false
        }
    }

    fn try_next_candidate(&mut self) -> bool {
        if self.is_local || self.candidate_index + 1 >= self.candidates.len() {
            return false;
        }
        self.candidate_index += 1;
        let Some(url) = self.candidates.get(self.candidate_index) else {
            return false;
        };
        let Some(ns_url) = NSURL::URLWithString(&NSString::from_str(url.as_str())) else {
            return false;
        };
        let Some(main) = MainThreadMarker::new() else {
            return false;
        };
        let item = unsafe { AVPlayerItem::playerItemWithURL(&ns_url, main) };
        self.video_output = if self.is_video {
            attach_video_output(&item)
        } else {
            None
        };
        unsafe { self.player.replaceCurrentItemWithPlayerItem(Some(&item)) };
        self.load_started_at = Some(Instant::now());
        if self.requested_play && self.pending_seek.is_none() {
            unsafe { self.player.setRate(self.rate) };
        }
        true
    }

    pub fn update(&mut self) -> PlaybackEvent {
        if let Some(error) = unsafe { self.player.error() }.or_else(|| {
            unsafe { self.player.currentItem() }.and_then(|item| unsafe { item.error() })
        }) {
            if self.try_next_candidate() {
                return PlaybackEvent::Buffering;
            }
            self.pause();
            let msg = if self.is_video {
                "The video is unavailable from Dhamma Download.".to_string()
            } else {
                let desc = error.localizedDescription().to_string();
                if desc.is_empty() {
                    "The audio stream is unavailable from Dhamma Download.".to_string()
                } else {
                    desc
                }
            };
            return PlaybackEvent::Failed(msg);
        }

        let item_status = unsafe { self.player.currentItem() }
            .map(|item| unsafe { item.status() })
            .unwrap_or(AVPlayerItemStatus::Unknown);

        if item_status == AVPlayerItemStatus::Failed {
            if self.try_next_candidate() {
                return PlaybackEvent::Buffering;
            }
            self.pause();
            return PlaybackEvent::Failed(if self.is_video {
                "The video is unavailable from Dhamma Download.".to_string()
            } else {
                "The audio stream is unavailable from Dhamma Download.".to_string()
            });
        }

        if self.requested_play
            && item_status != AVPlayerItemStatus::ReadyToPlay
            && let Some(started) = self.load_started_at
            && started.elapsed() >= CANDIDATE_TIMEOUT
        {
            if self.try_next_candidate() {
                return PlaybackEvent::Buffering;
            }
            self.pause();
            return PlaybackEvent::Failed(if self.is_video {
                "The video is unavailable from Dhamma Download.".to_string()
            } else {
                "The audio stream is unavailable from Dhamma Download.".to_string()
            });
        }

        if item_status == AVPlayerItemStatus::ReadyToPlay {
            self.load_started_at = None;
        }

        self.apply_seek();
        self.poll_video_frame();

        let state = unsafe { self.player.timeControlStatus() };
        let duration = self.duration();
        let position = self.position();

        if self.requested_play
            && !self.emitted_end
            && self.pending_seek.is_none()
            && item_status == AVPlayerItemStatus::ReadyToPlay
            && duration > 0.5
            && position >= duration - 0.35
            && state == AVPlayerTimeControlStatus::Paused
        {
            self.requested_play = false;
            self.emitted_end = true;
            return PlaybackEvent::Ended;
        }

        if state == AVPlayerTimeControlStatus::Playing {
            PlaybackEvent::Playing
        } else if self.requested_play {
            PlaybackEvent::Buffering
        } else {
            PlaybackEvent::Paused
        }
    }
}

impl Drop for Playback {
    fn drop(&mut self) {
        unsafe {
            self.player.pause();
            self.player.replaceCurrentItemWithPlayerItem(None);
        }
    }
}

fn attach_video_output(item: &AVPlayerItem) -> Option<Retained<AVPlayerItemVideoOutput>> {
    let key = NSString::from_str("PixelFormatType");
    let format_value = NSNumber::new_u32(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange);
    let obj_ref: &AnyObject = unsafe { &*(Retained::as_ptr(&format_value) as *const AnyObject) };
    let attrs = NSDictionary::from_slices(&[&*key], &[obj_ref]);
    let output = unsafe {
        AVPlayerItemVideoOutput::initWithPixelBufferAttributes(
            AVPlayerItemVideoOutput::alloc(),
            Some(&attrs),
        )
    };
    let output_super: &AVPlayerItemOutput = output.as_ref();
    unsafe { item.addOutput(output_super) };
    Some(output)
}
