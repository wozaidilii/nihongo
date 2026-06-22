#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成技能特效 spritesheet + LPC 影龙精灵。

龙素材(LPC / OpenGameArt):
- RPG Enemies: 11 Dragons — Stephen "Redshrike" Challener 等 (CC-BY-SA 3.0 / GPL)
- Dragon idle animation — Daniel Stephens (Scribe)，基于 Redshrike/Surt 龙 (CC-BY-SA 3.0)
"""

from __future__ import annotations

import json
import os
import urllib.request
from PIL import Image, ImageDraw

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
TMP = os.path.join(ROOT, "public", "sprites", "_tmp")
OUT_FX = os.path.join(ROOT, "public", "sprites", "fx")
OUT_ENEMIES = os.path.join(ROOT, "public", "sprites", "enemies")
MANIFEST_FX = os.path.join(OUT_FX, "fx-manifest.json")

# LPC Redshrike 古代龙 idle 动画(3 帧，174×103)
LPC_DRAGON_IDLE = [
    ("dragon_idle_0.png", "https://opengameart.org/sites/default/files/0%20%5Bupdated%5D.png"),
    ("dragon_idle_1.png", "https://opengameart.org/sites/default/files/1%20%5Bupdated%5D.png"),
    ("dragon_idle_2.png", "https://opengameart.org/sites/default/files/2%20%5Bupdated%5D.png"),
]

FRAME_W = 174
FRAME_H = 103


def _save_sheet(frames: list[Image.Image], out_path: str, meta: dict, manifest: dict, key: str) -> None:
    if not frames:
        return
    fw = frames[0].width
    fh = frames[0].height
    w = len(frames) * fw
    h = fh
    sheet = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * fw, 0))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    sheet.save(out_path)
    manifest[key] = {
        **meta,
        "sheet": "/sprites/fx/" + os.path.basename(out_path),
        "frameWidth": fw,
        "frameHeight": fh,
        "sheetWidth": w,
        "sheetHeight": h,
        "animations": {"play": {"row": 0, "frames": list(range(len(frames))), "fps": 12}},
    }


def _circle_burst(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, color: tuple, alpha: int) -> None:
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))


def gen_fire() -> list[Image.Image]:
    frames = []
    colors = [(255, 90, 30), (255, 160, 40), (255, 220, 80)]
    for t in range(8):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        for i, c in enumerate(colors):
            r = 8 + t * 3 + i * 4
            _circle_burst(d, 32, 40 - t, r, c, 200 - i * 40)
        d.polygon([(32, 8), (24, 28 + t), (40, 28 + t)], fill=(255, 200, 60, 220))
        frames.append(img)
    return frames


def gen_holy() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        _circle_burst(d, 32, 32, 10 + t * 2, (255, 255, 200), 180)
        d.rectangle((28, 8, 36, 56), fill=(255, 255, 220, 120 + t * 10))
        d.rectangle((8, 28, 56, 36), fill=(255, 255, 220, 120 + t * 10))
        frames.append(img)
    return frames


def gen_lightning() -> list[Image.Image]:
    frames = []
    bolts = [(32, 4, 20, 50, 44, 50), (32, 4, 44, 50, 20, 50)]
    for t in range(8):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        if t % 2 == 0:
            d.polygon(bolts[0], fill=(180, 220, 255, 230))
            d.polygon(bolts[1], fill=(120, 180, 255, 200))
        _circle_burst(d, 32, 52, 6 + t, (200, 240, 255), 150)
        frames.append(img)
    return frames


def gen_shadow() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        _circle_burst(d, 32, 32, 12 + t * 3, (60, 20, 90), 160)
        _circle_burst(d, 32, 32, 6 + t * 2, (120, 40, 160), 120)
        frames.append(img)
    return frames


def gen_slash() -> list[Image.Image]:
    frames = []
    for t in range(6):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.arc((4 + t * 4, 8, 60, 56), 300, 60, fill=(220, 240, 255, 220), width=4)
        frames.append(img)
    return frames


def gen_thrust() -> list[Image.Image]:
    frames = []
    for t in range(6):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.polygon([(8 + t * 6, 30), (56, 26), (56, 38)], fill=(200, 220, 255, 220))
        frames.append(img)
    return frames


def gen_dagger() -> list[Image.Image]:
    frames = []
    for t in range(6):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.line((12 + t * 4, 44 - t * 2, 48, 20), fill=(180, 255, 200, 230), width=3)
        frames.append(img)
    return frames


FX_BUILDERS = {
    "fire": gen_fire,
    "holy": gen_holy,
    "lightning": gen_lightning,
    "shadow": gen_shadow,
    "slash": gen_slash,
    "thrust": gen_thrust,
    "dagger": gen_dagger,
}


def ensure_lpc_dragon_frames() -> list[str]:
    """下载并缓存 LPC 龙 idle 帧"""
    os.makedirs(TMP, exist_ok=True)
    paths: list[str] = []
    for filename, url in LPC_DRAGON_IDLE:
        dest = os.path.join(TMP, filename)
        if not os.path.isfile(dest):
            print(f"[dragon] 下载 LPC {filename}")
            urllib.request.urlretrieve(url, dest)
        paths.append(dest)
    return paths


def flip_frame(im: Image.Image) -> Image.Image:
    """怪物朝左"""
    return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def tint_hurt(im: Image.Image) -> Image.Image:
    """受击闪红"""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (min(255, r + 70), max(0, g - 35), max(0, b - 35), a)
    return out


def tint_death(im: Image.Image) -> Image.Image:
    """死亡变暗"""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (r // 2, g // 2, b // 2, max(0, a - 40))
    return out


def normalize_frame(im: Image.Image) -> Image.Image:
    """统一帧尺寸，内容居中"""
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    im = im.convert("RGBA")
    ox = max(0, (FRAME_W - im.width) // 2)
    oy = max(0, (FRAME_H - im.height) // 2)
    canvas.paste(im, (ox, oy))
    return canvas


def build_dragon() -> dict:
    """
    LPC Redshrike 古代龙 + Scribe 呼吸动画 → 影龙 spritesheet。
    idle: 0→1→2→1 循环；attack: 张口帧序列；hurt/death: 着色变体。
    """
    paths = ensure_lpc_dragon_frames()
    idle_src = [flip_frame(normalize_frame(Image.open(p))) for p in paths]

    idle = [idle_src[0], idle_src[1], idle_src[2], idle_src[1]]
    attack = [idle_src[2], idle_src[1], idle_src[0]]
    hurt = [tint_hurt(idle_src[1])]
    death = [tint_death(idle_src[0])]

    anims_data = {"idle": idle, "attack": attack, "hurt": hurt, "death": death}
    order = ["idle", "attack", "hurt", "death"]
    max_w = max(len(anims_data[k]) for k in order) * FRAME_W
    out_h = len(order) * FRAME_H
    sheet = Image.new("RGBA", (max_w, out_h), (0, 0, 0, 0))
    meta_anims = {}

    for ri, key in enumerate(order):
        frames = anims_data[key]
        meta_anims[key] = {
            "row": ri,
            "frames": list(range(len(frames))),
            "fps": {"idle": 4, "attack": 8, "hurt": 4, "death": 3}.get(key, 6),
        }
        for ci, fr in enumerate(frames):
            sheet.paste(fr, (ci * FRAME_W, ri * FRAME_H))

    out_path = os.path.join(OUT_ENEMIES, "dragon.png")
    sheet.save(out_path)

    return {
        "sheet": "/sprites/enemies/dragon.png",
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "sheetWidth": max_w,
        "sheetHeight": out_h,
        "scale": 1,
        "flipX": False,
        "animations": meta_anims,
    }


def main() -> None:
    os.makedirs(OUT_FX, exist_ok=True)
    fx_manifest: dict = {}

    for key, builder in FX_BUILDERS.items():
        frames = builder()
        out = os.path.join(OUT_FX, f"{key}.png")
        _save_sheet(frames, out, {"scale": 1.5}, fx_manifest, key)
        print(f"[fx] {key} -> {out}")

    dragon_meta = build_dragon()
    print(f"[dragon] LPC Redshrike ancient dragon -> {os.path.join(OUT_ENEMIES, 'dragon.png')}")

    with open(MANIFEST_FX, "w", encoding="utf-8") as f:
        json.dump(fx_manifest, f, ensure_ascii=False, indent=2)

    sprites_manifest_path = os.path.join(ROOT, "public", "sprites", "sprites-manifest.json")
    if os.path.isfile(sprites_manifest_path):
        with open(sprites_manifest_path, encoding="utf-8") as f:
            sprites = json.load(f)
    else:
        sprites = {"heroes": {}, "enemies": {}}

    # 只更新 dragon 与 fx，保留 heroes/slime
    sprites.setdefault("enemies", {})["dragon"] = dragon_meta
    sprites["fx"] = fx_manifest
    with open(sprites_manifest_path, "w", encoding="utf-8") as f:
        json.dump(sprites, f, ensure_ascii=False, indent=2)
    print(f"[manifest] updated {sprites_manifest_path}")


if __name__ == "__main__":
    main()
