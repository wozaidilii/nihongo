#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
四职业「锚点 + 克隆」示例：验证同一角色声线一致。

流程（与正式 generate_voices 相同）：
  1. Voice Design 生成选职业试听 → 声线锚点
  2. 以锚点为参考克隆 3 条咒文 → 技能配音

运行:
  VoxCPM/.venv/bin/python scripts/preview_all_classes.py

浏览器（npm run dev 后）:
  http://localhost:3000/voices/preview
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

import soundfile as sf
from voxcpm import VoxCPM

from voice_lib import (
    CLASS_IDS,
    PREVIEW_DIR,
    load_class_skills_from_ts,
    load_config,
    load_samples_from_classes_ts,
    postprocess_wav,
    synthesize_sample,
    synthesize_skill_clone,
)

os.makedirs(PREVIEW_DIR, exist_ok=True)


def pick_preview_skills(config: dict, class_id: str) -> list[tuple[str, str]]:
    all_skills = dict(load_class_skills_from_ts()[class_id])
    class_preview = config.get("class_preview", {}).get(class_id, {})
    skill_ids = class_preview.get("skills") or list(all_skills.keys())[:3]
    out: list[tuple[str, str]] = []
    for sid in skill_ids:
        if sid in all_skills:
            out.append((sid, all_skills[sid]))
    return out


def main() -> None:
    config = load_config()
    samples = load_samples_from_classes_ts()
    class_persona = config["class_persona"]

    print("[Pipeline] 四职业锚点+克隆示例 ->", PREVIEW_DIR, flush=True)

    model = VoxCPM.from_pretrained(
        "openbmb/VoxCPM2",
        load_denoiser=False,
        optimize=False,
        device="auto",
    )
    sample_rate = model.tts_model.sample_rate

    manifest: dict = {
        "type": "pipeline",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "classes": [],
    }

    for class_id in CLASS_IDS:
        style = class_persona[class_id]
        class_dir = os.path.join(PREVIEW_DIR, class_id)
        os.makedirs(class_dir, exist_ok=True)

        anchor_name = f"anchor_{style}.wav"
        anchor_path = os.path.join(class_dir, anchor_name)
        anchor_text = samples[style]

        print(f"\n[{class_id}] 锚点 VoiceDesign ({style}): {anchor_text}", flush=True)
        try:
            wav = postprocess_wav(synthesize_sample(model, config, style, anchor_text), sample_rate)
            sf.write(anchor_path, wav, sample_rate)
        except Exception as e:
            print(f"  ! 锚点失败: {e}", file=sys.stderr, flush=True)
            continue

        class_entry = {
            "class_id": class_id,
            "style": style,
            "anchor": {
                "file": f"{class_id}/{anchor_name}",
                "text": anchor_text,
                "label": "选职业试听（声线锚点）",
            },
            "skills": [],
        }

        for skill_id, incantation in pick_preview_skills(config, class_id):
            out_name = f"{skill_id}.wav"
            out_path = os.path.join(class_dir, out_name)
            print(f"  [{class_id}] 克隆 {skill_id}: {incantation}", flush=True)
            try:
                wav = postprocess_wav(
                    synthesize_skill_clone(
                        model,
                        config,
                        style,
                        incantation,
                        samples,
                        ref_path=anchor_path,
                    ),
                    sample_rate,
                )
                sf.write(out_path, wav, sample_rate)
                class_entry["skills"].append(
                    {
                        "skill_id": skill_id,
                        "incantation": incantation,
                        "file": f"{class_id}/{out_name}",
                    }
                )
            except Exception as e:
                print(f"    ! 克隆失败: {e}", file=sys.stderr, flush=True)

        manifest["classes"].append(class_entry)

    manifest_path = os.path.join(PREVIEW_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print("\n[Pipeline] 完成。npm run dev 后打开: http://localhost:3000/voices/preview", flush=True)


if __name__ == "__main__":
    main()
