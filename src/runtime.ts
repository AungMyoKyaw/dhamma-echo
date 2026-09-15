import { createMockInvoke } from "./mock-data.js";
import type { InvokeFn } from "./types.js";

export interface NativeWindowFullscreenBridge {
  isFullscreen: () => Promise<boolean>;
  setFullscreen: (fullscreen: boolean) => Promise<void>;
}

export interface NativeWindowChromeBridge {
  close: () => Promise<void>;
  minimize: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  toggleMaximize: () => Promise<boolean>;
}

export type NativeWindow = NativeWindowFullscreenBridge & NativeWindowChromeBridge;

/* c8 ignore start -- this block only augments browser/Tauri global types. */
declare global {
  interface Window {
    __TAURI__?: {
      core?: { invoke?: InvokeFn; convertFileSrc?: (path: string) => string };
      window?: { getCurrentWindow?: () => NativeWindow };
      event?: {
        listen?: (name: string, handler: (event: { payload: unknown }) => void) => Promise<unknown>;
      };
    };
  }
}
/* c8 ignore stop */

export function selectInvoke(candidate: InvokeFn | undefined): InvokeFn {
  return candidate ?? createMockInvoke();
}

export function localFileUrl(path: string): string {
  const convert = window.__TAURI__?.core?.convertFileSrc;
  return convert?.(path) ?? path;
}

export function getNativeWindow(): NativeWindow | null {
  return window.__TAURI__?.window?.getCurrentWindow?.() ?? null;
}

export function getNativeChrome(): NativeWindowChromeBridge | null {
  return getNativeWindow();
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || typeof target !== "object") return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  const tag = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";
  return (
    tag === "input" || tag === "select" || tag === "textarea" || element.isContentEditable === true
  );
}

/**
 * Reports the host platform from the webview user agent so the layout can
 * apply platform-specific chrome (e.g. the macOS traffic-light inset). The
 * Vite preview uses the browser host platform; unknown or absent user agents
 * return "browser" to suppress platform-specific treatment.
 */
export function detectPlatform(): "macos" | "windows" | "linux" | "browser" {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua)) return "linux";
  return "browser";
}

export function applyPlatformClass(target: HTMLElement = document.documentElement): void {
  const platform = detectPlatform();
  target.dataset.platform = platform;
}
