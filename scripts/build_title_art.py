#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
可选：从 OGA LPC 城堡贴图生成标题「魔王城」横幅。

来源：Lanea Zimmerman — LPC Interior Castle Tiles (castle.png)
https://lpc.opengameart.org/content/lpc-interior-castle-tiles
许可：CC-BY-SA 3.0 / GPL 3.0

用法：python3 scripts/build_title_art.py
输出：public/sprites/title/demon-castle.png
"""

from __future__ import annotations

import os
import urllib.request

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "public", "sprites", "title")
SRC_URL = "https://opengameart.org/sites/default/files/castle.png"
SRC_PATH = os.path.join(OUT_DIR, "castle-tiles-source.png")
OUT_PATH = os.path.join(OUT_DIR, "demon-castle.png")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    if not os.path.isfile(SRC_PATH):
        print(f"[fetch] {SRC_URL}")
        urllib.request.urlretrieve(SRC_URL, SRC_PATH)

    src = Image.open(SRC_PATH).convert("RGBA")
    w, h = src.size
    crop = src.crop((w // 3, 0, min(w, w // 3 + 384), h))
    crop = crop.resize((480, 160), Image.Resampling.NEAREST)

    px = crop.load()
    assert px is not None
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (
                min(255, int(r * 0.55 + 25)),
                max(0, int(g * 0.45)),
                min(255, int(b * 0.65 + 35)),
                a,
            )

    crop.save(OUT_PATH)
    print(f"[title] {OUT_PATH} ({crop.size[0]}x{crop.size[1]})")


if __name__ == "__main__":
    main()
