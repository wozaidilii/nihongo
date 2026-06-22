/** 精灵动画状态 */
export type SpriteAnimState = "idle" | "cast" | "attack" | "hurt" | "death" | "play";

/** 单个动画片段定义 */
export interface SpriteAnimDef {
  row: number;
  frames: number[];
  fps: number;
}

/** 完整 spritesheet 配置(与 sprites-manifest.json 对齐) */
export interface SpriteDefinition {
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  sheetWidth: number;
  sheetHeight: number;
  /** 显示倍率(史莱姆等较小帧可放大) */
  scale?: number;
  /** 水平翻转(怪物朝左) */
  flipX?: boolean;
  animations: Partial<Record<SpriteAnimState, SpriteAnimDef>>;
}

export interface SpritesManifest {
  heroes: Record<string, SpriteDefinition>;
  enemies: Record<string, SpriteDefinition>;
  fx?: Record<string, SpriteDefinition>;
}
