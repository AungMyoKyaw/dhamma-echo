import { Avatar, Style } from "@dicebear/core";
import blobs from "@dicebear/styles/blobs.json" with { type: "json" };

const style = new Style(blobs);

const BACKGROUND_COLORS = ["#f0eee7", "#e8e3d6", "#ddd5c2"] as const;

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
