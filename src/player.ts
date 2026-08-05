import type { AudioTrack, PlayerEvent } from "./types.js";
import { clamp, mediaUrlCandidates } from "./utils.js";

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
  private candidates: string[] = [];
  private candidateIndex = -1;
  private resumeAt = 0;
  private handlingFailure = false;
  private finalErrorEmitted = false;

  private readonly onPlay = (): void => {
    this.emit({ type: "status", status: "playing" });
  };
  private readonly onPause = (): void => {
    this.emit({ type: "status", status: "paused" });
  };
  private readonly onLoadedMetadata = (): void => {
    const duration = Number.isFinite(this.audio.duration) ? Math.max(0, this.audio.duration) : 0;
    const upperBound = duration > 0 ? duration : this.resumeAt;
    this.audio.currentTime = clamp(this.resumeAt, 0, upperBound);
    this.emit({
      type: "progress",
      currentTime: this.audio.currentTime,
      duration
    });
  };
  private readonly onTimeUpdate = (): void => {
    const currentTime = Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0;
    this.resumeAt = Math.max(0, currentTime);
    this.emit({
      type: "progress",
      currentTime,
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0
    });
  };
  private readonly onEnded = (): void => {
    this.emit({ type: "ended" });
  };
  private readonly onError = (): void => {
    if (!this.handlingFailure) void this.startFrom(this.candidateIndex + 1);
  };

  constructor(
    private readonly audio: AudioLike,
    private readonly emit: (event: PlayerEvent) => void
  ) {
    audio.addEventListener("play", this.onPlay);
    audio.addEventListener("pause", this.onPause);
    audio.addEventListener("loadedmetadata", this.onLoadedMetadata);
    audio.addEventListener("timeupdate", this.onTimeUpdate);
    audio.addEventListener("ended", this.onEnded);
    audio.addEventListener("error", this.onError);
  }

  async setTrack(track: AudioTrack, resumeAt = 0): Promise<boolean> {
    this.candidates = mediaUrlCandidates(track.url, track.format);
    this.candidateIndex = -1;
    this.resumeAt = Math.max(0, Number.isFinite(resumeAt) ? resumeAt : 0);
    this.finalErrorEmitted = false;
    if (this.candidates.length === 0) {
      this.emit({
        type: "error",
        message:
          track.format.trim().toLowerCase() === "mp3"
            ? "This audio source is not trusted."
            : "This audio format is not supported by the macOS player."
      });
      return false;
    }
    return this.startFrom(0);
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
    const maximum =
      Number.isFinite(this.audio.duration) && this.audio.duration > 0
        ? this.audio.duration
        : Number.POSITIVE_INFINITY;
    this.audio.currentTime = clamp(value, 0, maximum);
    this.resumeAt = this.audio.currentTime;
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
    this.audio.removeEventListener("loadedmetadata", this.onLoadedMetadata);
    this.audio.removeEventListener("timeupdate", this.onTimeUpdate);
    this.audio.removeEventListener("ended", this.onEnded);
    this.audio.removeEventListener("error", this.onError);
  }

  private async startFrom(index: number): Promise<boolean> {
    this.handlingFailure = true;
    let candidateIndex = index;
    for (const candidate of this.candidates.slice(index)) {
      this.candidateIndex = candidateIndex;
      candidateIndex += 1;
      this.audio.src = candidate;
      this.audio.load();
      this.emit({ type: "status", status: "loading" });
      try {
        await this.audio.play();
        this.handlingFailure = false;
        return true;
      } catch {
        // Try the alternate approved hostname before surfacing a final error.
      }
    }
    this.handlingFailure = false;
    this.emitFinalError();
    return false;
  }

  private emitFinalError(): void {
    if (this.finalErrorEmitted) return;
    this.finalErrorEmitted = true;
    this.emit({
      type: "error",
      message: "The audio stream is unavailable from Dhamma Download."
    });
  }
}
