import type { HeroClass, HeroClassId, Skill, SkillTreeNode, SpeechStyle, SpeechStyleId, Stage } from "~/types";
import type { CastMatchPath } from "~/lib/match";
import type { Locale } from "./types";
import { t } from "./messages";

type L = Record<Locale, string>;

/** 职业描述（name 仍用 heroName / nameJa） */
const CLASS_DESC: Record<HeroClassId, L> = {
  knight: {
    zh: "以礼为剑的圣骑士。用最优雅的敬语，斩断一切邪恶。",
    ja: "礼を剣とする聖騎士。最も優雅な敬語で、あらゆる悪を斬る。",
    en: "A holy knight whose blade is courtesy. Cut down evil with the most elegant polite speech.",
  },
  mage: {
    zh: "封印着禁忌之力的咏唱者。中二咒文越长，魔力越强。",
    ja: "禁忌の力を封じた詠唱者。厨二呪文が長いほど、魔力は強まる。",
    en: "A chanter bound to forbidden power. The chuunier the spell, the stronger the magic.",
  },
  rogue: {
    zh: "潇洒不羁的影之刺客。用最随性的口语，给敌人致命一击。",
    ja: "洒脱不羈の影の刺客。最も気軽な口調で、敵に致命の一撃を。",
    en: "A carefree shadow assassin. Finish foes with casual, street-smart speech.",
  },
  samurai: {
    zh: "恪守武士之道的剑豪。一言一行皆古风，一刀一式皆必杀。",
    ja: "武士の道を守る剣豪。一言一行に古風、一刀一技に必殺。",
    en: "A swordsman who lives by bushido. Every word is archaic; every strike is lethal.",
  },
};

/** 语体名称（ja 用数据里的 nameJa） */
const STYLE_NAME: Record<SpeechStyleId, L> = {
  keigo: { zh: "敬语·礼貌体", ja: "丁寧語", en: "Polite (Keigo)" },
  chuuni: { zh: "中二·文言混合", ja: "厨二語", en: "Chuuni / Archaic Mix" },
  tameguchi: { zh: "随便·口语体", ja: "タメ口", en: "Casual Speech" },
  bushi: { zh: "古风·武士体", ja: "武士語", en: "Samurai Speech" },
};

const STYLE_DESC: Record<SpeechStyleId, L> = {
  keigo: {
    zh: "彬彬有礼的高雅说话方式，句尾多用「です・ます」，骑士风范尽显。",
    ja: "礼儀正しい話し方。語尾は「です・ます」が多く、騎士の風格が漂う。",
    en: "Refined and polite, ending sentences with desu/masu — true knight's bearing.",
  },
  chuuni: {
    zh: "中二病全开的咏唱体，混用文语与夸张词汇，魔法师的浪漫。",
    ja: "厨二病全開の詠唱体。文語と誇張表現が混ざり、魔法使いの浪漫。",
    en: "Full chuuni incantation style mixing literary and dramatic words — a mage's romance.",
  },
  tameguchi: {
    zh: "吊儿郎当的朋友口吻，句尾爱用「だぜ・じゃん」，盗贼的潇洒。",
    ja: "気軽な友達口調。「だぜ・じゃん」が多く、盗賊の洒脱さ。",
    en: "Buddy-buddy casual tone with da ze / jan endings — rogue swagger.",
  },
  bushi: {
    zh: "古色古香的武士腔，自称「拙者」，句尾用「〜でござる」，侍之道也。",
    ja: "古風な武士口調。自称「拙者」、語尾「〜でござる」、侍の道。",
    en: "Archaic samurai speech: sessha for 'I', de gozaru endings — the way of the warrior.",
  },
};

const STAGE_TITLE: Record<string, L> = {
  "forest-1": { zh: "迷雾之森", ja: "迷いの森", en: "Lost Forest" },
  "cave-1": { zh: "龙之洞窟", ja: "竜の洞窟", en: "Dragon's Cavern" },
};

const STAGE_INTRO: Record<string, L> = {
  "forest-1": {
    zh: "迷雾森林的深处，一只史莱姆魔人挡住了去路。念出你的咒文，让它见识勇者之力！",
    ja: "霧の森の奥深く、スライム魔人が進路を阻む。呪文を唱え、勇者の力を見せつけよう！",
    en: "Deep in the misty woods, a slime fiend blocks your path. Chant your spell and show your hero's might!",
  },
  "cave-1": {
    zh: "幽暗洞窟的最深处，影之巨龙苏醒了。用最强的咒文，终结这场战斗吧！",
    ja: "暗い洞窟の最奥で、影のドラゴンが目を覚ました。最強の呪文で戦いを終わらせよう！",
    en: "In the deepest dark cavern, the shadow dragon awakens. End the battle with your strongest chant!",
  },
};

