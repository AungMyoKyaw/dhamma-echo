#!/usr/bin/env python3
"""Generate Microsoft Store MSIX logo assets from the existing app-icon.png.

The Microsoft Store requires a fixed set of PNG sizes for app tiles, the
Start menu, and the splash screen. Tauri's `tauri icon` does not emit
these sizes, so we resize them from the canonical master at
`src-tauri/icons/app-icon.png` (1024x1024) and write them into
`src-tauri/msix/Assets`.

Run with `--check` to validate committed assets without rewriting them.
CI uses the same script to keep the repo deterministic.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
APP_ICON = ROOT / "src-tauri" / "icons" / "app-icon.png"
ASSETS_DIR = ROOT / "src-tauri" / "msix" / "Assets"

# (filename, width, height) — Microsoft Store tile and logo requirements.
# Keep the set aligned with the entries referenced by Package.appxmanifest.xml.
STORE_ASSETS: dict[str, tuple[int, int]] = {
    "StoreLogo.png": (50, 50),
    "Square44x44Logo.png": (44, 44),
    "Square71x71Logo.png": (71, 71),
    "Square150x150Logo.png": (150, 150),
    "Square310x310Logo.png": (310, 310),
    "Wide310x150Logo.png": (310, 150),
}


def generate_assets() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    master = Image.open(APP_ICON).convert("RGBA")
    if master.size != (1024, 1024):
        raise SystemExit(
            f"{APP_ICON.relative_to(ROOT)}: expected 1024x1024, got {master.size}"
        )
    for filename, (width, height) in STORE_ASSETS.items():
        target = master.resize((width, height), Image.Resampling.LANCZOS)
        target.save(ASSETS_DIR / filename, optimize=True)


def check_assets() -> None:
    if not ASSETS_DIR.is_dir():
        raise SystemExit(f"missing assets directory: {ASSETS_DIR.relative_to(ROOT)}")
    for filename, (width, height) in STORE_ASSETS.items():
        path = ASSETS_DIR / filename
        if not path.exists():
            raise SystemExit(f"missing: {path.relative_to(ROOT)}")
        image = Image.open(path)
        if image.size != (width, height):
            raise SystemExit(
                f"{filename}: expected {width}x{height}, got {image.size}"
            )
        if image.mode != "RGBA":
            raise SystemExit(f"{filename}: expected RGBA, got {image.mode}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate committed assets without rewriting them",
    )
    args = parser.parse_args()
    if args.check:
        check_assets()
        print(f"msix assets ok: {len(STORE_ASSETS)} files in {ASSETS_DIR.relative_to(ROOT)}")
        return
    generate_assets()
    check_assets()
    print(f"generated {len(STORE_ASSETS)} MSIX assets in {ASSETS_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
