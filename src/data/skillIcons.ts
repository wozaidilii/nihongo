import type { HeroClassId, SkillFxKey } from "~/types";
import iconsManifest from "../../public/sprites/icons/icons-manifest.json";

/** 技能图标键（spritesheet 内） */
export type SkillIconKey =
  | SkillFxKey
  | "hp-up"
  | "crit-up"
  | "power-up"
  | "guard"
  | "void";

export interface SkillIconDef {
  col: number;
  row: number;
}

const manifest = iconsManifest as {
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  sheetWidth: number;
  sheetHeight: number;
  icons: Record<string, SkillIconDef>;
};

/** 战斗技能默认用 fxKey 作图标 */
export function iconKeyForSkill(fxKey: SkillFxKey): SkillIconKey {
  return fxKey;
}

/** 技能树节点图标（参考经典双分支：守护/输出、元素/暗系等） */
export const SKILL_TREE_ICON: Record<string, SkillIconKey> = {
  "k-a1": "guard",
  "k-a2": "holy",
  "k-b1": "slash",
  "k-b2": "crit-up",
  "m-a1": "fire",
  "m-a2": "power-up",
  "m-b1": "shadow",
  "m-b2": "void",
  "r-a1": "shadow",
  "r-a2": "dagger",
  "r-b1": "lightning",
  "r-b2": "power-up",
  "s-a1": "slash",
  "s-a2": "power-up",
  "s-b1": "lightning",
  "s-b2": "crit-up",
};

/** 职业根节点图标（分支起点） */
export const CLASS_ROOT_ICON: Record<HeroClassId, SkillIconKey> = {
  knight: "guard",
  mage: "fire",
  rogue: "dagger",
  samurai: "slash",
};

export function getSkillIconDef(key: SkillIconKey | string | undefined): SkillIconDef | undefined {
  if (!key) return undefined;
  return manifest.icons[key];
}

export function getSkillIconManifest() {
  return manifest;
}
