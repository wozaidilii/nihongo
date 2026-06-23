import { getStarterSkillIds } from "~/data/skills";
import { STAGES_ORDERED } from "~/data/stages";
import type {
  GlobalCodex,
  HeroClassId,
  PlayerState,
  SaveRoot,
  SaveSlotData,
  SaveSlotIndex,
} from "~/types";
import { SAVE_SLOT_COUNT } from "~/types";

/**
 * 玩家存档读写：3 档位 + 全局图鉴。
 * 全程 try/catch，损坏数据回退默认值。
 */

const ROOT_KEY = "nihongo-hero-save-root";
const LEGACY_KEY = "nihongo-hero-save";

export const SAVE_VERSION = 5;

const VALID_CLASS_IDS: HeroClassId[] = [
  "knight",
  "mage",
  "rogue",
  "samurai",
];

/** 空档位 */
export function createEmptySlot(): SaveSlotData {
  return {
    version: SAVE_VERSION,
    classId: null,
    level: 1,
    exp: 0,
    clearedStageIds: [],
    skillTreeUnlocked: [],
    unlockedSkillIds: [],
    savedAt: 0,
  };
}

/** 默认图鉴 */
export function createDefaultCodex(): GlobalCodex {
  return {
    version: SAVE_VERSION,
    learnedVocabIds: [],
    discoveredEncounterIds: [],
    discoveredSkillIds: [],
  };
}

/** 默认根存档 */
export function createDefaultSaveRoot(): SaveRoot {
  return {
    version: SAVE_VERSION,
    activeSlot: null,
    lastPlayedSlot: null,
    slots: Array.from({ length: SAVE_SLOT_COUNT }, () => createEmptySlot()),
    codex: createDefaultCodex(),
  };
}

/** 默认运行时状态 */
export function createDefaultPlayerState(): PlayerState {
  return {
    version: SAVE_VERSION,
    activeSlotIndex: null,
    classId: null,
    level: 1,
    exp: 0,
    clearedStageIds: [],
    skillTreeUnlocked: [],
    unlockedSkillIds: [],
    learnedVocabIds: [],
    discoveredEncounterIds: [],
    discoveredSkillIds: [],
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out = value.filter((x): x is string => typeof x === "string");
  return Array.from(new Set(out));
}

function toNonNegInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

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

function sanitizeSlot(raw: unknown): SaveSlotData {
  const base = createEmptySlot();
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

  if (unlockedSkillIds.length === 0 && classId) {
    unlockedSkillIds = getStarterSkillIds(classId, level, clearedStageIds);
  }

  return {
    version: SAVE_VERSION,
    classId,
    level,
    exp: toNonNegInt(data.exp, base.exp),
    clearedStageIds,
    skillTreeUnlocked: toStringArray(data.skillTreeUnlocked),
    unlockedSkillIds,
    savedAt: toNonNegInt(data.savedAt, 0),
  };
}

function sanitizeCodex(raw: unknown): GlobalCodex {
  const base = createDefaultCodex();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  return {
    version: SAVE_VERSION,
    learnedVocabIds: toStringArray(data.learnedVocabIds),
    discoveredEncounterIds: toStringArray(data.discoveredEncounterIds),
    discoveredSkillIds: toStringArray(data.discoveredSkillIds),
  };
}

function sanitizeSaveRoot(raw: unknown): SaveRoot {
  const base = createDefaultSaveRoot();
  if (!raw || typeof raw !== "object") return base;

  const data = raw as Record<string, unknown>;
  const slotsRaw = Array.isArray(data.slots) ? data.slots : [];
  const slots = base.slots.map((empty, i) => sanitizeSlot(slotsRaw[i] ?? empty));

  let codex = sanitizeCodex(data.codex);
  if (codex.discoveredSkillIds.length === 0) {
    codex = {
      ...codex,
      discoveredSkillIds: Array.from(
        new Set(slots.flatMap((s) => s.unlockedSkillIds)),
      ),
    };
  }

  const active =
    data.activeSlot === 0 || data.activeSlot === 1 || data.activeSlot === 2
      ? (data.activeSlot as SaveSlotIndex)
      : null;
  const lastPlayed =
    data.lastPlayedSlot === 0 ||
    data.lastPlayedSlot === 1 ||
    data.lastPlayedSlot === 2
      ? (data.lastPlayedSlot as SaveSlotIndex)
      : null;

  return {
    version: SAVE_VERSION,
    activeSlot: active,
    lastPlayedSlot: lastPlayed,
    slots,
    codex,
  };
}

/** 旧版单档 → 根存档（写入 slot0 + 图鉴） */
function migrateLegacySave(): SaveRoot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;

    const legacy = JSON.parse(raw) as Record<string, unknown>;
    const classId =
      typeof legacy.classId === "string" &&
      VALID_CLASS_IDS.includes(legacy.classId as HeroClassId)
        ? (legacy.classId as HeroClassId)
        : null;
    const level = Math.max(1, toNonNegInt(legacy.level, 1));
    const clearedStageIds = backfillClearedStages(
      toStringArray(legacy.clearedStageIds),
    );
    let unlockedSkillIds = toStringArray(legacy.unlockedSkillIds);
    if (unlockedSkillIds.length === 0 && classId) {
      unlockedSkillIds = getStarterSkillIds(classId, level, clearedStageIds);
    }

    const root = createDefaultSaveRoot();
    root.slots[0] = {
      version: SAVE_VERSION,
      classId,
      level,
      exp: toNonNegInt(legacy.exp, 0),
      clearedStageIds,
      skillTreeUnlocked: toStringArray(legacy.skillTreeUnlocked),
      unlockedSkillIds,
      savedAt: Date.now(),
    };
    root.activeSlot = classId ? 0 : null;
    root.lastPlayedSlot = classId ? 0 : null;
    root.codex = {
      version: SAVE_VERSION,
      learnedVocabIds: toStringArray(legacy.learnedVocabIds),
      discoveredEncounterIds: toStringArray(legacy.discoveredEncounterIds),
      discoveredSkillIds: unlockedSkillIds,
    };

    window.localStorage.removeItem(LEGACY_KEY);
    return root;
  } catch {
    return null;
  }
}

