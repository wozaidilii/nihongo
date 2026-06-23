#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 LPC (Liberated Pixel Cup) 分层 PNG 合成为游戏用 spritesheet。

输出到 public/sprites/heroes/ 与 public/sprites/enemies/，
并生成 manifest.json 供前端 PixelAnimator 读取。
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Iterable

from PIL import Image

from build_lpc_enemies import build_all_enemies

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
TMP = os.path.join(ROOT, "public", "sprites", "_tmp")
LPC = os.path.join(TMP, "lpc_entry", "png")
OUT_HEROES = os.path.join(ROOT, "public", "sprites", "heroes")
OUT_ENEMIES = os.path.join(ROOT, "public", "sprites", "enemies")
MANIFEST_PATH = os.path.join(ROOT, "public", "sprites", "sprites-manifest.json")

FRAME = 64
# LPC 四方向行序：0=下 1=左 2=右 3=上；勇者朝右，怪物朝左
HERO_ROW = 2
ENEMY_ROW = 1

# 绘制顺序：从底到顶
LAYER_ORDER = [
    "BEHIND",
    "BODY",
    "FEET",
    "LEGS",
    "TORSO",
    "BELT",
    "HANDS",
    "HEAD",
    "WEAPON",
]


@dataclass
class CharBuild:
    id: str
    layers: list[str]
    body_key: str = "BODY_male"
    anims: dict[str, str] = field(default_factory=dict)


def load_rgba(path: str) -> Image.Image | None:
    if not os.path.isfile(path):
        return None
    return Image.open(path).convert("RGBA")


def find_body_key(folder_path: str, preferred: str) -> str:
    for key in (preferred, "BODY_male", "BODY_human", "BODY_animation"):
        if os.path.isfile(os.path.join(folder_path, f"{key}.png")):
            return key
    return preferred


def composite_sheet(folder: str, layers: Iterable[str], body_key: str) -> Image.Image | None:
    """合成某一动画文件夹下的整张贴图。"""
    folder_path = os.path.join(LPC, folder)
    if not os.path.isdir(folder_path):
        return None

    base_name = find_body_key(folder_path, body_key)
    base = load_rgba(os.path.join(folder_path, f"{base_name}.png"))
    if base is None:
        return None

    canvas = Image.new("RGBA", base.size, (0, 0, 0, 0))
    wanted = set(layers) | {base_name}

    for prefix in LAYER_ORDER:
        for name in wanted:
            if not name.startswith(prefix):
                continue
            path = os.path.join(folder_path, f"{name}.png")
            layer = load_rgba(path)
            if layer and layer.size == canvas.size:
                canvas = Image.alpha_composite(canvas, layer)

    return canvas


def extract_row(sheet: Image.Image, row: int) -> Image.Image:
    y = row * FRAME
    return sheet.crop((0, y, sheet.width, y + FRAME))


