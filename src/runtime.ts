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
  startDragging: () => void;
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

/**
 * Svelte action: turns a host element into a window-drag area. Calls
 * `startDragging()` on the native window bridge when the user presses
 * the left mouse button on the host, unless the press originated on
 * an interactive descendant (button, link, form control). This is the
 * primary drag mechanism on every platform and intentionally does NOT
 * rely on Tauri's `data-tauri-drag-region` data attribute, which is
 * unreliable on macOS when combined with the overlay title-bar style.
 */
export function dragWindow(node: HTMLElement): { destroy(): void } {
  function isInteractive(target: EventTarget | null): boolean {
    if (target === null || typeof target !== "object") return false;
    const element = target as { closest?: (selector: string) => unknown };
    return (
      typeof element.closest === "function" &&
      element.closest(
        "button, a, input, select, textarea, summary, [role='button'], [role='checkbox'], [role='menuitem'], [role='option'], [role='tab'], [data-no-drag]"
      ) !== null
    );
  }

  function onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    if (isInteractive(event.target)) return;
    const chrome = getNativeChrome();
    if (chrome === null) return;
    event.preventDefault();
    chrome.startDragging();
  }

  node.addEventListener("mousedown", onMouseDown);
  return {
    destroy(): void {
      node.removeEventListener("mousedown", onMouseDown);
    }
  };
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
