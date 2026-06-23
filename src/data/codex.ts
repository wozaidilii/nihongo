import { STAGES, STAGES_ORDERED } from "~/data/stages";
import {
  getClassSkillProgression,
  getSkillsForStage,
} from "~/data/skills";
import type { HeroClassId, Skill, Vocab } from "~/types";

/** 四职业 id */
const ALL_CLASSES: HeroClassId[] = [
  "knight",
  "mage",
  "rogue",
  "samurai",
];

/** 全关卡 id 顺序 */
export const STAGE_IDS_ORDERED = STAGES_ORDERED.map((s) => s.id);

/** 全部词汇（去重） */
export function getAllVocab(): Vocab[] {
  const map = new Map<string, Vocab>();
  for (const stage of STAGES) {
    for (const v of stage.vocab ?? []) {
      map.set(v.id, v);
    }
  }
  return [...map.values()];
}

/** 按 id 取词汇 */
export function getVocabById(id: string): Vocab | undefined {
  return getAllVocab().find((v) => v.id === id);
}

/** 全部遭遇战条目（图鉴用） */
export interface CodexEncounterEntry {
  encounterId: string;
  stageId: string;
  stageOrder: number;
  kind: "normal" | "boss";
  enemyName: string;
  spriteKey: string;
  sprite: string;
  element: string;
}

export function getAllCodexEncounters(): CodexEncounterEntry[] {
  const out: CodexEncounterEntry[] = [];
  for (const stage of STAGES_ORDERED) {
    for (const enc of stage.encounters) {
      out.push({
        encounterId: enc.id,
        stageId: stage.id,
        stageOrder: stage.order,
        kind: enc.kind,
        enemyName: enc.enemy.name,
        spriteKey: enc.enemy.spriteKey,
        sprite: enc.enemy.sprite,
        element: enc.enemy.element,
      });
    }
  }
  return out;
}

/** 按 id 取咒文（全职业全关卡） */
export function getSkillById(skillId: string): Skill | undefined {
  if (!skillId) return undefined;
  for (const classId of ALL_CLASSES) {
    for (const skill of getClassSkillProgression(classId)) {
      if (skill.id === skillId) return skill;
    }
  }
  return undefined;
}

/** 图鉴：已见过的咒文详情 */
export function getDiscoveredSkillDetails(discoveredSkillIds: string[]): Skill[] {
  const seen = new Set<string>();
  const out: Skill[] = [];
  for (const id of discoveredSkillIds) {
    if (seen.has(id)) continue;
    const skill = getSkillById(id);
    if (skill) {
      seen.add(id);
      out.push(skill);
    }
  }
  return out;
}

/** 已解锁咒文详情（当前档位，兼容旧调用） */
export function getUnlockedSkillDetails(
  classId: HeroClassId | null,
  unlockedSkillIds: string[],
): Skill[] {
  if (!classId) return getDiscoveredSkillDetails(unlockedSkillIds);
  const set = new Set(unlockedSkillIds);
  return getClassSkillProgression(classId).filter((s) => set.has(s.id));
}

/** 某关卡全部咒文（四职业合集，图鉴参考） */
export function getStageSkillCatalog(stageId: string): Skill[] {
  return ALL_CLASSES.flatMap((c) => getSkillsForStage(stageId, c));
}
