#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成技能特效 spritesheet + 影龙精灵。
龙素材：OpenGameArt carnageddon「side view dragon」(CC-BY-SA 3.0)
"""

from __future__ import annotations

import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
TMP = os.path.join(ROOT, "public", "sprites", "_tmp")
OUT_FX = os.path.join(ROOT, "public", "sprites", "fx")
OUT_ENEMIES = os.path.join(ROOT, "public", "sprites", "enemies")
MANIFEST_FX = os.path.join(OUT_FX, "fx-manifest.json")

# 侧视龙源图(96×128 = 3×4 格，每格 32×32)
DRAGON_SRC = os.path.join(TMP, "side_view_dragon.png")
DRAGON_SRC_URL = "https://opengameart.org/sites/default/files/side%20view%20dragon.png"

FRAME = 32


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


def ensure_dragon_src() -> str:
    """确保侧视龙源图已下载"""
    if os.path.isfile(DRAGON_SRC):
        return DRAGON_SRC
    os.makedirs(TMP, exist_ok=True)
    import urllib.request

    print(f"[dragon] 下载 {DRAGON_SRC_URL}")
    urllib.request.urlretrieve(DRAGON_SRC_URL, DRAGON_SRC)
    return DRAGON_SRC


def extract_frames(src: Image.Image) -> list[Image.Image]:
    """从 96×128 源图提取 10 帧(32×32)"""
    frames: list[Image.Image] = []
    for row in range(4):
        for col in range(3):
            x, y = col * FRAME, row * FRAME
            fr = src.crop((x, y, x + FRAME, y + FRAME))
            if max(p[3] for p in fr.getdata()) > 0:
                frames.append(fr)
    return frames


def flip_frame(im: Image.Image) -> Image.Image:
    """怪物朝左"""
    return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def shadow_tint(im: Image.Image) -> Image.Image:
    """绿龙 → 影龙紫调，保留火焰等高饱和色"""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            # 火焰/红嘴：保留暖色
            if r > 140 and g < 120:
                px[x, y] = (min(255, r), min(255, g + 20), b, a)
                continue
            # 主体绿色 → 深紫青
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if g >= r and g >= b - 10:
                nr = int(40 + lum * 0.35)
                ng = int(25 + lum * 0.25)
                nb = int(70 + lum * 0.45)
                px[x, y] = (min(255, nr), min(255, ng), min(255, nb), a)
            elif lum < 40:
                px[x, y] = (r, g, min(255, b + 30), a)
    return im


def tint_hurt(im: Image.Image) -> Image.Image:
    """受击闪红"""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            px[x, y] = (min(255, r + 80), max(0, g - 30), max(0, b - 30), a)
    return im


def upscale(im: Image.Image, scale: int = 2) -> Image.Image:
    nw, nh = im.width * scale, im.height * scale
    return im.resize((nw, nh), Image.Resampling.NEAREST)


def build_dragon() -> dict:
    """
    侧视像素龙 → 影龙 spritesheet。
    源帧序：0-2 抬头 / 3-5 展翅 idle / 6-8 扑击 / 9 吐息
    """
    path = ensure_dragon_src()
    src = Image.open(path).convert("RGBA")
    raw = extract_frames(src)
    if len(raw) < 10:
        raise RuntimeError(f"龙源图帧数不足: {len(raw)}")

    processed = [upscale(shadow_tint(flip_frame(f)), 2) for f in raw]
    fw = processed[0].width  # 64

    idle = processed[3:6]
    attack = processed[6:10]
    hurt = [tint_hurt(processed[4].copy())]
    death = [processed[9].copy()]

    anims_data = {"idle": idle, "attack": attack, "hurt": hurt, "death": death}
    order = ["idle", "attack", "hurt", "death"]
    max_w = max(len(anims_data[k]) for k in order) * fw
    out_h = len(order) * fw
    sheet = Image.new("RGBA", (max_w, out_h), (0, 0, 0, 0))
    meta_anims = {}

    for ri, key in enumerate(order):
        frames = anims_data[key]
        meta_anims[key] = {
            "row": ri,
            "frames": list(range(len(frames))),
            "fps": {"idle": 5, "attack": 10, "hurt": 4, "death": 4}.get(key, 6),
        }
        for ci, fr in enumerate(frames):
            sheet.paste(fr, (ci * fw, ri * fw))

    out_path = os.path.join(OUT_ENEMIES, "dragon.png")
    sheet.save(out_path)

    return {
        "sheet": "/sprites/enemies/dragon.png",
        "frameWidth": fw,
        "frameHeight": fw,
        "sheetWidth": max_w,
        "sheetHeight": out_h,
        "scale": 1.75,
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
    print(f"[dragon] side-view shadow dragon -> {os.path.join(OUT_ENEMIES, 'dragon.png')}")

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
