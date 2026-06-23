/**
 * 全局领域类型定义。
 * 这里集中描述「勇者探险」日语学习游戏的核心数据结构，
 * 供数据层(src/data)、状态层(src/store)与 UI 复用，避免重复定义。
 */

/** 日语语体(说话方式)标识：不同职业对应不同语体 */
export type SpeechStyleId = "keigo" | "chuuni" | "tameguchi" | "bushi";

/** 勇者职业标识 */
export type HeroClassId =
  | "knight"
  | "mage"
  | "rogue"
  | "samurai";

/** 一种日语语体的描述：用于渲染台词风格与说明 */
export interface SpeechStyle {
  id: SpeechStyleId;
  /** 语体名(日文) */
  nameJa: string;
  /** 语体名(中文) */
  nameZh: string;
  /** 语体特点说明(中文) */
  description: string;
  /** 典型句末/口癖，用于 UI 展示，例如「〜でござる」 */
  signature: string;
  /** 一句示例台词 */
  sample: string;
}

/** 勇者职业 */
export interface HeroClass {
  id: HeroClassId;
  nameJa: string;
  nameZh: string;
  /** 对应的语体 */
  styleId: SpeechStyleId;
  /** 职业简介(中文，中二风) */
  description: string;
  /** 像素精灵 emoji 回退 */
  sprite: string;
  /** LPC 精灵 id(与 manifest heroes 键一致) */
  spriteKey: HeroClassId;
  /** 属性加成：攻击力倍率与生命上限 */
  stats: {
    /** 技能伤害倍率，1 为基准 */
    power: number;
    /** 生命上限 */
    maxHp: number;
  };
}

/** 词汇(N5 起步) */
export interface Vocab {
  id: string;
  /** 假名读音 */
  kana: string;
  /** 汉字写法(可能没有) */
  kanji?: string;
  /** 罗马音 */
  romaji: string;
  /** 中文释义 */
  zh: string;
  /** 用于 TTS 朗读的文本，默认取假名 */
  ttsText?: string;
}

/** 技能树节点加成 */
export interface SkillTreeModifiers {
  damageMul?: number;
  critBonus?: number;
  maxHpBonus?: number;
  failDamageReduction?: number;
  skillDamageMul?: Record<string, number>;
}

/** 技能树节点 */
export interface SkillTreeNode {
  id: string;
  classId: HeroClassId;
  branch: "a" | "b";
  tier: 1 | 2;
  unlockLevel: number;
  nameZh: string;
  description: string;
  requires?: string;
  modifiers: SkillTreeModifiers;
}

/** 技能特效素材键(与 public/sprites/fx 一致) */
export type SkillFxKey =
  | "fire"
  | "holy"
  | "lightning"
  | "shadow"
  | "slash"
  | "thrust"
  | "dagger";

/** 战斗属性（与关卡词汇、fx 对齐） */
export type Element = "fire" | "holy" | "lightning" | "shadow" | "neutral";

/**
 * 技能：每个职业拥有独立咒文与特效。
 * incantation / reading 为该职业专属，不再按语体分叉。
 */
export interface Skill {
  id: string;
  classId: HeroClassId;
  stageId: string;
  nameJa: string;
  nameZh: string;
  /** 咒文写法(展示用) */
  incantation: string;
  /** 目标读音(平假名，语音识别比对用) */
  reading: string;
  /** 罗马音读音参考 */
  romaji: string;
  baseDamage: number;
  zh: string;
  fxKey: SkillFxKey;
  /** 技能属性；省略时由 fxKey 推断 */
  element?: Element;
}

/** 降级答题(不支持语音/拒权时使用) */
export interface Question {
  id: string;
  type: "kana" | "choice";
  /** 题干(中文/日文) */
  prompt: string;
  /** 选择题选项 */
  options?: string[];
  /** 正确答案 */
  answer: string;
}

/** 敌人(怪兽) */
export interface Enemy {
  name: string;
  /** 像素精灵 emoji 回退 */
  sprite: string;
  /** LPC 敌人精灵 id(与 manifest enemies 键一致) */
  spriteKey: string;
  hp: number;
  /** 怪兽攻击力（每回合对勇者造成的伤害） */
  attack: number;
  /** 主属性 */
  element: Element;
  /** 弱点属性（克制，×1.5） */
  weakness: Element[];
  /** 抵抗属性（×0.5） */
  resist?: Element[];
}

/** 单场遭遇战类型 */
export type EncounterKind = "normal" | "boss";

/** 关卡内一场战斗 */
export interface StageEncounter {
  id: string;
  kind: EncounterKind;
  enemy: Enemy;
}

/** 关卡 */
export interface Stage {
  id: string;
  title: string;
  /** 章节序号，决定地图顺序与解锁关系 */
  order: number;
  /** 场景描述(中二风) */
  intro: string;
  /** 连战：2 场普通战 + 1 场 Boss */
  encounters: StageEncounter[];
  /** 本关学习的词汇 */
  vocab: Vocab[];
}

/** 存档槽位索引（共 3 档） */
export type SaveSlotIndex = 0 | 1 | 2;

export const SAVE_SLOT_COUNT = 3;

/** 单档冒险进度（不含全局图鉴） */
export interface SaveSlotData {
  version: number;
  classId: HeroClassId | null;
  level: number;
  exp: number;
  clearedStageIds: string[];
  skillTreeUnlocked: string[];
  unlockedSkillIds: string[];
  /** 最后写入时间戳 */
  savedAt: number;
}

/** 全局图鉴（跨档位永久保留） */
export interface GlobalCodex {
  version: number;
  learnedVocabIds: string[];
  discoveredEncounterIds: string[];
  /** 曾解锁/见过的咒文 id */
  discoveredSkillIds: string[];
}

/** localStorage 根结构 */
export interface SaveRoot {
  version: number;
  activeSlot: SaveSlotIndex | null;
  lastPlayedSlot: SaveSlotIndex | null;
  slots: SaveSlotData[];
  codex: GlobalCodex;
}

/** 运行时玩家状态（当前档位 + 图鉴） */
export interface PlayerState {
  /** 存档版本，便于迁移 */
  version: number;
  /** 当前游玩的档位；未选档为 null */
  activeSlotIndex: SaveSlotIndex | null;
  /** 已选职业，未选为 null */
  classId: HeroClassId | null;
  level: number;
  exp: number;
  /** 已通关的关卡 id */
  clearedStageIds: string[];
  /** 已解锁的技能树节点 id */
  skillTreeUnlocked: string[];
  /** 已解锁的战斗咒文 id（当前档位） */
  unlockedSkillIds: string[];
  /** 图鉴：已收录词汇 */
  learnedVocabIds: string[];
  /** 图鉴：已遭遇敌人 */
  discoveredEncounterIds: string[];
  /** 图鉴：已见过咒文 */
  discoveredSkillIds: string[];
}

/** 关卡通关结算快照（仅 UI 展示） */
export interface StageClearResult {
  firstClear: boolean;
  expGained: number;
  prevLevel: number;
  newLevel: number;
  leveledUp: boolean;
}
