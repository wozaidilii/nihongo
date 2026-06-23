import type { Stage, StageEncounter } from "~/types";

/** 关卡数据(技能见 src/data/skills.ts，按职业区分) */
export const STAGES: Stage[] = [
  {
    id: "forest-1",
    title: "迷いの森",
    order: 1,
    intro:
      "迷雾森林深处魔物横行。连战三场，在最后的 Boss 战前摸清它们的属性弱点，用克制咒文一击必杀！",
    encounters: [
      {
        id: "forest-1-e1",
        kind: "normal",
        enemy: {
          name: "スライム",
          sprite: "🟢",
          spriteKey: "slime",
          hp: 35,
          attack: 6,
          element: "shadow",
          weakness: ["fire", "holy"],
        },
      },
      {
        id: "forest-1-e2",
        kind: "normal",
        enemy: {
          name: "森の亡霊",
          sprite: "👻",
          spriteKey: "ghost",
          hp: 45,
          attack: 7,
          element: "shadow",
          weakness: ["holy"],
          resist: ["shadow"],
        },
      },
      {
        id: "forest-1-boss",
        kind: "boss",
        enemy: {
          name: "スライム魔人",
          sprite: "🟢",
          spriteKey: "slime_boss",
          hp: 70,
          attack: 9,
          element: "shadow",
          weakness: ["fire", "holy"],
          resist: ["shadow"],
        },
      },
    ],
    vocab: [
      { id: "v-hi", kana: "ほのお", kanji: "炎", romaji: "honoo", zh: "火焰" },
      { id: "v-hikari", kana: "ひかり", kanji: "光", romaji: "hikari", zh: "光" },
      { id: "v-yami", kana: "やみ", kanji: "闇", romaji: "yami", zh: "黑暗" },
      { id: "v-chikara", kana: "ちから", kanji: "力", romaji: "chikara", zh: "力量" },
    ],
  },
  {
    id: "cave-1",
    title: "竜の洞窟",
    order: 2,
    intro:
      "幽暗洞窟中潜伏着炎与影的魔物。突破前两战，在 Boss「影龙」面前用光与雷的咒文终结传说！",
    encounters: [
      {
        id: "cave-1-e1",
        kind: "normal",
        enemy: {
          name: "コウモリ魔",
          sprite: "🦇",
          spriteKey: "bat",
          hp: 50,
          attack: 10,
          element: "shadow",
          weakness: ["holy", "lightning"],
        },
      },
      {
        id: "cave-1-e2",
        kind: "normal",
        enemy: {
          name: "炎のゴーレム",
          sprite: "🔥",
          spriteKey: "golem",
          hp: 55,
          attack: 12,
          element: "fire",
          weakness: ["lightning"],
          resist: ["fire"],
        },
      },
      {
        id: "cave-1-boss",
        kind: "boss",
        enemy: {
          name: "影のドラゴン",
          sprite: "🐉",
          spriteKey: "dragon",
          hp: 120,
          attack: 18,
          element: "shadow",
          weakness: ["holy", "lightning"],
          resist: ["fire", "shadow"],
        },
      },
    ],
    vocab: [
      { id: "v-kaze", kana: "かぜ", kanji: "風", romaji: "kaze", zh: "风" },
      { id: "v-kaminari", kana: "かみなり", kanji: "雷", romaji: "kaminari", zh: "雷" },
      { id: "v-tsurugi", kana: "つるぎ", kanji: "剣", romaji: "tsurugi", zh: "剑" },
      { id: "v-ryuu", kana: "りゅう", kanji: "竜", romaji: "ryuu", zh: "龙" },
    ],
  },
];

/** 按 order 排序的关卡列表(稳定顺序) */
export const STAGES_ORDERED = [...STAGES].sort((a, b) => a.order - b.order);

/** 按 id 安全获取关卡 */
export function getStage(id: string | null | undefined): Stage | undefined {
  if (!id) return undefined;
  return STAGES.find((s) => s.id === id);
}

/** 获取某关卡的下一关，无则返回 undefined */
export function getNextStage(id: string): Stage | undefined {
  const idx = STAGES_ORDERED.findIndex((s) => s.id === id);
  if (idx < 0 || idx + 1 >= STAGES_ORDERED.length) return undefined;
  return STAGES_ORDERED[idx + 1];
}

/** Boss 战（关卡最后一场） */
export function getBossEncounter(stage: Stage): StageEncounter | undefined {
  if (!stage.encounters?.length) return undefined;
  return stage.encounters[stage.encounters.length - 1];
}

/** 按索引取遭遇战，越界返回 undefined */
export function getEncounter(
  stage: Stage,
  index: number,
): StageEncounter | undefined {
  if (index < 0 || index >= stage.encounters.length) return undefined;
  return stage.encounters[index];
}

/**
 * 判断关卡是否已解锁：第一关恒解锁，其余需前一关已通关。
 * clearedIds 缺省视为空，保证健壮。
 */
export function isStageUnlocked(stageId: string, clearedIds: string[] = []): boolean {
  const idx = STAGES_ORDERED.findIndex((s) => s.id === stageId);
  if (idx <= 0) return idx === 0;
  const prev = STAGES_ORDERED[idx - 1];
  return prev ? clearedIds.includes(prev.id) : true;
}
