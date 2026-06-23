#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成配音试听对比页：同一批咒文 × 多种语气/参数，便于挑选正式配置。

编辑 scripts/voice_config.json 里的 preview / preview_variants，然后运行:

  VoxCPM/.venv/bin/python scripts/preview_voices.py

浏览器打开（dev 运行时）:
  http://localhost:3000/voices/preview

也可指定参数:
  VoxCPM/.venv/bin/python scripts/preview_voices.py \\
    --class knight --skills k-breeze,k-dawn,k-smite \\
    --variants keigo-clone-default,keigo-vd-heroic,keigo-vd-calm
"""

from __future__ import annotations

import argparse
import html
import json
import os
import sys
from datetime import datetime, timezone

import soundfile as sf
from voxcpm import VoxCPM

from voice_lib import (
    PREVIEW_DIR,
    load_class_skills_from_ts,
    load_config,
    load_samples_from_classes_ts,
    postprocess_wav,
    synthesize_with_variant,
)

os.makedirs(PREVIEW_DIR, exist_ok=True)


def parse_csv(value: str | None) -> list[str] | None:
    if not value:
        return None
    return [x.strip() for x in value.split(",") if x.strip()]


def pick_skills(
    class_id: str,
    skill_ids: list[str] | None,
    config: dict,
) -> list[tuple[str, str]]:
    all_skills = dict(load_class_skills_from_ts()[class_id])
    if skill_ids:
        missing = [s for s in skill_ids if s not in all_skills]
        if missing:
            raise ValueError(f"{class_id} 中不存在技能: {', '.join(missing)}")
        return [(s, all_skills[s]) for s in skill_ids]

    defaults = config.get("preview", {}).get("skill_ids") or []
    if defaults:
        return [(s, all_skills[s]) for s in defaults if s in all_skills]

    # 兜底：取前 3 个
    return load_class_skills_from_ts()[class_id][:3]


def write_index_html(
    class_id: str,
    rows: list[dict],
    variants_meta: dict[str, dict],
) -> None:
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    variant_ids = list({r["variant_id"] for r in rows})
    skill_ids = list({r["skill_id"] for r in rows})

    table_rows = []
    for skill_id in skill_ids:
        skill_label = html.escape(next(r["incantation"] for r in rows if r["skill_id"] == skill_id))
        cells = [f"<td><strong>{html.escape(skill_id)}</strong><br><span class='jp'>{skill_label}</span></td>"]
        for vid in variant_ids:
            hit = next((r for r in rows if r["skill_id"] == skill_id and r["variant_id"] == vid), None)
            if not hit:
                cells.append("<td>—</td>")
                continue
            meta = variants_meta[vid]
            cells.append(
                f"<td><audio controls preload='none' src='{html.escape(hit['file'])}'></audio>"
                f"<div class='meta'>{html.escape(meta.get('label', vid))}</div></td>"
            )
        table_rows.append("<tr>" + "".join(cells) + "</tr>")

    variant_headers = "".join(
        f"<th>{html.escape(variants_meta[vid].get('label', vid))}</th>" for vid in variant_ids
    )

    doc = f"""<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <title>配音试听 · {html.escape(class_id)}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 24px; background: #1a1a2e; color: #eee; }}
    h1 {{ font-size: 1.25rem; }}
    .hint {{ color: #aaa; font-size: 0.9rem; margin-bottom: 16px; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #444; padding: 10px; vertical-align: top; }}
    th {{ background: #16213e; text-align: left; font-size: 0.85rem; }}
    .jp {{ font-size: 0.95rem; color: #ccc; }}
    .meta {{ font-size: 0.75rem; color: #888; margin-top: 4px; }}
    audio {{ width: 100%; max-width: 280px; }}
    code {{ background: #333; padding: 2px 6px; border-radius: 4px; }}
  </style>
</head>
<body>
  <h1>配音试听对比 · {html.escape(class_id)}</h1>
  <p class="hint">生成时间 {generated} · 编辑 <code>scripts/voice_config.json</code> 后重新运行 <code>preview_voices.py</code></p>
  <table>
    <thead><tr><th>技能 / 咒文</th>{variant_headers}</tr></thead>
    <tbody>
      {"".join(table_rows)}
    </tbody>
  </table>
</body>
</html>
"""
    index_path = os.path.join(PREVIEW_DIR, "index.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(doc)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--class", dest="class_id", default=None, help="职业，默认读 config.preview.class")
    parser.add_argument("--skills", help="技能 id 列表，逗号分隔")
    parser.add_argument("--variants", help="preview_variants 的 key 列表，逗号分隔")
    args = parser.parse_args()

    config = load_config()
    class_id = args.class_id or config.get("preview", {}).get("class") or "knight"
    skill_ids = parse_csv(args.skills)
    variant_ids = parse_csv(args.variants) or config.get("preview", {}).get("variants") or []

    variants_meta = config.get("preview_variants", {})
    if not variant_ids:
        raise SystemExit("未指定 variants，请在 voice_config.json 的 preview.variants 或 --variants 中设置")

    for vid in variant_ids:
        if vid not in variants_meta:
            raise SystemExit(f"voice_config.json 缺少 preview_variants.{vid}")

    class_persona = config["class_persona"]
    style = class_persona[class_id]
    skills = pick_skills(class_id, skill_ids, config)
    samples = load_samples_from_classes_ts()

    jobs: list[tuple[str, str, str, dict]] = []
    for skill_id, incantation in skills:
        for vid in variant_ids:
            safe = f"{class_id}__{skill_id}__{vid}.wav"
            jobs.append((skill_id, incantation, vid, variants_meta[vid], safe))

    print(f"[Preview] {class_id} · {len(skills)} 技能 × {len(variant_ids)} 语气 = {len(jobs)} 条", flush=True)
    print(f"[Preview] 输出 -> {PREVIEW_DIR}", flush=True)

    model = VoxCPM.from_pretrained(
        "openbmb/VoxCPM2",
        load_denoiser=False,
        optimize=False,
        device="auto",
    )
    sample_rate = model.tts_model.sample_rate

    rows: list[dict] = []
    manifest_path = os.path.join(PREVIEW_DIR, "manifest.json")

    for i, (skill_id, incantation, vid, variant, filename) in enumerate(jobs, 1):
        label = variant.get("label", vid)
        print(f"[{i}/{len(jobs)}] {skill_id} / {vid}: {incantation}", flush=True)
        try:
            wav = postprocess_wav(
                synthesize_with_variant(model, config, variant, style, incantation, samples),
                sample_rate,
            )
            out_path = os.path.join(PREVIEW_DIR, filename)
            sf.write(out_path, wav, sample_rate)
            rows.append(
                {
                    "class_id": class_id,
                    "skill_id": skill_id,
                    "incantation": incantation,
                    "variant_id": vid,
                    "file": filename,
                }
            )
        except Exception as e:
            print(f"   ! 失败: {e}", file=sys.stderr, flush=True)

    write_index_html(class_id, rows, {vid: variants_meta[vid] for vid in variant_ids})

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "class": class_id,
                "variants": variant_ids,
                "variant_labels": {
                    vid: variants_meta[vid].get("label", vid) for vid in variant_ids
                },
                "items": rows,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("[Preview] 完成。请先 npm run dev，再打开: http://localhost:3000/voices/preview", flush=True)


if __name__ == "__main__":
    main()
