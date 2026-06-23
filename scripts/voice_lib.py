#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""VoxCPM 配音生成共享库：读配置、解析 skills.ts、合成。"""

from __future__ import annotations

import json
import os
import re
from typing import Any

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT_DIR = os.path.normpath(os.path.join(ROOT, "public", "voices"))
PREVIEW_DIR = os.path.join(OUT_DIR, "preview")
SKILLS_TS = os.path.join(ROOT, "src", "data", "skills.ts")
CLASSES_TS = os.path.join(ROOT, "src", "data", "classes.ts")
CONFIG_PATH = os.path.join(HERE, "voice_config.json")

CLASS_IDS = ("knight", "mage", "rogue", "samurai")
STYLE_IDS = ("keigo", "chuuni", "tameguchi", "bushi")


def load_config() -> dict[str, Any]:
    """读取 voice_config.json；缺失字段用内置默认值。"""
    defaults: dict[str, Any] = {
        "synthesis": {"cfg_value": 2.0, "inference_timesteps": 16},
        "sample_overrides": {},
        "persona": {},
        "class_persona": {
            "knight": "keigo",
            "mage": "chuuni",
            "rogue": "tameguchi",
            "samurai": "bushi",
        },
        "preview": {},
        "preview_variants": {},
    }
    if not os.path.isfile(CONFIG_PATH):
        return defaults

    with open(CONFIG_PATH, encoding="utf-8") as f:
        raw = json.load(f)

    for key in defaults:
        if key not in raw:
            raw[key] = defaults[key]
    return raw


def load_samples_from_classes_ts() -> dict[str, str]:
    """从 classes.ts 读取语体试听台词。"""
    if not os.path.isfile(CLASSES_TS):
        raise FileNotFoundError(f"找不到 {CLASSES_TS}")

    content = open(CLASSES_TS, encoding="utf-8").read()
    samples: dict[str, str] = {}
    for style in STYLE_IDS:
        m = re.search(rf'{style}:\s*\{{[\s\S]*?sample:\s*"([^"]+)"', content)
        if not m:
            raise ValueError(f"classes.ts 中未解析到 {style}.sample")
        samples[style] = m.group(1)
    return samples


def load_class_skills_from_ts() -> dict[str, list[tuple[str, str]]]:
    """从 skills.ts 读取 (skillId, incantation)。"""
    if not os.path.isfile(SKILLS_TS):
        raise FileNotFoundError(f"找不到 {SKILLS_TS}")

    content = open(SKILLS_TS, encoding="utf-8").read()
    result: dict[str, list[tuple[str, str]]] = {c: [] for c in CLASS_IDS}

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


def skill_key(class_id: str, skill_id: str) -> str:
    return f"skill_{class_id}_{skill_id}"


def skill_filename(class_id: str, skill_id: str) -> str:
    return f"{skill_key(class_id, skill_id)}.wav"


def resolve_synthesis_params(
    config: dict[str, Any],
    overrides: dict[str, Any] | None = None,
    *,
    for_clone: bool = False,
) -> tuple[float, int]:
    """合成参数；技能克隆优先读 skill_clone。"""
    if for_clone and not (overrides or {}).get("cfg_value") and not (overrides or {}).get(
        "inference_timesteps"
    ):
        base = config.get("skill_clone") or config.get("synthesis", {})
    else:
        base = config.get("synthesis", {})
    ov = overrides or {}
    cfg_raw = ov.get("cfg_value", base.get("cfg_value", 2.0))
    steps_raw = ov.get("inference_timesteps", base.get("inference_timesteps", 16))
    cfg = float(cfg_raw) if cfg_raw is not None else float(base.get("cfg_value", 2.0))
    steps = int(steps_raw) if steps_raw is not None else int(base.get("inference_timesteps", 16))
    return cfg, steps


def resolve_sample_params(config: dict[str, Any], style: str) -> tuple[float, int]:
    """Voice Design 锚点参数；允许按语体降低 cfg，减少怪叫/爆音。"""
    overrides = config.get("sample_overrides", {})
    style_override = overrides.get(style, {}) if isinstance(overrides, dict) else {}
    return resolve_synthesis_params(
        config,
        style_override if isinstance(style_override, dict) else {},
    )


