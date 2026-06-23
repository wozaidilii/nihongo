#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 LPC 城堡贴图拼合标题「魔王城」横幅。

来源：theidiotmachine — Another LPC style castle (castle2.png)
https://opengameart.org/content/another-lpc-style-castle
许可：CC-BY-SA 3.0

用法：python3 scripts/build_title_art.py
输出：public/sprites/title/demon-castle.png
"""

from __future__ import annotations

import os
import urllib.request

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "public", "sprites", "title")
TMP = os.path.join(ROOT, "public", "sprites", "_tmp")
SRC_URL = "https://opengameart.org/sites/default/files/castle2.png"
SRC_PATH = os.path.join(TMP, "castle2.png")
OUT_PATH = os.path.join(OUT_DIR, "demon-castle.png")

TILE = 32
# 从 castle2 贴图拼合 8×4 外立面（塔楼 + 中央城门）
CASTLE_LAYOUT: list[list[tuple[int, int] | None]] = [
    [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0), (7, 0)],
    [(0, 1), (1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1)],
    [(0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2), (7, 2)],
    [(0, 3), (1, 3), (2, 3), (3, 3), (4, 4), (5, 5), (6, 5), (7, 3)],
]


def ensure_castle_tiles() -> None:
    os.makedirs(TMP, exist_ok=True)
    if os.path.isfile(SRC_PATH):
        return
    print(f"[fetch] castle2.png", flush=True)
    urllib.request.urlretrieve(SRC_URL, SRC_PATH)


def pick_tile(sheet: Image.Image, coord: tuple[int, int] | None) -> Image.Image:
    blank = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    if coord is None:
        return blank
    tx, ty = coord
    return sheet.crop((tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE)).convert("RGBA")


def tint_demon_keep(im: Image.Image) -> Image.Image:
    """略压暗并偏紫，贴合魔王城氛围。"""
    out = im.copy()
    px = out.load()
    assert px is not None
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (
                min(255, int(r * 0.72 + 18)),
                max(0, int(g * 0.58)),
                min(255, int(b * 0.82 + 28)),
                a,
            )
    return out


def compose_castle(sheet: Image.Image) -> Image.Image:
    rows = len(CASTLE_LAYOUT)
    cols = max(len(r) for r in CASTLE_LAYOUT)
    canvas = Image.new("RGBA", (cols * TILE, rows * TILE), (0, 0, 0, 0))
    for y, row in enumerate(CASTLE_LAYOUT):
        for x, coord in enumerate(row):
            tile = pick_tile(sheet, coord)
            canvas.paste(tile, (x * TILE, y * TILE), tile)
    # 放大到标题横幅尺寸
    return canvas.resize((cols * TILE * 2, rows * TILE * 2), Image.Resampling.NEAREST)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    ensure_castle_tiles()
    sheet = Image.open(SRC_PATH).convert("RGBA")
    banner = tint_demon_keep(compose_castle(sheet))
    banner.save(OUT_PATH)
    print(f"[title] {OUT_PATH} ({banner.size[0]}x{banner.size[1]})")


if __name__ == "__main__":
    main()
