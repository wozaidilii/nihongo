/**
 * 咒文匹配评分工具。
 * 语音识别常输出汉字（如 行く），而读音目标是假名（いく），
 * 需在对齐咒文与假名后再比对，避免「念对了却扣分」。
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

/** 是否为平假名 */
function isHiragana(ch: string): boolean {
  const c = ch.codePointAt(0);
  return c !== undefined && c >= 0x3041 && c <= 0x3096;
}

/**
 * 归一化日语文本：
 * 转半角 → 片假名转平假名 → 去除空白与标点。
 */
export function normalizeJa(input: string | null | undefined): string {
  if (!input) return "";
  let s = toHalfWidth(String(input));
  s = katakanaToHiragana(s);
  s = s.toLowerCase();
  s = s.replace(/[\s、。，．,.!！?？・「」『』…ー―\-~〜]/g, "");
  return s;
}

/** 语音识别里常见的「汉字写法 ↔ 假名写法」等价（仅用于评分） */
const ASR_KANA_ALIASES: Record<string, string> = {
  行く: "いく",
  行って: "いって",
  行け: "いけ",
  来る: "くる",
  来て: "きて",
  見る: "みる",
  見て: "みて",
  言う: "いう",
  言って: "いって",
  思う: "おもう",
  思って: "おもって",
  有る: "ある",
  在る: "ある",
  成る: "なる",
  成って: "なって",
  為る: "する",
  為て: "して",
  御: "ご",
  御座: "ござ",
  燃えよ: "もえよ",
  紅き: "あかき",
  炎: "ほのお",
  闇: "やみ",
  応えよ: "おうえよ",
  背割れ: "せわれ",
  一刺し: "いっとし",
  居合: "いあい",
  拙者: "せっしゃ",
  風: "かぜ",
  刃: "は",
  裁け: "さばけ",
  護れ: "まもれ",
};

/** 将识别结果里的常见汉字写法替换成假名 */
function applyAsrAliases(text: string): string {
  let s = text;
  const keys = Object.keys(ASR_KANA_ALIASES).sort((a, b) => b.length - a.length);
  for (const kanji of keys) {
    s = s.split(kanji).join(ASR_KANA_ALIASES[kanji] ?? kanji);
  }
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

/** Levenshtein 回溯，得到 inc(咒文) 与 read(假名) 的分段对齐 */
function alignIncantationReading(
  inc: string,
  read: string,
): Array<{ inc: string; read: string }> {
  const a = [...inc];
  const b = [...read];
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );

  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }

  const segments: Array<{ inc: string; read: string }> = [];
  let i = n;
  let j = m;
  let incBuf = "";
  let readBuf = "";

  const flush = () => {
    if (incBuf || readBuf) {
      segments.unshift({ inc: incBuf, read: readBuf });
      incBuf = "";
      readBuf = "";
    }
  };

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i]![j] === dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] === b[j - 1]) {
        flush();
        segments.unshift({ inc: a[i - 1]!, read: b[j - 1]! });
      } else {
        incBuf = a[i - 1]! + incBuf;
        readBuf = b[j - 1]! + readBuf;
      }
      i--;
      j--;
    } else if (j > 0 && dp[i]![j] === dp[i]![j - 1]! + 1) {
      readBuf = b[j - 1]! + readBuf;
      j--;
    } else if (i > 0 && dp[i]![j] === dp[i - 1]![j]! + 1) {
      incBuf = a[i - 1]! + incBuf;
      i--;
    } else {
      break;
    }
  }
  flush();
  return segments;
}

/** 从咒文 + 假名读音推导「汉字/混合写法 → 假名」替换表 */
function buildReadingMap(incantation: string, reading: string): Map<string, string> {
  const inc = normalizeJa(incantation);
  const read = normalizeJa(reading);
  const map = new Map<string, string>();

  if (!inc || !read) return map;

  const segments = alignIncantationReading(inc, read);
  for (const { inc: incSeg, read: readSeg } of segments) {
    if (!incSeg || !readSeg || incSeg === readSeg) continue;
    // 咒文段含汉字或非假名，且假名段为纯假名 → 建立替换
    const incHasNonHira = [...incSeg].some((ch) => !isHiragana(ch));
    const readAllHira = [...readSeg].every((ch) => isHiragana(ch));
    if (incHasNonHira && readAllHira) {
      map.set(incSeg, readSeg);
    }
  }
  return map;
}

/** 按咒文/读音对齐表 + 常见别名，把识别文本尽量转成假名读音 */
function heardToReadingForm(
  heard: string,
  incantation: string,
  reading: string,
): string {
  let s = applyAsrAliases(normalizeJa(heard));
  const map = buildReadingMap(incantation, reading);

  const replacements = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [surface, kana] of replacements) {
    if (surface && kana) s = s.split(surface).join(kana);
  }
  return applyAsrAliases(s);
}

