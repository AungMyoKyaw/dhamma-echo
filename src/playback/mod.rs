#[cfg(target_os = "macos")]
mod macos;
#[cfg(not(target_os = "macos"))]
mod portable;

#[cfg(target_os = "macos")]
pub use macos::Playback;
#[cfg(not(target_os = "macos"))]
pub use portable::Playback;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlaybackEvent {
    Playing,
    Buffering,
    Paused,
    Ended,
    Failed(String),
}

#[derive(Clone)]
pub enum VideoFrame {
    #[cfg(target_os = "macos")]
    Surface(core_video::pixel_buffer::CVPixelBuffer),
    #[cfg(not(target_os = "macos"))]
    Image(std::sync::Arc<gpui::RenderImage>),
}