const ENEMY_NAME: Record<string, L> = {
  "forest-1": { zh: "史莱姆魔人", ja: "スライム魔人", en: "Slime Fiend" },
  "cave-1": { zh: "影之龙", ja: "影のドラゴン", en: "Shadow Dragon" },
};

const VOCAB_MEANING: Record<string, L> = {
  "v-hi": { zh: "火焰", ja: "炎", en: "flame" },
  "v-hikari": { zh: "光", ja: "光", en: "light" },
  "v-yami": { zh: "黑暗", ja: "闇", en: "darkness" },
  "v-chikara": { zh: "力量", ja: "力", en: "power" },
  "v-kaze": { zh: "风", ja: "風", en: "wind" },
  "v-kaminari": { zh: "雷", ja: "雷", en: "thunder" },
  "v-tsurugi": { zh: "剑", ja: "剣", en: "sword" },
  "v-ryuu": { zh: "龙", ja: "竜", en: "dragon" },
};

const SKILL_NAME: Record<string, L> = {
  "k-smite": { zh: "斩击", ja: "斬撃", en: "Smite" },
  "k-shield": { zh: "防御", ja: "防御", en: "Guard" },
  "k-oath": { zh: "骑士之誓", ja: "騎士の誓い", en: "Knight's Oath" },
  "k-judgment": { zh: "终焉审判", ja: "終焉の審判", en: "Final Judgment" },
  "m-orb": { zh: "火球", ja: "火球", en: "Fireball" },
  "m-whisper": { zh: "暗影", ja: "暗影", en: "Shadow Whisper" },
  "m-storm": { zh: "终焉风暴", ja: "終焉の嵐", en: "Final Storm" },
  "m-void": { zh: "虚无咏唱", ja: "虚無の詠唱", en: "Void Chant" },
  "r-stab": { zh: "突刺", ja: "突刺", en: "Backstab" },
  "r-shadow": { zh: "影步", ja: "影步", en: "Shadow Step" },
  "r-volt": { zh: "速攻雷", ja: "速攻雷", en: "Quick Bolt" },
  "r-finisher": { zh: "必杀终局", ja: "必殺・終局", en: "Finishing Blow" },
  "s-wind": { zh: "斩击", ja: "斬撃", en: "Wind Slash" },
  "s-iai": { zh: "居合", ja: "居合", en: "Iai Draw" },
  "s-thunder": { zh: "雷鸣一刀", ja: "雷鳴一刀", en: "Thunder Cut" },
  "s-mushin": { zh: "无双心击", ja: "無双心撃", en: "Mushin Strike" },
};

const SKILL_MEANING: Record<string, L> = {
  "k-smite": { zh: "以正义之光斩击敌人！", ja: "正義の光で敵を斬る！", en: "Strike the foe with righteous light!" },
  "k-shield": { zh: "以圣盾护佑，再以光刃反击！", ja: "聖盾で守り、光の刃で反撃！", en: "Shield up, then counter with a blade of light!" },
  "k-oath": { zh: "以骑士之名，斩断恶龙！", ja: "騎士の名のもと、悪龍を断つ！", en: "In the knight's name, slay the wicked dragon!" },
  "k-judgment": { zh: "祈求神之裁决，终结影龙！", ja: "神の裁きを乞い、影龍を終わらせる！", en: "Pray for divine judgment and end the shadow dragon!" },
  "m-orb": { zh: "凝聚火焰，射出火球！", ja: "炎を集め、火球を放て！", en: "Gather flame and launch a fireball!" },
  "m-whisper": { zh: "呼唤暗影，侵蚀敌人！", ja: "闇を呼び、敵を蝕め！", en: "Call the shadows to corrode your enemy!" },
  "m-storm": { zh: "终焉风暴，听我号令！", ja: "終焉の嵐よ、我が命に従え！", en: "Final storm, obey my command!" },
  "m-void": { zh: "以虚无吞噬一切，包括影龙！", ja: "虚無が全てを呑み、影龍も！", en: "Let the void devour all — even the shadow dragon!" },
  "r-stab": { zh: "从背后突刺，一击必杀！", ja: "背後から一刺し、一撃必殺！", en: "Stab from behind — one hit kill!" },
  "r-shadow": { zh: "借影而行，迅捷一击！", ja: "影に乗り、素早く一撃！", en: "Ride the shadow for a swift strike!" },
  "r-volt": { zh: "快如闪电，一击必杀！", ja: "稲妻の如く、一撃必殺！", en: "Fast as lightning — one decisive blow!" },
  "r-finisher": { zh: "这就是最后一击了！", ja: "これで終わりだぜ！", en: "This is the finishing blow!" },
  "s-wind": { zh: "化风为刃，斩破敌阵！", ja: "風を刃とし、敵陣を切り裂け！", en: "Turn wind into a blade and cut through the foe!" },
  "s-iai": { zh: "以居合之术，一刀两断！", ja: "居合の術で、一刀両断！", en: "Iai technique — one cut, two halves!" },
  "s-thunder": { zh: "伴随雷鸣，一刀斩龙！", ja: "雷鳴と共に、龍を斬る！", en: "With thunder's roar, cut down the dragon!" },
  "s-mushin": { zh: "无心之剑，一击无双！", ja: "無心の剣、一撃無双！", en: "Mindless blade — one peerless strike!" },
};