export function loadSaveRoot(): SaveRoot {
  if (typeof window === "undefined") return createDefaultSaveRoot();
  try {
    const migrated = migrateLegacySave();
    if (migrated) {
      saveSaveRoot(migrated);
      return migrated;
    }

    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return createDefaultSaveRoot();
    return sanitizeSaveRoot(JSON.parse(raw));
  } catch {
    return createDefaultSaveRoot();
  }
}

export function saveSaveRoot(root: SaveRoot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROOT_KEY, JSON.stringify(root));
  } catch {
    // 忽略
  }
}

/** 档位是否有进行中冒险 */
export function isSlotOccupied(slot: SaveSlotData): boolean {
  return slot.classId !== null;
}

/** 从档位 + 图鉴合成运行时状态 */
export function mergePlayerState(
  slot: SaveSlotData,
  codex: GlobalCodex,
  activeSlotIndex: SaveSlotIndex | null,
): PlayerState {
  return {
    version: SAVE_VERSION,
    activeSlotIndex,
    classId: slot.classId,
    level: slot.level,
    exp: slot.exp,
    clearedStageIds: slot.clearedStageIds,
    skillTreeUnlocked: slot.skillTreeUnlocked,
    unlockedSkillIds: slot.unlockedSkillIds,
    learnedVocabIds: codex.learnedVocabIds,
    discoveredEncounterIds: codex.discoveredEncounterIds,
    discoveredSkillIds: codex.discoveredSkillIds,
  };
}

/** 从运行时状态拆出档位数据 */
export function slotFromPlayerState(state: PlayerState): SaveSlotData {
  return {
    version: SAVE_VERSION,
    classId: state.classId,
    level: state.level,
    exp: state.exp,
    clearedStageIds: state.clearedStageIds,
    skillTreeUnlocked: state.skillTreeUnlocked,
    unlockedSkillIds: state.unlockedSkillIds,
    savedAt: Date.now(),
  };
}

export function codexFromPlayerState(state: PlayerState): GlobalCodex {
  return {
    version: SAVE_VERSION,
    learnedVocabIds: state.learnedVocabIds,
    discoveredEncounterIds: state.discoveredEncounterIds,
    discoveredSkillIds: state.discoveredSkillIds,
  };
}

/** @deprecated 兼容旧调用：加载当前激活档位 */
export function loadPlayerState(): PlayerState {
  const root = loadSaveRoot();
  const idx = root.activeSlot;
  const slot = idx !== null ? root.slots[idx]! : createEmptySlot();
  return mergePlayerState(slot, root.codex, idx);
}

/** @deprecated 兼容旧调用 */
export function savePlayerState(state: PlayerState): void {
  const root = loadSaveRoot();
  const idx = state.activeSlotIndex;
  if (idx === null) {
    root.codex = codexFromPlayerState(state);
    saveSaveRoot(root);
    return;
  }
  root.slots[idx] = slotFromPlayerState(state);
  root.codex = codexFromPlayerState(state);
  root.activeSlot = idx;
  root.lastPlayedSlot = idx;
  saveSaveRoot(root);
}

export function clearPlayerState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ROOT_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // 忽略
  }
}
