#!/usr/bin/env python3
"""Generate deterministic Dhamma Echo desktop icons from vector-like geometry."""

from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "src-tauri" / "icons"
MASTER_SIZE = 1024
SCALE = 4


def cubic(p0, p1, p2, p3, steps: int = 28):
    points = []
    for index in range(steps + 1):
        t = index / steps
        mt = 1 - t
        points.append(
            (
                mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0],
                mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
            )
        )
    return points


def transform(points: Iterable[tuple[float, float]], origin=(128, 142), scale=6.0):
    ox, oy = origin
    return [((ox + x * scale) * SCALE, (oy + y * scale) * SCALE) for x, y in points]


def petal_center():
    return (
        cubic((64, 24), (72, 36), (76, 47), (76, 58))
        + cubic((76, 58), (76, 72), (71, 83), (64, 92))[1:]
        + cubic((64, 92), (57, 83), (52, 72), (52, 58))[1:]
        + cubic((52, 58), (52, 47), (56, 36), (64, 24))[1:]
    )


def petal_left():
    return (
        cubic((28, 52), (44, 53), (57, 59), (64, 70))
        + cubic((64, 70), (61, 84), (52, 94), (38, 99))[1:]
        + cubic((38, 99), (31, 88), (27, 76), (28, 52))[1:]
    )


def petal_right():
    return (
        cubic((100, 52), (84, 53), (71, 59), (64, 70))
        + cubic((64, 70), (67, 84), (76, 94), (90, 99))[1:]
        + cubic((90, 99), (97, 88), (101, 76), (100, 52))[1:]
    )


def make_master() -> Image.Image:
    canvas = Image.new("RGBA", (MASTER_SIZE * SCALE, MASTER_SIZE * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # A smaller, centered tile leaves an optical safe area in the Dock.
    tile = tuple(value * SCALE for value in (96, 96, 928, 928))
    draw.rounded_rectangle(tile, radius=190 * SCALE, fill=(253, 249, 241, 255), outline=(224, 217, 204, 255), width=3 * SCALE)

    # A subtle inner glow gives definition without making the icon visually heavy.
    inner = tuple(value * SCALE for value in (112, 112, 912, 912))
    draw.rounded_rectangle(inner, radius=174 * SCALE, outline=(255, 255, 255, 170), width=5 * SCALE)

    draw.polygon(transform(petal_left()), fill=(164, 81, 28, 232))
    draw.polygon(transform(petal_right()), fill=(140, 63, 8, 218))
    draw.polygon(transform(petal_center()), fill=(156, 63, 0, 255))

    upper_wave = cubic((18, 86), (31, 99), (46, 105), (64, 105)) + cubic(
        (64, 105), (82, 105), (97, 99), (110, 86)
    )[1:]
    lower_wave = cubic((30, 105), (40, 112), (51, 115), (64, 115)) + cubic(
        (64, 115), (77, 115), (88, 112), (98, 105)
    )[1:]
    draw.line(transform(upper_wave), fill=(64, 89, 53, 255), width=6 * 6 * SCALE, joint="curve")
    draw.line(transform(lower_wave), fill=(104, 77, 29, 205), width=4 * 6 * SCALE, joint="curve")

    return canvas.resize((MASTER_SIZE, MASTER_SIZE), Image.Resampling.LANCZOS)


def save_assets(master: Image.Image) -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    master.save(ICON_DIR / "app-icon.png", optimize=True)
    master.save(ICON_DIR / "icon.png", optimize=True)
    for filename, size in (("32x32.png", 32), ("128x128.png", 128), ("128x128@2x.png", 256)):
        master.resize((size, size), Image.Resampling.LANCZOS).save(ICON_DIR / filename, optimize=True)
    master.save(
        ICON_DIR / "icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    master.save(ICON_DIR / "icon.icns", format="ICNS")


def alpha_bbox(image: Image.Image):
    return image.getchannel("A").getbbox()


def check_assets() -> None:
    expected = {
        "app-icon.png": (1024, 1024),
        "icon.png": (1024, 1024),
        "32x32.png": (32, 32),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256)
    }
    for filename, size in expected.items():
        image = Image.open(ICON_DIR / filename).convert("RGBA")
        if image.size != size:
            raise SystemExit(f"{filename}: expected {size}, got {image.size}")

    master = Image.open(ICON_DIR / "app-icon.png").convert("RGBA")
    if any(master.getpixel(point)[3] != 0 for point in ((0, 0), (1023, 0), (0, 1023), (1023, 1023))):
        raise SystemExit("app-icon.png: corners must remain transparent")
    bbox = alpha_bbox(master)
    if bbox is None or not (88 <= bbox[0] <= 104 and 920 <= bbox[2] <= 936):
        raise SystemExit(f"app-icon.png: unexpected artwork bounds {bbox}")
    if master.getpixel((512, 512))[3] < 250:
        raise SystemExit("app-icon.png: center artwork is missing")

    for filename, magic in (("icon.icns", b"icns"), ("icon.ico", b"\x00\x00\x01\x00")):
        data = (ICON_DIR / filename).read_bytes()
        if not data.startswith(magic):
            raise SystemExit(f"{filename}: invalid file header")
        if len(data) < 1024:
            raise SystemExit(f"{filename}: file is unexpectedly small")

    print(f"icon geometry check passed: artwork bounds {bbox}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Validate generated assets without rewriting them")
    args = parser.parse_args()
    if args.check:
        check_assets()
        return
    save_assets(make_master())
    check_assets()
    print(f"generated desktop icons in {ICON_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
