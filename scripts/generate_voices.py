#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 VoxCPM2 为「勇者日语探险」生成配音。

- 选职业试听：Voice Design（括号内音色描述 + 示例台词）
- 技能咒文：以对应语体 sample 为参考克隆，仅合成 incantation 原文（避免念错咒文）

运行:
  VoxCPM/.venv/bin/python scripts/generate_voices.py
  VoxCPM/.venv/bin/python scripts/generate_voices.py --skills-only   # 仅重生成技能
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

import soundfile as sf
from voxcpm import VoxCPM

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT_DIR = os.path.normpath(os.path.join(ROOT, "public", "voices"))
SKILLS_TS = os.path.join(ROOT, "src", "data", "skills.ts")
CLASSES_TS = os.path.join(ROOT, "src", "data", "classes.ts")
os.makedirs(OUT_DIR, exist_ok=True)

# Voice Design 音色描述（仅用于 sample_*.wav）
PERSONA = {
    "keigo": "(A noble young knight, gallant and dignified male voice, elegant, heroic, dramatic Japanese anime style)",
    "chuuni": "(A theatrical dark sorcerer, intense chuunibyou young male voice, brooding, grandiose, dramatic Japanese anime style)",
    "tameguchi": "(A cheeky confident teenage rogue, playful energetic cool male voice, smirking, lively Japanese anime style)",
    "bushi": "(A stern old samurai, deep resolute gravelly male voice, solemn bushido warrior, dramatic Japanese anime style)",
}

def load_samples_from_classes_ts() -> dict[str, str]:
    """从 classes.ts 的 SPEECH_STYLES.sample 读取语体试听台词，与游戏数据单一来源。"""
    if not os.path.isfile(CLASSES_TS):
        raise FileNotFoundError(f"找不到 {CLASSES_TS}")

    content = open(CLASSES_TS, encoding="utf-8").read()
    samples: dict[str, str] = {}
    for style in ("keigo", "chuuni", "tameguchi", "bushi"):
        m = re.search(rf'{style}:\s*\{{[\s\S]*?sample:\s*"([^"]+)"', content)
        if not m:
            raise ValueError(f"classes.ts 中未解析到 {style}.sample")
        samples[style] = m.group(1)
    return samples


SAMPLES = load_samples_from_classes_ts()

CLASS_PERSONA = {
    "knight": "keigo",
    "mage": "chuuni",
    "rogue": "tameguchi",
    "samurai": "bushi",
}


def load_class_skills_from_ts() -> dict[str, list[tuple[str, str]]]:
    """从 skills.ts 读取 (skillId, incantation)，保证与游戏数据一致。"""
    if not os.path.isfile(SKILLS_TS):
        raise FileNotFoundError(f"找不到 {SKILLS_TS}")

    content = open(SKILLS_TS, encoding="utf-8").read()
    result: dict[str, list[tuple[str, str]]] = {
        "knight": [],
        "mage": [],
        "rogue": [],
        "samurai": [],
    }

    # 匹配每个技能块：classId + id + incantation
    for block in re.finditer(
        r'\{\s*id:\s*"([^"]+)"\s*,\s*classId:\s*"(knight|mage|rogue|samurai)"[\s\S]*?incantation:\s*"([^"]+)"',
        content,
    ):
        skill_id, class_id, incantation = block.group(1), block.group(2), block.group(3)
        result[class_id].append((skill_id, incantation))

    for class_id, items in result.items():
        if not items:
            raise ValueError(f"skills.ts 中未解析到 {class_id} 的技能")
    return result


def voice_design_text(style: str, line: str) -> str:
    """Voice Design 标准格式：(描述)要念的文本"""
    return f"{PERSONA[style]}{line}"


def build_jobs(skills_only: bool) -> list[tuple[str, str, str, str, str]]:
    """
    返回 (key, filename, styleId, speak_text, mode)
    mode: sample | skill
    """
    jobs: list[tuple[str, str, str, str, str]] = []
    if not skills_only:
        for style, text in SAMPLES.items():
            jobs.append((f"sample_{style}", f"sample_{style}.wav", style, text, "sample"))

    class_skills = load_class_skills_from_ts()
    for class_id, skill_list in class_skills.items():
        style = CLASS_PERSONA[class_id]
        for skill_id, incantation in skill_list:
            key = f"skill_{class_id}_{skill_id}"
            jobs.append((key, f"{key}.wav", style, incantation, "skill"))
    return jobs


def synthesize(model: VoxCPM, style: str, speak_text: str, mode: str) -> tuple:
    """合成单条语音；技能用 sample 克隆，sample 用 Voice Design。"""
    if mode == "sample":
        prompt = voice_design_text(style, speak_text)
        return model.generate(
            text=prompt,
            cfg_value=2.0,
            inference_timesteps=16,
        )

    ref_path = os.path.join(OUT_DIR, f"sample_{style}.wav")
    if not os.path.isfile(ref_path):
        raise FileNotFoundError(
            f"缺少参考音频 {ref_path}，请先运行不带 --skills-only 的完整生成"
        )

    ref_text = SAMPLES[style]
    # 克隆选职业试听音色，target 仅为技能咒文
    return model.generate(
        text=speak_text,
        prompt_wav_path=ref_path,
        prompt_text=ref_text,
        reference_wav_path=ref_path,
        cfg_value=2.0,
        inference_timesteps=16,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skills-only",
        action="store_true",
        help="仅重生成技能配音(依赖已有 sample_*.wav)",
    )
    args = parser.parse_args()

    jobs = build_jobs(skills_only=args.skills_only)
    print(f"[VoxCPM] 准备合成 {len(jobs)} 条 -> {OUT_DIR}", flush=True)

    model = VoxCPM.from_pretrained(
        "openbmb/VoxCPM2",
        load_denoiser=False,
        optimize=False,
        device="auto",
    )
    sample_rate = model.tts_model.sample_rate
    print(f"[VoxCPM] 模型就绪，采样率 {sample_rate}Hz", flush=True)

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    manifest: dict[str, str] = {}
    if os.path.isfile(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)

    for i, (key, filename, style, speak_text, mode) in enumerate(jobs, 1):
        mode_label = "克隆" if mode == "skill" else "VoiceDesign"
        print(f"[{i}/{len(jobs)}] {key} ({mode_label}): {speak_text}", flush=True)
        try:
            wav = synthesize(model, style, speak_text, mode)
            out_path = os.path.join(OUT_DIR, filename)
            sf.write(out_path, wav, sample_rate)
            manifest[key] = f"/voices/{filename}"
        except Exception as e:
            print(f"   ! 合成失败({key}): {e}", file=sys.stderr, flush=True)

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[VoxCPM] 完成 {len(jobs)} 条任务，manifest 已更新", flush=True)


if __name__ == "__main__":
    main()
