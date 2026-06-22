import type { Stage } from "~/types";

/**
 * 关卡数据。
 * 每个技能给出四种语体的「咒文写法」与「目标读音(假名)」，
 * 读音用于语音识别比对；展示则按玩家职业的语体选取。
 */
export const STAGES: Stage[] = [
  {
    id: "forest-1",
    title: "迷いの森",
    order: 1,
    intro: "迷雾森林的深处，一只史莱姆魔人挡住了去路。念出你的咒文，让它见识勇者之力！",
    enemy: { name: "スライム魔人", sprite: "🟢", hp: 70, attack: 12 },
    vocab: [
      { id: "v-hi", kana: "ほのお", kanji: "炎", romaji: "honoo", zh: "火焰" },
      { id: "v-hikari", kana: "ひかり", kanji: "光", romaji: "hikari", zh: "光" },
      { id: "v-yami", kana: "やみ", kanji: "闇", romaji: "yami", zh: "黑暗" },
      { id: "v-chikara", kana: "ちから", kanji: "力", romaji: "chikara", zh: "力量" },
    ],
    skills: [
      {
        id: "s-flame",
        nameJa: "炎の刃",
        nameZh: "炎之刃",
        baseDamage: 32,
        zh: "燃烧吧，我的火焰！",
        incantationByStyle: {
          keigo: "炎よ、燃えてください",
          chuuni: "燃えよ、我が炎",
          tameguchi: "燃えろ、炎",
          bushi: "炎よ、いざ参る",
        },
        readingByStyle: {
          keigo: "ほのおよ もえてください",
          chuuni: "もえよ わがほのお",
          tameguchi: "もえろ ほのお",
          bushi: "ほのおよ いざまいる",
        },
      },
      {
        id: "s-light",
        nameJa: "光の祈り",
        nameZh: "光之祈祷",
        baseDamage: 38,
        zh: "光啊，贯穿黑暗！",
        incantationByStyle: {
          keigo: "光よ、導いてください",
          chuuni: "光よ、闇を貫け",
          tameguchi: "光、頼むぜ",
          bushi: "光明よ、いざ",
        },
        readingByStyle: {
          keigo: "ひかりよ みちびいてください",
          chuuni: "ひかりよ やみをつらぬけ",
          tameguchi: "ひかり たのむぜ",
          bushi: "こうみょうよ いざ",
        },
      },
    ],
  },
  {
    id: "cave-1",
    title: "竜の洞窟",
    order: 2,
    intro: "幽暗洞窟的最深处，影之巨龙苏醒了。用最强的咒文，终结这场战斗吧！",
    enemy: { name: "影のドラゴン", sprite: "🐉", hp: 120, attack: 20 },
    vocab: [
      { id: "v-kaze", kana: "かぜ", kanji: "風", romaji: "kaze", zh: "风" },
      { id: "v-kaminari", kana: "かみなり", kanji: "雷", romaji: "kaminari", zh: "雷" },
      { id: "v-tsurugi", kana: "つるぎ", kanji: "剣", romaji: "tsurugi", zh: "剑" },
      { id: "v-ryuu", kana: "りゅう", kanji: "竜", romaji: "ryuu", zh: "龙" },
    ],
    skills: [
      {
        id: "s-thunder",
        nameJa: "雷鳴撃",
        nameZh: "雷鸣击",
        baseDamage: 40,
        zh: "雷啊，降临吧！",
        incantationByStyle: {
          keigo: "雷よ、落ちてください",
          chuuni: "雷よ、我に宿れ",
          tameguchi: "雷、落ちろ",
          bushi: "雷よ、いざ落ちよ",
        },
        readingByStyle: {
          keigo: "かみなりよ おちてください",
          chuuni: "かみなりよ われにやどれ",
          tameguchi: "かみなり おちろ",
          bushi: "かみなりよ いざおちよ",
        },
      },
      {
        id: "s-final",
        nameJa: "勇者の一閃",
        nameZh: "勇者一闪",
        baseDamage: 50,
        zh: "以我之剑，斩断命运！",
        incantationByStyle: {
          keigo: "我が剣で、終わらせます",
          chuuni: "我が剣よ、運命を断て",
          tameguchi: "俺の剣で、終わりだぜ",
          bushi: "拙者の剣で、討ち取るでござる",
        },
        readingByStyle: {
          keigo: "わがつるぎで おわらせます",
          chuuni: "わがつるぎよ うんめいをたて",
          tameguchi: "おれのつるぎで おわりだぜ",
          bushi: "せっしゃのつるぎで うちとるでござる",
        },
      },
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
  if (idx <= 0) return idx === 0; // 第一关或不存在
  const prev = STAGES_ORDERED[idx - 1];
  return prev ? clearedIds.includes(prev.id) : true;
}
