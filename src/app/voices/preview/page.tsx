import fs from "fs";
import path from "path";

import { PageShell } from "~/components/game/PageShell";
import { PixelPanel } from "~/components/pixel/PixelPanel";

export const dynamic = "force-dynamic";

interface PipelineSkill {
  skill_id: string;
  incantation: string;
  file: string;
}

interface PipelineClass {
  class_id: string;
  style: string;
  anchor: { file: string; text: string; label?: string };
  skills: PipelineSkill[];
}

interface PipelineManifest {
  type: "pipeline";
  generated_at?: string;
  classes: PipelineClass[];
}

interface VariantPreviewItem {
  skill_id: string;
  incantation: string;
  variant_id: string;
  file: string;
}

interface VariantManifest {
  type?: string;
  generated_at?: string;
  class?: string;
  variants?: string[];
  variant_labels?: Record<string, string>;
  items?: VariantPreviewItem[];
}

type PreviewManifest = PipelineManifest | VariantManifest;

function isPipeline(m: PreviewManifest): m is PipelineManifest {
  return m.type === "pipeline" && Array.isArray((m as PipelineManifest).classes);
}

function loadManifest(): PreviewManifest | null {
  const manifestPath = path.join(
    process.cwd(),
    "public/voices/preview/manifest.json",
  );
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PreviewManifest;
  } catch {
    return null;
  }
}

const CLASS_LABEL: Record<string, string> = {
  knight: "骑士",
  mage: "魔法师",
  rogue: "盗贼",
  samurai: "武士",
};

function EmptyState() {
  return (
    <PageShell centered className="max-w-lg gap-4 text-center">
      <h1 className="font-pixel text-base text-rpg-5">配音试听</h1>
      <PixelPanel tone="dialog">
        <p className="font-jp text-sm text-rpg-12">
          尚未生成试听。推荐先跑四职业示例（锚点+克隆，声线一致）：
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-rpg-16/60 p-3 font-mono text-[11px] text-rpg-8">
          VoxCPM/.venv/bin/python scripts/preview_all_classes.py
        </pre>
        <p className="mt-3 font-jp text-xs text-rpg-14">
          然后 <code className="text-rpg-8">npm run dev</code>，打开本页。
        </p>
      </PixelPanel>
    </PageShell>
  );
}

function PipelineView({ manifest }: { manifest: PipelineManifest }) {
  return (
    <PageShell className="gap-6">
      <header className="text-center">
        <h1 className="font-pixel text-base text-rpg-5 sm:text-lg">
          四职业配音示例（统一声线）
        </h1>
        {manifest.generated_at && (
          <p className="mt-1 font-jp text-[11px] text-rpg-14">
            生成于 {new Date(manifest.generated_at).toLocaleString()}
          </p>
        )}
        <p className="mt-2 font-jp text-xs text-rpg-12">
          每条先 Voice Design 生成锚点，再克隆咒文 — 同一角色音色不变
        </p>
      </header>

      {manifest.classes.map((entry) => (
        <PixelPanel key={entry.class_id} tone="dialog" className="gap-3">
          <h2 className="font-pixel text-[11px] text-rpg-8">
            {CLASS_LABEL[entry.class_id] ?? entry.class_id} · {entry.style}
          </h2>

          <div className="rounded border border-rpg-15 bg-rpg-16/40 p-3">
            <p className="font-pixel text-[9px] text-rpg-10">
              {entry.anchor.label ?? "声线锚点"}
            </p>
            <p className="mt-1 font-jp text-sm text-rpg-5">{entry.anchor.text}</p>
            <audio
              controls
              preload="none"
              className="mt-2 w-full max-w-md"
              src={`/voices/preview/${entry.anchor.file}`}
            />
          </div>

          <ul className="flex flex-col gap-3">
            {entry.skills.map((skill) => (
              <li
                key={skill.skill_id}
                className="rounded border border-rpg-16 p-3"
              >
                <p className="font-pixel text-[9px] text-rpg-5">{skill.skill_id}</p>
                <p className="font-jp text-sm text-rpg-12">{skill.incantation}</p>
                <audio
                  controls
                  preload="none"
                  className="mt-2 w-full max-w-md"
                  src={`/voices/preview/${skill.file}`}
                />
              </li>
            ))}
          </ul>
        </PixelPanel>
      ))}
    </PageShell>
  );
}

function VariantView({ manifest }: { manifest: VariantManifest }) {
  const variants = manifest.variants ?? [];
  const labels = manifest.variant_labels ?? {};
  const skillIds = [...new Set((manifest.items ?? []).map((i) => i.skill_id))];

  return (
    <PageShell className="gap-4">
      <header className="text-center">
        <h1 className="font-pixel text-base text-rpg-5 sm:text-lg">
          语气对比 · {manifest.class ?? "?"}
        </h1>
        {manifest.generated_at && (
          <p className="mt-1 font-jp text-[11px] text-rpg-14">
            生成于 {new Date(manifest.generated_at).toLocaleString()}
          </p>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-rpg-15">
              <th className="p-2 font-pixel text-[10px] text-rpg-8">咒文</th>
              {variants.map((vid) => (
                <th key={vid} className="p-2 font-jp text-[11px] text-rpg-10">
                  {labels[vid] ?? vid}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skillIds.map((skillId) => {
              const incantation =
                manifest.items?.find((i) => i.skill_id === skillId)?.incantation ??
                "";
              return (
                <tr key={skillId} className="border-b border-rpg-16 align-top">
                  <td className="p-2">
                    <p className="font-pixel text-[10px] text-rpg-5">{skillId}</p>
                    <p className="font-jp text-sm text-rpg-12">{incantation}</p>
                  </td>
                  {variants.map((vid) => {
                    const hit = manifest.items?.find(
                      (i) => i.skill_id === skillId && i.variant_id === vid,
                    );
                    if (!hit) {
                      return (
                        <td key={vid} className="p-2 text-rpg-14">
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={vid} className="p-2">
                        <audio
                          controls
                          preload="none"
                          className="w-full max-w-xs"
                          src={`/voices/preview/${hit.file}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function VoicePreviewPage() {
  const manifest = loadManifest();

  if (!manifest) return <EmptyState />;

  if (isPipeline(manifest) && manifest.classes.length > 0) {
    return <PipelineView manifest={manifest} />;
  }

  if (!isPipeline(manifest) && manifest.items?.length) {
    return <VariantView manifest={manifest} />;
  }

  return <EmptyState />;
}
