import type { HeroClassId, Skill } from "~/types";
import { getAggregatedModifiers } from "~/data/skillTree";
import { isStageSkillGateOpen, STAGES_ORDERED } from "~/data/stages";
import { elementFromFx } from "~/lib/element";

/** 关卡顺序：决定咒文解锁进度 */
const STAGE_ORDER = STAGES_ORDERED.map((s) => s.id);

/**
 * 各职业专属技能：同一关卡不同职业咒文、特效、伤害均不同。
 * reading / romaji 为咒文完整读音参考；语音路径：/voices/skill_{classId}_{skillId}.wav
 */
export const CLASS_SKILLS: Record<HeroClassId, Record<string, Skill[]>> = {
  knight: {
    "plains-1": [
      {
        id: "k-breeze",
        classId: "knight",
        stageId: "plains-1",
        nameJa: "風刃",
        nameZh: "风刃",
        incantation: "風よ、刃となれ",
        reading: "かぜよ はとなれ",
        romaji: "kaze yo, ha to nare",
        baseDamage: 28,
        zh: "化风为刃，切开平原魔物！",
        fxKey: "slash",
      },
      {
        id: "k-dawn",
        classId: "knight",
        stageId: "plains-1",
        nameJa: "暁光",
        nameZh: "晓光",
        incantation: "暁よ、闇を断て",
        reading: "あかつきよ やみをたて",
        romaji: "akatsuki yo, yami o tate",
        baseDamage: 30,
        zh: "以晓之光划破黑暗！",
        fxKey: "holy",
      },
    ],
    "forest-1": [
      {
        id: "k-smite",
        classId: "knight",
        stageId: "forest-1",
        nameJa: "斬撃",
        nameZh: "斩击",
        incantation: "正道の光よ、裁け",
        reading: "せいどうのひかりよ さばけ",
        romaji: "seidou no hikari yo, sabake",
        baseDamage: 32,
        zh: "以正义之光斩击敌人！",
        fxKey: "slash",
      },
      {
        id: "k-shield",
        classId: "knight",
        stageId: "forest-1",
        nameJa: "防御",
        nameZh: "防御",
        incantation: "盾よ、我を護れ",
        reading: "たてよ われをまもれ",
        romaji: "tateyo, ware o mamore",
        baseDamage: 28,
        zh: "以圣盾护佑，再以光刃反击！",
        fxKey: "holy",
      },
    ],
    "cave-1": [
      {
        id: "k-oath",
        classId: "knight",
        stageId: "cave-1",
        nameJa: "騎士の誓い",
        nameZh: "骑士之誓",
        incantation: "我が誓い、悪を断つ",
        reading: "わがちかい あくをたつ",
        romaji: "waga chikai, aku o tatsu",
        baseDamage: 42,
        zh: "以骑士之名，斩断恶龙！",
        fxKey: "holy",
      },
      {
        id: "k-judgment",
        classId: "knight",
        stageId: "cave-1",
        nameJa: "終焉の審判",
        nameZh: "终焉审判",
        incantation: "神よ、裁きをください",
        reading: "かみよ さばきをください",
        romaji: "kami yo, sabaki o kudasai",
        baseDamage: 52,
        zh: "祈求神之裁决，终结影龙！",
        fxKey: "holy",
      },
    ],
    "castle-1": [
      {
        id: "k-bastion",
        classId: "knight",
        stageId: "castle-1",
        nameJa: "城塞の盾",
        nameZh: "城塞之盾",
        incantation: "城塞よ、我を護れ",
        reading: "じょうさいよ われをまもれ",
        romaji: "jousai yo, ware o mamore",
        baseDamage: 44,
        zh: "以城塞之名守护并反击！",
        fxKey: "holy",
      },
      {
        id: "k-thunder-blade",
        classId: "knight",
        stageId: "castle-1",
        nameJa: "雷刃",
        nameZh: "雷刃",
        incantation: "雷よ、刃に宿れ",
        reading: "かみなりよ はにやどれ",
        romaji: "kaminari yo, ha ni yadore",
        baseDamage: 48,
        zh: "雷电附刃，斩断城塞妖魔！",
        fxKey: "lightning",
      },
    ],
    "demon-1": [
      {
        id: "k-final-oath",
        classId: "knight",
        stageId: "demon-1",
        nameJa: "終焉の誓約",
        nameZh: "终焉誓约",
        incantation: "終焉の時、悪を断つ",
        reading: "しゅうえんのとき あくをたつ",
        romaji: "shuuen no toki, aku o tatsu",
        baseDamage: 55,
        zh: "在终焉之时斩断邪恶！",
        fxKey: "holy",
      },
      {
        id: "k-demon-slay",
        classId: "knight",
        stageId: "demon-1",
        nameJa: "魔王斬",
        nameZh: "魔王斩",
        incantation: "魔王よ、我が剣に散れ",
        reading: "まおうよ わがけんにちれ",
        romaji: "maou yo, waga ken ni chire",
        baseDamage: 58,
        zh: "以圣剑击散魔王！",
        fxKey: "slash",
      },
    ],
  },
  mage: {
    "plains-1": [
      {
        id: "m-gust",
        classId: "mage",
        stageId: "plains-1",
        nameJa: "疾風",
        nameZh: "疾风",
        incantation: "風よ、我に従え",
        reading: "かぜよ われにしたがえ",
        romaji: "kaze yo, ware ni shitagae",
        baseDamage: 26,
        zh: "驱使疾风撕裂敌人！",
        fxKey: "shadow",
      },
      {
        id: "m-spark",
        classId: "mage",
        stageId: "plains-1",
        nameJa: "火花",
        nameZh: "火花",
        incantation: "火花よ、舞い上がれ",
        reading: "ひばちよ まいあがれ",
        romaji: "hibachi yo, maiagare",
        baseDamage: 28,
        zh: "点燃火花，焚尽魔蜂！",
        fxKey: "fire",
      },
    ],
    "forest-1": [
      {
        id: "m-orb",
        classId: "mage",
        stageId: "forest-1",
        nameJa: "火球",
        nameZh: "火球",
        incantation: "燃えよ、紅き炎",
        reading: "もえよ あかきほのお",
        romaji: "moeyo, akaki honoo",
        baseDamage: 30,
        zh: "凝聚火焰，射出火球！",
        fxKey: "fire",
      },
      {
        id: "m-whisper",
        classId: "mage",
        stageId: "forest-1",
        nameJa: "暗影",
        nameZh: "暗影",
        incantation: "闇よ、我が呼び声に応えよ",
        reading: "やみよ わがよびごえにおうえよ",
        romaji: "yami yo, waga yobigoe ni oue yo",
        baseDamage: 32,
        zh: "呼唤暗影，侵蚀敌人！",
        fxKey: "shadow",
      },
    ],
    "cave-1": [
      {
        id: "m-storm",
        classId: "mage",
        stageId: "cave-1",
        nameJa: "終焉の嵐",
        nameZh: "终焉风暴",
        incantation: "終焉の嵐、我に従え",
        reading: "しゅうえんのあらし われにしたがえ",
        romaji: "shuuen no arashi, ware ni shitagae",
        baseDamage: 44,
        zh: "终焉风暴，听我号令！",
        fxKey: "lightning",
      },
      {
        id: "m-void",
        classId: "mage",
        stageId: "cave-1",
        nameJa: "虚無の詠唱",
        nameZh: "虚无咏唱",
        incantation: "虚無よ、全てを呑め",
        reading: "きょむよ すべてをのめ",
        romaji: "kyomu yo, subete o nome",
        baseDamage: 54,
        zh: "以虚无吞噬一切，包括影龙！",
        fxKey: "shadow",
      },
    ],
    "castle-1": [
      {
        id: "m-arcane",
        classId: "mage",
        stageId: "castle-1",
        nameJa: "魔眼封じ",
        nameZh: "封魔眼",
        incantation: "魔眼よ、眠れ",
        reading: "まがんよ ねむれ",
        romaji: "magan yo, nemure",
        baseDamage: 46,
        zh: "封印魔眼，使其归于沉寂！",
        fxKey: "shadow",
      },
      {
        id: "m-sanctify",
        classId: "mage",
        stageId: "castle-1",
        nameJa: "聖域",
        nameZh: "圣域",
        incantation: "聖域よ、邪を祓え",
        reading: "せいいきよ じゃをはらえ",
        romaji: "seiiki yo, ja o harae",
        baseDamage: 50,
        zh: "展开圣域，净化城塞！",
        fxKey: "holy",
      },
    ],
    "demon-1": [
      {
        id: "m-apocalypse",
        classId: "mage",
        stageId: "demon-1",
        nameJa: "終末の火",
        nameZh: "终末之火",
        incantation: "終末の火、魔王を焼け",
        reading: "しゅうまつのひ まおうをやけ",
        romaji: "shuumatsu no hi, maou o yake",
        baseDamage: 56,
        zh: "终末之火，焚尽魔王！",
        fxKey: "fire",
      },
      {
        id: "m-judgment-bolt",
        classId: "mage",
        stageId: "demon-1",
        nameJa: "裁きの雷",
        nameZh: "裁决之雷",
        incantation: "裁きの雷、降り注げ",
        reading: "さばきのかみなり ふりそそげ",
        romaji: "sabaki no kaminari, furisosoge",
        baseDamage: 58,
        zh: "裁决之雷，降临魔王城！",
        fxKey: "lightning",
      },
    ],
  },
  rogue: {
    "plains-1": [
      {
        id: "r-quick",
        classId: "rogue",
        stageId: "plains-1",
        nameJa: "速撃",
        nameZh: "速击",
        incantation: "サッと刺す、風だぜ",
        reading: "さっとさす かぜだぜ",
        romaji: "satto sasu, kaze da ze",
        baseDamage: 28,
        zh: "如风般快速刺击！",
        fxKey: "dagger",
      },
      {
        id: "r-buzz",
        classId: "rogue",
        stageId: "plains-1",
        nameJa: "蜂刺し",
        nameZh: "蜂刺",
        incantation: "蜂みたいに刺すぜ",
        reading: "はちみたいにさすぜ",
        romaji: "hachi mitai ni sasu ze",
        baseDamage: 30,
        zh: "像蜂一样蛰刺敌人！",
        fxKey: "dagger",
      },
    ],
    "forest-1": [
      {
        id: "r-stab",
        classId: "rogue",
        stageId: "forest-1",
        nameJa: "突刺",
        nameZh: "突刺",
        incantation: "背割れ、一刺しだぜ",
        reading: "せわれ いっとしだぜ",
        romaji: "seware, hitoshi da ze",
        baseDamage: 32,
        zh: "从背后突刺，一击必杀！",
        fxKey: "dagger",
      },
      {
        id: "r-shadow",
        classId: "rogue",
        stageId: "forest-1",
        nameJa: "影步",
        nameZh: "影步",
        incantation: "影に乗って、いくぜ",
        reading: "かげにのって いくぜ",
        romaji: "kage ni notte, iku ze",
        baseDamage: 28,
        zh: "借影而行，迅捷一击！",
        fxKey: "shadow",
      },
    ],
    "cave-1": [
      {
        id: "r-volt",
        classId: "rogue",
        stageId: "cave-1",
        nameJa: "速攻雷",
        nameZh: "速攻雷",
        incantation: "サッと決める、雷だぜ",
        reading: "さっとける かみなりだぜ",
        romaji: "satto keru, kaminari da ze",
        baseDamage: 40,
        zh: "快如闪电，一击必杀！",
        fxKey: "lightning",
      },
      {
        id: "r-finisher",
        classId: "rogue",
        stageId: "cave-1",
        nameJa: "必殺・終局",
        nameZh: "必杀终局",
        incantation: "これで終わりだぜ",
        reading: "これでおわりだぜ",
        romaji: "kore de owari da ze",
        baseDamage: 50,
        zh: "这就是最后一击了！",
        fxKey: "dagger",
      },
    ],
    "castle-1": [
      {
        id: "r-ambush",
        classId: "rogue",
        stageId: "castle-1",
        nameJa: "城塞奇襲",
        nameZh: "城塞奇袭",
        incantation: "城塞の影、俺の物だ",
        reading: "じょうさいのかげ おれのものだ",
        romaji: "jousai no kage, ore no mono da",
        baseDamage: 44,
        zh: "借城塞阴影奇袭！",
        fxKey: "shadow",
      },
      {
        id: "r-holy-cut",
        classId: "rogue",
        stageId: "castle-1",
        nameJa: "聖光切り",
        nameZh: "圣光切",
        incantation: "光で切る、決まってる",
        reading: "ひかりできる きまってる",
        romaji: "hikari de kiru, kimatteru",
        baseDamage: 48,
        zh: "用圣光切开南瓜魔！",
        fxKey: "holy",
      },
    ],
    "demon-1": [
      {
        id: "r-maou-stab",
        classId: "rogue",
        stageId: "demon-1",
        nameJa: "魔王刺し",
        nameZh: "魔王刺",
        incantation: "魔王だろうが刺すぜ",
        reading: "まおうだろうがさすぜ",
        romaji: "maou darou ga sasu ze",
        baseDamage: 54,
        zh: "管他是魔王，照刺不误！",
        fxKey: "dagger",
      },
      {
        id: "r-last-word",
        classId: "rogue",
        stageId: "demon-1",
        nameJa: "終局の一言",
        nameZh: "终局一言",
        incantation: "これが最後だ、魔王",
        reading: "これがさいごだ まおう",
        romaji: "kore ga saigo da, maou",
        baseDamage: 56,
        zh: "魔王，这是最后一击！",
        fxKey: "shadow",
      },
    ],
  },
  samurai: {
    "plains-1": [
      {
        id: "s-plain-wind",
        classId: "samurai",
        stageId: "plains-1",
        nameJa: "平原風斬",
        nameZh: "平原风斩",
        incantation: "風よ、平原を切れでござる",
        reading: "かぜよ へいげんをきれでござる",
        romaji: "kaze yo, heigen o kire de gozaru",
        baseDamage: 28,
        zh: "以风斩开平原之敌！",
        fxKey: "slash",
      },
      {
        id: "s-grass-flash",
        classId: "samurai",
        stageId: "plains-1",
        nameJa: "草閃",
        nameZh: "草闪",
        incantation: "草の如く、一閃でござる",
        reading: "くさのごとく いっせんでござる",
        romaji: "kusa no gotoku, issen de gozaru",
        baseDamage: 30,
        zh: "如草般迅捷的一闪！",
        fxKey: "slash",
      },
    ],
    "forest-1": [
      {
        id: "s-wind",
        classId: "samurai",
        stageId: "forest-1",
        nameJa: "斬撃",
        nameZh: "斩击",
        incantation: "風よ、刃となれでござる",
        reading: "かぜよ はとなれでござる",
        romaji: "kaze yo, ha to nare de gozaru",
        baseDamage: 30,
        zh: "化风为刃，斩破敌阵！",
        fxKey: "slash",
      },
      {
        id: "s-iai",
        classId: "samurai",
        stageId: "forest-1",
        nameJa: "居合",
        nameZh: "居合",
        incantation: "拙者、居合にて斬るでござる",
        reading: "せっしゃ いあいにてきるでござる",
        romaji: "sessha, iai nite kiru de gozaru",
        baseDamage: 34,
        zh: "以居合之术，一刀两断！",
        fxKey: "slash",
      },
    ],
    "cave-1": [
      {
        id: "s-thunder",
        classId: "samurai",
        stageId: "cave-1",
        nameJa: "雷鳴一刀",
        nameZh: "雷鸣一刀",
        incantation: "雷鳴と共に、斬るでござる",
        reading: "らいめいとともに きるでござる",
        romaji: "raimei to tomo ni, kiru de gozaru",
        baseDamage: 42,
        zh: "伴随雷鸣，一刀斩龙！",
        fxKey: "lightning",
      },
      {
        id: "s-mushin",
        classId: "samurai",
        stageId: "cave-1",
        nameJa: "無双心撃",
        nameZh: "无双心击",
        incantation: "無心の剣、いざ放つでござる",
        reading: "むしんのつるぎ いざはなつでござる",
        romaji: "mushin no tsurugi, iza hanatsu de gozaru",
        baseDamage: 52,
        zh: "无心之剑，一击无双！",
        fxKey: "thrust",
      },
    ],
    "castle-1": [
      {
        id: "s-castle-draw",
        classId: "samurai",
        stageId: "castle-1",
        nameJa: "城塞抜刀",
        nameZh: "城塞拔刀",
        incantation: "城塞にて、抜刀致すでござる",
        reading: "じょうさいにて ばっとういたすでござる",
        romaji: "jousai nite, battou itasu de gozaru",
        baseDamage: 46,
        zh: "于城塞之中拔刀一击！",
        fxKey: "slash",
      },
      {
        id: "s-holy-blade",
        classId: "samurai",
        stageId: "castle-1",
        nameJa: "聖刀",
        nameZh: "圣刀",
        incantation: "聖なる刃、斬り下ろすでござる",
        reading: "せいなるは きりおろすでござる",
        romaji: "sei naru ha, kiri orosu de gozaru",
        baseDamage: 50,
        zh: "以圣刀斩落城主！",
        fxKey: "holy",
      },
    ],
    "demon-1": [
      {
        id: "s-demon-iai",
        classId: "samurai",
        stageId: "demon-1",
        nameJa: "魔王居合",
        nameZh: "魔王居合",
        incantation: "魔王に向け、居合の極意でござる",
        reading: "まおうにむけ いあいのきわみでござる",
        romaji: "maou ni muke, iai no kyowmi de gozaru",
        baseDamage: 56,
        zh: "以居合极意斩向魔王！",
        fxKey: "thrust",
      },
      {
        id: "s-final-bushido",
        classId: "samurai",
        stageId: "demon-1",
        nameJa: "武士道・終",
        nameZh: "武士道·终",
        incantation: "武士道、ここに極まるでござる",
        reading: "ぶしどう ここにきわまるでござる",
        romaji: "bushidou, koko ni kiwamaru de gozaru",
        baseDamage: 58,
        zh: "武士道，在此终结魔王！",
        fxKey: "slash",
      },
    ],
  },
};