def row_to_frames(row_img: Image.Image) -> list[Image.Image]:
    count = max(1, row_img.width // FRAME)
    return [row_img.crop((i * FRAME, 0, (i + 1) * FRAME, FRAME)) for i in range(count)]


def build_hero_sheet(cfg: CharBuild, direction_row: int = HERO_ROW) -> tuple[Image.Image, dict]:
    """合成勇者 spritesheet(纵向排列各动画行)并返回动画元数据。"""
    anim_frames: dict[str, list[Image.Image]] = {}
    for state, folder in cfg.anims.items():
        sheet = composite_sheet(folder, cfg.layers, cfg.body_key)
        if sheet is None:
            continue
        frames = row_to_frames(extract_row(sheet, direction_row))
        if state == "idle":
            # 走路循环前几帧作待机
            anim_frames[state] = frames[: min(4, len(frames))] or frames[:1]
        elif state == "hurt":
            anim_frames[state] = frames[: min(2, len(frames))] or frames[:1]
        else:
            anim_frames[state] = frames

    if not anim_frames:
        raise RuntimeError(f"无法合成勇者: {cfg.id}")

    order = ["idle", "cast", "attack", "hurt"]
    order = [k for k in order if k in anim_frames] + [k for k in anim_frames if k not in order]
    max_w = max(len(anim_frames[k]) for k in order) * FRAME
    height = len(order) * FRAME
    out = Image.new("RGBA", (max_w, height), (0, 0, 0, 0))

    meta_anims: dict = {}
    for row_i, key in enumerate(order):
        frames = anim_frames[key]
        meta_anims[key] = {"row": row_i, "frames": list(range(len(frames))), "fps": fps_for(key)}
        for col_i, frame in enumerate(frames):
            out.paste(frame, (col_i * FRAME, row_i * FRAME))

    meta = {
        "sheet": f"/sprites/heroes/{cfg.id}.png",
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "sheetWidth": max_w,
        "sheetHeight": height,
        "animations": meta_anims,
    }
    return out, meta


def fps_for(state: str) -> int:
    return {"idle": 4, "cast": 8, "attack": 10, "hurt": 6}.get(state, 8)


HEROES: list[CharBuild] = [
    CharBuild(
        "knight",
        layers=[
            "LEGS_plate_armor_pants",
            "FEET_plate_armor_shoes",
            "TORSO_plate_armor_torso",
            "HEAD_plate_armor_helmet",
            "HANDS_plate_armor_gloves",
        ],
        anims={"idle": "walkcycle", "cast": "spellcast", "attack": "slash", "hurt": "hurt"},
    ),
    CharBuild(
        "mage",
        layers=[
            "LEGS_robe_skirt",
            "FEET_shoes_brown",
            "TORSO_robe_shirt_brown",
            "HEAD_robe_hood",
        ],
        anims={"idle": "walkcycle", "cast": "spellcast", "attack": "spellcast", "hurt": "hurt"},
    ),
    CharBuild(
        "rogue",
        layers=[
            "LEGS_pants_greenish",
            "FEET_shoes_brown",
            "TORSO_leather_armor_torso",
            "TORSO_leather_armor_shoulders",
            "TORSO_leather_armor_bracers",
            "HEAD_leather_armor_hat",
            "WEAPON_dagger",
        ],
        anims={"idle": "walkcycle", "cast": "spellcast", "attack": "slash", "hurt": "hurt"},
    ),
    CharBuild(
        "samurai",
        layers=[
            "LEGS_pants_greenish",
            "FEET_shoes_brown",
            "TORSO_chain_armor_torso",
            "TORSO_chain_armor_jacket_purple",
            "HEAD_chain_armor_hood",
            "HANDS_plate_armor_gloves",
            "WEAPON_spear",
        ],
        body_key="BODY_male",
        anims={"idle": "walkcycle", "cast": "spellcast", "attack": "thrust", "hurt": "hurt"},
    ),
]


def build_dragon() -> tuple[Image.Image, dict]:
    """影龙由 scripts/build_fx_and_dragon.py 从 LPC 素材生成。"""
    dragon_path = os.path.join(OUT_ENEMIES, "dragon.png")
    if not os.path.isfile(dragon_path):
        raise FileNotFoundError("请先运行 scripts/build_fx_and_dragon.py 生成 dragon.png")
    sheet = Image.open(dragon_path).convert("RGBA")
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)
    return sheet, manifest["enemies"]["dragon"]


def main() -> None:
    os.makedirs(OUT_HEROES, exist_ok=True)
    os.makedirs(OUT_ENEMIES, exist_ok=True)

    manifest: dict = {"heroes": {}, "enemies": {}}

    for cfg in HEROES:
        img, meta = build_hero_sheet(cfg)
        out_path = os.path.join(OUT_HEROES, f"{cfg.id}.png")
        img.save(out_path)
        manifest["heroes"][cfg.id] = meta
        print(f"[hero] {cfg.id} -> {out_path} ({img.size[0]}x{img.size[1]})")

    # 全部 LPC 敌人（slime / ghost / bat / golem / slime_boss）
    manifest["enemies"].update(build_all_enemies())

    dragon_img, dragon_meta = build_dragon()
    dragon_path = os.path.join(OUT_ENEMIES, "dragon.png")
    dragon_img.save(dragon_path)
    manifest["enemies"]["dragon"] = dragon_meta
    print(f"[enemy] dragon -> {dragon_path}")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[manifest] {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
