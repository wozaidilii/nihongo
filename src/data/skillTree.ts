import type { HeroClassId, SkillTreeModifiers, SkillTreeNode } from "~/types";

/** 四职业双分支技能树（每分支 Lv2 → Lv3 各一层） */
export const SKILL_TREES: Record<HeroClassId, SkillTreeNode[]> = {
  knight: [
    {
      id: "k-a1",
      classId: "knight",
      branch: "a",
      tier: 1,
      unlockLevel: 2,
      nameZh: "圣盾强化",
      description: "生命上限 +15",
      modifiers: { maxHpBonus: 15 },
    },
    {
      id: "k-a2",
      classId: "knight",
      branch: "a",
      tier: 2,
      unlockLevel: 3,
      nameZh: "守护誓言",
      description: "防御技能伤害 +30%",
      requires: "k-a1",
      modifiers: { skillDamageMul: { "k-shield": 1.3 } },
    },
    {
      id: "k-b1",
      classId: "knight",
      branch: "b",
      tier: 1,
      unlockLevel: 2,
      nameZh: "光明斩",
      description: "全技能伤害 +12%",
      modifiers: { damageMul: 1.12 },
    },
    {
      id: "k-b2",
      classId: "knight",
      branch: "b",
      tier: 2,
      unlockLevel: 3,
      nameZh: "终焉审判",
      description: "暴击阈值 -5（更易暴击）",
      requires: "k-b1",
      modifiers: { critBonus: 5 },
    },
  ],
  mage: [
    {
      id: "m-a1",
      classId: "mage",
      branch: "a",
      tier: 1,
      unlockLevel: 2,
      nameZh: "炎爆",
      description: "火球伤害 +25%",
      modifiers: { skillDamageMul: { "m-orb": 1.25 } },
    },
    {
      id: "m-a2",
      classId: "mage",
      branch: "a",
      tier: 2,
      unlockLevel: 3,
      nameZh: "烈焰风暴",
      description: "全技能伤害 +10%",
      requires: "m-a1",
      modifiers: { damageMul: 1.1 },
    },
    {
      id: "m-b1",
      classId: "mage",
      branch: "b",
      tier: 1,
      unlockLevel: 2,
      nameZh: "虚空触媒",
      description: "暗影伤害 +25%",
      modifiers: { skillDamageMul: { "m-whisper": 1.25 } },
    },
    {
      id: "m-b2",
      classId: "mage",
      branch: "b",
      tier: 2,
      unlockLevel: 3,
      nameZh: "虚无吞噬",
      description: "全技能伤害 +12%",
      requires: "m-b1",
      modifiers: { damageMul: 1.12 },
    },
  ],
  rogue: [
    {
      id: "r-a1",
      classId: "rogue",
      branch: "a",
      tier: 1,
      unlockLevel: 2,
      nameZh: "影遁",
      description: "受到怪物伤害 -20%",
      modifiers: { failDamageReduction: 0.2 },
    },
    {
      id: "r-a2",
      classId: "rogue",
      branch: "a",
      tier: 2,
      unlockLevel: 3,
      nameZh: "完美背刺",
      description: "突刺伤害 +30%",
      requires: "r-a1",
      modifiers: { skillDamageMul: { "r-stab": 1.3 } },
    },
    {
      id: "r-b1",
      classId: "rogue",
      branch: "b",
      tier: 1,
      unlockLevel: 2,
      nameZh: "迅雷",
      description: "突刺伤害 +25%",
      modifiers: { skillDamageMul: { "r-stab": 1.25 } },
    },
    {
      id: "r-b2",
      classId: "rogue",
      branch: "b",
      tier: 2,
      unlockLevel: 3,
      nameZh: "终结一击",
      description: "全技能伤害 +12%",
      requires: "r-b1",
      modifiers: { damageMul: 1.12 },
    },
  ],
  samurai: [
    {
      id: "s-a1",
      classId: "samurai",
      branch: "a",
      tier: 1,
      unlockLevel: 2,
      nameZh: "疾风斩",
      description: "斩击类伤害 +25%",
      modifiers: { skillDamageMul: { "s-wind": 1.25, "s-iai": 1.15 } },
    },
    {
      id: "s-a2",
      classId: "samurai",
      branch: "a",
      tier: 2,
      unlockLevel: 3,
      nameZh: "无想剑",
      description: "全技能伤害 +10%",
      requires: "s-a1",
      modifiers: { damageMul: 1.1 },
    },
    {
      id: "s-b1",
      classId: "samurai",
      branch: "b",
      tier: 1,
      unlockLevel: 2,
      nameZh: "雷鸣斩",
      description: "居合伤害 +25%",
      modifiers: { skillDamageMul: { "s-iai": 1.25 } },
    },
    {
      id: "s-b2",
      classId: "samurai",
      branch: "b",
      tier: 2,
      unlockLevel: 3,
      nameZh: "无心放剑",
      description: "暴击阈值 -5（更易暴击）",
      requires: "s-b1",
      modifiers: { critBonus: 5 },
    },
  ],
};

