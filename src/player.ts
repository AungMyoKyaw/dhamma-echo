import type { AudioTrack, PlayerEvent } from "./types.js";
import { clamp, isPlayableUrl } from "./utils.js";

export interface AudioLike {
  src: string;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  readonly paused: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
  play(): Promise<void>;
  pause(): void;
  load(): void;
}

export class AudioEngine {
  private readonly onPlay = (): void => this.emit({ type: "status", status: "playing" });
  private readonly onPause = (): void => this.emit({ type: "status", status: "paused" });
  private readonly onTimeUpdate = (): void =>
    this.emit({
      type: "progress",
      currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0,
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0
    });
  private readonly onEnded = (): void => this.emit({ type: "ended" });
  private readonly onError = (): void =>
    this.emit({ type: "error", message: "The remote audio stream is unavailable." });

  constructor(
    private readonly audio: AudioLike,
    private readonly emit: (event: PlayerEvent) => void
  ) {
    audio.addEventListener("play", this.onPlay);
    audio.addEventListener("pause", this.onPause);
    audio.addEventListener("timeupdate", this.onTimeUpdate);
    audio.addEventListener("ended", this.onEnded);
    audio.addEventListener("error", this.onError);
  }

  async setTrack(track: AudioTrack, resumeAt = 0): Promise<boolean> {
    if (!track.playable || !isPlayableUrl(track.url)) {
      this.emit({ type: "error", message: "This legacy HTTP track is blocked for your safety." });
      return false;
    }
    this.audio.src = track.url;
    this.audio.currentTime = Math.max(0, Number.isFinite(resumeAt) ? resumeAt : 0);
    this.audio.load();
    this.emit({ type: "status", status: "loading" });
    try {
      await this.audio.play();
      return true;
    } catch {
      this.emit({ type: "error", message: "The audio stream could not start." });
      return false;
    }
  }

  async toggle(): Promise<void> {
    if (this.audio.paused) {
      try {
        await this.audio.play();
      } catch {
        this.emit({ type: "error", message: "The audio stream could not start." });
      }
    } else {
      this.audio.pause();
    }
  }

  seek(value: number): void {
    this.audio.currentTime = Math.max(0, Number.isFinite(value) ? value : 0);
  }

  setVolume(value: number): void {
    this.audio.volume = clamp(value, 0, 1);
  }

  setRate(value: number): void {
    this.audio.playbackRate = clamp(value, 0.75, 2);
  }

  destroy(): void {
    this.audio.removeEventListener("play", this.onPlay);
    this.audio.removeEventListener("pause", this.onPause);
    this.audio.removeEventListener("timeupdate", this.onTimeUpdate);
    this.audio.removeEventListener("ended", this.onEnded);
    this.audio.removeEventListener("error", this.onError);
  }
}
