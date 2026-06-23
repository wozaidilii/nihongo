#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LPC 敌人精灵构建：从 OpenGameArt 素材生成统一 spritesheet + manifest 条目。

素材来源见 public/sprites/CREDITS-LPC.md
"""

from __future__ import annotations

import os
import urllib.request
from dataclasses import dataclass
from typing import Callable

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
TMP = os.path.join(ROOT, "public", "sprites", "_tmp")
OUT_ENEMIES = os.path.join(ROOT, "public", "sprites", "enemies")

# 首次构建时自动下载到 _tmp（已存在则跳过）
DOWNLOADS: dict[str, str] = {
    "slime_calciumtrice.png": "https://opengameart.org/sites/default/files/slime_0.png",
    "lpc-monsters.zip": "https://opengameart.org/sites/default/files/lpc-monsters.zip",
    "golem-walk.png": "https://opengameart.org/sites/default/files/golem-walk.png",
    "golem-atk.png": "https://opengameart.org/sites/default/files/golem-atk.png",
    "golem-die.png": "https://opengameart.org/sites/default/files/golem-die.png",
    "in-battle-sprites.png": "https://opengameart.org/sites/default/files/in%20battle%20sprites%201.PNG",
}


@dataclass
class GridEnemyConfig:
    id: str
    source: str
    frame_w: int = 64
    frame_h: int = 64
    anims: dict[str, tuple[int, int | None]] | None = None
    scale: float = 1.5
    flip: bool = True
    rotate_180: bool = False
    fps: dict[str, int] | None = None


def ensure_assets() -> None:
    """确保 _tmp 内 LPC 敌人源文件存在"""
    os.makedirs(TMP, exist_ok=True)

    for filename, url in DOWNLOADS.items():
        dest = os.path.join(TMP, filename)
        if os.path.isfile(dest):
            continue
        print(f"[fetch] {filename}")
        urllib.request.urlretrieve(url, dest)

    monsters_dir = os.path.join(TMP, "lpc-monsters")
    if not os.path.isdir(monsters_dir):
        zip_path = os.path.join(TMP, "lpc-monsters.zip")
        if os.path.isfile(zip_path):
            import zipfile

            with zipfile.ZipFile(zip_path) as zf:
                zf.extractall(TMP)
            print(f"[unzip] lpc-monsters -> {monsters_dir}")


def pad_sprite_bottom(im: Image.Image, fw: int, fh: int) -> Image.Image:
    """把不规则立绘居中贴入统一帧，脚底对齐底部。"""
    canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    bbox = im.getbbox()
    if not bbox:
        return canvas
    tight = im.crop(bbox)
    tw, th = tight.size
    scale = min((fw - 8) / tw, (fh - 6) / th, 1.0)
    if scale < 1.0:
        tw = max(1, int(tw * scale))
        th = max(1, int(th * scale))
        tight = tight.resize((tw, th), Image.Resampling.NEAREST)
    x = (fw - tw) // 2
    y = fh - th - 2
    canvas.paste(tight, (x, y), tight)
    return canvas


def remove_edge_white_background(im: Image.Image, threshold: int = 245) -> Image.Image:
    """把源图边缘连通的白色背景转为透明，保留角色内部高光。"""
    out = im.convert("RGBA")
    w, h = out.size
    px = out.load()
    stack: list[tuple[int, int]] = []
    seen: set[tuple[int, int]] = set()

    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0 or r < threshold or g < threshold or b < threshold:
            continue
        px[x, y] = (r, g, b, 0)
        stack.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    return out


def shift_frame(im: Image.Image, dx: int, dy: int) -> Image.Image:
    """在固定画布内平移精灵，用于待机动画与突进。"""
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (dx, dy), im)
    return out


def tint_hurt_flash(im: Image.Image) -> Image.Image:
    """受击闪白"""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (
                min(255, r + 80),
                min(255, g + 50),
                min(255, b + 50),
                a,
            )
    return out


def make_death_frames(base: Image.Image, count: int = 4) -> list[Image.Image]:
    """静态立绘倒地：下沉 + 渐隐"""
    frames: list[Image.Image] = []
    for i in range(count):
        fr = Image.new("RGBA", base.size, (0, 0, 0, 0))
        sink = i * 4
        alpha = max(0, 255 - i * 55)
        layer = base.copy()
        px = layer.load()
        w, h = layer.size
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a > 0:
                    px[x, y] = (r, g, b, int(a * alpha / 255))
        fr.paste(layer, (0, sink), layer)
        frames.append(fr)
    return frames


def build_demon_lord_gnu_mage() -> tuple[Image.Image, dict]:
    """魔王：LPC in-battle Gnu Mage，侧视持杖，朝左与勇者对峙。"""
    path = os.path.join(TMP, "in-battle-sprites.png")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"缺少魔王素材: {path}（请先下载 LPC in-battle RPG sprites）")

    sheet = Image.open(path).convert("RGBA")
    # Gnu Mage 位于原图右列、倒数第二行（见 OGA 说明）
    crop = remove_edge_white_background(sheet.crop((168, 250, 254, 326)))
    bbox = crop.getbbox()
    if not bbox:
        raise ValueError("无法从 in-battle-sprites 裁切 Gnu Mage")
    raw = flip_frame(crop.crop(bbox))  # 原图朝右，翻转后朝左

    fw = fh = 96
    base = pad_sprite_bottom(raw, fw, fh)
    idle = [shift_frame(base, 0, dy) for dy in (0, -1, 0, 1)]
    attack = [shift_frame(base, dx, 0) for dx in (0, -3, -6, -3, 0)]
    hurt = [tint_hurt_flash(base)]
    death = make_death_frames(base, 4)

    boss_scale = 2.0
    anims_data = {
        "idle": scale_frames(idle, boss_scale),
        "attack": scale_frames(attack, boss_scale),
        "hurt": scale_frames(hurt, boss_scale),
        "death": scale_frames(death, boss_scale),
    }
    img, meta = pack_enemy_sheet(anims_data, "demon_lord", flip_x=False)
    meta["animations"]["idle"]["fps"] = 4
    meta["animations"]["attack"]["fps"] = 10
    meta["animations"]["death"]["fps"] = 6
    return img, meta


def flip_frame(im: Image.Image) -> Image.Image:
    return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def tint_purple(im: Image.Image) -> Image.Image:
    """Boss 史莱姆：偏紫"""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (
                min(255, int(r * 0.75 + 40)),
                max(0, int(g * 0.55)),
                min(255, int(b * 0.9 + 50)),
                a,
            )
    return out


def tint_fire(im: Image.Image) -> Image.Image:
    """炎魔像：暖色"""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (
                min(255, r + 25),
                min(255, int(g * 0.85 + 20)),
                max(0, int(b * 0.7)),
                a,
            )
    return out


def extract_row_frames(
    sheet: Image.Image,
    row: int,
    fw: int,
    fh: int,
    max_frames: int | None = None,
) -> list[Image.Image]:
    frames: list[Image.Image] = []
    cols = sheet.width // fw
    for col in range(cols):
        fr = sheet.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))
        if fr.getbbox() is None:
            break
        frames.append(fr.convert("RGBA"))
        if max_frames is not None and len(frames) >= max_frames:
            break
    return frames or [sheet.crop((0, row * fh, fw, (row + 1) * fh)).convert("RGBA")]


def scale_frames(frames: list[Image.Image], scale: float) -> list[Image.Image]:
    if scale == 1:
        return frames
    out: list[Image.Image] = []
    for fr in frames:
        nw = max(1, int(fr.width * scale))
        nh = max(1, int(fr.height * scale))
        out.append(fr.resize((nw, nh), Image.Resampling.NEAREST))
    return out


def pack_enemy_sheet(
    anims_data: dict[str, list[Image.Image]],
    enemy_id: str,
    flip_x: bool = False,
) -> tuple[Image.Image, dict]:
    order = ["idle", "attack", "hurt", "death"]
    order = [k for k in order if k in anims_data] + [k for k in anims_data if k not in order]

    fw = anims_data[order[0]][0].width
    fh = anims_data[order[0]][0].height
    max_w = max(len(anims_data[k]) for k in order) * fw
    out_h = len(order) * fh
    sheet = Image.new("RGBA", (max_w, out_h), (0, 0, 0, 0))
    meta_anims: dict = {}

    for ri, key in enumerate(order):
        frames = anims_data[key]
        if flip_x:
            frames = [flip_frame(f) for f in frames]
        meta_anims[key] = {
            "row": ri,
            "frames": list(range(len(frames))),
            "fps": {"idle": 4, "attack": 8, "hurt": 4, "death": 4}.get(key, 6),
        }
        for ci, fr in enumerate(frames):
            sheet.paste(fr, (ci * fw, ri * fh))

    meta = {
        "sheet": f"/sprites/enemies/{enemy_id}.png",
        "frameWidth": fw,
        "frameHeight": fh,
        "sheetWidth": max_w,
        "sheetHeight": out_h,
        "scale": 1,
        "flipX": False,
        "animations": meta_anims,
    }
    return sheet, meta


def build_grid_enemy(cfg: GridEnemyConfig) -> tuple[Image.Image, dict]:
    path = os.path.join(TMP, cfg.source)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"缺少敌人素材: {path}")

    sheet = Image.open(path).convert("RGBA")
    anims_map = cfg.anims or {
        "idle": (0, 4),
        "attack": (1, None),
        "hurt": (2, 1),
        "death": (3, None),
    }

    anims_data: dict[str, list[Image.Image]] = {}
    for state, (row, max_f) in anims_map.items():
        frames = extract_row_frames(sheet, row, cfg.frame_w, cfg.frame_h, max_f)
        if cfg.rotate_180:
            frames = [f.rotate(180, expand=False) for f in frames]
        anims_data[state] = frames

    if not anims_data.get("hurt"):
        anims_data["hurt"] = anims_data.get("idle", [])[:1]

    scaled = {state: scale_frames(frames, cfg.scale) for state, frames in anims_data.items()}
    img, meta = pack_enemy_sheet(scaled, cfg.id, flip_x=cfg.flip)
    if cfg.fps:
        for state, fps in cfg.fps.items():
            if state in meta["animations"]:
                meta["animations"][state]["fps"] = fps
    return img, meta


def build_slime_calciumtrice(
    enemy_id: str = "slime",
    scale: float = 1,
    tint_fn: Callable[[Image.Image], Image.Image] | None = None,
) -> tuple[Image.Image, dict]:
    path = os.path.join(TMP, "slime_calciumtrice.png")
    sheet = Image.open(path).convert("RGBA")
    fw = fh = 32

    def row_frames(row: int, max_frames: int = 10) -> list[Image.Image]:
        frames = []
        for col in range(2):
            fr = sheet.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))
            if tint_fn:
                fr = tint_fn(fr)
            frames.append(fr)
        return frames[:max_frames]

    anims_data = {
        "idle": row_frames(0, 2),
        "attack": row_frames(6, 2),
        "hurt": row_frames(8, 1),
        "death": row_frames(9, 1),
    }

    pixel_scale = scale if scale != 1 else 1
    if pixel_scale != 1:
        for k in anims_data:
            anims_data[k] = scale_frames(anims_data[k], pixel_scale)

    fw = int(32 * pixel_scale)
    fh = int(32 * pixel_scale)
    order = ["idle", "attack", "hurt", "death"]
    max_w = max(len(anims_data[k]) for k in order) * fw
    out = Image.new("RGBA", (max_w, len(order) * fh), (0, 0, 0, 0))
    meta_anims = {}
    for ri, key in enumerate(order):
        frames = anims_data[key]
        meta_anims[key] = {
            "row": ri,
            "frames": list(range(len(frames))),
            "fps": {"idle": 3, "attack": 8, "hurt": 4, "death": 4}.get(key, 6),
        }
        for ci, fr in enumerate(frames):
            out.paste(fr, (ci * fw, ri * fh))

    display_scale = 2.5 if enemy_id == "slime_boss" else 2
    meta = {
        "sheet": f"/sprites/enemies/{enemy_id}.png",
        "frameWidth": fw,
        "frameHeight": fh,
        "sheetWidth": max_w,
        "sheetHeight": len(order) * fh,
        "scale": display_scale,
        "animations": meta_anims,
    }
    return out, meta


def build_golem() -> tuple[Image.Image, dict]:
    walk = Image.open(os.path.join(TMP, "golem-walk.png")).convert("RGBA")
    atk = Image.open(os.path.join(TMP, "golem-atk.png")).convert("RGBA")
    die = Image.open(os.path.join(TMP, "golem-die.png")).convert("RGBA")
    fw = fh = 64
    row = 1

    idle = extract_row_frames(walk, row, fw, fh, 4)
    attack = extract_row_frames(atk, row, fw, fh, None)
    death = extract_row_frames(die, row, fw, fh, None) or extract_row_frames(die, 0, fw, fh, None)
    hurt = [idle[0].copy()]

    anims_data = {
        "idle": scale_frames([tint_fire(f) for f in idle], 1.5),
        "attack": scale_frames([tint_fire(f) for f in attack], 1.5),
        "hurt": scale_frames([tint_fire(f) for f in hurt], 1.5),
        "death": scale_frames([tint_fire(f) for f in death], 1.5),
    }
    return pack_enemy_sheet(anims_data, "golem", flip_x=False)


def build_all_enemies() -> dict:
    ensure_assets()
    os.makedirs(OUT_ENEMIES, exist_ok=True)
    enemies: dict = {}

    builders: list[tuple[str, Callable[[], tuple[Image.Image, dict]]]] = [
        ("slime", lambda: build_slime_calciumtrice("slime", scale=1)),
        ("slime_boss", lambda: build_slime_calciumtrice("slime_boss", scale=1.35, tint_fn=tint_purple)),
        (
            "ghost",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="ghost",
                    source="lpc-monsters/ghost.png",
                    anims={
                        "idle": (0, 4),
                        "attack": (1, 4),
                        "hurt": (2, 1),
                        "death": (3, 4),
                    },
                    scale=1.5,
                )
            ),
        ),
        (
            "bat",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="bat",
                    source="lpc-monsters/bat.png",
                    anims={
                        "idle": (0, 4),
                        "attack": (1, 5),
                        "hurt": (2, 1),
                        "death": (3, 3),
                    },
                    scale=1.5,
                    fps={"idle": 6, "attack": 10},
                )
            ),
        ),
        ("golem", build_golem),
        (
            "bee",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="bee",
                    source="lpc-monsters/bee.png",
                    frame_w=32,
                    frame_h=32,
                    anims={"idle": (0, 4), "attack": (1, 3), "hurt": (2, 1), "death": (3, 2)},
                    scale=2,
                    fps={"idle": 8, "attack": 12},
                )
            ),
        ),
        (
            "snake",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="snake",
                    source="lpc-monsters/snake.png",
                    anims={"idle": (0, 4), "attack": (1, 4), "hurt": (2, 1), "death": (3, 3)},
                    scale=1.5,
                )
            ),
        ),
        (
            "small_worm",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="small_worm",
                    source="lpc-monsters/small_worm.png",
                    anims={"idle": (0, 4), "attack": (1, 5), "hurt": (2, 1), "death": (3, 4)},
                    scale=1.4,
                )
            ),
        ),
        (
            "eyeball",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="eyeball",
                    source="lpc-monsters/eyeball.png",
                    anims={"idle": (0, 4), "attack": (1, 4), "hurt": (2, 1), "death": (3, 3)},
                    scale=1.5,
                )
            ),
        ),
        (
            "pumpking",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="pumpking",
                    source="lpc-monsters/pumpking.png",
                    anims={"idle": (0, 4), "attack": (1, 4), "hurt": (2, 1), "death": (3, 4)},
                    scale=1.5,
                )
            ),
        ),
        (
            "pumpking_boss",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="pumpking_boss",
                    source="lpc-monsters/pumpking.png",
                    anims={"idle": (0, 4), "attack": (1, 4), "hurt": (2, 1), "death": (3, 4)},
                    scale=1.85,
                    flip=False,
                )
            ),
        ),
        (
            "big_worm",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="big_worm",
                    source="lpc-monsters/big_worm.png",
                    anims={"idle": (0, 4), "attack": (1, 5), "hurt": (2, 1), "death": (3, 4)},
                    scale=1.6,
                )
            ),
        ),
        (
            "man_eater",
            lambda: build_grid_enemy(
                GridEnemyConfig(
                    id="man_eater",
                    source="lpc-monsters/man_eater_flower.png",
                    anims={"idle": (0, 4), "attack": (1, 6), "hurt": (2, 1), "death": (3, 5)},
                    scale=1.2,
                    flip=False,
                )
            ),
        ),
        ("demon_lord", build_demon_lord_gnu_mage),
    ]

    for enemy_id, builder in builders:
        img, meta = builder()
        out_path = os.path.join(OUT_ENEMIES, f"{enemy_id}.png")
        img.save(out_path)
        enemies[enemy_id] = meta
        print(f"[enemy] {enemy_id} -> {out_path} ({img.size[0]}x{img.size[1]})")

    return enemies


if __name__ == "__main__":
    build_all_enemies()
