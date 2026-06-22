"use client";

import { create } from "zustand";
import type { HeroClassId, PlayerState } from "~/types";
import {
  createDefaultPlayerState,
  loadPlayerState,
  savePlayerState,
} from "~/lib/storage";

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
  /** 通关结算：记录通关、加经验、记录所学词 */
  completeStage: (stageId: string, vocabIds: string[]) => void;
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
    set({ classId: id });
    persist(get());
  },

  completeStage: (stageId, vocabIds) => {
    const state = get();
    const cleared = state.clearedStageIds.includes(stageId)
      ? state.clearedStageIds
      : [...state.clearedStageIds, stageId];

    const learned = Array.from(
      new Set([...state.learnedVocabIds, ...(vocabIds ?? [])]),
    );

    // 仅首次通关给经验，避免刷关
    const firstClear = !state.clearedStageIds.includes(stageId);
    const exp = state.exp + (firstClear ? EXP_PER_STAGE : 0);
    const level = Math.max(1, Math.floor(exp / EXP_PER_LEVEL) + 1);

    set({
      clearedStageIds: cleared,
      learnedVocabIds: learned,
      exp,
      level,
    });
    persist(get());
  },

  resetProgress: () => {
    const fresh = createDefaultPlayerState();
    set({ ...fresh });
    persist(get());
  },
}));
