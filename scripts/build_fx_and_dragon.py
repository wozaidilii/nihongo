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


def _pixel_line(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    fill: tuple[int, int, int, int],
    width: int = 3,
) -> None:
    draw.line(xy, fill=fill, width=width)
    draw.line((xy[0], xy[1] + width, xy[2], xy[3] + width), fill=(0, 0, 0, 90), width=1)


def _spark(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, color: tuple[int, int, int]) -> None:
    draw.rectangle((cx - r, cy, cx + r, cy + 1), fill=(*color, 210))
    draw.rectangle((cx, cy - r, cx + 1, cy + r), fill=(*color, 210))


def gen_fire() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        cx = 20 + t * 7
        cy = 50 - min(t, 4)
        _circle_burst(d, cx - 10, cy + 5, 16, (110, 24, 12), 130)
        _circle_burst(d, cx, cy, 18 + t // 2, (255, 88, 28), 220)
        _circle_burst(d, cx + 6, cy - 3, 12, (255, 180, 46), 230)
        d.polygon([(cx + 18, cy), (cx + 2, cy - 19), (cx + 6, cy + 16)], fill=(255, 230, 94, 230))
        if t >= 5:
            for r in (18, 27, 36):
                d.rectangle((cx - r, cy - 2, cx + r, cy + 2), fill=(255, 180, 56, max(40, 170 - r * 3)))
                d.rectangle((cx - 2, cy - r, cx + 2, cy + r), fill=(255, 220, 96, max(35, 150 - r * 3)))
        frames.append(img)
    return frames


def gen_holy() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        cx, cy = 48, 48
        beam_alpha = 90 + t * 16
        d.rectangle((42, 6, 54, 90), fill=(255, 248, 184, min(230, beam_alpha)))
        d.rectangle((8, 42, 88, 54), fill=(255, 248, 184, min(220, beam_alpha)))
        _circle_burst(d, cx, cy, 10 + t * 4, (255, 255, 210), max(70, 190 - t * 8))
        _spark(d, 18 + t * 5, 24 + (t % 2) * 8, 5, (255, 245, 160))
        _spark(d, 78 - t * 3, 70 - (t % 3) * 5, 4, (255, 255, 220))
        frames.append(img)
    return frames


def gen_lightning() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        x = 20 + t * 7
        points = [(x, 8), (x - 12, 38), (x + 2, 38), (x - 8, 84), (x + 24, 46), (x + 8, 46)]
        if t % 2 == 0:
            d.line(points + [points[0]], fill=(50, 90, 140, 150), width=10, joint="curve")
        d.polygon(points, fill=(180, 225, 255, 240))
        d.polygon([(x + 4, 12), (x - 4, 36), (x + 8, 36), (x, 66), (x + 16, 42), (x + 6, 42)], fill=(255, 255, 190, 245))
        _circle_burst(d, x + 8, 82, 5 + t, (160, 220, 255), 120)
        frames.append(img)
    return frames


def gen_shadow() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        cx = 18 + t * 7
        cy = 48 + ((t % 3) - 1) * 3
        _circle_burst(d, cx, cy, 18, (18, 8, 32), 210)
        _circle_burst(d, cx + 2, cy - 2, 12, (94, 34, 126), 190)
        d.arc((cx - 24, cy - 24, cx + 24, cy + 24), 220, 80, fill=(190, 72, 220, 190), width=4)
        if t >= 5:
            _circle_burst(d, cx, cy, 30 + (t - 5) * 7, (70, 16, 110), 75)
            _spark(d, cx + 18, cy - 18, 5, (210, 92, 240))
        frames.append(img)
    return frames


def gen_slash() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        offset = t * 4
        d.arc((8 + offset, 8, 88 + offset, 88), 210, 326, fill=(35, 46, 72, 150), width=10)
        d.arc((6 + offset, 6, 90 + offset, 90), 210, 326, fill=(220, 246, 255, 240), width=5)
        d.arc((18 + offset, 18, 78 + offset, 78), 210, 326, fill=(115, 185, 255, 210), width=3)
        if t >= 4:
            _spark(d, 70, 32 + (t % 2) * 10, 5, (255, 240, 160))
        frames.append(img)
    return frames


def gen_thrust() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        x = 10 + t * 8
        _pixel_line(d, (x, 48, 88, 48), (210, 230, 255, 235), width=5)
        d.polygon([(88, 48), (70, 38), (70, 58)], fill=(245, 250, 255, 240))
        d.polygon([(88, 48), (76, 43), (76, 53)], fill=(96, 170, 255, 210))
        _spark(d, min(88, x + 38), 48, 4 + t // 2, (220, 245, 255))
        frames.append(img)
    return frames


def gen_dagger() -> list[Image.Image]:
    frames = []
    for t in range(8):
        img = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        x = 12 + t * 8
        d.polygon([(x, 60), (x + 36, 22), (x + 44, 30), (x + 8, 68)], fill=(38, 80, 66, 160))
        d.polygon([(x + 6, 58), (x + 38, 26), (x + 42, 30), (x + 10, 62)], fill=(190, 255, 220, 235))
        d.rectangle((x + 1, 62, x + 16, 68), fill=(80, 48, 30, 220))
        if t >= 4:
            _spark(d, 74, 30, 5, (170, 255, 200))
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
