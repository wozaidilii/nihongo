import type { HeroClass, HeroClassId, SpeechStyle, SpeechStyleId } from "~/types";

/**
 * 四种日语语体(说话方式)。
 * 职业不同 → 语体不同 → 学到的日语表达方式不同。
 */
export const SPEECH_STYLES: Record<SpeechStyleId, SpeechStyle> = {
  keigo: {
    id: "keigo",
    nameJa: "丁寧語",
    nameZh: "敬语·礼貌体",
    description: "彬彬有礼的高雅说话方式，句尾多用「です・ます」，骑士风范尽显。",
    signature: "〜です／〜ます",
    sample: "我が剣に懸けて、必ずや勝利いたします。",
  },
  chuuni: {
    id: "chuuni",
    nameJa: "厨二語",
    nameZh: "中二·文言混合",
    description: "中二病全开的咏唱体，混用文语与夸张词汇，魔法师的浪漫。",
    signature: "我が〜よ／〜なり",
    sample: "闇よ、我が呼び声に応えよ……穿て、漆黒の槍！",
  },
  tameguchi: {
    id: "tameguchi",
    nameJa: "タメ口",
    nameZh: "随便·口语体",
    description: "吊儿郎当的朋友口吻，句尾爱用「だぜ・じゃん」，盗贼的潇洒。",
    signature: "〜だぜ／〜じゃん",
    sample: "こんなの楽勝だぜ。さっさと行こうぜ！",
  },
  bushi: {
    id: "bushi",
    nameJa: "武士語",
    nameZh: "古风·武士体",
    description: "古色古香的武士腔，自称「拙者」，句尾用「〜でござる」，侍之道也。",
    signature: "拙者／〜でござる",
    sample: "拙者の刃、いざ唸るでござる！",
  },
};

/** 四个可选职业 */
export const HERO_CLASS_IDS: HeroClassId[] = [
  "knight",
  "mage",
  "rogue",
  "samurai",
];

/** 四个可选职业 */
export const HERO_CLASSES: HeroClass[] = [
  {
    id: "knight",
    nameJa: "騎士",
    nameZh: "骑士",
    styleId: "keigo",
    description: "以礼为剑的圣骑士。用最优雅的敬语，斩断一切邪恶。",
    sprite: "🛡️",
    spriteKey: "knight",
    stats: { power: 1.0, maxHp: 120 },
  },
  {
    id: "mage",
    nameJa: "魔法使い",
    nameZh: "魔法师",
    styleId: "chuuni",
    description: "封印着禁忌之力的咏唱者。中二咒文越长，魔力越强。",
    sprite: "🔮",
    spriteKey: "mage",
    stats: { power: 1.3, maxHp: 80 },
  },
  {
    id: "rogue",
    nameJa: "盗賊",
    nameZh: "盗贼",
    styleId: "tameguchi",
    description: "潇洒不羁的影之刺客。用最随性的口语，给敌人致命一击。",
    sprite: "🗡️",
    spriteKey: "rogue",
    stats: { power: 1.15, maxHp: 95 },
  },
  {
    id: "samurai",
    nameJa: "侍",
    nameZh: "武士",
    styleId: "bushi",
    description: "恪守武士之道的剑豪。一言一行皆古风，一刀一式皆必杀。",
    sprite: "⚔️",
    spriteKey: "samurai",
    stats: { power: 1.1, maxHp: 110 },
  },
];

/** 按 id 安全获取职业，找不到返回 undefined(调用方需兜底) */
export function getHeroClass(id: HeroClassId | null | undefined): HeroClass | undefined {
  if (!id) return undefined;
  return HERO_CLASSES.find((c) => c.id === id);
}

/** 按职业获取其语体；缺省回退到中二体，保证永不为空 */
export function getStyleForClass(id: HeroClassId | null | undefined): SpeechStyle {
  const cls = getHeroClass(id);
  const styleId = cls?.styleId ?? "chuuni";
  return SPEECH_STYLES[styleId] ?? SPEECH_STYLES.chuuni;
}
