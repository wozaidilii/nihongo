#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 VoxCPM2 Voice Design 为各职业专属技能生成中二动漫配音。

运行:
  VoxCPM/.venv/bin/python scripts/generate_voices.py
"""

from __future__ import annotations

import json
import os
import sys

import soundfile as sf
from voxcpm import VoxCPM

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(HERE, "..", "public", "voices"))
os.makedirs(OUT_DIR, exist_ok=True)

# 语体示例(选职业试听)
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

# 职业 → 语体 persona
CLASS_PERSONA = {
    "knight": "keigo",
    "mage": "chuuni",
    "rogue": "tameguchi",
    "samurai": "bushi",
}

# 职业专属技能咒文(与 src/data/skills.ts 对齐)
CLASS_SKILLS: dict[str, list[tuple[str, str]]] = {
    "knight": [
        ("k-shield", "盾よ、我を護れ"),
        ("k-smite", "正道の光よ、裁け"),
        ("k-oath", "我が誓い、悪を断つ"),
        ("k-judgment", "神よ、裁きをください"),
    ],
    "mage": [
        ("m-orb", "我が左手に、闇黒の球"),
        ("m-whisper", "禁じられた言霊よ、起きよ"),
        ("m-storm", "終焉の嵐、我に従え"),
        ("m-void", "虚無よ、全てを呑め"),
    ],
    "rogue": [
        ("r-shadow", "影に乗って、いくぜ"),
        ("r-stab", "背中から、一刺しだ"),
        ("r-volt", "サッと決める、雷だぜ"),
        ("r-finisher", "これで終わりだぜ"),
    ],
    "samurai": [
        ("s-iai", "拙者、居合にて斬るでござる"),
        ("s-wind", "風よ、刃となれでござる"),
        ("s-thunder", "雷鳴と共に、斬るでござる"),
        ("s-mushin", "無心の剣、いざ放つでござる"),
    ],
}


def build_jobs() -> list[tuple[str, str, str, str]]:
    """(key, filename, styleId, text)"""
    jobs: list[tuple[str, str, str, str]] = []
    for style, text in SAMPLES.items():
        jobs.append((f"sample_{style}", f"sample_{style}.wav", style, text))
    for class_id, skills in CLASS_SKILLS.items():
        style = CLASS_PERSONA[class_id]
        for skill_id, text in skills:
            key = f"skill_{class_id}_{skill_id}"
            jobs.append((key, f"{key}.wav", style, text))
    return jobs


def main() -> None:
    jobs = build_jobs()
    print(f"[VoxCPM] 准备合成 {len(jobs)} 条台词 -> {OUT_DIR}", flush=True)

    print("[VoxCPM] 加载模型 openbmb/VoxCPM2 …", flush=True)
    model = VoxCPM.from_pretrained(
        "openbmb/VoxCPM2",
        load_denoiser=False,
        optimize=False,
        device="auto",
    )
    sample_rate = model.tts_model.sample_rate
    print(f"[VoxCPM] 模型就绪，采样率 {sample_rate}Hz", flush=True)

    manifest: dict[str, str] = {}
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
    print(f"[VoxCPM] 完成 {len(manifest)}/{len(jobs)} 条 -> {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
