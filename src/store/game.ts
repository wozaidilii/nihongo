"use client";

import { create } from "zustand";
import type {
  HeroClassId,
  PlayerState,
  SaveSlotIndex,
  StageClearResult,
} from "~/types";
import { getStage } from "~/data/stages";
import {
  getPendingBattleSkillUnlockCount,
  getNextUnlockableBattleSkill,
  getStarterSkillId,
  getUnlockableBattleSkills,
} from "~/data/skills";
import {
  codexFromPlayerState,
  createDefaultPlayerState,
  createEmptySlot,
  isSlotOccupied,
  loadSaveRoot,
  mergePlayerState,
  saveSaveRoot,
  slotFromPlayerState,
} from "~/lib/storage";
import { getAvailableSkillPicks } from "~/data/skillTree";

/** 每通一关获得的经验 */
const EXP_PER_STAGE = 100;
/** 升级所需经验 */
const EXP_PER_LEVEL = 100;

function mergeUniqueIds(existing: string[], additions: string[]): string[] {
  if (additions.length === 0) return existing;
  return Array.from(new Set([...existing, ...additions]));
}

interface GameStore extends PlayerState {
  hydrated: boolean;
  hydrate: () => void;
  /** 写入当前档位 + 全局图鉴 */
  autosave: () => void;
  /** 继续冒险：载入指定档位 */
  continueFromSlot: (index: SaveSlotIndex) => void;
  /** 新游戏：清空指定档位进度，保留图鉴 */
  prepareNewGameSlot: (index: SaveSlotIndex) => void;
  selectClass: (id: HeroClassId) => void;
  completeStage: (stageId: string) => StageClearResult;
  unlockBattleSkill: (skillId: string) => void;
  discoverEncounter: (encounterId: string) => void;
  unlockSkillNode: (nodeId: string) => void;
  hasPendingSkillPick: () => boolean;
  hasPendingBattleSkillUnlock: () => boolean;
  getSkillPickOptions: () => string[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createDefaultPlayerState(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const root = loadSaveRoot();
    const idx = root.activeSlot;
    const slot = idx !== null ? root.slots[idx]! : createEmptySlot();
    set({ ...mergePlayerState(slot, root.codex, idx), hydrated: true });
  },

  autosave: () => {
    const state = get();
    const idx = state.activeSlotIndex;
    if (idx === null) return;

    const root = loadSaveRoot();
    root.slots[idx] = slotFromPlayerState(state);
    root.codex = codexFromPlayerState(state);
    root.activeSlot = idx;
    root.lastPlayedSlot = idx;
    saveSaveRoot(root);
  },

  continueFromSlot: (index) => {
    const root = loadSaveRoot();
    const slot = root.slots[index]!;
    if (!isSlotOccupied(slot)) return;

    const merged = mergePlayerState(slot, root.codex, index);
    set(merged);
    root.activeSlot = index;
    root.lastPlayedSlot = index;
    root.slots[index] = slotFromPlayerState(merged);
    root.codex = codexFromPlayerState(merged);
    saveSaveRoot(root);
  },

  prepareNewGameSlot: (index) => {
    const root = loadSaveRoot();
    const empty = createEmptySlot();
    const merged = mergePlayerState(empty, root.codex, index);
    set(merged);
    root.slots[index] = empty;
    root.activeSlot = index;
    root.lastPlayedSlot = index;
    saveSaveRoot(root);
  },

  selectClass: (id) => {
    const state = get();
    const starter = getStarterSkillId(id);
    const starterIds = starter ? [starter] : [];
    set({
      classId: id,
      unlockedSkillIds: starterIds,
      discoveredSkillIds: mergeUniqueIds(state.discoveredSkillIds, starterIds),
    });
    get().autosave();
  },

  completeStage: (stageId) => {
    const state = get();
    const prevLevel = state.level;
    const firstClear = !state.clearedStageIds.includes(stageId);

    const cleared = firstClear
      ? [...state.clearedStageIds, stageId]
      : state.clearedStageIds;

    const stage = getStage(stageId);
    const vocabIds = stage?.vocab?.map((v) => v.id) ?? [];
    const learned = mergeUniqueIds(state.learnedVocabIds, vocabIds);

    const expGained = firstClear ? EXP_PER_STAGE : 0;
    const exp = state.exp + expGained;
    const newLevel = Math.max(1, Math.floor(exp / EXP_PER_LEVEL) + 1);

    set({
      clearedStageIds: cleared,
      learnedVocabIds: learned,
      exp,
      level: newLevel,
    });
    get().autosave();

    return {
      firstClear,
      expGained,
      prevLevel,
      newLevel,
      leveledUp: newLevel > prevLevel,
    };
  },

  discoverEncounter: (encounterId) => {
    const state = get();
    if (!encounterId || state.discoveredEncounterIds.includes(encounterId)) return;
    set({
      discoveredEncounterIds: [...state.discoveredEncounterIds, encounterId],
    });
    get().autosave();
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

    set({
      unlockedSkillIds: [...state.unlockedSkillIds, skillId],
      discoveredSkillIds: mergeUniqueIds(state.discoveredSkillIds, [skillId]),
    });
    get().autosave();
  },

  unlockSkillNode: (nodeId) => {
    const state = get();
    if (!nodeId || state.skillTreeUnlocked.includes(nodeId)) return;
    set({ skillTreeUnlocked: [...state.skillTreeUnlocked, nodeId] });
    get().autosave();
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
}));

/** 是否存在可继续的档位 */
export function hasAnyOccupiedSlot(): boolean {
  return loadSaveRoot().slots.some(isSlotOccupied);
}