/**
 * 计算咏唱准确度(0~100)。
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

/**
 * 技能咏唱评分：对照咒文、假名读音，以及对齐后的假名形式，取最高分。
 */
export function scoreSkillCast(
  heard: string | null | undefined,
  incantation: string | null | undefined,
  reading: string | null | undefined,
  options?: { stageId?: string },
): number {
  return scoreSkillCastDetailed(heard, incantation, reading, options).accuracy;
}

export type CastMatchPath =
  | "incantation"
  | "incantation_alias"
  | "reading_aligned"
  | "reading_direct"
  | "reading_core";

export interface CastScoreDetail {
  accuracy: number;
  matchPath: CastMatchPath;
}

/** 第一关短咒文：取假名前 60% 作为核心片段，降低入门难度 */
function coreReadingFragment(reading: string): string {
  const n = normalizeJa(reading);
  if (!n) return "";
  const len = Math.max(2, Math.ceil(n.length * 0.6));
  return n.slice(0, len);
}

/**
 * 技能咏唱详细评分（含匹配路径，供 UI 提示）。
 */
export function scoreSkillCastDetailed(
  heard: string | null | undefined,
  incantation: string | null | undefined,
  reading: string | null | undefined,
  options?: { stageId?: string },
): CastScoreDetail {
  const inc = incantation ?? "";
  const read = reading ?? "";
  const aligned = heardToReadingForm(heard ?? "", inc, read);
  const coreRead = coreReadingFragment(read);

  const candidates: Array<{ score: number; path: CastMatchPath }> = [
    { score: scoreReading(heard, inc), path: "incantation" },
    {
      score: scoreReading(applyAsrAliases(normalizeJa(heard)), inc),
      path: "incantation_alias",
    },
    { score: scoreReading(aligned, read), path: "reading_aligned" },
    { score: scoreReading(heard, read), path: "reading_direct" },
  ];

  // 第一关：额外比对假名核心片段
  if (options?.stageId === "forest-1" && coreRead) {
    candidates.push({
      score: scoreReading(aligned, coreRead),
      path: "reading_core",
    });
    candidates.push({
      score: scoreReading(heard, coreRead),
      path: "reading_core",
    });
  }

  const best = candidates.reduce((a, b) => (b.score > a.score ? b : a), {
    score: 0,
    path: "reading_direct" as CastMatchPath,
  });

  return {
    accuracy: Math.max(0, best.score),
    matchPath: best.path,
  };
}

export function matchPathLabel(path: CastMatchPath): string {
  switch (path) {
    case "incantation":
    case "incantation_alias":
      return "咒文汉字匹配";
    case "reading_aligned":
    case "reading_direct":
      return "假名读音匹配";
    case "reading_core":
      return "核心假名匹配（第一关宽容）";
    default:
      return "匹配";
  }
}

/** UI 用：准确度达到此值显示「咏唱成功」 */
export const CAST_GOOD_THRESHOLD = 70;

/** 暴击阈值 */
export const CAST_CRIT_THRESHOLD = 92;

/** 最低威力倍率(1% 准确度时) */
export const CAST_MIN_SCALE = 0.15;

export function powerScaleFromAccuracy(accuracy: number): number {
  const acc = Math.max(0, Math.min(100, Number.isFinite(accuracy) ? accuracy : 0));
  if (acc <= 0) return 0;
  return CAST_MIN_SCALE + (acc / 100) * (1 - CAST_MIN_SCALE);
}

export function damageFromAccuracy(
  accuracy: number,
  base: number,
  power = 1,
  critThreshold = CAST_CRIT_THRESHOLD,
): { damage: number; crit: boolean; cast: boolean } {
  const safeBase = Number.isFinite(base) && base > 0 ? base : 0;
  const safePower = Number.isFinite(power) && power > 0 ? power : 1;
  const scale = powerScaleFromAccuracy(accuracy);
  const safeCritThreshold = Math.max(
    50,
    Math.min(100, Number.isFinite(critThreshold) ? critThreshold : CAST_CRIT_THRESHOLD),
  );

  if (scale <= 0 || safeBase <= 0) {
    return { damage: 0, crit: false, cast: false };
  }

  const acc = Math.max(0, Math.min(100, Number.isFinite(accuracy) ? accuracy : 0));
  const crit = acc >= safeCritThreshold;
  const critMul = crit ? 1.5 : 1;
  const damage = Math.max(1, Math.round(safeBase * safePower * scale * critMul));
  return { damage, crit, cast: true };
}
