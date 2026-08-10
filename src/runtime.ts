import { createMockInvoke } from "./mock-data.js";
import type { InvokeFn } from "./types.js";

export function selectInvoke(candidate: InvokeFn | undefined): InvokeFn {
  return candidate ?? createMockInvoke();
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || typeof target !== "object") return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  const tag = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";
  return (
    tag === "input" || tag === "select" || tag === "textarea" || element.isContentEditable === true
  );
}
