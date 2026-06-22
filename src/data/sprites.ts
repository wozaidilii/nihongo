import type { HeroClassId } from "~/types";
import type { SpriteDefinition, SpritesManifest } from "~/types/sprites";
import rawManifest from "../../public/sprites/sprites-manifest.json";

const manifest = rawManifest as SpritesManifest;

/** 取勇者 LPC 精灵配置；缺失时返回 undefined(调用方回退 emoji) */
export function getHeroSprite(classId: HeroClassId | null | undefined): SpriteDefinition | undefined {
  if (!classId) return undefined;
  return manifest.heroes[classId];
}

/** 取敌人 LPC 精灵配置 */
export function getEnemySprite(enemyKey: string | null | undefined): SpriteDefinition | undefined {
  if (!enemyKey) return undefined;
  return manifest.enemies[enemyKey];
}

/** 取技能特效 spritesheet 配置 */
export function getFxSprite(fxKey: string | null | undefined): SpriteDefinition | undefined {
  if (!fxKey) return undefined;
  return manifest.fx?.[fxKey];
}

export { manifest as spritesManifest };
