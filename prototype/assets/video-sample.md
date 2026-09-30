# Silent interface sample

`video-sample.mp4` is a locally authored, synthetic 24-second UI demonstration. It contains three eight-second typographic frames: “Settle into the moment.”, “Notice what is here.”, and “Begin again, gently.” No teacher footage, Dhamma recording, or audible content is included.

## Provenance

- Existing project logo: `public/logo.svg`.
- Existing bundled font: `src/assets/fonts/source-serif-4-latin.woff2`.
- Established design colors: page `#f4efde`, ink `#1f2024`, quiet ink `#5a5b55`, rule `#cbc5b0`, primary `#3f6b3a`.
- Frames authored as local HTML and captured at 1280×720 with Chromium. Temporary screenshots are generation inputs, not shipped raster assets.
- FFmpeg concatenated the frames into H.264/yuv420p at 24 fps, with a silent AAC track and fast-start metadata. CRF 27; three eight-second holds; no decorative animation.
- The MP4 title and comment metadata identify it as a synthetic interface sample.

The clip exists so playback, pause, seeking, speed, volume properties, completion, dock transitions, and fullscreen can be exercised against an actual HTMLVideoElement without fetching remote media. The interface labels it as a silent sample, not a recorded talk.
