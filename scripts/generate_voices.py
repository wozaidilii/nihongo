#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 VoxCPM2 为「勇者日语探险」生成配音。

配置：scripts/voice_config.json（persona、cfg_value、inference_timesteps）

运行:
  VoxCPM/.venv/bin/python scripts/generate_voices.py
  VoxCPM/.venv/bin/python scripts/generate_voices.py --samples-only   # 仅重生四语体锚点
  VoxCPM/.venv/bin/python scripts/generate_voices.py --skills-only  # 克隆全部咒文（需先有 sample）
  VoxCPM/.venv/bin/python scripts/generate_voices.py --only-missing
  VoxCPM/.venv/bin/python scripts/generate_voices.py --class knight --only-missing
  VoxCPM/.venv/bin/python scripts/generate_voices.py --skills k-breeze,k-dawn
"""

from __future__ import annotations

import argparse
import os
import sys

import soundfile as sf
from voxcpm import VoxCPM

from voice_lib import (
    OUT_DIR,
    build_skill_variant,
    get_skill_override,
    load_class_skills_from_ts,
    load_config,
    load_manifest,
    load_samples_from_classes_ts,
    save_manifest,
    skill_filename,
    skill_key,
    synthesize_sample,
    synthesize_skill,
    is_skill_voice_missing,
)

os.makedirs(OUT_DIR, exist_ok=True)


def parse_csv(value: str | None) -> list[str] | None:
    if not value:
        return None
    return [x.strip() for x in value.split(",") if x.strip()]


def build_jobs(
    *,
    samples_only: bool,
    skills_only: bool,
    only_missing: bool,
    class_filter: list[str] | None,
    skill_filter: list[str] | None,
) -> list[tuple[str, str, str, str, str, str | None, str | None]]:
    """
    返回 (key, filename, styleId, speak_text, mode, class_id, skill_id)
    mode: sample | skill
    """
    config = load_config()
    class_persona = config["class_persona"]
    jobs: list[tuple[str, str, str, str, str, str | None, str | None]] = []
    manifest = load_manifest()

    if not skills_only:
        for style, text in load_samples_from_classes_ts().items():
            jobs.append((f"sample_{style}", f"sample_{style}.wav", style, text, "sample", None, None))

    if samples_only:
        return jobs

    class_skills = load_class_skills_from_ts()
    for class_id, skill_list in class_skills.items():
        if class_filter and class_id not in class_filter:
            continue
        style = class_persona[class_id]
        for skill_id, incantation in skill_list:
            if skill_filter and skill_id not in skill_filter:
                continue
            if only_missing and not is_skill_voice_missing(class_id, skill_id, manifest):
                continue
            key = skill_key(class_id, skill_id)
            jobs.append(
                (key, skill_filename(class_id, skill_id), style, incantation, "skill", class_id, skill_id)
            )

    return jobs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--samples-only",
        action="store_true",
        help="仅重生 sample_*.wav 声线锚点（改 persona 后必须先跑这步）",
    )
    parser.add_argument(
        "--skills-only",
        action="store_true",
        help="不重生 sample_*.wav，仅克隆技能配音",
    )
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="仅生成 manifest/磁盘缺失的技能配音",
    )
    parser.add_argument(
        "--class",
        dest="classes",
        metavar="CLASS",
        help="限定职业：knight,mage,...",
    )
    parser.add_argument(
        "--skills",
        metavar="IDS",
        help="限定技能 id：k-breeze,k-dawn,...",
    )
    args = parser.parse_args()

    class_filter = parse_csv(args.classes)
    skill_filter = parse_csv(args.skills)

    jobs = build_jobs(
        samples_only=args.samples_only,
        skills_only=args.skills_only,
        only_missing=args.only_missing,
        class_filter=class_filter,
        skill_filter=skill_filter,
    )

    if not jobs:
        print("[VoxCPM] 没有待合成任务（可能已全部齐全）", flush=True)
        return

    config = load_config()
    samples = load_samples_from_classes_ts()
    print(f"[VoxCPM] 配置: {os.path.join(os.path.dirname(__file__), 'voice_config.json')}", flush=True)
    print(f"[VoxCPM] 准备合成 {len(jobs)} 条 -> {OUT_DIR}", flush=True)

    model = VoxCPM.from_pretrained(
        "openbmb/VoxCPM2",
        load_denoiser=False,
        optimize=False,
        device="auto",
    )
    sample_rate = model.tts_model.sample_rate
    print(f"[VoxCPM] 模型就绪，采样率 {sample_rate}Hz", flush=True)

    manifest = load_manifest()

    for i, (key, filename, style, speak_text, mode, class_id, skill_id) in enumerate(jobs, 1):
        if mode == "sample":
            mode_label = "VoiceDesign"
        else:
            variant = build_skill_variant(config, class_id or "", skill_id or "", style)
            mode_label = "VoiceDesign" if variant.get("mode") == "voice_design" else "克隆"
            if class_id and skill_id and get_skill_override(config, class_id, skill_id):
                mode_label += "·override"
        print(f"[{i}/{len(jobs)}] {key} ({mode_label}): {speak_text}", flush=True)
        try:
            if mode == "sample":
                wav = synthesize_sample(model, config, style, speak_text)
            else:
                wav = synthesize_skill(
                    model,
                    config,
                    class_id or "",
                    skill_id or "",
                    style,
                    speak_text,
                    samples,
                )
            out_path = os.path.join(OUT_DIR, filename)
            sf.write(out_path, wav, sample_rate)
            manifest[key] = f"/voices/{filename}"
        except Exception as e:
            print(f"   ! 合成失败({key}): {e}", file=sys.stderr, flush=True)

    save_manifest(manifest)
    print(f"[VoxCPM] 完成 {len(jobs)} 条任务，manifest 已更新", flush=True)
    if args.samples_only:
        print("[VoxCPM] 锚点已更新。请继续: python scripts/generate_voices.py --skills-only", flush=True)
    elif not args.skills_only:
        print("[VoxCPM] 提示: 技能使用克隆模式，声线来自 sample_*.wav", flush=True)
    print("[VoxCPM] 建议运行: npm run verify:voices", flush=True)


if __name__ == "__main__":
    main()
