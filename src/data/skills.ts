import type { HeroClassId, Skill } from "~/types";
import { getAggregatedModifiers } from "~/data/skillTree";
import { elementFromFx } from "~/lib/element";

/** 关卡顺序：决定咒文解锁进度 */
const STAGE_ORDER = ["forest-1", "cave-1"] as const;

/**
 * 各职业专属技能：同一关卡不同职业咒文、特效、伤害均不同。
 * reading / romaji 为咒文完整读音参考；语音路径：/voices/skill_{classId}_{skillId}.wav
 */
export const CLASS_SKILLS: Record<HeroClassId, Record<string, Skill[]>> = {
  knight: {
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
  },
  mage: {
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
  },
  rogue: {
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
  },
  samurai: {
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
  const forestCleared = clearedStageIds.includes("forest-1");
  const allowed = progression.filter(
    (s) => s.stageId !== "cave-1" || forestCleared,
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
  const forestCleared = clearedStageIds.includes("forest-1");
  return getClassSkillProgression(classId).filter((skill) => {
    if (unlocked.has(skill.id)) return false;
    if (skill.stageId === "cave-1" && !forestCleared) return false;
    return true;
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