/** 补全技能属性 */
function normalizeSkill(skill: Skill): Skill {
  return {
    ...skill,
    element: skill.element ?? elementFromFx(skill.fxKey),
  };
}

/** 取某职业在某关卡的技能列表；缺省返回空数组 */
export function getSkillsForStage(
  stageId: string | null | undefined,
  classId: HeroClassId | null | undefined,
): Skill[] {
  if (!stageId || !classId) return [];
  return (CLASS_SKILLS[classId]?.[stageId] ?? []).map(normalizeSkill);
}

/** 职业全部咒文（按关卡顺序） */
export function getClassSkillProgression(classId: HeroClassId): Skill[] {
  return STAGE_ORDER.flatMap((stageId) => getSkillsForStage(stageId, classId));
}

/** 首个免费咒文 id */
export function getStarterSkillId(classId: HeroClassId): string | undefined {
  return getClassSkillProgression(classId)[0]?.id;
}

/**
 * 迁移/初始化：按等级补全已解锁咒文（Lv1 仅首咒文，每升 1 级多 1 个技能点）。
 * 洞窟咒文需先通关森林关。
 */
export function getStarterSkillIds(
  classId: HeroClassId,
  level: number,
  clearedStageIds: string[] = [],
): string[] {
  const progression = getClassSkillProgression(classId);
  const allowed = progression.filter((s) =>
    isStageSkillGateOpen(s.stageId, clearedStageIds),
  );
  const count = Math.min(Math.max(1, level), allowed.length);
  return allowed.slice(0, count).map((s) => s.id);
}

