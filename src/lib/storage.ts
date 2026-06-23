import { getStarterSkillIds } from "~/data/skills";
import { STAGES_ORDERED } from "~/data/stages";
import type { HeroClassId, PlayerState } from "~/types";

/**
 * 玩家存档读写。
 * 全程 try/catch，并对字段做校验与补全，
 * 任何损坏/旧版本数据都回退到默认存档，绝不让游戏崩溃。
 */

const STORAGE_KEY = "nihongo-hero-save";

/** 当前存档版本，结构变更时 +1 并在 migrate 处理 */
export const SAVE_VERSION = 4;

/** 生成一份全新的默认存档 */
export function createDefaultPlayerState(): PlayerState {
  return {
    version: SAVE_VERSION,
    classId: null,
    level: 1,
    exp: 0,
    clearedStageIds: [],
    learnedVocabIds: [],
    skillTreeUnlocked: [],
    unlockedSkillIds: [],
    discoveredEncounterIds: [],
  };
}

/** 老存档：补全跳关前的通关记录 */
function backfillClearedStages(cleared: string[]): string[] {
  const out = new Set(cleared);
  for (const stage of STAGES_ORDERED) {
    if (!out.has(stage.id)) continue;
    const idx = STAGES_ORDERED.findIndex((s) => s.id === stage.id);
    for (let i = 0; i < idx; i++) {
      const prev = STAGES_ORDERED[i];
      if (prev) out.add(prev.id);
    }
  }
  return [...out];
}

const VALID_CLASS_IDS: HeroClassId[] = ["knight", "mage", "rogue", "samurai"];

/** 把任意值收敛为字符串数组(去重、过滤非字符串) */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out = value.filter((x): x is string => typeof x === "string");
  return Array.from(new Set(out));
}

/** 把任意值收敛为非负整数 */
function toNonNegInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/**
 * 校验并补全任意输入为合法 PlayerState。
 * 用于旧版本迁移与防御损坏数据。
 */
export function sanitizePlayerState(raw: unknown): PlayerState {
  const base = createDefaultPlayerState();
  if (!raw || typeof raw !== "object") return base;

  const data = raw as Record<string, unknown>;
  const classId =
    typeof data.classId === "string" &&
    VALID_CLASS_IDS.includes(data.classId as HeroClassId)
      ? (data.classId as HeroClassId)
      : null;

  const level = Math.max(1, toNonNegInt(data.level, base.level));
  let clearedStageIds = backfillClearedStages(toStringArray(data.clearedStageIds));
  let unlockedSkillIds = toStringArray(data.unlockedSkillIds);
  let discoveredEncounterIds = toStringArray(data.discoveredEncounterIds);

  // v2 → v3：按等级补全已解锁咒文（首咒文 Lv1 免费）
  if (unlockedSkillIds.length === 0 && classId) {
    unlockedSkillIds = getStarterSkillIds(classId, level, clearedStageIds);
  }

  return {
    version: SAVE_VERSION,
    classId,
    level,
    exp: toNonNegInt(data.exp, base.exp),
    clearedStageIds,
    learnedVocabIds: toStringArray(data.learnedVocabIds),
    skillTreeUnlocked: toStringArray(data.skillTreeUnlocked),
    unlockedSkillIds,
    discoveredEncounterIds,
  };
}

/** 读取存档；不存在或损坏时返回默认存档 */
export function loadPlayerState(): PlayerState {
  if (typeof window === "undefined") return createDefaultPlayerState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultPlayerState();
    return sanitizePlayerState(JSON.parse(raw));
  } catch {
    return createDefaultPlayerState();
  }
}

/** 写入存档；失败静默忽略 */
export function savePlayerState(state: PlayerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 忽略(隐私模式/容量满等)
  }
}

/** 清空存档 */
export function clearPlayerState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}