def postprocess_wav(
    wav,
    sample_rate: int,
    *,
    target_peak: float = 0.72,
    max_gain: float = 4.0,
    trim_threshold: float = 0.004,
    pad_ms: int = 80,
    fade_ms: int = 12,
):
    """
    统一模型输出音频：转 mono、去 NaN、裁静音、淡入淡出、削峰到约 -2.8dB。
    这不能修复模型发错音色，但能避免浏览器里刺耳爆音和点击噪声。
    """
    arr = np.asarray(wav, dtype=np.float32)
    if arr.ndim > 1:
        arr = arr.mean(axis=1)
    arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
    if arr.size == 0:
        return arr

    if np.max(np.abs(arr)) > 2.0:
        arr = arr / 32768.0

    active = np.flatnonzero(np.abs(arr) > trim_threshold)
    if active.size:
        pad = int(sample_rate * pad_ms / 1000)
        start = max(0, int(active[0]) - pad)
        end = min(arr.size, int(active[-1]) + pad)
        arr = arr[start:end]

    fade = min(int(sample_rate * fade_ms / 1000), arr.size // 2)
    if fade > 1:
        ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
        arr[:fade] *= ramp
        arr[-fade:] *= ramp[::-1]

    peak = float(np.max(np.abs(arr))) if arr.size else 0.0
    if peak > 0:
        arr = arr * min(max_gain, target_peak / peak)

    return np.clip(arr, -0.98, 0.98)


def get_skill_override(
    config: dict[str, Any],
    class_id: str,
    skill_id: str,
) -> dict[str, Any]:
    """单条技能的语气/参数覆盖（可选）。"""
    overrides = config.get("skill_overrides", {})
    if not isinstance(overrides, dict):
        return {}
    class_map = overrides.get(class_id, {})
    if not isinstance(class_map, dict):
        return {}
    raw = class_map.get(skill_id, {})
    return raw if isinstance(raw, dict) else {}


def build_skill_variant(
    config: dict[str, Any],
    class_id: str,
    skill_id: str,
    style: str,
) -> dict[str, Any]:
    """合并全局 skill_mode 与单技能 override。"""
    override = get_skill_override(config, class_id, skill_id)
    mode = override.get("mode") or config.get("skill_mode", "clone")
    variant: dict[str, Any] = {"mode": mode, "style": style}
    for key in ("persona", "cfg_value", "inference_timesteps"):
        if key in override:
            variant[key] = override[key]
    return variant


def persona_for_style(config: dict[str, Any], style: str, override: str | None = None) -> str:
    if override:
        return override
    persona = config.get("persona", {})
    if style in persona:
        return str(persona[style])
    raise KeyError(f"voice_config.json 缺少 persona.{style}")


def voice_design_text(persona: str, line: str) -> str:
    return f"{persona}{line}"


def synthesize_sample(model, config: dict[str, Any], style: str, speak_text: str):
    persona = persona_for_style(config, style)
    cfg, steps = resolve_sample_params(config, style)
    return model.generate(
        text=voice_design_text(persona, speak_text),
        cfg_value=cfg,
        inference_timesteps=steps,
    )


def synthesize_skill_clone(
    model,
    config: dict[str, Any],
    style: str,
    speak_text: str,
    samples: dict[str, str],
    *,
    cfg_value: float | None = None,
    inference_timesteps: int | None = None,
    ref_path: str | None = None,
):
    resolved_ref = ref_path or os.path.join(OUT_DIR, f"sample_{style}.wav")
    if not os.path.isfile(resolved_ref):
        raise FileNotFoundError(
            f"缺少参考音频 {resolved_ref}，请先运行: "
            f"python scripts/generate_voices.py --samples-only"
        )

    cfg, steps = resolve_synthesis_params(
        config,
        {
            "cfg_value": cfg_value,
            "inference_timesteps": inference_timesteps,
        },
        for_clone=True,
    )
    ref_text = samples[style]
    return model.generate(
        text=speak_text,
        prompt_wav_path=resolved_ref,
        prompt_text=ref_text,
        reference_wav_path=resolved_ref,
        cfg_value=cfg,
        inference_timesteps=steps,
    )


def synthesize_with_variant(
    model,
    config: dict[str, Any],
    variant: dict[str, Any],
    style: str,
    speak_text: str,
    samples: dict[str, str],
):
    mode = variant.get("mode", "clone")
    cfg, steps = resolve_synthesis_params(config, variant)

    if mode == "voice_design":
        persona = persona_for_style(config, style, variant.get("persona"))
        return model.generate(
            text=voice_design_text(persona, speak_text),
            cfg_value=cfg,
            inference_timesteps=steps,
        )

    return synthesize_skill_clone(
        model,
        config,
        style,
        speak_text,
        samples,
        cfg_value=cfg,
        inference_timesteps=steps,
        ref_path=variant.get("ref_path"),
    )


def synthesize_skill(
    model,
    config: dict[str, Any],
    class_id: str,
    skill_id: str,
    style: str,
    speak_text: str,
    samples: dict[str, str],
):
    """正式技能配音：读 skill_mode + skill_overrides。"""
    variant = build_skill_variant(config, class_id, skill_id, style)
    return synthesize_with_variant(model, config, variant, style, speak_text, samples)


def load_manifest() -> dict[str, str]:
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    if not os.path.isfile(manifest_path):
        return {}
    with open(manifest_path, encoding="utf-8") as f:
        return json.load(f)


def save_manifest(manifest: dict[str, str]) -> None:
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


def is_skill_voice_missing(class_id: str, skill_id: str, manifest: dict[str, str]) -> bool:
    key = skill_key(class_id, skill_id)
    wav = os.path.join(OUT_DIR, skill_filename(class_id, skill_id))
    return key not in manifest or not os.path.isfile(wav)