/** 尚未解锁、且满足关卡条件的下一批咒文 */
export function getUnlockableBattleSkills(
  classId: HeroClassId,
  clearedStageIds: string[],
  unlockedSkillIds: string[] = [],
): Skill[] {
  const unlocked = new Set(unlockedSkillIds);
  return getClassSkillProgression(classId).filter((skill) => {
    if (unlocked.has(skill.id)) return false;
    return isStageSkillGateOpen(skill.stageId, clearedStageIds);
  });
}

/** 下一项可解锁咒文（按进度顺序） */
export function getNextUnlockableBattleSkill(
  classId: HeroClassId,
  clearedStageIds: string[],
  unlockedSkillIds: string[] = [],
): Skill | undefined {
  return getUnlockableBattleSkills(classId, clearedStageIds, unlockedSkillIds)[0];
}

/** 待消耗的技能点数量（Lv1 自带 1 咒文不计入） */
export function getPendingBattleSkillUnlockCount(
  level: number,
  unlockedSkillIds: string[] = [],
): number {
  const earned = Math.max(0, level - 1);
  const spent = Math.max(0, unlockedSkillIds.length - 1);
  return Math.max(0, earned - spent);
}

/** 应用技能树加成后的战斗技能列表（仅已解锁咒文） */
export function getBattleSkills(
  classId: HeroClassId | null | undefined,
  unlockedSkillIds: string[] = [],
  unlockedNodes: string[] = [],
): Skill[] {
  if (!classId) return [];

  const unlocked = new Set(unlockedSkillIds);
  const base = getClassSkillProgression(classId).filter((s) => unlocked.has(s.id));
  if (base.length === 0) return base;

  const mods = getAggregatedModifiers(classId, unlockedNodes);
  const globalMul = mods.damageMul ?? 1;

  return base.map((skill) => {
    const skillMul = mods.skillDamageMul?.[skill.id] ?? 1;
    const mul = globalMul * skillMul;
    if (mul === 1) return skill;
    return {
      ...skill,
      baseDamage: Math.max(1, Math.round(skill.baseDamage * mul)),
    };
  });
}