const TREE_NAME: Record<string, L> = {
  "k-a1": { zh: "圣盾强化", ja: "聖盾強化", en: "Holy Shield+" },
  "k-a2": { zh: "守护誓言", ja: "守護の誓い", en: "Guardian's Oath" },
  "k-b1": { zh: "光明斩", ja: "光明斬", en: "Radiant Slash" },
  "k-b2": { zh: "终焉审判", ja: "終焉の審判", en: "Final Judgment" },
  "m-a1": { zh: "炎爆", ja: "炎爆", en: "Blaze Burst" },
  "m-a2": { zh: "烈焰风暴", ja: "烈焰の嵐", en: "Flame Tempest" },
  "m-b1": { zh: "虚空触媒", ja: "虚空触媒", en: "Void Catalyst" },
  "m-b2": { zh: "虚无吞噬", ja: "虚無吞噬", en: "Void Devour" },
  "r-a1": { zh: "影遁", ja: "影遁", en: "Shadow Escape" },
  "r-a2": { zh: "完美背刺", ja: "完璧な背刺", en: "Perfect Backstab" },
  "r-b1": { zh: "迅雷", ja: "迅雷", en: "Swift Thunder" },
  "r-b2": { zh: "终结一击", ja: "終結の一撃", en: "Finishing Strike" },
  "s-a1": { zh: "疾风斩", ja: "疾風斬", en: "Gale Slash" },
  "s-a2": { zh: "无想剑", ja: "無想剣", en: "Mushin Blade" },
  "s-b1": { zh: "雷鸣斩", ja: "雷鳴斬", en: "Thunder Slash" },
  "s-b2": { zh: "无心放剑", ja: "無心放剣", en: "Mindless Release" },
};

const TREE_DESC: Record<string, L> = {
  "k-a1": { zh: "生命上限 +15", ja: "最大HP +15", en: "Max HP +15" },
  "k-a2": { zh: "防御技能伤害 +30%", ja: "防御スキルダメージ +30%", en: "Guard skill damage +30%" },
  "k-b1": { zh: "全技能伤害 +12%", ja: "全スキルダメージ +12%", en: "All skill damage +12%" },
  "k-b2": { zh: "暴击阈值 -5（更易暴击）", ja: "クリ閾値 -5（クリしやすい）", en: "Crit threshold -5 (easier crits)" },
  "m-a1": { zh: "火球伤害 +25%", ja: "火球ダメージ +25%", en: "Fireball damage +25%" },
  "m-a2": { zh: "全技能伤害 +10%", ja: "全スキルダメージ +10%", en: "All skill damage +10%" },
  "m-b1": { zh: "暗影伤害 +25%", ja: "暗影ダメージ +25%", en: "Shadow damage +25%" },
  "m-b2": { zh: "全技能伤害 +12%", ja: "全スキルダメージ +12%", en: "All skill damage +12%" },
  "r-a1": { zh: "受到怪物伤害 -20%", ja: "モンスターからの被ダメ -20%", en: "Damage taken from monsters -20%" },
  "r-a2": { zh: "突刺伤害 +30%", ja: "突刺ダメージ +30%", en: "Backstab damage +30%" },
  "r-b1": { zh: "突刺伤害 +25%", ja: "突刺ダメージ +25%", en: "Backstab damage +25%" },
  "r-b2": { zh: "全技能伤害 +12%", ja: "全スキルダメージ +12%", en: "All skill damage +12%" },
  "s-a1": { zh: "斩击类伤害 +25%", ja: "斬撃系ダメージ +25%", en: "Slash-type damage +25%" },
  "s-a2": { zh: "全技能伤害 +10%", ja: "全スキルダメージ +10%", en: "All skill damage +10%" },
  "s-b1": { zh: "居合伤害 +25%", ja: "居合ダメージ +25%", en: "Iai damage +25%" },
  "s-b2": { zh: "暴击阈值 -5（更易暴击）", ja: "クリ閾値 -5（クリしやすい）", en: "Crit threshold -5 (easier crits)" },
};

