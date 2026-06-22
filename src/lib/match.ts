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
  // 去掉所有空白与常见标点(中日英)
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
        (prev[j] ?? 0) + 1, // 删除
        (curr[j - 1] ?? 0) + 1, // 插入
        (prev[j - 1] ?? 0) + cost, // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] ?? 0;
}

/**
 * 计算咏唱准确度(0~100)。
 * heard：识别到的文本；target：目标读音。
 * 二者归一化后基于编辑距离换算相似度；空输入返回 0。
 */
export function scoreReading(
  heard: string | null | undefined,
  target: string | null | undefined,
): number {
  const a = normalizeJa(heard);
  const b = normalizeJa(target);
  if (!b) return 0; // 没有目标，无法判定
  if (!a) return 0;

  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  const ratio = 1 - dist / maxLen;
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return pct;
}

/** 默认施法成功阈值(准确度百分比) */
export const CAST_SUCCESS_THRESHOLD = 70;

/** 暴击阈值：准确度达到此值额外加伤 */
export const CAST_CRIT_THRESHOLD = 92;

/**
 * 由准确度计算伤害。
 * base：技能基础伤害；power：职业倍率。
 * 准确度越高伤害越高，达暴击阈值额外 1.5 倍。
 */
export function damageFromAccuracy(
  accuracy: number,
  base: number,
  power = 1,
): { damage: number; crit: boolean } {
  const safeBase = Number.isFinite(base) && base > 0 ? base : 0;
  const safePower = Number.isFinite(power) && power > 0 ? power : 1;
  const acc = Math.max(0, Math.min(100, Number.isFinite(accuracy) ? accuracy : 0));

  // 准确度低于阈值视为施法失败(0 伤害)
  if (acc < CAST_SUCCESS_THRESHOLD) return { damage: 0, crit: false };

  // 在阈值~100 之间线性缩放到 0.7~1.0 的伤害系数
  const span = 100 - CAST_SUCCESS_THRESHOLD || 1;
  const scale = 0.7 + (0.3 * (acc - CAST_SUCCESS_THRESHOLD)) / span;
  const crit = acc >= CAST_CRIT_THRESHOLD;
  const critMul = crit ? 1.5 : 1;
  const damage = Math.max(1, Math.round(safeBase * safePower * scale * critMul));
  return { damage, crit };
}
