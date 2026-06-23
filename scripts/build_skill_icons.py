#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 Kyrise 16×16 RPG Icon Pack 选取图标，放大到 32×32 并拼成技能图标表。

素材：Kyrise's Free 16x16 RPG Icon Pack (CC BY 4.0)
https://opengameart.org/content/kyrises-free-16x16-rpg-icon-pack
https://kyrise.itch.io/

源文件放在 public/sprites/icons/kyrise/（由本脚本从 _src 提取，或手动放置）。
"""

from __future__ import annotations

import json
import os
import shutil
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
KYRISE_SRC = os.path.join(
    ROOT,
    "public",
    "sprites",
    "icons",
    "_src",
    "kyrise",
    "extracted",
    "Kyrise's 16x16 RPG Icon Pack - V1.2",
    "icons",
    "16x16",
)
KYRISE_COMMITTED = os.path.join(ROOT, "public", "sprites", "icons", "kyrise")
OUT_DIR = os.path.join(ROOT, "public", "sprites", "icons")
OUT_SHEET = os.path.join(OUT_DIR, "icons.png")
OUT_MANIFEST = os.path.join(OUT_DIR, "icons-manifest.json")

ICON_SIZE = 32
SRC_SIZE = 16

# 游戏图标键 → Kyrise 包内文件名
KYRISE_ICON_MAP: dict[str, str] = {
    "fire": "potion_03f.png",       # 红药瓶 → 火球
    "holy": "shield_03b.png",         # 盾 → 圣光/防御
    "shadow": "book_05a.png",       # 魔导书 → 暗影
    "slash": "sword_03a.png",       # 剑 → 斩击
    "dagger": "sword_02a.png",       # 短剑 → 突刺
    "lightning": "crystal_01h.png",  # 水晶 → 雷电
    "thrust": "arrow_03a.png",       # 箭 → 突刺/居合
    "hp-up": "potion_01h.png",      # 治疗药 → 生命
    "crit-up": "gem_01f.png",        # 宝石 → 暴击
    "power-up": "ingot_01e.png",     # 金锭 → 全伤
    "guard": "shield_03a.png",       # 盾 → 守护路线
    "void": "scroll_01f.png",        # 卷轴 → 虚无
}

ICON_KEYS = list(KYRISE_ICON_MAP.keys())


def _ensure_committed_sources() -> None:
    """把选用到的 16×16 源图复制到 kyrise/ 目录，便于仓库追踪与署名。"""
    os.makedirs(KYRISE_COMMITTED, exist_ok=True)
    for key, filename in KYRISE_ICON_MAP.items():
        src = os.path.join(KYRISE_SRC, filename)
        if not os.path.isfile(src):
            # 已提交副本存在则跳过
            committed = os.path.join(KYRISE_COMMITTED, f"{key}.png")
            if os.path.isfile(committed):
                continue
            raise FileNotFoundError(
                f"找不到 Kyrise 图标 {filename}，请先下载解压到 {KYRISE_SRC} "
                f"或放置 {committed}"
            )
        dst = os.path.join(KYRISE_COMMITTED, f"{key}.png")
        if not os.path.isfile(dst):
            shutil.copy2(src, dst)
        # 记录原始文件名
        meta_path = os.path.join(KYRISE_COMMITTED, f"{key}.source.txt")
        with open(meta_path, "w", encoding="utf-8") as f:
            f.write(f"{filename}\n")


def _load_kyrise_icon(key: str) -> Image.Image:
    committed = os.path.join(KYRISE_COMMITTED, f"{key}.png")
    src = committed if os.path.isfile(committed) else os.path.join(
        KYRISE_SRC, KYRISE_ICON_MAP[key]
    )
    img = Image.open(src).convert("RGBA")
    if img.size != (SRC_SIZE, SRC_SIZE):
        img = img.resize((SRC_SIZE, SRC_SIZE), Image.NEAREST)
    if ICON_SIZE != SRC_SIZE:
        img = img.resize((ICON_SIZE, ICON_SIZE), Image.NEAREST)
    return img


def main() -> None:
    _ensure_committed_sources()
    os.makedirs(OUT_DIR, exist_ok=True)

    cols = 4
    rows = (len(ICON_KEYS) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * ICON_SIZE, rows * ICON_SIZE), (0, 0, 0, 0))
    manifest_icons: dict[str, dict] = {}

    for i, key in enumerate(ICON_KEYS):
        icon = _load_kyrise_icon(key)
        col = i % cols
        row = i // cols
        sheet.paste(icon, (col * ICON_SIZE, row * ICON_SIZE))
        manifest_icons[key] = {
            "col": col,
            "row": row,
            "kyriseSource": KYRISE_ICON_MAP[key],
        }

    sheet.save(OUT_SHEET)
    manifest = {
        "sheet": "/sprites/icons/icons.png",
        "frameWidth": ICON_SIZE,
        "frameHeight": ICON_SIZE,
        "sheetWidth": cols * ICON_SIZE,
        "sheetHeight": rows * ICON_SIZE,
        "icons": manifest_icons,
        "credits": {
            "pack": "Kyrise's Free 16x16 RPG Icon Pack",
            "author": "Kyrise",
            "license": "CC BY 4.0",
            "url": "https://opengameart.org/content/kyrises-free-16x16-rpg-icon-pack",
            "itchUrl": "https://kyrise.itch.io/",
            "attribution": "Graphics made by Kyrise: https://kyrise.itch.io/",
        },
    }
    with open(OUT_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[icons] Kyrise × {len(ICON_KEYS)} -> {OUT_SHEET}")


if __name__ == "__main__":
    main()
