import type { AudioTrack, PlayerEvent } from "./types.js";
import { clamp, mediaUrlCandidates } from "./utils.js";

export interface AudioLike {
  src: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
  readonly paused: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
  play(): Promise<void>;
  pause(): void;
  load(): void;
}

/**
 * Structural shape of `HTMLMediaElement` shared by `<audio>` and `<video>`.
 * The webview creates the matching element based on the track's `mediaType`
 * and hands it to `MediaEngine`; the engine never needs to know which kind.
 */
export type MediaLike = AudioLike;

const FALLBACK_TIMEOUT_MS = 8000;

export class MediaEngine {
  private audio: MediaLike;
  private candidates: string[] = [];
  private candidateIndex = -1;
  private resumeAt = 0;
  private finalErrorEmitted = false;
  private activeAttempt = 0;
  private startedAttempt = 0;

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
    if (this.startedAttempt === 0) return;
    const next = this.candidateIndex + 1;
    if (next >= this.candidates.length) {
      this.emitFinalError();
      return;
    }
    void this.attempt(next);
  };

  constructor(
    audio: MediaLike,
    private readonly emit: (event: PlayerEvent) => void,
    private readonly fallbackTimeoutMs: number = FALLBACK_TIMEOUT_MS
  ) {
    this.audio = audio;
    this.attach(audio);
  }

  private attach(element: MediaLike): void {
    element.addEventListener("play", this.onPlay);
    element.addEventListener("pause", this.onPause);
    element.addEventListener("loadedmetadata", this.onLoadedMetadata);
    element.addEventListener("timeupdate", this.onTimeUpdate);
    element.addEventListener("ended", this.onEnded);
    element.addEventListener("error", this.onError);
  }

  private detach(): void {
    const element = this.audio;
    element.removeEventListener("play", this.onPlay);
    element.removeEventListener("pause", this.onPause);
    element.removeEventListener("loadedmetadata", this.onLoadedMetadata);
    element.removeEventListener("timeupdate", this.onTimeUpdate);
    element.removeEventListener("ended", this.onEnded);
    element.removeEventListener("error", this.onError);
  }

  async setTrack(track: AudioTrack, resumeAt = 0, localUrl?: string): Promise<boolean> {
    this.candidates =
      localUrl === undefined ? mediaUrlCandidates(track.url, track.format) : [localUrl];
    this.candidateIndex = -1;
    this.resumeAt = Math.max(0, Number.isFinite(resumeAt) ? resumeAt : 0);
    this.finalErrorEmitted = false;
    this.activeAttempt += 1;
    this.startedAttempt = 0;
    if (this.candidates.length === 0) {
      const normalized = track.format.trim().toLowerCase();
      const isWebviewPlayable = normalized === "mp3" || normalized === "mp4";
      this.emit({
        type: "error",
        message: isWebviewPlayable
          ? "This media source is not trusted."
          : "This media format is not supported by the macOS player."
      });
      return false;
    }
    return this.attempt(0);
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
    const duration = this.audio.duration;
    const maximum = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
    this.audio.currentTime = clamp(value, 0, maximum);
    this.resumeAt = this.audio.currentTime;
  }

  setRate(value: number): void {
    this.audio.playbackRate = clamp(value, 0.75, 2);
  }

  destroy(): void {
    this.detach();
  }

  private attempt(index: number): Promise<boolean> {
    const target = ++this.activeAttempt;
    const candidate = this.candidates[index] as string;
    this.candidateIndex = index;
    this.audio.src = candidate;
    this.audio.load();
    this.emit({ type: "status", status: "loading" });
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        if (target !== this.activeAttempt) return;
        const next = this.candidateIndex + 1;
        resolve(false);
        if (next >= this.candidates.length) this.emitFinalError();
        else void this.attempt(next).then(resolve);
      }, this.fallbackTimeoutMs);
      this.startedAttempt = target;
      void this.audio.play().then(
        () => {
          if (target !== this.activeAttempt) return;
          clearTimeout(timer);
          resolve(true);
        },
        () => {
          if (target !== this.activeAttempt) return;
          clearTimeout(timer);
          const next = this.candidateIndex + 1;
          resolve(false);
          if (next >= this.candidates.length) this.emitFinalError();
          else void this.attempt(next).then(resolve);
        }
      );
    });
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
