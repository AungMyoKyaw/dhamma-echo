import { Avatar, Style } from "@dicebear/core";
import blobs from "@dicebear/styles/blobs.json" with { type: "json" };

const style = new Style(blobs);

// DESIGN.md substrate / panel / rule. Keeping the exact system values here
// makes the deterministic SVG/data-URI avatars read as specimen labels rather
// than as a disconnected grey illustration set.
const BACKGROUND_COLORS = ["#f5f2e9", "#ede8dd", "#d6d8ce"] as const;

export function teacherAvatarSvg(id: number): string {
  return new Avatar(style, {
    seed: id.toString(),
    size: 64,
    backgroundColor: [...BACKGROUND_COLORS]
  }).toString();
}

export function teacherAvatarDataUri(id: number): string {
  return new Avatar(style, {
    seed: id.toString(),
    size: 64,
    backgroundColor: [...BACKGROUND_COLORS]
  }).toDataUri();
}
