"use client";

import { create } from "zustand";
import type { HeroClassId, PlayerState, StageClearResult } from "~/types";
import {
  getPendingBattleSkillUnlockCount,
  getNextUnlockableBattleSkill,
  getStarterSkillId,
  getUnlockableBattleSkills,
} from "~/data/skills";
import {
  createDefaultPlayerState,
  loadPlayerState,
  savePlayerState,
} from "~/lib/storage";
import { getAvailableSkillPicks } from "~/data/skillTree";

/** 每通一关获得的经验 */
const EXP_PER_STAGE = 100;
/** 升级所需经验 */
const EXP_PER_LEVEL = 100;

interface GameStore extends PlayerState {
  /** 是否已从 localStorage 完成水合 */
  hydrated: boolean;
  /** 客户端挂载后调用：从存档恢复 */
  hydrate: () => void;
  /** 选择职业 */
  selectClass: (id: HeroClassId) => void;
  /** 通关结算：记录通关、加经验 */
  completeStage: (stageId: string) => StageClearResult;
  /** 解锁战斗咒文（消耗技能点） */
  unlockBattleSkill: (skillId: string) => void;
  /** 解锁技能树节点 */
  unlockSkillNode: (nodeId: string) => void;
  /** 是否还有待选技能树分支 */
  hasPendingSkillPick: () => boolean;
  /** 是否还有待解锁的战斗咒文 */
  hasPendingBattleSkillUnlock: () => boolean;
  /** 当前可选择的技能树节点 id 列表 */
  getSkillPickOptions: () => string[];
  /** 重置全部进度 */
  resetProgress: () => void;
}

/** 把当前可持久化字段抽成 PlayerState 并保存 */
function persist(state: GameStore): PlayerState {
  const snapshot: PlayerState = {
    version: state.version,
    classId: state.classId,
    level: state.level,
    exp: state.exp,
    clearedStageIds: state.clearedStageIds,
    learnedVocabIds: state.learnedVocabIds,
    skillTreeUnlocked: state.skillTreeUnlocked,
    unlockedSkillIds: state.unlockedSkillIds,
  };
  savePlayerState(snapshot);
  return snapshot;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createDefaultPlayerState(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const saved = loadPlayerState();
    set({ ...saved, hydrated: true });
  },

  selectClass: (id) => {
    const starter = getStarterSkillId(id);
    set({
      classId: id,
      unlockedSkillIds: starter ? [starter] : [],
    });
    persist(get());
  },

  completeStage: (stageId) => {
    const state = get();
    const prevLevel = state.level;
    const prevExp = state.exp;
    const firstClear = !state.clearedStageIds.includes(stageId);

    const cleared = firstClear
      ? [...state.clearedStageIds, stageId]
      : state.clearedStageIds;

    const expGained = firstClear ? EXP_PER_STAGE : 0;
    const exp = prevExp + expGained;
    const newLevel = Math.max(1, Math.floor(exp / EXP_PER_LEVEL) + 1);

    set({
      clearedStageIds: cleared,
      exp,
      level: newLevel,
    });
    persist(get());

    return {
      firstClear,
      expGained,
      prevLevel,
      newLevel,
      leveledUp: newLevel > prevLevel,
    };
  },

  unlockBattleSkill: (skillId) => {
    const state = get();
    if (!skillId || !state.classId || state.unlockedSkillIds.includes(skillId)) return;

    const pending = getPendingBattleSkillUnlockCount(
      state.level,
      state.unlockedSkillIds,
    );
    if (pending <= 0) return;

    const unlockable = getNextUnlockableBattleSkill(
      state.classId,
      state.clearedStageIds,
      state.unlockedSkillIds,
    );
    if (!unlockable || unlockable.id !== skillId) return;

    set({ unlockedSkillIds: [...state.unlockedSkillIds, skillId] });
    persist(get());
  },

  unlockSkillNode: (nodeId) => {
    const state = get();
    if (!nodeId || state.skillTreeUnlocked.includes(nodeId)) return;
    set({ skillTreeUnlocked: [...state.skillTreeUnlocked, nodeId] });
    persist(get());
  },

  hasPendingSkillPick: () => {
    const state = get();
    if (!state.classId) return false;
    return getAvailableSkillPicks(
      state.classId,
      state.level,
      state.skillTreeUnlocked,
    ).length > 0;
  },

  hasPendingBattleSkillUnlock: () => {
    const state = get();
    if (!state.classId) return false;
    const pending = getPendingBattleSkillUnlockCount(
      state.level,
      state.unlockedSkillIds,
    );
    if (pending <= 0) return false;
    return (
      getUnlockableBattleSkills(
        state.classId,
        state.clearedStageIds,
        state.unlockedSkillIds,
      ).length > 0
    );
  },

  getSkillPickOptions: () => {
    const state = get();
    if (!state.classId) return [];
    return getAvailableSkillPicks(
      state.classId,
      state.level,
      state.skillTreeUnlocked,
    ).map((n) => n.id);
  },

  resetProgress: () => {
    const fresh = createDefaultPlayerState();
    set({ ...fresh });
    persist(get());
  },
}));
