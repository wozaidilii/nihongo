/**
 * 咒文匹配评分工具。
 * 把「语音识别结果」与「目标读音」都归一化后计算相似度，
 * 得到 0~100 的咏唱准确度，供战斗判定与暴击使用。
 */

/** 片假名 → 平假名(按码位平移 0x60) */
function katakanaToHiragana(input: string): string {
  return input.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

/** 全角英数字/空格 → 半角 */
function toHalfWidth(input: string): string {
  return input
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ");
}

/**
 * 归一化日语文本：
 * 转半角 → 片假名转平假名 → 去除空白与标点 → 统一长音/拗音等易混差异。
 * 对任意非法输入(null/undefined)都安全返回空串。
 */
export function normalizeJa(input: string | null | undefined): string {
  if (!input) return "";
  let s = toHalfWidth(String(input));
  s = katakanaToHiragana(s);
  s = s.toLowerCase();
  s = s.replace(/[\s、。，．,.!！?？・「」『』…ー―\-~〜]/g, "");
  return s;
}

/** 经典 Levenshtein 编辑距离 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] ?? 0;
}

/**
 * 计算咏唱准确度(0~100)。
 * heard：识别到的文本；target：目标文本。
 * 二者归一化后基于编辑距离换算相似度；空输入返回 0。
 */
export function scoreReading(
  heard: string | null | undefined,
  target: string | null | undefined,
): number {
  const a = normalizeJa(heard);
  const b = normalizeJa(target);
  if (!b) return 0;
  if (!a) return 0;

  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  const ratio = 1 - dist / maxLen;
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
}

/** 仅保留平假名，用于混有汉字时的读音兜底比对 */
function hiraganaOnly(input: string | null | undefined): string {
  return normalizeJa(input).replace(/[^\u3041-\u3096]/g, "");
}

/**
 * 技能咏唱评分：同时对照咒文原文与假名读音，取最高分。
 * 语音识别常输出汉字(与画面咒文一致)，仅比假名会导致误伤。
 */
export function scoreSkillCast(
  heard: string | null | undefined,
  incantation: string | null | undefined,
  reading: string | null | undefined,
): number {
  const scores = [
    scoreReading(heard, incantation),
    scoreReading(heard, reading),
    scoreReading(hiraganaOnly(heard), reading),
  ];
  return Math.max(0, ...scores);
}

/** UI 用：准确度达到此值显示「咏唱成功」 */
export const CAST_GOOD_THRESHOLD = 70;

/** 暴击阈值：准确度达到此值额外加伤 */
export const CAST_CRIT_THRESHOLD = 92;

/** 最低威力倍率(1% 准确度时) */
export const CAST_MIN_SCALE = 0.15;

/**
 * 由准确度换算威力倍率(0~1)。
 * 准确度为 0 时返回 0，表示完全未命中咒文。
 */
export function powerScaleFromAccuracy(accuracy: number): number {
  const acc = Math.max(0, Math.min(100, Number.isFinite(accuracy) ? accuracy : 0));
  if (acc <= 0) return 0;
  return CAST_MIN_SCALE + (acc / 100) * (1 - CAST_MIN_SCALE);
}

/**
 * 由准确度计算伤害。
 * 任意 >0 的准确度均可施法，威力随准确度连续缩放；仅 0% 视为完全失败。
 */
export function damageFromAccuracy(
  accuracy: number,
  base: number,
  power = 1,
): { damage: number; crit: boolean; cast: boolean } {
  const safeBase = Number.isFinite(base) && base > 0 ? base : 0;
  const safePower = Number.isFinite(power) && power > 0 ? power : 1;
  const scale = powerScaleFromAccuracy(accuracy);

  if (scale <= 0 || safeBase <= 0) {
    return { damage: 0, crit: false, cast: false };
  }

  const acc = Math.max(0, Math.min(100, Number.isFinite(accuracy) ? accuracy : 0));
  const crit = acc >= CAST_CRIT_THRESHOLD;
  const critMul = crit ? 1.5 : 1;
  const damage = Math.max(1, Math.round(safeBase * safePower * scale * critMul));
  return { damage, crit, cast: true };
}
