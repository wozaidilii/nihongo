#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 VoxCPM2 的 Voice Design 能力为「勇者日语探险」生成中二动漫感台词配音。

运行方式(需先 clone VoxCPM 并安装依赖):
  git clone https://github.com/OpenBMB/VoxCPM
  cd VoxCPM && uv venv --python 3.11 .venv && uv pip install -p .venv -e .
  cd .. && VoxCPM/.venv/bin/python scripts/generate_voices.py
"""

import os
import json
import sys

import soundfile as sf
from voxcpm import VoxCPM

# ---------- 路径 ----------
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(HERE, "..", "public", "voices"))
os.makedirs(OUT_DIR, exist_ok=True)

# ---------- 各语体的动漫/中二音色描述(Voice Design) ----------
PERSONA = {
    "keigo": "(A noble young knight, gallant and dignified male voice, elegant, heroic and passionate, dramatic Japanese anime style)",
    "chuuni": "(A theatrical dark sorcerer, intense over-the-top chuunibyou young male voice, brooding, grandiose and powerful, highly dramatic Japanese anime style)",
    "tameguchi": "(A cheeky confident teenage rogue, playful energetic and cool male voice, smirking and mischievous, lively Japanese anime style)",
    "bushi": "(A stern old samurai, deep resolute gravelly male voice, solemn bushido warrior, dramatic Japanese anime style)",
}

SAMPLES = {
    "keigo": "我が剣に懸けて、必ずや勝利いたします。",
    "chuuni": "闇よ、我が呼び声に応えよ……穿て、漆黒の槍！",
    "tameguchi": "へへっ、こんなの楽勝だぜ！",
    "bushi": "拙者の刃、いざ唸るでござる！",
}

SKILLS = {
    "s-flame": {
        "keigo": "炎よ、燃えてください",
        "chuuni": "燃えよ、我が炎",
        "tameguchi": "燃えろ、炎",
        "bushi": "炎よ、いざ参る",
    },
    "s-light": {
        "keigo": "光よ、導いてください",
        "chuuni": "光よ、闇を貫け",
        "tameguchi": "光、頼むぜ",
        "bushi": "光明よ、いざ",
    },
    "s-thunder": {
        "keigo": "雷よ、落ちてください",
        "chuuni": "雷よ、我に宿れ",
        "tameguchi": "雷、落ちろ",
        "bushi": "雷よ、いざ落ちよ",
    },
    "s-final": {
        "keigo": "我が剣で、終わらせます",
        "chuuni": "我が剣よ、運命を断て",
        "tameguchi": "俺の剣で、終わりだぜ",
        "bushi": "拙者の剣で、討ち取るでござる",
    },
}


def build_jobs():
    """汇总所有要合成的任务：(key, filename, styleId, 文本)。"""
    jobs = []
    for style, text in SAMPLES.items():
        jobs.append((f"sample_{style}", f"sample_{style}.wav", style, text))
    for skill_id, by_style in SKILLS.items():
        for style, text in by_style.items():
            key = f"skill_{skill_id}_{style}"
            jobs.append((key, f"{key}.wav", style, text))
    return jobs


def main():
    jobs = build_jobs()
    print(f"[VoxCPM] 准备合成 {len(jobs)} 条台词 -> {OUT_DIR}", flush=True)

    print("[VoxCPM] 加载模型 openbmb/VoxCPM2 (首次会自动下载，请耐心等待)…", flush=True)
    model = VoxCPM.from_pretrained(
        "openbmb/VoxCPM2",
        load_denoiser=False,
        optimize=False,
        device="auto",
    )
    sample_rate = model.tts_model.sample_rate
    print(f"[VoxCPM] 模型就绪，采样率 {sample_rate}Hz", flush=True)

    manifest = {}
    for i, (key, filename, style, text) in enumerate(jobs, 1):
        prompt = f"{PERSONA[style]}{text}"
        print(f"[{i}/{len(jobs)}] {key}: {text}", flush=True)
        try:
            wav = model.generate(
                text=prompt,
                cfg_value=2.0,
                inference_timesteps=16,
            )
            out_path = os.path.join(OUT_DIR, filename)
            sf.write(out_path, wav, sample_rate)
            manifest[key] = f"/voices/{filename}"
        except Exception as e:
            print(f"   ! 合成失败({key}): {e}", file=sys.stderr, flush=True)

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[VoxCPM] 完成，成功 {len(manifest)}/{len(jobs)} 条；manifest -> {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