const TREE_ROOT: L = {
  zh: "基础咒文",
  ja: "基本呪文",
  en: "Basic Chants",
};

const TREE_ROOT_DESC: L = {
  zh: "Lv.1 默认",
  ja: "Lv.1 デフォルト",
  en: "Lv.1 default",
};

function pick(map: Record<string, L> | undefined, id: string, fallback: string, locale: Locale): string {
  const entry = map?.[id];
  if (entry) return t(entry, locale);
  return fallback;
}

export function getClassDescription(hero: HeroClass, locale: Locale): string {
  return t(CLASS_DESC[hero.id], locale);
}

export function getSpeechStyleName(style: SpeechStyle, locale: Locale): string {
  return t(STYLE_NAME[style.id], locale);
}

export function getSpeechStyleDescription(style: SpeechStyle, locale: Locale): string {
  return t(STYLE_DESC[style.id], locale);
}

export function getStageTitle(stage: Stage, locale: Locale): string {
  return pick(STAGE_TITLE, stage.id, stage.title, locale);
}

export function getStageIntro(stage: Stage, locale: Locale): string {
  return pick(STAGE_INTRO, stage.id, stage.intro, locale);
}

export function getEnemyName(stage: Stage, locale: Locale): string {
  return pick(ENEMY_NAME, stage.id, stage.enemy.name, locale);
}

export function getVocabMeaning(vocabId: string, fallbackZh: string, locale: Locale): string {
  return pick(VOCAB_MEANING, vocabId, fallbackZh, locale);
}

export function getSkillDisplayName(skill: Skill, locale: Locale): string {
  if (locale === "ja") return skill.nameJa;
  return pick(SKILL_NAME, skill.id, skill.nameZh, locale);
}

export function getSkillMeaning(skill: Skill, locale: Locale): string {
  return pick(SKILL_MEANING, skill.id, skill.zh, locale);
}

export function getSkillTreeNodeName(node: SkillTreeNode, locale: Locale): string {
  return pick(TREE_NAME, node.id, node.nameZh, locale);
}

export function getSkillTreeNodeDesc(node: SkillTreeNode, locale: Locale): string {
  return pick(TREE_DESC, node.id, node.description, locale);
}

export function getSkillTreeRootName(locale: Locale): string {
  return t(TREE_ROOT, locale);
}

export function getSkillTreeRootDesc(locale: Locale): string {
  return t(TREE_ROOT_DESC, locale);
}

const MATCH_PATH: Record<CastMatchPath, L> = {
  incantation: { zh: "咒文汉字匹配", ja: "呪文漢字一致", en: "Kanji incantation match" },
  incantation_alias: { zh: "咒文汉字匹配", ja: "呪文漢字一致", en: "Kanji incantation match" },
  reading_aligned: { zh: "假名读音匹配", ja: "仮名読み一致", en: "Kana reading match" },
  reading_direct: { zh: "假名读音匹配", ja: "仮名読み一致", en: "Kana reading match" },
  reading_core: { zh: "核心假名匹配（第一关宽容）", ja: "核心仮名一致（第1関寛容）", en: "Core kana match (Stage 1 lenient)" },
};

export function matchPathLabelLocalized(path: CastMatchPath, locale: Locale): string {
  const entry = MATCH_PATH[path];
  return entry ? t(entry, locale) : t({ zh: "匹配", ja: "一致", en: "Match" }, locale);
}
