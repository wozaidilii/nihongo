import type { Stage } from "~/types";

/** 关卡数据(技能见 src/data/skills.ts，按职业区分) */
export const STAGES: Stage[] = [
  {
    id: "forest-1",
    title: "迷いの森",
    order: 1,
    intro: "迷雾森林的深处，一只史莱姆魔人挡住了去路。念出你的咒文，让它见识勇者之力！",
    enemy: { name: "スライム魔人", sprite: "🟢", spriteKey: "slime", hp: 70, attack: 8 },
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
    intro: "幽暗洞窟的最深处，影之巨龙苏醒了。用最强的咒文，终结这场战斗吧！",
    enemy: { name: "影のドラゴン", sprite: "🐉", spriteKey: "dragon", hp: 120, attack: 20 },
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
