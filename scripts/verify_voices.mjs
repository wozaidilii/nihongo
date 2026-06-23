#!/usr/bin/env node
/**
 * 校验 skills.ts 咒文与 public/voices 配音是否对齐。
 * 用法: node scripts/verify_voices.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const skillsTs = fs.readFileSync(path.join(ROOT, "src/data/skills.ts"), "utf8");
const classesTs = fs.readFileSync(path.join(ROOT, "src/data/classes.ts"), "utf8");
const genPy = fs.readFileSync(path.join(ROOT, "scripts/generate_voices.py"), "utf8");
const manifestPath = path.join(ROOT, "public/voices/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

/** 从 skills.ts 解析技能 */
function parseSkills() {
  return [...skillsTs.matchAll(
    /id:\s*"([^"]+)"[\s\S]*?classId:\s*"(knight|mage|rogue|samurai)"[\s\S]*?incantation:\s*"([^"]+)"/g,
  )].map((m) => ({ id: m[1], classId: m[2], incantation: m[3] }));
}

/** 从 classes.ts 解析语体 sample */
function parseClassSamples() {
  const out = {};
  for (const m of classesTs.matchAll(
    /(\w+):\s*\{[\s\S]*?id:\s*"(keigo|chuuni|tameguchi|bushi)"[\s\S]*?sample:\s*"([^"]+)"/g,
  )) {
    out[m[2]] = m[3];
  }
  // 更稳：按 SPEECH_STYLES 块解析
  for (const style of ["keigo", "chuuni", "tameguchi", "bushi"]) {
    const re = new RegExp(`${style}:\\s*\\{[\\s\\S]*?sample:\\s*"([^"]+)"`);
    const hit = classesTs.match(re);
    if (hit) out[style] = hit[1];
  }
  return out;
}

/** generate_voices.py 从 classes.ts 动态加载 sample（单一数据源） */
function parsePythonSamples() {
  if (genPy.includes("load_samples_from_classes_ts")) {
    return parseClassSamples();
  }
  const block = genPy.match(/SAMPLES = \{([\s\S]*?)\n\}/);
  if (!block) return {};
  const out = {};
  for (const m of block[1].matchAll(/"(keigo|chuuni|tameguchi|bushi)":\s*"([^"]+)"/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const skills = parseSkills();
const classSamples = parseClassSamples();
const pySamples = parsePythonSamples();

let errors = 0;

console.log("=== 技能配音文件 ===");
for (const s of skills) {
  const key = `skill_${s.classId}_${s.id}`;
  const wav = path.join(ROOT, "public/voices", `${key}.wav`);
  if (!manifest[key]) {
    console.error(`✗ manifest 缺少 ${key}`);
    errors++;
  }
  if (!fs.existsSync(wav)) {
    console.error(`✗ 文件缺失 ${key}.wav`);
    errors++;
  }
}
if (errors === 0) console.log(`✓ ${skills.length} 个技能 wav + manifest 齐全`);

console.log("\n=== 语体 sample 文案 ===");
for (const style of ["keigo", "chuuni", "tameguchi", "bushi"]) {
  const a = classSamples[style];
  const b = pySamples[style];
  if (a !== b) {
    console.error(`✗ ${style} 不一致:\n    classes.ts: ${a}\n    generate_voices.py: ${b}`);
    errors++;
  } else {
    console.log(`✓ ${style}: ${a}`);
  }
}

console.log("\n=== 技能咒文（配音应念以下内容）===");
for (const s of skills) {
  console.log(`  ${s.classId}/${s.id}: ${s.incantation}`);
}

if (errors > 0) {
  console.error(`\n共 ${errors} 项未对齐，请运行 VoxCPM/.venv/bin/python scripts/generate_voices.py --skills-only`);
  process.exit(1);
}
console.log("\n全部对齐 ✓");