/** 按 id 查找节点 */
export function getSkillTreeNode(
  classId: HeroClassId,
  nodeId: string,
): SkillTreeNode | undefined {
  return SKILL_TREES[classId]?.find((n) => n.id === nodeId);
}

/** 合并已解锁节点的全部加成 */
export function getAggregatedModifiers(
  classId: HeroClassId,
  unlockedIds: string[] = [],
): SkillTreeModifiers {
  const nodes = SKILL_TREES[classId] ?? [];
  const unlocked = new Set(unlockedIds);
  const out: SkillTreeModifiers = {
    damageMul: 1,
    critBonus: 0,
    maxHpBonus: 0,
    failDamageReduction: 0,
    skillDamageMul: {},
  };

  for (const node of nodes) {
    if (!unlocked.has(node.id)) continue;
    const m = node.modifiers;
    if (m.damageMul) out.damageMul = (out.damageMul ?? 1) * m.damageMul;
    if (m.critBonus) out.critBonus = (out.critBonus ?? 0) + m.critBonus;
    if (m.maxHpBonus) out.maxHpBonus = (out.maxHpBonus ?? 0) + m.maxHpBonus;
    if (m.failDamageReduction) {
      out.failDamageReduction = Math.min(
        0.8,
        (out.failDamageReduction ?? 0) + m.failDamageReduction,
      );
    }
    if (m.skillDamageMul) {
      out.skillDamageMul = out.skillDamageMul ?? {};
      for (const [skillId, mul] of Object.entries(m.skillDamageMul)) {
        out.skillDamageMul[skillId] = (out.skillDamageMul[skillId] ?? 1) * mul;
      }
    }
  }

  return out;
}

/** 玩家已选分支（tier1 节点决定） */
export function getChosenBranch(
  classId: HeroClassId,
  unlockedIds: string[] = [],
): "a" | "b" | null {
  const nodes = SKILL_TREES[classId] ?? [];
  const tier1 = nodes.filter((n) => n.tier === 1 && unlockedIds.includes(n.id));
  return tier1[0]?.branch ?? null;
}

/** 当前等级下可选择的技能树节点 */
export function getAvailableSkillPicks(
  classId: HeroClassId,
  level: number,
  unlockedIds: string[] = [],
): SkillTreeNode[] {
  const nodes = SKILL_TREES[classId] ?? [];
  const unlocked = new Set(unlockedIds);
  const branch = getChosenBranch(classId, unlockedIds);

  const tier1Unlocked = nodes.some((n) => n.tier === 1 && unlocked.has(n.id));
  const tier2Unlocked = nodes.some((n) => n.tier === 2 && unlocked.has(n.id));

  // Lv2：尚未选分支，展示两个 tier1
  if (!tier1Unlocked && level >= 2) {
    return nodes.filter((n) => n.tier === 1 && level >= n.unlockLevel);
  }

  // Lv3+：已选分支且未点 tier2，展示该分支 tier2
  if (tier1Unlocked && !tier2Unlocked && branch && level >= 3) {
    return nodes.filter(
      (n) =>
        n.tier === 2 &&
        n.branch === branch &&
        level >= n.unlockLevel &&
        n.requires &&
        unlocked.has(n.requires),
    );
  }

  return [];
}

/** 是否还有待选技能点 */
export function hasPendingSkillPick(
  classId: HeroClassId,
  level: number,
  unlockedIds: string[] = [],
): boolean {
  return getAvailableSkillPicks(classId, level, unlockedIds).length > 0;
}

/** 计算勇者有效生命上限 */
export function getEffectiveMaxHp(
  baseMaxHp: number,
  classId: HeroClassId,
  unlockedIds: string[] = [],
): number {
  const bonus = getAggregatedModifiers(classId, unlockedIds).maxHpBonus ?? 0;
  return Math.max(1, baseMaxHp + bonus);
}
