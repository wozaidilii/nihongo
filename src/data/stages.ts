import type { Stage, StageEncounter } from "~/types";

/** 关卡数据(技能见 src/data/skills.ts，按职业区分) */
export const STAGES: Stage[] = [
  {
    id: "plains-1",
    title: "風の平原",
    order: 1,
    intro:
      "広い平原に魔物が現れた。三連戦で弱点を見極め、風と光の呪文で道を切り開け！",
    encounters: [
      {
        id: "plains-1-e1",
        kind: "normal",
        enemy: {
          name: "魔蜂",
          sprite: "🐝",
          spriteKey: "bee",
          hp: 28,
          attack: 5,
          element: "neutral",
          weakness: ["fire", "lightning"],
        },
      },
      {
        id: "plains-1-e2",
        kind: "normal",
        enemy: {
          name: "毒蛇",
          sprite: "🐍",
          spriteKey: "snake",
          hp: 38,
          attack: 7,
          element: "shadow",
          weakness: ["holy", "fire"],
        },
      },
      {
        id: "plains-1-boss",
        kind: "boss",
        enemy: {
          name: "大蠕虫",
          sprite: "🪱",
          spriteKey: "small_worm",
          hp: 60,
          attack: 9,
          element: "neutral",
          weakness: ["fire", "holy"],
          resist: ["shadow"],
        },
      },
    ],
    vocab: [
      { id: "v-kaze", kana: "かぜ", kanji: "風", romaji: "kaze", zh: "风" },
      { id: "v-sora", kana: "そら", kanji: "空", romaji: "sora", zh: "天空" },
      { id: "v-hikari", kana: "ひかり", kanji: "光", romaji: "hikari", zh: "光" },
      { id: "v-dobu", kana: "どぶ", kanji: "土", romaji: "tsuchi", zh: "土地" },
    ],
  },
  {
    id: "forest-1",
    title: "迷いの森",
    order: 2,
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
      { id: "v-yami", kana: "やみ", kanji: "闇", romaji: "yami", zh: "黑暗" },
      { id: "v-chikara", kana: "ちから", kanji: "力", romaji: "chikara", zh: "力量" },
      { id: "v-mori", kana: "もり", kanji: "森", romaji: "mori", zh: "森林" },
    ],
  },
  {
    id: "cave-1",
    title: "竜の洞窟",
    order: 3,
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
      { id: "v-kaminari", kana: "かみなり", kanji: "雷", romaji: "kaminari", zh: "雷" },
      { id: "v-tsurugi", kana: "つるぎ", kanji: "剣", romaji: "tsurugi", zh: "剑" },
      { id: "v-ryuu", kana: "りゅう", kanji: "竜", romaji: "ryuu", zh: "龙" },
      { id: "v-hora", kana: "ほら", kanji: "洞", romaji: "hora", zh: "洞穴" },
    ],
  },
  {
    id: "castle-1",
    title: "古の城塞",
    order: 4,
    intro:
      "荒废城塞中游荡着魔眼与南瓜怪。用雷与圣光咒文突破防线，在城主面前证明你的实力！",
    encounters: [
      {
        id: "castle-1-e1",
        kind: "normal",
        enemy: {
          name: "魔眼",
          sprite: "👁",
          spriteKey: "eyeball",
          hp: 58,
          attack: 11,
          element: "shadow",
          weakness: ["holy", "lightning"],
          resist: ["shadow"],
        },
      },
      {
        id: "castle-1-e2",
        kind: "normal",
        enemy: {
          name: "カボチャ魔",
          sprite: "🎃",
          spriteKey: "pumpking",
          hp: 62,
          attack: 13,
          element: "fire",
          weakness: ["holy"],
          resist: ["fire"],
        },
      },
      {
        id: "castle-1-boss",
        kind: "boss",
        enemy: {
          name: "城塞の番人",
          sprite: "🎃",
          spriteKey: "pumpking_boss",
          hp: 95,
          attack: 15,
          element: "fire",
          weakness: ["holy", "lightning"],
          resist: ["fire", "shadow"],
        },
      },
    ],
    vocab: [
      { id: "v-shiro", kana: "しろ", kanji: "城", romaji: "shiro", zh: "城堡" },
      { id: "v-mamoru", kana: "まもる", kanji: "守", romaji: "mamoru", zh: "守护" },
      { id: "v-seinaru", kana: "せいなる", kanji: "聖", romaji: "seinaru", zh: "神圣" },
      { id: "v-yami2", kana: "やみ", kanji: "闇", romaji: "yami", zh: "黑暗" },
    ],
  },
  {
    id: "demon-1",
    title: "魔王城",
    order: 5,
    intro:
      "魔王城的最深处，终极连战等待勇者。以全部咒文与属性克制，终结魔王的传说！",
    encounters: [
      {
        id: "demon-1-e1",
        kind: "normal",
        enemy: {
          name: "巨大蠕虫",
          sprite: "🐛",
          spriteKey: "big_worm",
          hp: 70,
          attack: 14,
          element: "neutral",
          weakness: ["fire", "lightning"],
        },
      },
      {
        id: "demon-1-e2",
        kind: "normal",
        enemy: {
          name: "食人花",
          sprite: "🌺",
          spriteKey: "man_eater",
          hp: 75,
          attack: 16,
          element: "shadow",
          weakness: ["fire", "holy"],
          resist: ["shadow"],
        },
      },
      {
        id: "demon-1-boss",
        kind: "boss",
        enemy: {
          name: "魔王",
          sprite: "👹",
          spriteKey: "demon_lord",
          hp: 150,
          attack: 22,
          element: "shadow",
          weakness: ["holy", "lightning"],
          resist: ["fire", "shadow"],
        },
      },
    ],
    vocab: [
      { id: "v-maou", kana: "まおう", kanji: "魔王", romaji: "maou", zh: "魔王" },
      { id: "v-saigo", kana: "さいご", kanji: "最後", romaji: "saigo", zh: "最后" },
      { id: "v-hokori", kana: "ほこり", kanji: "誇り", romaji: "hokori", zh: "骄傲" },
      { id: "v-unmei", kana: "うんめい", kanji: "運命", romaji: "unmei", zh: "命运" },
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

/** 咒文解锁：某关技能是否可解锁（需通关前一关） */
export function isStageSkillGateOpen(
  stageId: string,
  clearedStageIds: string[] = [],
): boolean {
  return isStageUnlocked(stageId, clearedStageIds);
}
