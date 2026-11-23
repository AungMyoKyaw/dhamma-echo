#!/usr/bin/env python3
"""Validate the native proposal and its exported PNG inventory; no Python packages required."""
from pathlib import Path
import argparse
import collections
import json
import struct
import zipfile

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--source", type=Path, default=HERE / "dhamma-echo-review.figcraft")
parser.add_argument("--screens", type=Path, default=HERE / "screens")
args = parser.parse_args()
with zipfile.ZipFile(args.source) as archive:
    assert archive.testzip() is None, "Invalid native archive"
    doc = json.loads(archive.read("document.json"))
nodes = doc["nodes"]
styles = {s["id"]: s for s in doc.get("styles", [])}
variables = {v["id"]: v for v in doc.get("variables", {}).get("variables", [])}
collections_by_id = {c["id"]: c for c in doc["variables"]["collections"]}
defaults = {c["id"]: c["modes"][0]["id"] for c in collections_by_id.values()}
counts = collections.Counter(n["type"] for n in nodes.values())
assert len(variables) == 31, len(variables)
assert len(collections_by_id) == 2
assert counts["component"] == 38, counts
assert counts["componentSet"] == 7, counts
assert counts["instance"] >= 16, counts
assert not doc.get("imageIndex"), "Screens must remain editable"

def variable_value(vid, modes):
    v = variables[vid]
    mode = modes.get(v["collection"], defaults[v["collection"]])
    return v["values"][mode]["value"]

def paint(n, modes, field="fill"):
    plural = "fills" if field == "fill" else "strokes"
    binding = n.get("bound", {}).get(field) or n.get("bound", {}).get(plural + "/0/color")
    style = styles.get(n.get("styles", {}).get(field), {})
    binding = binding or style.get("bound", {}).get("fills/0/color")
    if binding:
        return variable_value(binding, modes)
    values = n.get(plural, [])
    if values and values[0].get("type") == "solid" and values[0].get("visible", True):
        c = values[0].get("color")
        if c and c.get("a", 1) * values[0].get("opacity", 1) > 0:
            return c
    return None

def luminance(c):
    channels = [c[k] for k in ("r", "g", "b")]
    channels = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
    return sum(a * b for a, b in zip(channels, (0.2126, 0.7152, 0.0722)))

def contrast(a, b):
    lo, hi = sorted((luminance(a), luminance(b)))
    return (hi + 0.05) / (lo + 0.05)

for n in nodes.values():
    for vid in n.get("bound", {}).values():
        assert vid in variables, (n["name"], "dangling variable", vid)
    if n["type"] == "instance":
        assert nodes[str(n["component"])]["type"] == "component", n
    if n["type"] == "componentSet":
        assert all(nodes[str(c)]["type"] == "component" for c in n["children"])
for s in styles.values():
    assert all(v in variables for v in s.get("bound", {}).values())

paths = {
    "Screens — Core": args.screens,
    "Screens — Missing states": args.screens / "states",
    "Design system": args.screens / "design-system",
}
expected = {"Screens — Core": 27, "Screens — Missing states": 21, "Design system": 6}
frame_count = 0
text_checks = []
bounds = []
manifest = []
for page_id in doc["pages"]:
    page = nodes[str(page_id)]
    assert page["name"] in expected, page["name"]
    assert len(page["children"]) == expected[page["name"]]
    for frame_id in page["children"]:
        frame = nodes[str(frame_id)]
        assert frame["type"] == "frame"
        frame_count += 1
        fw, fh = frame["width"], frame["height"]
        modes = {**defaults, **frame.get("var_modes", {})}
        background = paint(frame, modes)
        surfaces = [(0, 0, fw, fh, background)]
        def visit(nid, ox=0, oy=0, inherited=None):
            n = nodes[str(nid)]
            mode = {**(inherited or modes), **n.get("var_modes", {})}
            transform = n.get("transform", [1, 0, 0, 1, 0, 0])
            x, y = ox + transform[4], oy + transform[5]
            w, h = n.get("width", 0), n.get("height", 0)
            if x < -0.1 or y < -0.1 or x + w > fw + 0.1 or y + h > fh + 0.1:
                bounds.append((frame["name"], n["name"], x, y, w, h))
            color = paint(n, mode)
            if n["type"] in ("rectangle", "frame", "component", "instance", "componentSet") and color:
                surfaces.append((x, y, w, h, color))
            if n["type"] == "text" and color:
                assert n["style"]["font_family"] in ("Avenir Next", "Noto Sans Myanmar")
                assert not any(g in n.get("characters", "") for g in ("↶", "↷", "☰", "⌂", "⌕", "♡", "···"))
                px, py = x + min(w / 2, 10), y + h / 2
                bg = background
                for sx, sy, sw, sh, sc in surfaces:
                    if sx <= px <= sx + sw and sy <= py <= sy + sh:
                        bg = sc
                cr = contrast(color, bg)
                minimum = 3 if n["style"]["font_size"] >= 24 else 4.5
                text_checks.append((cr, frame["name"], n["name"]))
                assert cr >= minimum - 0.01, (frame["name"], n["name"], cr)
            if n["name"].startswith("Lucide / "):
                assert n["type"] == "vector"
                assert n.get("plugin_data", {}).get("lucideSource", "").startswith("https://lucide.dev/icons/")
                assert w <= 24.1 and h <= 24.1, (n["name"], w, h)
            for child in n.get("children", []):
                visit(child, x, y, mode)
        for child in frame["children"]:
            visit(child)
        png = paths[page["name"]] / (frame["name"] + ".png")
        header = png.read_bytes()[:24]
        assert header[:8] == b"\x89PNG\r\n\x1a\n", png
        assert struct.unpack(">II", header[16:24]) == (round(fw), round(fh)), png
        manifest.append({"page": page["name"], "frame": frame["name"], "size": [fw, fh]})
assert frame_count == 54
assert not bounds, bounds
semantic = next(c for c in collections_by_id.values() if c["name"] == "Semantic colors")
assert [m["name"] for m in semantic["modes"]] == ["Light", "Dark"]
assert all(len(v["values"]) == 2 for v in variables.values() if v["collection"] == semantic["id"])
report = {
    "pages": 3, "boards": frame_count, "originalScreens": 27, "addedStateScreens": 21,
    "designSystemBoards": 6, "nodes": len(nodes), "styles": len(styles),
    "mainComponents": counts["component"], "componentSets": counts["componentSet"],
    "instances": counts["instance"], "variables": len(variables),
    "variableCollections": len(collections_by_id),
    "boundNodeFields": sum(len(n.get("bound", {})) for n in nodes.values()),
    "outOfFrameLayers": len(bounds), "textContrastChecks": len(text_checks),
    "minimumTextContrast": round(min(r[0] for r in text_checks), 2),
}
print(json.dumps(report, indent=2))
print("PASS: editable library, valid instance/variable references, all PNGs, bounds and flat-surface text contrast.")
