import { createMockInvoke } from "./mock-data.js";
import type { InvokeFn } from "./types.js";

declare global {
  interface Window {
    __TAURI__?: {
      core?: { invoke?: InvokeFn; convertFileSrc?: (path: string) => string };
      event?: {
        listen?: (name: string, handler: (event: { payload: unknown }) => void) => Promise<unknown>;
      };
    };
  }
}

export function selectInvoke(candidate: InvokeFn | undefined): InvokeFn {
  return candidate ?? createMockInvoke();
}

export function localFileUrl(path: string): string {
  const convert = window.__TAURI__?.core?.convertFileSrc;
  return convert?.(path) ?? path;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || typeof target !== "object") return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  const tag = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";
  return (
    tag === "input" || tag === "select" || tag === "textarea" || element.isContentEditable === true
  );
}
